package chan_integration

import (
	pb "github.com/brocaar/chirpstack-api/go/v3/as/integration"
)

var MainThread chan pb.UplinkEvent

func init() {
	MainThread = make(chan pb.UplinkEvent)
}


