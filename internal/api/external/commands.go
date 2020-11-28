package external

import (
	"context"
	"fmt"

	pb "github.com/brocaar/chirpstack-api/go/v3/as/external/api"

	"github.com/brocaar/chirpstack-application-server/internal/api/external/adapters"
)

func (r *Realization) doAuth(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Internal == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.LoginReqFromBytes(input)
	resp, err := r.Api.Internal.Login(ctx, req)
	return adapters.LoginRespFromPb(resp, err)
}

func (r *Realization) doUserUpdate(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.User == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	email, pass, err := adapters.UpdateReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	_, err = r.Api.User.UpdateMailAndPassword(ctx, email, pass)
	return adapters.UpdateRespFromErr(err)
}

func (r *Realization) doGetGateways(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Gateway == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GatewaysListReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.Gateway.List(ctx, req)
	return adapters.GatewayListRespFromPb(resp, err)
}
func (r *Realization) doGetGateway(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Gateway == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GetGatewayReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.Gateway.Get(ctx, req)
	return adapters.GetGatewayRespFromPb(resp, err)
}

func (r *Realization) doAddGateways(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Gateway == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GatewayCreateReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	_, err = r.Api.Gateway.Create(ctx, req)
	return adapters.GatewayCreateRespFromError(err)
}
func (r *Realization) doDeleteGateways(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Gateway == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GatewayDeleteReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	_, err = r.Api.Gateway.Delete(ctx, req)
	return adapters.GatewayDeleteRespFromError(err)
}

func (r *Realization) doGetDevices(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Device == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GetDevisesListReq(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.Device.List(ctx, req)
	return adapters.GetDevisesListResp(resp, err)
}

func (r *Realization) doAddDevice(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Device == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.CreateDeviceReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	_, err = r.Api.Device.Create(ctx, req.Device)
	if err != nil {
		return adapters.CreateDeviceRespFromError(err)

	}

	if req.Activate == nil {
		_, err = r.Api.Device.CreateKeys(ctx, req.Keys)
		if err != nil {
			r.Api.Device.Delete(ctx, &pb.DeleteDeviceRequest{DevEui: req.Device.Device.DevEui})
		}
	} else {
		_, err = r.Api.Device.Activate(ctx, req.Activate)
		if err != nil {
			r.Api.Device.Delete(ctx, &pb.DeleteDeviceRequest{DevEui: req.Device.Device.DevEui})
		}
	}

	return adapters.CreateDeviceRespFromError(err)
}

func (r *Realization) doGetDeviceInfo(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Device == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GetDeviceReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	device, err := r.Api.Device.Get(ctx, req)
	if err != nil {
		return adapters.GetDeviceRespFromPb(err, "", device, nil, nil)
	}

	devProfileId := device.Device.DeviceProfileId
	activationType, err := adapters.Cfg.GetActivation(devProfileId)
	if err != nil {
		return adapters.GetDeviceRespFromPb(err, "", device, nil, nil)
	}

	var activations *pb.DeviceActivation
	var keys *pb.DeviceKeys
	var aErr error
	devEUI := device.Device.DevEui
	switch activationType {
	case "ABP":
		var aResp *pb.GetDeviceActivationResponse
		req := adapters.GetDeviceActivationsReq(devEUI)

		aResp, aErr = r.Api.Device.GetActivation(ctx, req)
		if aErr != nil {
			break
		}
		activations = aResp.DeviceActivation
		break
	case "OTAA":
		var kResp *pb.GetDeviceKeysResponse
		req := adapters.GetDeviceKeysReq(devEUI)

		kResp, aErr = r.Api.Device.GetKeys(ctx, req)
		if aErr != nil {
			break
		}
		keys = kResp.DeviceKeys
		break
	}
	if aErr != nil {
		return adapters.GetDeviceRespFromPb(aErr, "", device, nil, nil)

	}

	return adapters.GetDeviceRespFromPb(err, activationType, device, activations, keys)
}

func (r *Realization) doDeleteDevice(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Device == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.DeleteDeviceReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	_, err = r.Api.Device.Delete(ctx, req)
	return adapters.DeleteDeviceRespFromError(err)
}
func (r *Realization) doSendData(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.DeviceQueue == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.SendDataReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.DeviceQueue.Enqueue(ctx, req)
	return adapters.SendDataRespFromPb(resp, err)
}

func (r *Realization) doGetDeviceQueue(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.DeviceQueue == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.QueueListReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.DeviceQueue.List(ctx, req)
	return adapters.QueueListRespFromPb(resp, err)
}

func (r *Realization) doGatewayStat(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.Api.Gateway == nil {
		return adapters.GetDefaultRespFromError(cmd, adapters.NotImplementedErr)
	}
	req, err := adapters.GatewayStatsReqFromBytes(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.Api.Gateway.GetStats(ctx, req)
	return adapters.GatewayStatsRespFromPb(resp, err)

}
func (r *Realization) doGetData(cmd string, ctx context.Context, input []byte) (output []byte) {
	if r.pgEvents == nil {
		return adapters.GetDefaultRespFromError(cmd, fmt.Errorf("database is disabled"))
	}
	devEUI, limit, offset, err := adapters.GetEventsReqFromBts(input)
	if err != nil {
		return adapters.GetDefaultRespFromError(cmd, err)
	}
	resp, err := r.pgEvents.GetPackets(devEUI, limit, offset)

	return adapters.GetEventsRespFromList(resp, err)
}
