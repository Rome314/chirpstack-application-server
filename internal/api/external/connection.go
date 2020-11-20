package external

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Job struct {
	ConnID string `json:"-"`
	Cmd    string
	Body   json.RawMessage
}


type Connection struct {
	Hub                *Realization
	UID                string
	Con                *websocket.Conn
	Mux                sync.Mutex
	ResponseCh         chan *Job
	WaitingForResponse bool
	ctx                context.Context
}



func (con *Connection) waitResponses() {
	for {
		select {
		case job := <-con.ResponseCh:
			if !con.WaitingForResponse {
				continue
			}
			con.Send(job.Body)
			con.WaitingForResponse = false

		}

	}
}

func (con *Connection) Send(v interface{}) (err error) {
	con.Mux.Lock()
	err = con.Con.WriteJSON(v)
	con.Mux.Unlock()
	return
}

func (con *Connection) Remove() {
	con.Hub.PoolLock.Lock()
	delete(con.Hub.Pool, con.UID)
	con.Hub.PoolLock.Unlock()

}

type cmd struct {
	Cmd string `json:"cmd"`
}

func (con *Connection) listener() {
	for {

		var c cmd
		_, bts, err := con.Con.ReadMessage()
		if err != nil {
			return
		}
		_ = json.Unmarshal(bts, &c)

		if c.Cmd != "" {
			con.process(c.Cmd, bts)
		}

	}
}

func (con *Connection) process(cmd string, msg []byte) {
	if con.WaitingForResponse {
		con.Mux.Lock()
		con.Con.WriteJSON(http.StatusTooEarly)
		con.Mux.Unlock()
		return
	}
	con.WaitingForResponse = true

	job := &Job{
		ConnID: con.UID,
		Cmd:    cmd,
		Body:   msg,
	}

	con.Hub.Jobs <- job
}

func (con *Connection) checker() {
	for {
		time.Sleep(time.Second * 2)
		con.Mux.Lock()
		if isClosedConnection(con.Con) {
			con.Remove()
			con.Mux.Unlock()
			break
		}
		con.Mux.Unlock()
	}
}

func isClosedConnection(con *websocket.Conn) bool {
	err := con.WriteMessage(websocket.PingMessage, []byte{})
	if err != nil {
		return true
	}
	return false
}
