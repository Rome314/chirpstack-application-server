$(function() {
  $(document).ready(function() {
    $('.tabs').each(function (i, tabs) {
      $(tabs).find('.tab').on('click', function(e) {
        let tab = $(e.target);

        $(tab).closest('.tabs').find('.tab').removeClass('active');
        tab.addClass('active');

        var table = tab.closest('.table');
        if(table.length == 0) {
          return;
        }

        table.get(0).clear();
        if(tab.attr('data-datasource-url')) {
          // network.loadAll(tab.attr('data-datasource-url'), undefined, undefined, function (res) {
          //   if(res.error) {
          //     showNotification(res.error);
          //   } else {
          //     res.entities.forEach(function (entity) {
          //       table.get(0).addRow(entity);
          //     })
          //   }
          // });
        }
      });
    });
  });
});

$(document).ready(function() {
  $('.table').each(function (i, table) {
    table = $(table);

    var tableHeaders = $(table).find('.table-header li');
    var rows = $(table).find('.content li');

    var widthOfColumnsInPercents = $.map(tableHeaders, function(header, i) {
      var width = $(header).attr('data-width');
      $(header).css({width: width + '%'});
      return width;
    })

    $(rows).each(function(i, row) {
      var cells = $(row).find('.cell');
      if(cells.length != widthOfColumnsInPercents.length) {
        return;
      }

      cells.each(function(j, cell) {
        $(cell).css({width: widthOfColumnsInPercents[j] + "%"});
      });
    });
  })


  //Add row
  var addRow = function(row, insertToStartList) {
    var table = $(this);
    var rowElement = $(document.createElement('li'));
    var tableHeaders = $(table).find('.table-header li');
    var widthOfColumnsInPercents = $.map(tableHeaders, function(header, i) {
      return $(header).attr('data-width');
    })

    tableHeaders.each(function(i, tableHeader) {
      var field = $(tableHeader).attr('data-field');
      var visible = $(tableHeader).attr('data-visible');
      var cell = row;

      var type = $(tableHeader).attr('data-type');
      var value = cell[field] instanceof Object ? cell[field].value : cell[field] ;
      var link = cell[field] instanceof Object ?
      '' :
      (cell["id"] ? "/gateway/" + cell["id"] : "/device/"+cell["devEUI"] );

      var cellElement = $(document.createElement('div'));
      var text = $(document.createElement('div'));
      if(value !== undefined){
        switch (type.toLowerCase()) {
          case 'link':
            text = $(document.createElement('a'));
            text.attr('href', link);
            break;
          case 'status':
            var status = $(document.createElement('div'));
            status.addClass('status');
            value = value == true ? 'connected' : 'disconnected';
            status.addClass('status-' + value);
            cellElement.prepend(status);
            break;
          default:
        }
      }


      text.addClass('text');
      text.text(value);
      cellElement.addClass('cell');
      cellElement.append(text);
      rowElement.append(cellElement);

      if(widthOfColumnsInPercents && widthOfColumnsInPercents[i]) {
        cellElement.css({width: widthOfColumnsInPercents[i] + '%'});
      }

      if(field == 'id' && !visible) {
        cellElement.css({display: 'none'});
      }
    })

    var content = table.find('.content');
    if(insertToStartList) {
      content.prepend(rowElement);
    } else {
      content.append(rowElement);
    }
  }

  var clearTable = function () {
    var table = $(this);
    table.find('.content').empty();
  }

  $('.table').each(function (i, t) {
    t.addRow = addRow;
    t.clear = clearTable;
  })
});
