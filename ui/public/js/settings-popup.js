$(function() {
  $('#settingsPopup .button-confirm').on('click', function(e) {
    e.preventDefault();

    var form = $(e.target).closest('form');
    var isValid = form.get(0).validateForm();
    if(!isValid) {
      return;
    }

    var data = form.get(0).collectDataByForm();
    // network.put('/user', data, function (res) {
    //   if(res.error) {
    //     showNotification(res.error);
    //   } else {
    //     hideNotification();
    //     $('.header .user .username').text(res.username)
    //     $(e.target).closest('.popup-wrapper').get(0).hide();
    //     $('#passwordWasChangedPopup').get(0).show();
    //   }
    // });

    network.send(network.host, {
      cmd: "user_upd_req",
      login: data.username,
      password: data.password,
      wsCallbackName: "user_upd_resp"
    }, (res) => {
      if(res.status) {
        hideNotification();
        window.localStorage.username = data.username;
        window.localStorage.password = data.password;
        // network.inConnectingProcess = false;
        // network.isAuthenticated = false;
        // network.inAuthenticatedProcessing = false;
        network.login(data.username, data.password, (res) => {
          if(res.status) {
            hideNotification();
            document.cookie = "authorization=" + res.token;
            network = new createWSNetwork("141.101.180.164:21234/ws", data.username, data.password);
            $('.header .user .username').text(data.username)
            $(e.target).closest('.popup-wrapper').get(0).hide();
            $('#passwordWasChangedPopup').get(0).show();
          } else {
            showNotification(res.err_msg);
          }
        });

      } else {
        showNotification(res.err_msg);
      }
    });

  })
});
