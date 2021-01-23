$(document).ready(function() {
  $('.notification .popup-close').on('click', function(e) {
    $(e.target).closest('.notification').removeClass('show');
  })
});


function showNotification(msg) {
  $(document).ready(function() {
    $('.notification').find('.text').text(msg);
    $('.notification').addClass('show');
  });

}

function hideNotification() {
  $(document).ready(function() {
    $('.notification').removeClass('show');
  });
}
