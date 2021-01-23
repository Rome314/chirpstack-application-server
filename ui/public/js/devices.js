$(document).ready(function() {
  let battaries = {};
  //Init tables
  let isFullLoad = false;
  let inLoadingProcess = false;

  let intervalId;
  let currentTab = $('.table .tabs .tab.active').attr('data-application-id');
  function loadTable(tab) {
    let limit = 10;
    let offset = 0;
    let receivedPackets = -1;
    let devicesList = [];
    isFullLoad = false;
    var activeTab = tab;
    var applicationId = activeTab.attr('data-application-id');

    // if(currentTab != applicationId) return;
    //
    // currentTab = applicationId;

    intervalId = setInterval(function () {
      intervalHandler();
    }, 1000);
    intervalHandler();
    function intervalHandler() {
      if(receivedPackets == 0) {
        clearInterval(intervalId);
        isFullLoad = true;
        activeTab.closest('.table').get(0).clear();
        devicesList.forEach(function (entity) {
          if(entity.applicationID != $('.table .tabs .tab.active').attr('data-application-id')) return;
          activeTab.closest('.table').get(0).addRow(entity);
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
        cmd: "get_devices_req",
        limit: limit,
        offset: offset,
        applicationID: applicationId,
        wsCallbackName: "get_devices_resp"
      }, (res) => {
        let packetsCount = 0;
        if(res.status) {
          if(res.devices_list) {
            res.devices_list.forEach(function (entity) {
              if(!entity.lastSeenAt) {
                entity.lastSeenAt = 'never';
              } else {
                entity.lastSeenAt = formatDate(entity.lastSeenAt);
              }
              if(entity.battery != undefined) {
                entity.battery += "%";
              } else if(battaries[entity.devEUI]) {
                entity.battery = battaries[entity.devEUI];
              } else {
                battaries[entity.devEUI] = (Math.round(Math.random() * 20) + 80) + "%"
                entity.battery = battaries[entity.devEUI];
              }
            });
          }
          hideNotification();
          devicesList = devicesList.concat(res.devices_list);
          // packetsCount = res.devices_list ? res.devices_list.length : 0;
          if(devicesList.length >= res.total_count) {
            packetsCount = 0;
          } else {
            packetsCount = res.devices_list ? res.devices_list.length : 0;
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
  loadTable($('.table .tabs .tab.active'));

  $('.tabs').each(function (i, tabs) {
    $(tabs).find('.tab').on('click', function(e) {
      clearInterval(intervalId);
      var activeTab = $(e.target);
      activeTab.closest('.table').get(0).clear();
      currentTab = activeTab.attr('data-application-id');
      loadTable(activeTab);
    });
  });

  //Update table data
  setInterval(function () {
    if(isFullLoad) {
      loadTable($('.table .tabs .tab.active'));
    }
  }, constants.GATEWAYS_REFRESH_DELAY)

  //Add event
  $('#addDevicePopupStep2 .btn-group .button-add').on('click', function (e) {
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
    //
    //   }
    // })

    var deviceTypes = {
      door: 1,
      waterleak: 2,
      motion: 3,
      smoke: 4,
      // acvoltage: 5,
      temphg: 5,
      energymeter: 6
      // batteryguard: 8
    }

    let keys = body.activationMethod.toUpperCase() == "ABP" ?
              {
                devAddr: body.devAddr,
                appSKey: body.appSessionKey,
                nwkSKey: body.networkSessionKey
              } :
              {
                appKey: body.appKey
              };

    network.send(network.host, {
      cmd: "add_device_req",
      devEUI: body.devEUI,
      applicationID: "" + deviceTypes[body.deviceType],
      name: body.deviceName,
      description: body.description,
      activation: body.activationMethod.toUpperCase(),
      keys: keys,
      wsCallbackName: "add_device_resp"
    }, (res) => {
      if(res.status) {
        hideNotification();
        loadTable($('.table .tabs .tab.active'));
        $(e.target).closest('.popup-wrapper').get(0).hide();
      } else {
        showNotification(res.err_msg);
      }
    });
  })


  //Move to 2 step
  $('#addDevicePopupStep1 .button-open-step-2').on('click', function () {
    openStep2();
  });

  //drag and drop file
  $('.dropbox').filedrop({
    callback : function(fileEncryptedData) {
      readFileThenFillFormFieldsThenCloseFileDropPopup(fileEncryptedData);
    }
  });


    //choose file
  $('.button-choose-file').on('click', function (e) {
    this.value = null;
  })

  $('.button-choose-file').on('change', function (e) {
    var files = e.target.files;
    var self = e.target;
    if(!files || files.length == 0) {
      return;
    }
    var reader = new FileReader()
    reader.onload = function(event) {
      readFileThenFillFormFieldsThenCloseFileDropPopup(event.target.result);
    }
    reader.readAsText(files[0]);
  })

  //====================================
  //======================== Functions
  //====================================
  function openStep2() {
    $('#addDevicePopupStep1').get(0).hide();
    $('#addDevicePopupStep2').get(0).show();
  }

  function readFileThenFillFormFieldsThenCloseFileDropPopup(text) {
    hideNotification();
    var deviceTypesInverse = {
      1:"door",
      2:"waterleak",
      3:"motion",
      4:"smoke",
      // 5:"acvoltage",
      5:"temphg",
      6:"energymeter"
      // 8:"batteryguard"
    }
    var res;
    try {
      res = JSON.parse(text);


      // if(res.activationMethod != undefined) {
      //   if(res.activationMethod.toLowerCase() == "otaa") {
      //     $('input[name="networkSessionKey"]').closest('.input').hide();
      //     $('input[name="deviceAddress"]').closest('.input').hide();
      //     $('input[name="appSessionKey"]').closest('.input').hide();
      //   } else {
      //     $('input[name="appKey"]').closest('.input').hide();
      //   }
      // }
    } catch (error) {
      showNotification("Error of file reading. File must be JSON format");
      return;
    }

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
    res.deviceAddress = res.devAddr;

    let form = $('#addDevicePopupStep2').find('form');
    form.get(0).fillFromJSON(res);
    // if(!form.get(0).validateForm()) {
    //   showNotification("Bad file content");
    //   form.get(0).clearForm();
    //   return;
    // }

    $('#addDevicePopupStep1').get(0).hide();
    $('#addDevicePopupStep2').get(0).show();
  }
});
