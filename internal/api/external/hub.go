package external

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"

	pb2 "github.com/brocaar/chirpstack-api/go/v3/as/integration"
	"github.com/gorilla/websocket"

	"github.com/brocaar/chirpstack-application-server/internal/api/external/adapters"
	"github.com/brocaar/chirpstack-application-server/internal/api/external/auth"
	"github.com/brocaar/chirpstack-application-server/internal/api/external/postgresEvents"
	chan_integration "github.com/brocaar/chirpstack-application-server/internal/integration/chan"
)

type Hub interface {
	Handler(w http.ResponseWriter, r *http.Request)
	Connect(uid string, ctx context.Context, con *websocket.Conn)
	Exit()
}

type Realization struct {
	Jobs     chan *Job
	Pool     map[string]*Connection // нужен только для того, чтобы бегать по нему и отправлять сообщения
	PoolLock sync.Mutex
	v        *auth.JWTValidator
	Api      *Api
	UpsChan  chan pb2.UplinkEvent
	pgEvents *postgresEvents.Repo
	Commands map[string]func(cmd string, ctx context.Context, input []byte) (output []byte)
}

func (h *Realization) Exit() {
	h.PoolLock.Lock()
	for _, value := range h.Pool {
		_ = value.Con.WriteMessage(websocket.CloseMessage, nil)
	}
	h.PoolLock.Unlock()
}

func NewHub(v *auth.JWTValidator, pgEvents *postgresEvents.Repo) Hub {
	pool := map[string]*Connection{}
	res := &Realization{
		Jobs:     make(chan *Job),
		Pool:     pool,
		PoolLock: sync.Mutex{},
		v:        v,
		Api:      &Api{},
		UpsChan:  chan_integration.MainThread,
		pgEvents: pgEvents,
	}
	go res.listenJobs()
	go res.listenUps()
	return res
}

type Message struct {
	Cmd string `json:"cmd"`
	json.RawMessage
}

func (h *Realization) listenUps() {
	for {
		select {
		case req := <-h.UpsChan:
			for _, conn := range h.Pool {
				data := adapters.UplinkEventFromPb(req)
				conn.Send(data)
			}
		}

	}
}

func (h *Realization) listenJobs() {
	for {
		select {
		case job := <-h.Jobs:
			connId := job.ConnID
			ctx := h.Pool[job.ConnID].ctx
			cmd := job.Cmd
			var resp []byte
			fn, ok := h.Commands[cmd]
			if !ok {
				resp = adapters.UnknownCommandResp(cmd)
			} else {
				resp = fn(cmd, ctx, job.Body)
			}
			job.Body = resp

			h.sendJob(connId, job)

		}

	}
}

func (h *Realization) sendJob(connId string, job *Job) {
	h.Pool[connId].ResponseCh <- job
}
