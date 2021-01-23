$(function() {
  $('form').submit(function (e) {
    e.preventDefault();

    var form = $(e.target);
    var isValid = form.get(0).validateForm();
    if(!isValid) {
      return;
    }

    var data = form.get(0).collectDataByForm();

//    network = new createWSNetwork("141.101.180.164:21234/ws", data.username, data.password);
    network = new createWSNetwork("localhost:1234/ws", data.username, data.password);
//    network.connect("141.101.180.164:21234/ws", () => {
    network.connect("localhost:1234/ws", () => {
      network.login(data.username, data.password, (res) => {
        if(res.status) {
          hideNotification();
          window.sessionStorage.authorization = res.token;
          window.localStorage.username = data.username;
          window.localStorage.password = data.password;
          // network.setCookie("authorization", res.token, {secure: true, 'max-age': 3600});
          document.cookie = "authorization=" + res.token;
          // window.cookie.abv = res.token;
          window.location.href = '/gateway';
        } else {
          showNotification(res.err_msg);
        }
      });
     });

    // network.get('/auth?username=' + data.username + '&password=' + data.password, function (res) {
    //   if(res.error) {
    //     showNotification(res.error);
    //   } else {
    //     hideNotification();
    //     window.sessionStorage.authorization = res.token;
    //     // network.setCookie("authorization", res.token, {secure: true, 'max-age': 3600});
    //     document.cookie = "authorization=" + res.token;
    //     // window.cookie.abv = res.token;
    //     window.location.href = '/gateway';
    //   }
    // });

    return false;
  })
});
