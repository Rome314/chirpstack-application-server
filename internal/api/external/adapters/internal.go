package adapters

import (
	"encoding/json"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"
)

func LoginReqFromBytes(input []byte) (req *pb.LoginRequest, err error) {
	req = &pb.LoginRequest{}
	err = json.Unmarshal(input, req)
	if err != nil {
		return nil, InvalidJsonErr
	}
	return req, nil
}

func LoginRespFromPb(resp *pb.LoginResponse, err error) (respBts []byte) {
	toReturn := struct {
		DefaultResp
		Jwt string `json:"jwt,omitempty"`
	}{}
	toReturn.SetCmd("auth_resp")
	if err != nil {
		toReturn.SetErr(err)

	} else {
		toReturn.Status = true
		toReturn.Jwt = resp.Jwt
	}

	bts, _ := json.Marshal(toReturn)

	return bts
}
