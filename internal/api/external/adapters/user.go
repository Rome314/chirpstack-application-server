package adapters

import "encoding/json"

func UpdateReqFromBytes(input []byte) (email, password string, err error) {
	inp := struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}{}

	err = json.Unmarshal(input, &inp)
	if err != nil {
		return "", "", InvalidJsonErr
	}
	return inp.Login, inp.Password, nil
}
func UpdateRespFromErr(err error) (respBts []byte) {
	toReturn := DefaultResp{Cmd: "user_upd_resp"}

	if err != nil {
		toReturn.SetErr(err)
	} else {
		toReturn.Status = true
	}

	respBts, _ = json.Marshal(toReturn)
	return respBts
}
