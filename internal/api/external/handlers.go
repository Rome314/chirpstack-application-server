package external

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
	"github.com/gorilla/websocket"
	"google.golang.org/grpc/metadata"

	"github.com/brocaar/chirpstack-application-server/internal/api/external/adapters"
)

const authTimeout = time.Second * 10

var wsupgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Realization) Handler(w http.ResponseWriter, r *http.Request) {

	con, err := wsupgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	authReq := struct {
		Cmd      string `json:"cmd"`
		Jwt      string `json:"jwt"`
		Login    string `json:"login"`
		Password string `json:"password"`
	}{}
	timer := time.NewTicker(authTimeout)
	timeStart := time.Now()
	ready := make(chan bool)
	go func() {
		select {
		case <-timer.C:
			_ = con.Close()
		case <-ready:
			return
		}
		close(ready)
		timer.Stop()
	}()
	err = con.ReadJSON(&authReq)
	if err != nil {
		con.WriteJSON(http.StatusBadRequest)
		return
	}
	if time.Since(timeStart) < authTimeout {
		ready <- true
	} else {
		w.WriteHeader(http.StatusRequestTimeout)
		con.Close()
		return
	}

	var respBts []byte
	var jwt string
	if authReq.Jwt != "" {
		jwt = authReq.Jwt
	} else {
		respBts, jwt = h.doLogin(authReq.Login, authReq.Password)

	}

	if jwt == "" {
		con.WriteJSON(http.StatusUnauthorized)
		con.Close()
		return
	}

	md := metadata.New(map[string]string{
		"authorization": "bearer " + jwt,
	})
	ctx := metadata.NewIncomingContext(context.Background(), md)
	usr, err := h.v.GetUser(ctx)
	if err != nil {
		con.WriteJSON(http.StatusUnauthorized)
		con.Close()
		return
	}

	id := fmt.Sprintf("%d_%d", usr.ID, time.Now().Unix())
	h.Connect(id, ctx, con)
	con.WriteJSON(respBts)

	return
}

func (h *Realization) doLogin(login, password string) (respBts []byte, jwt string) {
	ctx := context.Background()
	req := &pb.LoginRequest{Email: login, Password: password}

	resp, err := h.Api.Internal.Login(ctx, req)
	if err != nil {
		return nil, ""
	}

	respBts = adapters.LoginRespFromPb(resp, err)
	return respBts, resp.Jwt

}

func (h *Realization) Connect(uid string, ctx context.Context, con *websocket.Conn) {
	connection := &Connection{
		Hub:                h,
		UID:                uid,
		Con:                con,
		Mux:                sync.Mutex{},
		ResponseCh:         make(chan *Job),
		WaitingForResponse: false,
		ctx:                ctx,
	}

	go connection.listener()
	go connection.checker()
	go connection.waitResponses()

	h.Pool[uid] = connection
}
