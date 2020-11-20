package adapters

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"regexp"
)

type DefaultResp struct {
	Cmd    string `json:"cmd"`
	Status bool   `json:"status"`
	ErrMsg string `json:"err_msg,omitempty"`
}

var InvalidJsonErr = fmt.Errorf("invalid json provided")
var NotImplementedErr = fmt.Errorf("not implemented")

func init() {
	data, err := ioutil.ReadFile("config.json")
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(data, &Cfg)
	if err != nil {
		panic(err)
	}

	revABP := map[string]string{}
	for k, v := range Cfg.Devices.ABP {
		revABP[v] = k
	}
	Cfg.Devices.ReversedABP = revABP

	revOTAA := map[string]string{}
	for k, v := range Cfg.Devices.OTAA {
		revOTAA[v] = k
	}
	Cfg.Devices.ReversedOTAA = revOTAA

}

func UnknownCommandResp(cmd string) (respBts []byte) {
	toReturn := DefaultResp{
		Cmd:    cmd,
		Status: false,
		ErrMsg: "Unknown command",
	}
	respBts, _ = json.Marshal(toReturn)
	return respBts
}

func GetDefaultRespFromError(cmd string, err error) (respBts []byte) {
	errMsg := err.Error()
	errMsg = grpcErrRegexp.ReplaceAllString(errMsg, "")
	toReturn := DefaultResp{
		Cmd:    cmd,
		Status: false,
		ErrMsg: errMsg,
	}
	respBts, _ = json.Marshal(toReturn)
	return respBts
}

var grpcErrRegexp = regexp.MustCompile(`(.)*desc = `)

func (d *DefaultResp) SetErr(err error) {
	d.Status = false
	errMsg := err.Error()
	errMsg = grpcErrRegexp.ReplaceAllString(errMsg, "")
	d.ErrMsg = errMsg
	return
}
func (d *DefaultResp) SetCmd(cmd string) {
	d.Cmd = cmd
	return
}
