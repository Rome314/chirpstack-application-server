package adapters

import (
	"encoding/json"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
)

func SendDataReqFromBytes(input []byte) (*pb.EnqueueDeviceQueueItemRequest, error) {
	incoming := struct {
		Confirmed bool   `json:"confirmed"`
		Data      []byte `json:"data"`
		DevEUI    string `json:"devEUI"`
		FPort     uint32 `json:"fPort"`
	}{}

	err := json.Unmarshal(input, &incoming)
	if err != nil {
		return nil, InvalidJsonErr
	}

	qi := &pb.DeviceQueueItem{
		DevEui:    incoming.DevEUI,
		Confirmed: incoming.Confirmed,
		FPort:     incoming.FPort,
		Data:      incoming.Data,
	}
	req := &pb.EnqueueDeviceQueueItemRequest{DeviceQueueItem: qi}
	return req, nil

}

func SendDataRespFromPb(resp *pb.EnqueueDeviceQueueItemResponse, err error) (respBts []byte) {
	toReturnSuccess := struct {
		DefaultResp
		FCnt uint32 `json:"fCnt"`
	}{}

	toReturnSuccess.SetCmd("send_data_resp")

	if err != nil {
		t := DefaultResp{
			Cmd: "send_data_resp",
		}
		t.SetErr(err)
		respBts, _ = json.Marshal(t)
	} else {
		toReturnSuccess.Status = true
		toReturnSuccess.FCnt = resp.FCnt
		respBts, _ = json.Marshal(toReturnSuccess)

	}

	return respBts
}

func QueueListReqFromBytes(input []byte) (*pb.ListDeviceQueueItemsRequest, error) {
	incoming := struct {
		DevEUI string `json:"devEUI"`
	}{}

	err := json.Unmarshal(input, &incoming)
	if err != nil {
		return nil, InvalidJsonErr
	}

	req := &pb.ListDeviceQueueItemsRequest{DevEui: incoming.DevEUI}
	return req, nil
}
func QueueListRespFromPb(resp *pb.ListDeviceQueueItemsResponse, err error) (respBts []byte) {
	type lsItem struct {
		DevEUI    string `json:"devEUI"`
		Confirmed bool   `json:"confirmed"`
		FCnt      uint32 `json:"fCnt"`
		FPort     uint32 `json:"fPort"`
		Data      []byte `json:"data"`
	}

	toReturn := struct {
		DefaultResp
		TotalCount       uint32   `json:"total_count,omitempty"`
		DeviceQueueItems []lsItem `json:"device_queue_items,omitempty"`
	}{}
	toReturn.SetCmd("get_device_downlink_queue_resp")

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
		toReturn.TotalCount = resp.TotalCount

		ls := []lsItem{}
		for _, item := range resp.DeviceQueueItems {
			tmp := lsItem{
				DevEUI:    item.DevEui,
				Confirmed: item.Confirmed,
				FCnt:      item.FCnt,
				FPort:     item.FPort,
				Data:      item.Data,
			}
			ls = append(ls, tmp)
		}
		toReturn.DeviceQueueItems = ls

	}
	respBts, _ = json.Marshal(toReturn)
	return respBts

}
