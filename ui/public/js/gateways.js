$(document).ready(function() {
  //Init tables
  let isFullLoad = false;
  let inLoadingProcess = false;

  function loadTable() {
    let limit = 10;
    let offset = 0;
    let receivedPackets = -1;
    let devicesList = [];
    isFullLoad = false;

    let intervalId = setInterval(function () {
      intervalHandler();
    }, 1000);
    intervalHandler();
    function intervalHandler() {
      if(receivedPackets == 0) {
        clearInterval(intervalId);
        isFullLoad = true;
        $('.table').get(0).clear();
        devicesList.forEach(function (entity) {
          $('.table').get(0).addRow(entity);
        })
      } else if (receivedPackets > 0 || (receivedPackets == -1 && !inLoadingProcess)) {
        load(limit,offset, (packetsCount)=> {
          receivedPackets = packetsCount;
          offset += limit;
        });
      }
    }

    function load(limit, offset, callback) {
      inLoadingProcess = true;
      network.send(network.host, {
        cmd: "get_gateways_req",
        limit: limit,
        offset: offset,
        wsCallbackName: "get_gateways_resp"
      }, (res) => {
        let packetsCount = 0;
        if(res.status) {
          hideNotification();
          if(res.gateways_list) {
            res.gateways_list.forEach(function (entity) {
              if(!entity.lastSeenAt) {
                entity.lastSeenAt = 'never';
              } else {
                entity.lastSeenAt = formatDate(entity.lastSeenAt);
              }
            });
          }
          devicesList = devicesList.concat(res.gateways_list);
          if(devicesList.length >= res.totalCount) {
            packetsCount = 0;
          } else {
            packetsCount = res.gateways_list.length;
          }
        } else {
          showNotification(res.err_msg);
          packetsCount = 0;
        }
        callback(packetsCount);
        inLoadingProcess = false;
      });
    }
  }
  loadTable();

  //Update table data
  setInterval(function () {
    if(isFullLoad) {
      loadTable();
    }
  }, constants.GATEWAYS_REFRESH_DELAY)

  //Add event
  $('#addGatewayPopup .btn-group .button-add').on('click', function (e) {
    e.preventDefault();
    if(!$(e.target).closest('.popup-wrapper').find('form').get(0).validateForm()) {
      return;
    }

    var id = $(e.target).closest('.popup-wrapper').find('form input[name=id]').val();
    var body = $(e.target).closest('.popup-wrapper').find('form').get(0).collectDataByForm();
    var url = window.location.href;
    url = url.slice(url.indexOf('/', 8));

    // network.upload(url, body, function(res) {
    //   if(res.error) {
    //     //Ошибка
    //     showNotification(res.error);
    //   } else {
    //     //Успех
    //     hideNotification();
    //     $('.table').get(0).addRow(res);
    //     $(e.target).closest('.popup-wrapper').get(0).hide();
    //   }
    // })

    network.send(network.host, {
      cmd: "add_gateway_req",
      name: body.gatewayName,
      description: body.description,
      id: body.gatewayEUI.replace(/ /g, ''),
      wsCallbackName: "add_gateway_resp"
    }, (res) => {
      if(res.status) {
        hideNotification();
        loadTable();
        $(e.target).closest('.popup-wrapper').get(0).hide();
      } else {
        showNotification(res.err_msg);
      }
    });
  })
});
