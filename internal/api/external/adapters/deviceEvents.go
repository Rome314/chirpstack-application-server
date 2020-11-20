package adapters

import "encoding/json"

func GetEventsReqFromBts(input []byte) (devEUI string,err error) {
	incoming := struct {
		DevEui string `json:"devEUI"`
	}{}
	err = json.Unmarshal(input, &incoming)
	if err != nil{
		return "", InvalidJsonErr
	}
	return incoming.DevEui,nil
}

func GetEventsRespFromList(resp []Uplink, err error) (respBts []byte) {
	toReturn := struct {
		DefaultResp
		TotalCount int      `json:"total_count,omitempty"`
		Packets    []Uplink `json:"packets,omitempty"`
	}{}
	toReturn.SetCmd("get_data_resp")
	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
		toReturn.TotalCount = len(resp)
		toReturn.Packets = resp
	}

	respBts, _ = json.Marshal(toReturn)
	return respBts

}
