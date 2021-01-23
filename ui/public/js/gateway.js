$(document).ready(function() {
  var url = window.location.href;
  url = url.slice(url.indexOf('/', 8));
  var deviceType = url.slice(1, url.indexOf('/', 1));
  id = url.slice(1+url.indexOf('/', 1));

  setTimeout(() => {
    network.send(network.host, {
      cmd: "get_gw_stat_req",
      gateway_id: id,
      interval: "all",
      wsCallbackName: "get_gw_stat_resp"
    }, (res) => {
      let packetsCount = 0;
      if(res.status) {
        hideNotification();
        if(res.result && res.result.length > 0) {
          let data = {
            receivedFrames: res.result[0].rxPacketsReceived,
            transmittedFrames: res.result[0].txPacketsEmitted
          }

          $('.card').get(0).fill(data);
        }

      } else {
        showNotification(res.err_msg);
      }
    });
  }, 1000);
});
