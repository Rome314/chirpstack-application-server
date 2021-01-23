$(document).ready(function() {
  // network.get('/user', function (res) {
  //   if(res.error) {
  //     showNotification(res.error);
  //   } else {
  //     hideNotification();
  //     $('.header .user .username').text(res.username)
  //   }
  // });
  $('.header .user .username').text(window.localStorage.username);
  $('.header .user  .menu-item_logout').click(function (e) {
    window.sessionStorage.accessToken = undefined;
    // network.setCookie("authorization", "", {'max-age': -1});
    document.cookie = "authorization=";
    window.location.href = '/login';
    window.localStorage.username = "";
    window.localStorage.password = "";
  })
});

function getEntityByField(entities, fieldName) {
  for (entity of entities) {
    if(entity.field == fieldName) {
      return entity;
    }
  }
}

function findEntityByFieldTypeAndValue(entities, fieldType, fieldValue) {
  for (entity of entities) {
    if(entity[fieldType] == fieldValue) {
      return entity;
    }
  }
}

//Fill html-elements with attribute [data-field] values
function fillFrom(entity) {
  $(this).find('.row .value, .input').each(function (i, field) {
    field = $(field);
    var fieldName = field.is('.input') ? field.find('input').attr('name') : field.attr('data-field');
    var value = entity[fieldName] instanceof Object ? entity[fieldName].value : entity[fieldName];

    if(!value) {
      return;
    }

    if(field.is('.input')) {
      field.get(0).setValue({
        name: fieldName,
        value: value
      });
    } else {
      field.text(value);
    }
  })
}

//Fill html-elements with attribute [data-field] values
// function fillFromJSON(values) {
//   if(!values){
//     return;
//   }
//   $(this).find('.row .value, .input').each(function (i, field) {
//     field = $(field);
//     var fieldName = field.is('.input') ? field.find('input').attr('name') : field.attr('data-field');
//     var entity = findEntityByFieldTypeAndValue(values, 'name', fieldName);
//     if(!entity) {
//       return;
//     }
//
//     if(field.is('.input')) {
//       field.get(0).setValue(entity);
//     } else {
//       field.text(entity.value);
//     }
//   })
// }
function fillFromJSON(values) {
  if(!values){
    return;
  }
  $(this).find('.row .value, .input').each(function (i, field) {
    field = $(field);
    var fieldName = field.is('.input') ? field.find('input').attr('name') : field.attr('data-field');
    var entity = {
      name: fieldName,
      value: values[fieldName]
    };
    if(!entity || entity.value == undefined) {
      return;
    }

    if(field.is('.input')) {
      field.get(0).setValue(entity);
    } else {
      field.text(entity.value);
    }
  })
}

function formatDate(ts) {
  // if(!date) {
  //   return;
  // }
  // return date.slice(0, date.indexOf(".")).replace('T', ' ');
  let date = new Date(ts * 1000);

  var msg = "" + date.getFullYear() + "-";

  if(date.getMonth() < 9)
    msg += "0";
  msg +=  + (date.getMonth()+1) + "-";

  if(date.getDate() < 10)
    msg += "0";
  msg +=  + (date.getDate()) + " ";

  if(date.getHours() < 10)
    msg += "0";
  msg +=  + (date.getHours()) + ":";

  if(date.getMinutes() < 10)
    msg += "0";
  msg +=  + (date.getMinutes()) + ":";

  if(date.getSeconds() < 10)
    msg += "0";
  msg +=  + (date.getSeconds());

  return msg;

}
