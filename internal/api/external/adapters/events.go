package adapters

import (
	"strconv"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/integration"
	"github.com/brocaar/lorawan"
)

type Uplink struct {
	ApplicationID string  `json:"applicationID"`
	DeviceName    string  `json:"deviceName"`
	DevEUI        string  `json:"devEUI"`
	GatewayID     string  `json:"gatewayID"`
	Time          string  `json:"time"`
	RSSI          int32   `json:"RSSI"`
	LoRaSNR       float64 `json:"loRaSNR"`
	Channel       uint32  `json:"channel"`
	Frequency     uint32  `json:"frequency"`
	Adr           bool    `json:"adr"`
	Dr            uint32  `json:"dr"`
	FCnt          uint32  `json:"fCnt"`
	FPort         uint32  `json:"fPort"`
	Data          []byte  `json:"data"`
}

func UplinkEventFromPb(event pb.UplinkEvent) (resp Uplink) {
	var devEUI lorawan.EUI64
	copy(devEUI[:], event.DevEui)

	var gw lorawan.EUI64
	var time string
	var rssi int32
	var lorasnr float64
	var channel uint32
	var frequency uint32

	if event.RxInfo != nil && len(event.RxInfo) != 0 {
		item := event.RxInfo[0]
		copy(gw[:], item.GatewayId)
		time = fromTimeStamp(item.Time)
		rssi = item.Rssi
		lorasnr = item.LoraSnr
		channel = item.Channel

	}
	if event.TxInfo != nil {
		frequency = event.TxInfo.Frequency
	}

	toReturn := Uplink{
		ApplicationID: strconv.FormatUint(event.ApplicationId, 10),
		DeviceName:    event.DeviceName,
		DevEUI:        devEUI.String(),
		GatewayID:     gw.String(),
		Time:          time,
		RSSI:          rssi,
		LoRaSNR:       lorasnr,
		Channel:       channel,
		Frequency:     frequency,
		Adr:           event.Adr,
		Dr:            event.Dr,
		FCnt:          event.FCnt,
		FPort:         event.FPort,
		Data:          event.Data,
	}

	return toReturn
}
