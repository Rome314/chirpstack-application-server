$(document).ready(function() {
  $('.popup-wrapper .popup-close').each(function (i, close) {
    $(close).on('click', function(e) {
      $(close).closest('.popup-wrapper').get(0).hide();
    })
  })
  $('.popup-wrapper').each(function (i, popupWrapper) {
    // $(popupWrapper).on('click', function(e) {
    //   var popup = $(e.target);
    //   if(popup.is($(popupWrapper))){
    //     $(popupWrapper).find('form').each(function (i, form) {
    //       form.clearForm();
    //     })
    //     popup.hide();
    //   }
    // })
    popupWrapper.hide = function() {
      $(this).hide();
      $(this).find('form').each(function (i, form) {
        $(form).get(0).clearForm();
      })
      $(document.body).css({overflow: 'auto'});
    }
    popupWrapper.show = function() {
      $(this).show();
      $(document.body).css({overflow: 'hidden'});
    }
  })
  //Button popup summoner
  $('.button-popup-summoner').on('click', function (e) {
    var btn = $(e.target);
    var popupId = btn.attr('data-popup');
    if(popupId) {
      var popup = $('#' + popupId);
      if(popup.length) {
        popup.get(0).show();
      }
    }
  });
});
