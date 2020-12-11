package adapters

import (
	"encoding/json"
	"time"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
	"github.com/golang/protobuf/ptypes"
)

const incomingTimeFormat = "2006-01-02T15:04:05Z"

func GatewayStatsReqFromBytes(input []byte) (*pb.GetGatewayStatsRequest, error) {
	incoming := struct {
		GatewayId      string `json:"gateway_id"`
		Interval       string `json:"interval"`
		StartTimestamp int64  `json:"startTimestamp"`
		EndTimestamp   int64  `json:"endTimestamp"`
	}{}
	err := json.Unmarshal(input, &incoming)
	if err != nil {
		return nil, InvalidJsonErr
	}

	start := time.Unix(incoming.StartTimestamp, 0)
	end := time.Unix(incoming.EndTimestamp, 0)

	startProto, _ := ptypes.TimestampProto(start)
	endProto, _ := ptypes.TimestampProto(end)

	req := &pb.GetGatewayStatsRequest{
		GatewayId:      incoming.GatewayId,
		Interval:       incoming.Interval,
		StartTimestamp: startProto,
		EndTimestamp:   endProto,
	}
	return req, nil
}

func GatewayStatsRespFromPb(resp *pb.GetGatewayStatsResponse, err error) (respBts []byte) {
	type lsItem struct {
		Timestamp           int64 `json:"timestamp"`
		RxPacketsReceived   int32 `json:"rxPacketsReceived"`
		RxPacketsReceivedOK int32 `json:"rxPacketsReceivedOK"`
		TxPacketsReceived   int32 `json:"txPacketsReceived"`
		TxPacketsEmitted    int32 `json:"txPacketsEmitted"`
	}

	toReturn := struct {
		DefaultResp
		Result []lsItem `json:"result"`
	}{}
	toReturn.SetCmd("get_gw_stat_resp")

	if err != nil {
		tr := DefaultResp{}
		tr.SetErr(err)
		respBts, _ = json.Marshal(tr)
	} else {
		toReturn.Status = true
		ls := []lsItem{}
		for _, item := range resp.Result {
			tmp := lsItem{
				Timestamp:           time.Now().Unix(),
				RxPacketsReceived:   item.RxPacketsReceived,
				RxPacketsReceivedOK: item.RxPacketsReceivedOk,
				TxPacketsReceived:   item.TxPacketsReceived,
				TxPacketsEmitted:    item.TxPacketsEmitted,
			}
			ls = append(ls, tmp)
		}

		toReturn.Result = ls
		respBts, _ = json.Marshal(toReturn)

	}

	return respBts
}

type DeviceStatReq struct {
	DeviceId string `json:"device_id"`
}
type DeviceStatResp struct {
	Id      string `json:"id"`
	Packets int64  `json:"packets"`
}

func DeviceStatsReqFromBytes(input []byte) (DeviceStatReq, error) {
	tr := DeviceStatReq{}
	err := json.Unmarshal(input, &tr)
	if err != nil {
		return DeviceStatReq{}, InvalidJsonErr
	}
	return tr, nil
}

func DeviceStatsRespToBts(input []DeviceStatResp, err error) (respBts []byte) {
	toReturn := struct {
		DefaultResp
		Count  int              `json:"count"`
		Result []DeviceStatResp `json:"result"`
	}{}
	toReturn.SetCmd("get_device_stat_resp")

	if err != nil {
		tr := DefaultResp{Cmd: "get_device_stat_resp"}
		tr.SetErr(err)
		respBts, _ = json.Marshal(tr)
	} else {
		toReturn.Status = true
		toReturn.Count = len(input)
		toReturn.Result = input
		respBts, _ = json.Marshal(toReturn)
	}

	return respBts
}
