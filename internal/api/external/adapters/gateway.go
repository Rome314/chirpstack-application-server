package adapters

import (
	"encoding/json"
	"time"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
	"github.com/brocaar/chirpstack-api/go/v3/common"
	"github.com/golang/protobuf/ptypes"
	"github.com/golang/protobuf/ptypes/timestamp"
)

const TimeFormat = "2006-01-02T15:04:05.999999"

func GatewaysListReqFromBytes(input []byte) (req *pb.ListGatewayRequest, err error) {
	req = &pb.ListGatewayRequest{}
	err = json.Unmarshal(input, req)
	if err != nil {
		return nil, InvalidJsonErr
	}
	return req, nil
}
func fromTimeStamp(input *timestamp.Timestamp) (res string) {
	if input == nil {
		return ""
	}
	tm := time.Unix(input.Seconds, int64(input.GetNanos()))
	return tm.Format(TimeFormat)
}

func GatewayListRespFromPb(resp *pb.ListGatewayResponse, err error) (respBts []byte) {
	type lsItem struct {
		Id          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		CreatedAt   string `json:"createdAt"`
		UpdatedAt   string `json:"updatedAt"`
		FirstSeenAt string `json:"firstSeenAt"`
		LastSeenAt  string `json:"lastSeenAt"`
		Connected   bool   `json:"connected"`
	}

	toReturn := struct {
		DefaultResp
		TotalCount   int64    `json:"totalCount"`
		GatewaysList []lsItem `json:"gateways_list"`
	}{}
	toReturn.SetCmd("get_gateways_resp")

	if err != nil {
		toReturn.SetErr(err)
	} else {

		toReturn.Status = true
		toReturn.TotalCount = resp.TotalCount

		ls := []lsItem{}
		for _, gw := range resp.Result {
			var connected bool
			lastSeen, err := ptypes.Timestamp(gw.LastSeenAt)
			if err == nil {
				timeoutSeconds := time.Second * time.Duration(Cfg.Gateways.Timeout)
				connected = time.Now().Before(lastSeen.Add(timeoutSeconds))

			}

			tmp := lsItem{
				Id:          gw.Id,
				Name:        gw.Name,
				Description: gw.Description,
				CreatedAt:   fromTimeStamp(gw.CreatedAt),
				UpdatedAt:   fromTimeStamp(gw.UpdatedAt),
				FirstSeenAt: fromTimeStamp(gw.FirstSeenAt),
				LastSeenAt:  fromTimeStamp(gw.LastSeenAt),
				Connected:   connected,
			}
			ls = append(ls, tmp)
		}
		toReturn.GatewaysList = ls
	}
	respBts, _ = json.Marshal(toReturn)
	return respBts

}

func GatewayCreateReqFromBytes(input []byte) (req *pb.CreateGatewayRequest, err error) {
	tmp := struct {
		Id          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}{}

	err = json.Unmarshal(input, &tmp)
	if err != nil {
		return nil, InvalidJsonErr
	}

	req = &pb.CreateGatewayRequest{
		Gateway: &pb.Gateway{
			Id:          tmp.Id,
			Name:        tmp.Name,
			Description: tmp.Description,
			Location: &common.Location{
				Latitude:  Cfg.Gateways.Location.Latitude,
				Longitude: Cfg.Gateways.Location.Longitude,
				Altitude:  Cfg.Gateways.Location.Altitude,
				Source:    common.LocationSource(common.LocationSource_value[Cfg.Gateways.Location.Source]),
				Accuracy:  Cfg.Gateways.Location.Accuracy,
			},
			OrganizationId:   Cfg.Gateways.OrganizationID,
			DiscoveryEnabled: Cfg.Gateways.DiscoveryEnabled,
			NetworkServerId:  Cfg.Gateways.NetworkServerID,
			GatewayProfileId: Cfg.Gateways.GatewayProfileID,
		},
	}
	return req, nil
}

func GatewayCreateRespFromError(err error) (respBts []byte) {
	toReturn := DefaultResp{Cmd: "add_gateway_resp"}

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
	}

	respBts, _ = json.Marshal(toReturn)
	return respBts
}

func GatewayDeleteReqFromBytes(input []byte) (*pb.DeleteGatewayRequest, error) {
	resp := pb.DeleteGatewayRequest{}
	err := json.Unmarshal(input, &resp)
	if err != nil {
		return nil, InvalidJsonErr
	}
	return &resp, nil
}
func GatewayDeleteRespFromError(err error) (respBts []byte) {
	toReturn := DefaultResp{Cmd: "delete_gateway_resp"}

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
	}

	respBts, _ = json.Marshal(toReturn)
	return respBts
}

func GetGatewayReqFromBytes(input []byte) (*pb.GetGatewayRequest, error) {
	resp := pb.GetGatewayRequest{}
	err := json.Unmarshal(input, &resp)
	if err != nil {
		return nil, InvalidJsonErr
	}
	return &resp, nil
}

func GetGatewayRespFromPb(resp *pb.GetGatewayResponse, err error) (respBts []byte) {
	toReturn := struct {
		DefaultResp
		Id          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		CreatedAt   string `json:"createdAt"`
		UpdatedAt   string `json:"updatedAt"`
		FirstSeenAt string `json:"firstSeenAt"`
		LastSeenAt  string `json:"lastSeenAt"`
		Connected   bool   `json:"connected"`
	}{}
	toReturn.SetCmd("get_gateway_resp")

	if err != nil {
		toReturn := DefaultResp{Cmd:"get_gateway_resp" }
		toReturn.SetErr(err)
		respBts,_ = json.Marshal(toReturn)

	} else {
		toReturn.Status = true
		toReturn.Id = resp.Gateway.Id
		toReturn.Name = resp.Gateway.Name
		toReturn.Description = resp.Gateway.Description
		toReturn.CreatedAt = fromTimeStamp(resp.CreatedAt)
		toReturn.UpdatedAt = fromTimeStamp(resp.UpdatedAt)
		toReturn.FirstSeenAt = fromTimeStamp(resp.FirstSeenAt)
		toReturn.LastSeenAt = fromTimeStamp(resp.LastSeenAt)

		var connected bool
		lastSeen, err := ptypes.Timestamp(resp.LastSeenAt)
		if err == nil {
			timeoutSeconds := time.Second * time.Duration(Cfg.Gateways.Timeout)
			connected = time.Now().Before(lastSeen.Add(timeoutSeconds))

		}
		toReturn.Connected = connected
		respBts, _ = json.Marshal(toReturn)

	}
	return respBts

}
