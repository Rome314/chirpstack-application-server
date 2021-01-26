var wsAddress = document.location.href;
wsAddress = wsAddress.substr(wsAddress.indexOf("://") + 3, wsAddress.length);
wsAddress = wsAddress.substr(0, wsAddress.indexOf(":"));

//var network = new createWSNetwork("localhost:1234/ws", window.localStorage.username, window.localStorage.password);
var network = new createWSNetwork("localhost:1234/ws", window.localStorage.username, window.localStorage.password);
//var network = new createWSNetwork("141.101.180.164:21234/ws", window.localStorage.username, window.localStorage.password);
 var externalNetwork = new createWSNetwork(wsAddress + ":" + WEB_SOCKETS_EXTERNAL_SERVER_PORT);

function createWSNetwork(host, username, password) {
    return Object.create({
        // host: WEB_SOCKETS_SERVER_ADDRESS,
        host: host,
        socket: undefined,
        inConnectingProcess: false,
        username: username,
        password: password,
        isAuthenticated: false,
        inAuthenticatedProcessing: false,

        connect: function (url, connectCallback) {
            if (this.inConnectingProcess) {
                return;
            }
            let self = this;
            this.inConnectingProcess = true;
            this.socket = new WebSocket("ws://" + url);
            this.socket.onopen = function () {
                self.inConnectingProcess = false;
                connectCallback();
            };
            this.socket.onclose = function (event) {
                if (event.wasClean) {
                    showNotification('Соединение закрыто');
                } else {
                    showNotification('Обрыв соединения');
                }
                showNotification('Код: ' + event.code + ' причина: ' + event.reason);
                self.inConnectingProcess = false;
                self.isAuthenticated = false;
            };
            this.socket.onmessage = (event) => {
                let data = JSON.parse(event.data);
                console.log("WS получено: " + JSON.stringify(event.data))
                invokeCallback(data, this.callbacks);
            };
            this.socket.onerror = function (error) {
                showNotification("Ошибка " + error.message);
                self.inConnectingProcess = false;
                self.isAuthenticated = false;
            };
        },

        isConnected: function () {
            return this.socket && this.socket.readyState == 1;
        },

        callbacks: {},

        send: function (host, body, callback) {
            let send = () => {
                if (!this.isAuthenticated) {
                    document.location.href = "/login";
                    return;
                }
                callback.isExpiredLoss = false;
                addCallback(this.callbacks, body, callback);
                this.socket.send(JSON.stringify(body));
                console.log("WS отправлено: " + JSON.stringify(body))
            }
            if (!this.isConnected()) {
                this.connect(
                    host,
                    () => {
                        this.login(this.username, this.password, send)
                    }
                );
            } else if (!this.isAuthenticated) {
                this.login(this.username, this.password, send);
            } else {
                send();
            }
        },

        login: function (username, password, callback) {

            let self = this;
            let send = (body, callback) => {
                callback.isExpiredLoss = false;
                addCallback(self.callbacks, body, callback);
                self.socket.send(JSON.stringify(body));
                console.log("WS отправлено: " + JSON.stringify(body))
            }
            send({
                    cmd: 'auth_req',
                    login: username,
                    password: password,
                    wsCallbackName: 'auth_resp'
                },
                function (res) {
                    self.isAuthenticated = res.status;
                    callback(res);
                });
        },


        get: function (url, callback) {
            let params = {};
            let paramsPart = url.split('?')[1];
            if (paramsPart) {
                paramsPart.split('&').forEach((elem) => {
                    param = elem.split('=');
                    params[param[0]] = param[1];
                })
            }
            url = url.split('?')[0];
            this.send(this.host,
                {
                    url: url,
                    type: 'get',
                    data: {
                        params: params
                    }
                },
                function (res) {
                    callback(res);
                });
        },

        getById: function (url, id, callback) {
            this.send(this.host,
                {
                    url: url,
                    type: 'get',
                    data: {person_id: id}
                },
                function (res) {
                    callback(res);
                });
        },

        post: function (url, body, callback) {
            this.send(this.host,
                {
                    url: url,
                    type: 'post',
                    data: body
                },
                function (res) {
                    callback(res);
                });
        },

        remove: function (url, id, callback) {
            this.send(this.host,
                {
                    url: url,
                    type: 'delete',
                    data: {person_id: id}
                },
                function (res) {
                    callback(res);
                });
        }
    })
}

function addCallback(callbacks, body, callback) {
    if (body.AddPersonByImage) {
        callbacks['AddPersonByImage'] = callback;
    }
    if (body.DeletePerson) {
        callbacks['DeletePerson'] = callback;
    } else if (body.GetLastPersonID) {
        callbacks['GetLastPersonID'] = callback;
    } else {
        callbacks[body.wsCallbackName] = callback;
    }
}

function invokeCallback(body, callbacks) {
    let callbackKey = body.cmd;
    // if (body.AddPersonByImage) {
    //   callbackKey = 'AddPersonByImage';
    // } if(body.DeletePerson) {
    //   callbackKey = 'DeletePerson';
    // } else if(body.GetLastPersonID) {
    //   callbackKey = 'GetLastPersonID';
    // } else if(body.isLogUpdateEvent) {
    //   callbackKey = "logUpdateEvent";
    // }
    if (callbacks[callbackKey]) {
        if (callbacks[callbackKey].isExpiredLoss != undefined) {
            if (!callbacks[callbackKey].isExpiredLoss) {
                callbacks[callbackKey].isExpiredLoss = true;
                callbacks[callbackKey](body);
            }
        } else {
            callbacks[callbackKey](body);
        }
        // if(this.callbacks[callbackKey].destroyAfterUse) {
        //   this.callbacks[callbackKey] = undefined;
        // }
    }
}
