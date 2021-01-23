$(document).ready(function() {
  var cards = $('.card');

  cards.each(function (i, card) {
    card.fill = fillFrom;
  });

  var url = window.location.href;
  url = url.slice(url.indexOf('/', 8));
  var deviceType = url.slice(1, url.indexOf('/', 1));
  id = url.slice(1+url.indexOf('/', 1));

  url = url.slice(0, url.indexOf('/', 1));

  deviceType = deviceType == 'device' ?
  {
    req: "get_dev_info_req",
    res: "get_dev_info_resp"
  } :
  {
    req: "get_gateway_req",
    res: "get_gateway_resp"
  };

  network.send(network.host, {
    cmd: deviceType.req,
    id: id,
    devEUI: id,
    wsCallbackName: deviceType.res
  }, (res) => {
    let packetsCount = 0;
    // if(res.status) {

      if(res.keys){
        res.devAddr = res.keys.devAddr;
        res.appSessionKey = res.keys.appSKey;
        res.networkSessionKey = res.keys.nwkSKey;
        res.appKey = res.keys.appKey;
      }


      res.deviceType = deviceTypesInverse[res.applicationID];
      res.deviceName = res.name;
      res.lastSeen = res.lastSeenAt;
      res.activationMethod = res.activation;
      res.gatewayName = res.name;
      res.gatewayEUI = res.id;
      res.devEUI = res.devEUI;

      if(!res.lasSeenAt) {
        res.lasSeenAt = 'never';
      } else {
        res.lasSeenAt = formatDate(res.lasSeenAt);
      }

      if(!res.lastSeenAt) {
        res.lastSeenAt = 'never';
      } else {
        res.lastSeenAt = formatDate(res.lastSeenAt);
      }

      // res.appSessionKey = res.appKey;
      res.deviceAddress = res.devAddr;

      if(res.activationMethod != undefined) {
        if(res.activationMethod.toLowerCase() == "otaa") {
          $('input[name="networkSessionKey"]').closest('.input').hide();
          $('input[name="deviceAddress"]').closest('.input').hide();
          $('input[name="appSessionKey"]').closest('.input').hide();
        } else {
          $('input[name="appKey"]').closest('.input').hide();
        }
      }

      $("h1 .name").text(res.name);

      if(res.connected) {
        $('.status').addClass('status-enabled');
        $('.status').removeClass('status-disabled');
      } else {
        $('.status').removeClass('status-enabled');
        $('.status').addClass('status-disabled');
      }

      $('.card').get(0).fill(res);
      //Set device/gateway name in popup dialog
      setProductNameInPopupDialog($("#deleteDevicePopup"));
      setProductNameInPopupDialog($("#deleteGatewayPopup"));
      setProductNameInPopupDialog($("#deviceWasDeletedPopup"));
      setProductNameInPopupDialog($("#gatewayWasDeletedPopup"));
    // } else {
    //   showNotification(res.err_msg);
    // }
  });

  // network.load(url, function (res) {
  //   if(res.error) {
  //     showNotification(res.error);
  //   } else {
  //     $('.card').get(0).fill(res);
  //     //Set device/gateway name in popup dialog
  //     setProductNameInPopupDialog($("#deleteDevicePopup"));
  //     setProductNameInPopupDialog($("#deleteGatewayPopup"));
  //     setProductNameInPopupDialog($("#deviceWasDeletedPopup"));
  //     setProductNameInPopupDialog($("#gatewayWasDeletedPopup"));
  //   }
  // });

  //Delete event
  $('#deleteDevicePopup .btn-group .button-delete, #deleteGatewayPopup .btn-group .button-delete').on('click', function (e) {
    e.preventDefault();
    // var id = $('.card input[name="id"]').data('data');
    // var url = window.location.href;
    // url = url.slice(url.indexOf('/', 8));
    // url = url.slice(0, url.indexOf('/', 1)) + "/" + id;

    // network.remove(url, function(res) {
    //   if(res.error) {
    //     //Ошибка
    //     showNotification(res.error);
    //   } else {
    //     //Успех
    //     hideNotification();
    //     $(e.target).closest('.popup-wrapper').get(0).hide();
    //     if($("#gatewayWasDeletedPopup").length) {
    //       $("#gatewayWasDeletedPopup").get(0).show();
    //     }
    //     if($("#deviceWasDeletedPopup").length) {
    //       $("#deviceWasDeletedPopup").get(0).show();
    //     }
    //   }
    // })

    var url = window.location.href;
    url = url.slice(url.indexOf('/', 8));
    var deviceType = url.slice(1, url.indexOf('/', 1));
    deviceType = deviceType == 'device' ?
    {
      req: "delete_device_req",
      res: "delete_device_resp"
    } :
    {
      req: "delete_gateways_req",
      res: "delete_gateway_resp"
    };

    network.send(network.host, {
      cmd: deviceType.req,
      id: id,
      devEUI: id,
      wsCallbackName: deviceType.res
    }, (res) => {
      if(res.status) {
        hideNotification();
        $(e.target).closest('.popup-wrapper').get(0).hide();
        if($("#gatewayWasDeletedPopup").length) {
          $("#gatewayWasDeletedPopup").get(0).show();
        }
        if($("#deviceWasDeletedPopup").length) {
          $("#deviceWasDeletedPopup").get(0).show();
        }
      } else {
        showNotification(res.err_msg);
      }
    });
  })

  $('#gatewayWasDeletedPopup .btn-group .button-confirm, #deviceWasDeletedPopup .btn-group .button-confirm').on('click', function (e) {
    var url = window.location.href;
    url = url.slice(url.indexOf('/', 8));
    url = url.slice(0, url.indexOf('/', 1));
    window.location.href = url;
  });

  function setProductNameInPopupDialog(popup) {
    var name = $(".card .value[data-field='deviceName']").text();
    if(!name || name == '') {
      name = $(".card .value[data-field='gatewayName']").text();
    }
    $(popup).find('h2 span').text(name);
    $(popup).find('.product-name').text(name);
  }
});
