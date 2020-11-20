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
		toSend := adapters.DefaultResp{
			Cmd:    "INVALID",
			Status: false,
			ErrMsg: adapters.InvalidJsonErr.Error(),
		}
		con.WriteJSON(toSend)
		return
	}
	if time.Since(timeStart) < authTimeout {
		ready <- true
	} else {
		toSend := adapters.DefaultResp{
			Cmd:    "auth_req",
			Status: false,
			ErrMsg: "auth timeout",
		}
		con.WriteJSON(toSend)
		con.Close()
		return
	}

	var jwt string
	if authReq.Jwt != "" {
		jwt = authReq.Jwt
	} else {
		jwt, err = h.doLogin(authReq.Login, authReq.Password)

	}

	if jwt == "" {
		resp := adapters.LoginRespFromPb(nil, err)
		con.WriteJSON(resp)
		con.Close()
		return
	}

	md := metadata.New(map[string]string{
		"authorization": "bearer " + jwt,
	})
	ctx := metadata.NewIncomingContext(context.Background(), md)
	usr, err := h.v.GetUser(ctx)
	if err != nil {
		toSend := adapters.DefaultResp{Cmd: "auth_resp"}
		toSend.SetErr(err)
		con.WriteJSON(toSend)
		con.Close()
		return
	}

	id := fmt.Sprintf("%d_%d", usr.ID, time.Now().Unix())
	h.Connect(id, ctx, con)

	resp := struct {
		Cmd    string `json:"cmd"`
		Status bool   `json:"status"`
		Jwt    string `json:"jwt"`
	}{
		Cmd:    "auth_resp",
		Status: true,
		Jwt:    jwt,
	}

	con.WriteJSON(resp)

	return
}

func (h *Realization) doLogin(login, password string) (jwt string, err error) {
	ctx := context.Background()
	req := &pb.LoginRequest{Email: login, Password: password}

	resp, err := h.Api.Internal.Login(ctx, req)
	if err != nil {
		return "", err
	}

	// respBts = adapters.LoginRespFromPb(resp, err)
	return resp.Jwt, nil

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
