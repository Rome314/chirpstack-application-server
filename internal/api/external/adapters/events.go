package adapters

import (
	"encoding/hex"
	"encoding/json"
	"strconv"
	"time"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/integration"
	"github.com/brocaar/lorawan"
)

type Uplink struct {
	Cmd           string  `json:"cmd,omitempty"`
	ApplicationID string  `json:"applicationID"`
	DeviceName    string  `json:"deviceName"`
	DevEUI        string  `json:"devEUI"`
	GatewayID     string  `json:"gatewayID"`
	Time          string  `json:"-"`
	TimeUnix      int64   `json:"time"`
	RSSI          int32   `json:"RSSI"`
	LoRaSNR       float64 `json:"loRaSNR"`
	Channel       uint32  `json:"channel"`
	Frequency     uint32  `json:"-"`
	FrequencyFl   float64 `json:"frequency"`
	Adr           bool    `json:"adr"`
	Dr            uint32  `json:"dr"`
	FCnt          uint32  `json:"fCnt"`
	FPort         uint32  `json:"fPort"`
	Data          []byte  `json:"-"`
	DataStr       string  `json:"data"`
	Encoded       string  `json:"encoded"`
}

func UplinkEventFromPb(event pb.UplinkEvent) (resp Uplink) {
	var devEUI lorawan.EUI64
	copy(devEUI[:], event.DevEui)

	var gw lorawan.EUI64
	var rssi int32
	var lorasnr float64
	var channel uint32
	var frequency uint32
	var encoded string

	if event.RxInfo != nil && len(event.RxInfo) != 0 {
		item := event.RxInfo[0]
		copy(gw[:], item.GatewayId)
		rssi = item.Rssi
		lorasnr = item.LoraSnr
		channel = item.Channel

	}
	if event.TxInfo != nil {
		frequency = event.TxInfo.Frequency
	}

	fr := FloatFrequency(int32(frequency))

	dataStr := hex.EncodeToString(event.Data)

	if event.ObjectJson != "" {
		bts := []byte(event.ObjectJson)
		tmp := struct {
			Msg string `json:"msg"`
		}{}

		_ = json.Unmarshal(bts, &tmp)
		encoded = tmp.Msg

	}

	toReturn := Uplink{
		Cmd:           "rx_resp",
		ApplicationID: strconv.FormatUint(event.ApplicationId, 10),
		DeviceName:    event.DeviceName,
		DevEUI:        devEUI.String(),
		GatewayID:     gw.String(),
		TimeUnix:      time.Now().Unix(),
		RSSI:          rssi,
		LoRaSNR:       lorasnr,
		Channel:       channel,
		FrequencyFl:   fr,
		Adr:           event.Adr,
		Dr:            event.Dr,
		FCnt:          event.FCnt,
		FPort:         event.FPort,
		DataStr:       dataStr,
		Encoded:       encoded,
	}

	return toReturn
}
