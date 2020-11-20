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
		StartTimestamp string `json:"startTimestamp"`
		EndTimestamp   string `json:"endTimestamp"`
	}{}
	err := json.Unmarshal(input, &incoming)
	if err != nil {
		return nil, InvalidJsonErr
	}

	start, _ := time.Parse(incomingTimeFormat, incoming.StartTimestamp)
	end, _ := time.Parse(incomingTimeFormat, incoming.EndTimestamp)

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
		Timestamp           string `json:"timestamp"`
		RxPacketsReceived   int32  `json:"rxPacketsReceived"`
		RxPacketsReceivedOK int32  `json:"rxPacketsReceivedOK"`
		TxPacketsReceived   int32  `json:"txPacketsReceived"`
		TxPacketsEmitted    int32  `json:"txPacketsEmitted"`
	}

	toReturn := struct {
		DefaultResp
		Result []lsItem `json:"result,omitempty"`
	}{}
	toReturn.SetCmd("get_gw_stat_resp")

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
		ls := []lsItem{}

		for _, item := range resp.Result {
			tmp := lsItem{
				Timestamp:           ptypes.TimestampString(item.Timestamp),
				RxPacketsReceived:   item.RxPacketsReceived,
				RxPacketsReceivedOK: item.RxPacketsReceivedOk,
				TxPacketsReceived:   item.TxPacketsReceived,
				TxPacketsEmitted:    item.TxPacketsEmitted,
			}
			ls = append(ls, tmp)
		}

		toReturn.Result = ls

	}

	respBts, _ = json.Marshal(toReturn)
	return respBts
}
