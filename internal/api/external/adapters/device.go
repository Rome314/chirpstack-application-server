package adapters

import (
	"encoding/json"
	"fmt"
	"strconv"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
)

func GetDevisesListReq(input []byte) (*pb.ListDeviceRequest, error) {
	req := pb.ListDeviceRequest{}
	err := json.Unmarshal(input, &req)
	if err != nil {
		return nil, InvalidJsonErr
	}
	return &req, nil
}

func GetDevisesListResp(resp *pb.ListDeviceResponse, err error) (respBts []byte) {
	type lsItem struct {
		DevEUI        string `json:"devEUI"`
		Name          string `json:"name"`
		ApplicationID int64  `json:"applicationID"`
		Description   string `json:"description"`
		LasSeenAt     string `json:"lasSeenAt"`
	}

	toReturn := struct {
		DefaultResp
		TotalCount  int64    `json:"total_count,omitempty"`
		DevicesList []lsItem `json:"devices_list,omitempty"`
	}{}
	toReturn.SetCmd("get_devices_resp")

	if err != nil {
		toReturn.SetErr(err)
	} else {
		ls := []lsItem{}
		for _, device := range resp.Result {
			tmp := lsItem{
				DevEUI:        device.DevEui,
				Name:          device.Name,
				ApplicationID: device.ApplicationId,
				Description:   device.Description,
				LasSeenAt:     fromTimeStamp(device.LastSeenAt),
			}
			ls = append(ls, tmp)
		}

		toReturn.Status = true
		toReturn.DevicesList = ls
		toReturn.TotalCount = resp.TotalCount

	}
	respBts, _ = json.Marshal(toReturn)
	return

}

type CreateDeviceReq struct {
	Device   *pb.CreateDeviceRequest
	Keys     *pb.CreateDeviceKeysRequest
	Activate *pb.ActivateDeviceRequest
}

func CreateDeviceReqFromBytes(input []byte) (resp *CreateDeviceReq, err error) {
	incoming := struct {
		DevEUI        string `json:"devEUI"`
		ApplicationID string `json:"applicationID"`
		Name          string `json:"name"`
		Description   string `json:"description"`
		Activation    string `json:"activation"`
		Keys          struct {
			DevAddr string `json:"devAddr"`
			AppSKey string `json:"appSKey"`
			AppKey string `json:"appKey"`
			NwkSKey string `json:"nwkSKey"`
		} `json:"keys"`
	}{}
	err = json.Unmarshal(input, &incoming)
	if err != nil {
		return nil, InvalidJsonErr
	}
	appId, _ := strconv.Atoi(incoming.ApplicationID)

	if incoming.Activation != "ABP" && incoming.Activation != "OTAA" {
		err = fmt.Errorf("invalid activation provided")
		return nil, err
	}
	var devicesProfileId string
	var ok bool
	switch incoming.Activation {
	case "ABP":
		devicesProfileId, ok = Cfg.Devices.ABP[incoming.ApplicationID]
		break
	case "OTAA":
		devicesProfileId, ok = Cfg.Devices.OTAA[incoming.ApplicationID]
		break
	}
	if !ok {
		err = fmt.Errorf("unknown application id")
		return nil, err
	}

	device := &pb.CreateDeviceRequest{
		Device: &pb.Device{
			DevEui:            incoming.DevEUI,
			Name:              incoming.Name,
			ApplicationId:     int64(appId),
			Description:       incoming.Description,
			DeviceProfileId:   devicesProfileId,
			SkipFCntCheck:     true,
			IsDisabled:        false,
			ReferenceAltitude: 0,
			Variables:         map[string]string{},
			Tags:              map[string]string{},
		},
	}

	var activate *pb.ActivateDeviceRequest
	var keys *pb.CreateDeviceKeysRequest
	switch incoming.Activation {
	case "ABP":
		activate = &pb.ActivateDeviceRequest{
			DeviceActivation: &pb.DeviceActivation{
				DevEui:      incoming.DevEUI,
				DevAddr:     incoming.Keys.DevAddr,
				AppSKey:     incoming.Keys.AppSKey,
				NwkSEncKey:  incoming.Keys.NwkSKey,
				SNwkSIntKey: incoming.Keys.NwkSKey,
				FNwkSIntKey: incoming.Keys.NwkSKey,
				FCntUp:      0,
				NFCntDown:   0,
				AFCntDown:   0,
			},
		}
		break
	case "OTAA":
		keys = &pb.CreateDeviceKeysRequest{
			DeviceKeys: &pb.DeviceKeys{
				DevEui:    incoming.DevEUI,
				NwkKey:    incoming.Keys.AppKey,
				AppKey:    incoming.Keys.AppKey,
				GenAppKey: "00000000000000000000000000000000",
			},
		}
		break
	}

	resp = &CreateDeviceReq{
		Device:   device,
		Keys:     keys,
		Activate: activate,
	}
	return resp, nil

}
func CreateDeviceRespFromError(err error) (respBts []byte) {
	toReturn := DefaultResp{}
	toReturn.SetCmd("add_device_resp")
	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
	}
	respBts, _ = json.Marshal(toReturn)
	return
}

func GetDeviceKeysReq(devEUI string) *pb.GetDeviceKeysRequest {
	return &pb.GetDeviceKeysRequest{DevEui: devEUI}
}
func GetDeviceActivationsReq(devEUI string) *pb.GetDeviceActivationRequest {
	return &pb.GetDeviceActivationRequest{DevEui: devEUI}
}

func GetDeviceReqFromBytes(input []byte) (*pb.GetDeviceRequest, error) {
	inStr := struct {
		DevEUI string `json:"devEUI"`
	}{}
	err := json.Unmarshal(input, &inStr)
	if err != nil {
		return nil, InvalidJsonErr
	}

	req := pb.GetDeviceRequest{DevEui: inStr.DevEUI}
	return &req, nil
}

func GetDeviceRespFromPb(err error, aType string, device *pb.GetDeviceResponse, activation *pb.DeviceActivation, keys *pb.DeviceKeys) (respBts []byte) {
	type keyItem struct {
		DevAddr string `json:"devAddr,omitempty"`
		AppSKey string `json:"appSKey,omitempty"`
		NwkSKey string `json:"nwkSKey,omitempty"`
		AppKey  string `json:"appKey,omitempty"`
	}

	toReturn := struct {
		DefaultResp
		DevEUI        string  `json:"devEUI,omitempty"`
		ApplicationID string  `json:"applicationID,omitempty"`
		Name          string  `json:"name,omitempty"`
		Description   string  `json:"description,omitempty"`
		LastSeenAt    string  `json:"lastSeenAt,omitempty"`
		Activation    string  `json:"activation,omitempty"`
		Keys          keyItem `json:"keys,omitempty"`
	}{}
	toReturn.SetCmd("get_dev_info_resp")

	if err != nil {
		toReturn.SetErr(err)
	} else {
		devId := strconv.Itoa(int(device.Device.ApplicationId))

		toReturn.DevEUI = device.Device.DevEui
		toReturn.ApplicationID = devId
		toReturn.Name = device.Device.Name
		toReturn.Description = device.Device.Description
		toReturn.LastSeenAt = fromTimeStamp(device.LastSeenAt)
		toReturn.Activation = aType

		var k keyItem
		switch aType {
		case "ABP":
			k = keyItem{
				DevAddr: activation.DevAddr,
				AppSKey: activation.AppSKey,
				NwkSKey: activation.NwkSEncKey,
			}
			break
		case "OTAA":
			k = keyItem{
				AppKey: keys.AppKey,
			}
		}
		toReturn.Keys = k

	}

	respBts, _ = json.Marshal(toReturn)
	return respBts

}

func DeleteDeviceReqFromBytes(input []byte) (*pb.DeleteDeviceRequest, error) {
	inc := struct {
		DevEUI string `json:"devEUI"`
	}{}
	err := json.Unmarshal(input, &inc)
	if err != nil {
		return nil, InvalidJsonErr
	}

	req := pb.DeleteDeviceRequest{DevEui: inc.DevEUI}
	return &req, nil

}
func DeleteDeviceRespFromError(err error) (respBts []byte) {
	toReturn := DefaultResp{Cmd: "delete_device_resp"}

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
	}

	respBts, _ = json.Marshal(toReturn)
	return respBts

}
