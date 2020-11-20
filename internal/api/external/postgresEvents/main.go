package postgresEvents

import (
	"database/sql"
	"encoding/json"
	"strconv"
	"time"

	"github.com/brocaar/lorawan"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"

	"github.com/brocaar/chirpstack-application-server/internal/api/external/adapters"
	"github.com/brocaar/chirpstack-application-server/internal/config"
)

type Repo struct {
	db *sqlx.DB
}

func NewEventsHandler(conf config.IntegrationPostgreSQLConfig) (*Repo, error) {
	log.Info("postgres events handler: connecting to PostgreSQL database")
	d, err := sqlx.Open("postgres", conf.DSN)
	if err != nil {
		return nil, errors.Wrap(err, "postgres events handler: PostgreSQL connection error")
	}
	for {
		if err := d.Ping(); err != nil {
			log.WithError(err).Warning("postgres events handler: ping PostgreSQL database error, will retry in 2s")
			time.Sleep(2 * time.Second)
		} else {
			break
		}
	}

	d.SetMaxOpenConns(conf.MaxOpenConnections)
	d.SetMaxIdleConns(conf.MaxIdleConnections)

	return &Repo{
		db: d,
	}, nil
}

type rxJson struct {
	RSSI      int32   `json:"RSSI"`
	LoRaSNR   float64 `json:"loRaSNR"`
	GatewayID string  `json:"gatewayID"`
}

func (r *Repo) GetPackets(devEUI string) (resp []adapters.Uplink, err error) {
	resp = []adapters.Uplink{}

	id := &lorawan.EUI64{}
	_ = id.UnmarshalText([]byte(devEUI))

	query := `SELECT received_at,device_name,application_id,frequency,dr,adr,f_cnt,f_port,data,rx_info from device_up WHERE dev_eui = $1`

	rows, err := r.db.Query(query, id)
	if err != nil {
		err = errors.New("could not get rows")
		return
	}

	for rows.Next() {
		var rxLs []rxJson
		var appId, frequency, dr, fcnt, fport sql.NullInt32
		var adr sql.NullBool
		var deviceName sql.NullString
		var data []byte
		var recieved sql.NullTime
		var rx []byte
		var gw string
		var rssi int32
		var lorasnr float64

		err = rows.Scan(&recieved, &deviceName, &appId, &frequency, &dr, &adr, &fcnt, &fport, &data, &rx)
		if err != nil {
			log.Error(err)
			continue
		}

		err = json.Unmarshal(rx, &rxLs)
		if err != nil {
			log.Error(err)
			continue
		}
		if rxLs != nil && len(rxLs) != 0 {
			gw = rxLs[0].GatewayID
			rssi = rxLs[0].RSSI
			lorasnr = rxLs[0].LoRaSNR
		}

		ap := strconv.Itoa(int(appId.Int32))

		tmp := adapters.Uplink{
			ApplicationID: ap,
			DeviceName:    deviceName.String,
			DevEUI:        devEUI,
			GatewayID:     gw,
			Time:          recieved.Time.Format(adapters.TimeFormat),
			RSSI:          rssi,
			LoRaSNR:       lorasnr,
			Channel:       0,
			Frequency:     uint32(frequency.Int32),
			Adr:           adr.Bool,
			Dr:            uint32(dr.Int32),
			FCnt:          uint32(fcnt.Int32),
			FPort:         uint32(fport.Int32),
			Data:          data,
		}
		resp = append(resp, tmp)

	}
	return resp, nil

}
