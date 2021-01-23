//Change only this values
let HTTP_SERVER_PORT = 3001;
let WEB_SOCKETS_SERVER_PORT = 8081;
let WEB_SOCKETS_EXTERNAL_SERVER_PORT = 9933; // <---------------------------------change this
let PERSONS_REFRESH_DELAY_MS = 5000;
let TEST_MODE = false;
let DB_PATH = 'public/assets/scud.db';


var deviceTypes = {
    door: 1,
    waterleak: 2,
    motion: 3,
    smoke: 4,
    // acvoltage: 5,
    temphg: 5,
    energymeter: 6
    // batteryguard: 8
};

var deviceTypesInverse = {
    1: "door",
    2: "waterleak",
    3: "motion",
    4: "smoke",
    // 5:"acvoltage",
    5: "temphg",
    6: "energymeter"
    // 8:"batteryguard"
};

//No change value there!
let constants = {
    HTTP_SERVER_PORT: HTTP_SERVER_PORT,
    WEB_SOCKETS_SERVER_PORT: WEB_SOCKETS_SERVER_PORT,
    WEB_SOCKETS_EXTERNAL_SERVER_PORT: WEB_SOCKETS_EXTERNAL_SERVER_PORT,
    TEST_MODE: TEST_MODE,
    DB_PATH: DB_PATH,
    PERSONS_REFRESH_DELAY_MS: PERSONS_REFRESH_DELAY_MS,
    WS_HOST: WS_HOST
};

module.exports = {constants};
