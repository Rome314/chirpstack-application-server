package adapters

import (
	"encoding/json"
	"time"
)

type GetEventsReq struct {
	DevEui         string    `json:"devEUI"`
	Limit          int       `json:"limit"`
	Offset         int       `json:"offset"`
	StartTimestamp time.Time `json:"startTimestamp"`
	EndTimestamp   time.Time `json:"endTimestamp"`
}

func GetEventsReqFromBts(input []byte) (resp GetEventsReq, err error) {
	incoming := struct {
		DevEui         string `json:"devEUI"`
		Limit          int    `json:"limit"`
		Offset         int    `json:"offset"`
		StartTimestamp int64  `json:"startTimestamp"`
		EndTimestamp   int64  `json:"endTimestamp"`
	}{}
	err = json.Unmarshal(input, &incoming)
	if err != nil {
		return GetEventsReq{}, InvalidJsonErr
	}

	start := time.Unix(incoming.StartTimestamp, 0)
	end := time.Unix(incoming.EndTimestamp, 0)

	res := GetEventsReq{
		DevEui:         incoming.DevEui,
		Limit:          incoming.Limit,
		Offset:         incoming.Offset,
		StartTimestamp: start,
		EndTimestamp:   end,
	}

	return res, nil
}

func GetEventsRespFromList(resp []Uplink, err error) (respBts []byte) {
	toReturn := struct {
		DefaultResp
		TotalCount int      `json:"total_count"`
		Packets    []Uplink `json:"packets"`
	}{}
	toReturn.SetCmd("get_data_resp")
	if err != nil {
		tr := DefaultResp{Cmd: "get_data_resp"}
		tr.SetErr(err)
		respBts,_ = json.Marshal(tr)
	} else {
		toReturn.Status = true
		toReturn.TotalCount = len(resp)
		toReturn.Packets = resp
		respBts, _ = json.Marshal(toReturn)
	}

	return respBts

}
