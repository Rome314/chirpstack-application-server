$(function() {
  $(document).ready(function() {
    $(document).on('click', function(e) {
      var self = e.target;
      $('.user').each(function (i, icon) {
        if($(icon).has(self).length) {
          $(icon).find('.dropdown-menu-content').toggle();
        } else {
          $('.dropdown-menu .dropdown-menu-content').hide();
        }
      });

      //dropdown input
      $('.input .dropdown-list .item').each(function (i, item) {
        if($(item).is(self)) {
          $(item).closest('.input').get(0).setValue({value: $(item).text()});
        }
      });
      $('.dropdown-input').each(function (i, item) {
        if($(item).closest('.input').has(self).length > 0) {
          $(item).closest('.input').find('.dropdown-menu-content').toggle();
        } else {
          $(item).closest('.input').find('.dropdown-menu-content').hide();
        }
      });
    });
  });
});
