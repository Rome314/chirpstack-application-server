
var globalStartDate, globalEndDate;
$(function() {
  $(document).ready(function() {
    // init daterangepicker
    var picker = $('.date-range-picker .date-picker-area .date-range-chooses').daterangepicker({
      "parentEl": ".date-range-picker .date-picker-area .daterangepicker-container"
    });
    // range update listener
    picker.on('apply.daterangepicker', function(ev, picker) {
      var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      var diffDays = Math.round(Math.abs((picker.startDate - picker.endDate) / oneDay));
      $(".date-range-picker .drp-buttons span").html(diffDays + ' days selected');
      globalStartDate = picker.startDate._d;
      globalEndDate = picker.endDate._d;
      $('.date-range-picker .date-from').text(formatDate(globalStartDate));
      $('.date-range-picker .date-to').text(formatDate(globalEndDate));
      $('.date-range-picker .daterangepicker-container').hide();
      $('.date-range-picker .date-to').removeClass('active');
      $('.date-range-picker .date-to').addClass('choosed');
      $('#request').removeClass('disable');
    });
    // prevent hide after range selection
    picker.data('daterangepicker').hide = function () {};
    $('.date-range-picker .cancelBtn').text('Clear dates');
    picker.data('daterangepicker').show();
    $('.date-range-picker .cancelBtn').hide();

    //Create element showed selected days
    var selectedDays = $(document.createElement('div'));
    selectedDays.text('0 days selected');
    $('.date-picker-area .drp-buttons').prepend(selectedDays);
    var dateRange =  $('.date-picker-area .drp-buttons .drp-selected');
    dateRange.css('display', 'none');
    var prevDateRange = dateRange.text();
    setInterval(function () {
      if(dateRange.text() !== prevDateRange) {
        prevDateRange = dateRange.text();
        var currentDateRange = prevDateRange.replace(/ /g, '');
        var from = currentDateRange.split('-')[0];
        var to = currentDateRange.split('-')[1];
        from = new Date(from.split('/')[2], from.split('/')[0] - 1, from.split('/')[1]);
        to = new Date(to.split('/')[2], to.split('/')[0] - 1, to.split('/')[1]);
        var daysBetween = Math.round((to - from)/(1000*60*60*24));
        selectedDays.text(daysBetween + ' days selected');
      }
    }, 1000);

    var eventListenerAttached = false;
    //init daterangepicker
    //dropdown input
    $(document).on('click', function(e) {
      var self = e.target;
      $('.date-range-picker .dropdown-list .item').each(function (i, item) {
        var dateFrom = $(item).closest('.date-range-picker').find('.date-from');
        var dateTo = $(item).closest('.date-range-picker').find('.date-to');
        if($(item).is(self)) {
          $('.date-pick-result').hide();
          var dateRange = getDateByType($(item).attr('data-type'));
          if(dateRange.startDate && dateRange.endDate) {
            globalStartDate = dateRange.startDate;
            globalEndDate = dateRange.endDate;
            dateFrom.text(dateRange.startDate);
            dateTo.text(dateRange.endDate);
            dateTo.addClass('choosed');
            $('#request').removeClass('disable');
          } else {
            $('.date-range-picker .daterangepicker-container').show();
            $('#request').addClass('disable');
            dateTo.addClass('active');
          }
        }
      });
      $('.date-range-picker .dropdown-input').each(function (i, item) {
        if($(item).closest('.date-controls').find('.date-range').has(self).length > 0) {
          $(item).closest('.date-range-picker').find('.dropdown-menu-content').toggle();
        } else {
          $(item).closest('.date-range-picker').find('.dropdown-menu-content').hide();
        }
      });
    });

    function getDateByType(type) {
      var startDate = new Date();
      var endDate = new Date();
      switch (type) {
        case 'today':
          break
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          endDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = undefined;
          endDate = undefined;
      }
      if(startDate && endDate) {
        startDate = formatDate(startDate);
        endDate = formatDate(endDate);
      }
      return {
        startDate: startDate,
        endDate: endDate
      };
    }


    function formatDate(date) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      }).replace(/ /g, ' ');
    }
  });
});
