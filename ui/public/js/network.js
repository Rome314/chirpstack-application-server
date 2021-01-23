var network = {
  host: "http://localhost:3001"
};

network.loadAll = function(endpoint, page, size, callback) {
  $.ajax({
    url: this.host + endpoint + '?page=' + page + '&size=' + size,
    method: 'get',
    responseType: 'application/json',
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      callback({
        error: 'Error download table data'
      });
    }
  });
}

network.load = function(endpoint, callback) {
  $.ajax({
    url: this.host + endpoint,
    method: 'get',
    responseType: 'application/json',
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      callback({
        error: 'Error download table data'
      });
    }
  });
}

network.remove = function(endpoint, callback) {
  $.ajax({
    url: this.host + endpoint,
    method: 'delete',
    responseType: 'application/json',
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      callback({
        error: 'Error delete data'
      });
    }
  });
}

network.upload = function(endpoint, body, callback) {
  $.ajax({
    url: this.host + endpoint,
    method: 'post',
    data: body,
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      return {
        error: 'Error upload table data'
      };
    }
  });
}

//====== other

network.put = function(endpoint, body, callback) {
  $.ajax({
    url: this.host + endpoint,
    method: 'put',
    data: body,
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      return {
        error: 'Network error'
      };
    }
  });
}

network.get = function(endpoint, callback) {
  $.ajax({
    url: this.host + endpoint,
    method: 'get',
    responseType: 'application/json',
    headers: {
      'authorization': window.sessionStorage.authorization
    },
    success: function (res) {
      callback(res);
    },
    error: function (e) {
      callback({
        error: 'Network error'
      });
    }
  });
}


//Cookie work
network.setCookie = function(name, value, options = {}) {

  options = {
    path: '/',
    // add other defaults here if necessary
    ...options
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}
