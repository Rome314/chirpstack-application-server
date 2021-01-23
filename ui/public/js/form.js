$(function() {
  $('form').each(function (i, form) {
    form.collectDataByForm = collectDataByForm;
    form.validateForm = validateForm;
    form.clearForm = clearForm;
    form.fillFrom = fillFrom;
    form.fillFromJSON = fillFromJSON;
  })

  $('.popup-form').submit(function(e) {
    e.preventDefault();

    var form = $(this);
    var url = form.attr('action');

    if(form.get(0).validateForm()) {
      var data = form.get(0).collectDataByForm();
      send(data, 'post', url);
      form.get(0).clearForm();
      form.closest('.popup-wrapper').hide();
    }

    return false;
  })
});

var collectDataByForm = function() {
  var form = $(this);
  var fields = form.find('.input');
  var entity = {};

  $.map(fields, function (field) {
    field = $(field);
    var input = field.find('input');
    if(!field.hasClass('switcher') && (input.css('display') == 'none' || !input.data('data'))) {
      return;
    }
    if(field.hasClass('switcher')) {
      entity[input.attr('name')] = $(field.find('.cases .case')[$(input).is(':checked') ? 1 : 0]).text();
      entity[input.attr('name')] = entity[input.attr('name')].replace(/ /g, '').replace(/\n/g, '');
    } else {
      entity[input.attr('name')] = input.data('data').replace(/ /g, '').replace(/\n/g, '');
    }
  });
  return entity;
}

var validateForm = function() {
  var form = $(this);
  var fields = form.find('.input');
  var isValid = true;
  fields.each(function (i, field) {
    isValid = field.validate();
    return isValid;
  });

  return isValid;
}

var clearForm = function() {
  var form = $(this);
  var fields = form.find('.input');
  fields.each(function (i, field) {
    $(field).get(0).clear();
  });
}

function send(data, method, url) {
  return {
    status: 200
  };
}
