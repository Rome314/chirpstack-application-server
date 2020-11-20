package external

import "context"

type Api struct {
	Internal    *InternalAPI
	User        *UserAPI
	Gateway     *GatewayAPI
	Device      *DeviceAPI
	DeviceQueue *DeviceQueueAPI
}

func RegisterInternalApi(r *Realization, a *InternalAPI) {
	r.Api.Internal = a
}
func RegisterUserApi(r *Realization, a *UserAPI) {
	r.Api.User = a
}
func RegisterGatewayApi(r *Realization, a *GatewayAPI) {
	r.Api.Gateway = a
}
func RegisterDeviceApi(r *Realization, a *DeviceAPI) {
	r.Api.Device = a
}

func RegisterDeviceQueueApi(r *Realization, a *DeviceQueueAPI) {
	r.Api.DeviceQueue = a
}

func RegisterCommand(r *Realization) {
	commands := map[string]func(cmd string, ctx context.Context, input []byte) (output []byte){
		"auth_req":                      r.doAuth,
		"user_upd_req":                  r.doUserUpdate,
		"get_gateways_req":              r.doGetGateways,
		"add_gateway_req":               r.doAddGateways,
		"delete_gateways_req":           r.doDeleteGateways,
		"get_devices_req":               r.doGetDevices,
		"add_device_req":                r.doAddDevice,
		"get_dev_info_req":              r.doGetDeviceInfo,
		"delete_device_req":             r.doDeleteDevice,
		"send_data_req":                 r.doSendData,
		"get_device_downlink_queue_req": r.doGetDeviceQueue,
		"get_gw_stat_req":               r.doGatewayStat,
		"get_data_req":                  r.doGetData,
	}
	r.Commands = commands
}
