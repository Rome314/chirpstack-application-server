package adapters

import "fmt"

type config struct {
	Gateways struct {
		DiscoveryEnabled bool   `json:"discoveryEnabled"`
		GatewayProfileID string `json:"gatewayProfileID"`
		NetworkServerID  int64  `json:"networkServerID"`
		OrganizationID   int64  `json:"organizationID"`
		Location         struct {
			Accuracy  uint32  `json:"accuracy"`
			Altitude  float64 `json:"altitude"`
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
			Source    string  `json:"source"`
		} `json:"location"`
	} `json:"gateways"`
	Devices struct {
		ABP          map[string]string `json:"ABP"`
		OTAA         map[string]string `json:"OTAA"`
		ReversedABP  map[string]string
		ReversedOTAA map[string]string
	} `json:"devices"`
}

var Cfg config

func (c *config) GetActivation(devProfileId string) (activation string, err error) {
	if _,ok :=c.Devices.ReversedOTAA[devProfileId];ok{
		return "OTAA",nil
	}
	if _,ok :=c.Devices.ReversedABP[devProfileId];ok{
		return "ABP",nil
	}
	return "", fmt.Errorf("Internal Error: Profile not found")
	
}
