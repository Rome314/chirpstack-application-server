package adapters

import "encoding/json"

func GetEventsReqFromBts(input []byte) (devEUI string, limit, offset int, err error) {
	incoming := struct {
		DevEui string `json:"devEUI"`
		Limit  int    `json:"limit"`
		Offset int    `json:"offset"`
	}{}
	err = json.Unmarshal(input, &incoming)
	if err != nil {
		return "", 0, 0, InvalidJsonErr
	}
	return incoming.DevEui, incoming.Limit, incoming.Offset, nil
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
