$(document).ready(function() {
  var url = window.location.href;
  url = url.slice(url.indexOf('/', 8));
  var deviceType = url.slice(1, url.indexOf('/', 1));
  id = url.slice(1+url.indexOf('/', 1));

  //tables
  $('.tabs').each(function (i, tabs) {
    $(tabs).find('.tab').on('click', function(e) {
      let tab = $(e.target);

      openIsActiveTab(tab);
    });
    $(tabs).find('.tab').each(function(i, tab) {
      tab = $(tab);
      if(tab.hasClass('active')) {
        $('#'+tab.attr('data-show-element')).show();
      } else {
        $('#'+tab.attr('data-show-element')).hide();
      }
    });
  });

  $('.control-switch-count .select-count .item').click((e) => {
    var table = $(e.target).closest(".table");
    var from = prepareDate(globalStartDate, true);
    var to = prepareDate(globalEndDate, false);
    var size = +$(e.target).text();
    var page = 0;
    $('.date-pick-result').hide();
    table.get(0).clear();
    getEntities(table, page, size, from, to, () => {
      setTimeout(()=> {
        $('.date-pick-result').css("display", "flex");
      }, 300);
    });
  });
  //show data-range-picker results     encodedData
  $('#request').click(function () {
    if($(this).hasClass('disable')) {
      return;
    }
    $('.date-pick-result').hide();
    $('#encodedData').get(0).clear();
    $('#rawPackets').get(0).clear();
    var from = prepareDate(globalStartDate, true);
    var to = prepareDate(globalEndDate, false);
    var rawPacketsSize = $('#rawPackets .load-bar .dropdown-input').val();
    var encodedDataSize = $('#encodedData .load-bar .dropdown-input').val();

    var showResult = 0;
    getEntities($('#rawPackets, #encodedData'), 0, +rawPacketsSize, from, to, () => {
      // if(++showResult == 2) {
        setTimeout(()=> {
          $('.date-pick-result').css("display", "flex");
        }, 300)
      // }
    });
    // getEntities($('#encodedData'), 0, +encodedDataSize, from, to, () => {
    //   if(++showResult == 2) {
    //     setTimeout(()=> {
    //       $('.date-pick-result').css("display", "flex");
    //     }, 300)
    //   }
    // });
  })
  $('#rawPackets .load-bar .button-show-more, #encodedData .load-bar .button-show-more').click(function () {
    if($(this).hasClass('disable')) {
      return;
    }
    var table = $(this).closest('.table');
    var from = prepareDate(globalStartDate, true);
    var to = prepareDate(globalEndDate, false);
    var size = $(table).find('.control-switch-count .dropdown-input').val();
    var page = $(table).find('.content > li').length;
    getEntities(table, page, +size, from, to, () => {
      $('.date-pick-result').css("display", "flex");
    });
  })

  setTimeout(() => {
    network.send(network.host, {
      cmd: "get_device_stat_req",
      devEUI: id,
      wsCallbackName: "get_device_stat_resp"
    }, (res) => {
      if(res.status && res.result && res.result.length > 0) {
        hideNotification();
        res.framesUp = res.result[0].packets;
        $('.card').get(0).fill(res);
      } else {
        showNotification(res.err_msg);
      }
    });
  }, 1000);

  function getEntities(table, page, size, from, to, callback) {

    network.send(network.host, {
      cmd: "get_data_req",
      limit: size,
      devEUI: id,
      offset: page,
      startTimestamp: from,
      endTimestamp: to,
      wsCallbackName: "get_data_resp"
    }, (res) => {
      let packetsCount = 0;
      if(res.status) {
        hideNotification();
        res.packets.forEach(function (entity) {
          entity.RSSI += ' / ' + entity.loRaSNR;
          entity.time = formatDate(entity.time);
          entity.message = "guard event";
          $(table).each((i, t) => {
            t.addRow(entity);
          })
          // $(table).get(0).addRow(entity);
        })
        if(callback) callback();
      } else {
        showNotification(res.err_msg);
      }
    });
  }

  function openIsActiveTab(tab) {
    $(tab).closest('.tabs').find('.tab').each(function (i, tab) {
      tab = $(tab);
      $('#'+tab.attr('data-show-element')).hide();
    })
    $('#'+tab.attr('data-show-element')).show();
  }

  function prepareDate(date, isBeginOfDay) {
    date = new Date(date);
    if(isBeginOfDay) {
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
    } else {
      date.setHours(23);
      date.setMinutes(59);
      date.setSeconds(59);
    }
    return Math.floor(date.getTime() / 1000);
  }

  network.callbacks["rx_resp"] = (res) => {
    if(res.devEUI != id) {
      return;
    }
    if(res.time && globalStartDate && globalEndDate) {
      let date = res.time;
      if(date < prepareDate(globalStartDate, true) ||
         date > prepareDate(globalEndDate, false)) {
           return;
         }
    } else {
      return;
    }

    res.RSSI += ' / ' + res.loRaSNR;
    res.time = formatDate(res.time);
    res.message = "guard event";
    let tables = $('#rawPackets, #encodedData');
    $(tables).each((i, t) => {
      t.addRow(res, true);
    })
  }
});
