package postgresEvents

import (
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
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

const (
	justStart = 1
	justEnd   = 2
	all       = 3
	nothing   = 4
)

func (r *Repo) GetStats(input adapters.DeviceStatReq) (resp []adapters.DeviceStatResp, err error) {
	resp = []adapters.DeviceStatResp{}

	var rows *sql.Rows

	if input.DeviceId == "" {
		query := `SELECT dev_eui AS id,count(1)AS packets FROM device_up GROUP BY dev_eui ORDER BY id DESC`
		rows, err = r.db.Query(query)
	} else {

		id := &lorawan.EUI64{}
		_ = id.UnmarshalText([]byte(input.DeviceId))

		query := `SELECT dev_eui AS id,count(1)AS packets FROM device_up WHERE dev_eui = $1 GROUP BY dev_eui;`
		rows, err = r.db.Query(query, id)
	}

	if err != nil {
		err = fmt.Errorf("SQL: %v", err)
		return
	}

	for rows.Next() {
		var id []byte
		var packets sql.NullInt64
		err = rows.Scan(&id, &packets)
		if err != nil {
			log.Error(err)
			continue
		}
		t := &lorawan.EUI64{}
		err = t.Scan(id)
		if err != nil {
			log.Error(err)
			continue
		}

		tmp := adapters.DeviceStatResp{
			Id:      t.String(),
			Packets: packets.Int64,
		}
		resp = append(resp, tmp)
	}
	return
}

func (r *Repo) GetPackets(input adapters.GetEventsReq) (resp []adapters.Uplink, err error) {
	resp = []adapters.Uplink{}

	id := &lorawan.EUI64{}
	_ = id.UnmarshalText([]byte(input.DevEui))

	limOffset := fmt.Sprintf(` ORDER BY received_at DESC  LIMIT %d OFFSET %d;`, input.Limit, input.Offset)
	query := fmt.Sprintf(`SELECT received_at,device_name,application_id,frequency,dr,adr,f_cnt,f_port,data,rx_info 
								FROM device_up 
								WHERE dev_eui = $1`)

	mode := 0

	if input.StartTimestamp.Unix() != 0 && input.EndTimestamp.Unix() != 0 {
		mode = all
	} else if input.StartTimestamp.Unix() == 0 && input.EndTimestamp.Unix() == 0 {
		mode = nothing
	} else if input.StartTimestamp.Unix() != 0 && input.EndTimestamp.Unix() == 0 {
		mode = justStart
	} else {
		mode = justEnd
	}

	var rows *sql.Rows

	switch mode {
	case all:
		query += " AND received_at >= $2 AND received_at <= $3" + limOffset
		rows, err = r.db.Query(query, id, input.StartTimestamp, input.EndTimestamp)
		break
	case nothing:
		query += limOffset
		rows, err = r.db.Query(query, id)
		break
	case justStart:
		query += " AND received_at >= $2" + limOffset
		rows, err = r.db.Query(query, id, input.StartTimestamp)
		break
	case justEnd:
		query += " AND received_at <= $2" + limOffset
		rows, err = r.db.Query(query, id, input.EndTimestamp)
		break
	}

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
		dataStr := hex.EncodeToString(data)
		fr := adapters.FloatFrequency(frequency.Int32)
		tmp := adapters.Uplink{
			ApplicationID: ap,
			DeviceName:    deviceName.String,
			DevEUI:        input.DevEui,
			GatewayID:     gw,
			Time:          recieved.Time.Format(adapters.TimeFormat),
			TimeUnix:          recieved.Time.Unix(),
			RSSI:          rssi,
			LoRaSNR:       lorasnr,
			Channel:       0,
			Frequency:     uint32(frequency.Int32),
			FrequencyFl:   fr,
			Adr:           adr.Bool,
			Dr:            uint32(dr.Int32),
			FCnt:          uint32(fcnt.Int32),
			FPort:         uint32(fport.Int32),
			Data:          data,
			DataStr: dataStr,
		}
		resp = append(resp, tmp)

	}

	return resp, nil

}
