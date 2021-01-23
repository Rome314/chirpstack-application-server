const express = require('express')
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cookieParser())

// parse application/json
// app.use(bodyParser.json())
app.use('/public', express.static('public'));

let devices = JSON.parse(fs.readFileSync('public/assets/mock/device.json'));
let gateways = JSON.parse(fs.readFileSync('public/assets/mock/gateway.json'));
let deviceDataAndPackets = JSON.parse(fs.readFileSync('public/assets/mock/deviceDataAndPackets.json'));
let username = 'admin';
let password = 'admin';
let jwt = 'aasfjihfh.asifn98h98ghgh0hbpfnfoag23g.3g2238ng9823g3';


app.get('/', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/gateways.html");
});
app.get('/login', function(req, res) {
  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/login.html");
});
app.get('/gateway', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/gateways.html");
});
app.get('/gateway/:id', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  if(req.params.id == 'all') {
    let page = req.query.page;
    let size = req.query.size;
    var entities = getRepository('gateway');
    res.send(extractEntitiesFrom(entities, page, size));
    return;
  }

  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/gateway.html");
});
app.get('/gateway/card/:id', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  var entities = getRepository('gateway');
  res.send(findById(entities, req.params.id));
});
app.post('/gateway', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  var entities = getRepository('gateway');
  req.body.id = generateId(16);
  req.body.gatewayName = {
    link: 'http://localhost:3001/gateway/' + req.body.id,
    value: req.body.gatewayName
  }
  save(entities, req.body);
  res.send(req.body);
});
app.delete('/gateway/:id', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  let id = req.params.id;
  var entities = getRepository('gateway');
  console.log(`Удаление по id ${id}`)
  res.send(remove(entities, id));
});
app.get('/device', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/devices.html");
});

app.get('/device/:id', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  console.log(`Запрос с адреса: ${req.url}`);
  res.sendFile(__dirname + "/device.html");
});
// app.get('/device/:type/:id', function(req, res) {
//   if(!isAuthorization(req)) {
//     res.sendFile(__dirname + "/error.html");
//   }
//   if(req.params.id == 'all') {
//     let page = req.query.page;
//     let size = req.query.size;
//     var entities = getRepository(req.params.type);
//     res.send(extractEntitiesFrom(entities, page, size));
//     return;
//   }
//
//   console.log(`Запрос с адреса: ${req.url}`);
//   res.sendFile(__dirname + "/device.html");
// });
app.get('/device/card/:type/:id', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  var entities = getRepository(req.params.type);
  res.send(findById(entities, req.params.id));
});
app.get('/', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  res.sendFile(__dirname +  '/gateways.html')
});
app.get('/device', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  let id = req.query.id;
  console.log(`Запрос с фронта ${id}`)
  res.send(findById(devices, id));
});
app.post('/device', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  var entities = getRepository('device');
  req.body.id = generateId(16);
  req.body.deviceName = {
    link: 'http://localhost:3001/device/' + req.body.deviceType + '/' + req.body.id,
    value: req.body.deviceName
  }
  save(entities, req.body);
  console.log(JSON.stringify(devices))
  res.send(req.body);
});
app.delete('/device/:id', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  let id = req.params.id;
  var entities = getRepository('device');
  console.log(`Удаление по id ${id}`)
  res.send(remove(entities, id));
});
app.get('/device/data', function(req, res) {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  var page = req.query.page;
  var size = req.query.size;
  var entities = extractEntitiesFrom(getRepository('deviceDataAndPackets'), page, size);
  res.send(entities);
});
app.get('/auth', (req, res) => {
  console.log("Login with credentials: " + req.query.username + " " + req.query.password)
  if(req.query.username == username && req.query.password == password) {
    res.send({
      token: jwt,
      username: username,
      password: password
    });
    return;
  }
  res.send({
    error: "Invalid username or password"
  });
});
app.put('/user', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  console.log("Password changed")
  username = req.body.username;
  password = req.body.password;
  res.send({
    username: username,
    password: password
  });
});
app.get('/user', (req, res) => {
  if(!isAuthorization(req)) {
    res.sendFile(__dirname + "/error.html");
  }
  res.send({
    username: username,
    password: password
  });
});


app.listen(3001);


//Extract entities set by page and size
function extractEntitiesFrom(entities, page, size) {
  if((page == undefined || page == 'undefined') && (size == undefined || size == 'undefined')) {
    return {
      entities: entities
    };
  }
  if(size == undefined || size == 'undefined') {
    size = 0;
  }
  if(page == undefined || page == 'undefined') {
    page = 0;
  }
  if(page < 0 || size < 0) {
    return {
      error: 'Page and size cannot be negative'
    }
  }
  let from = +page * +size;
  let to = +from + +size;
  console.log('Page: ' + page + ' size ' + size);
  console.log('From: ' + from + ' to ' + to);

  return {
    entities: entities.slice(from, to)
  };
}

//Extract entity by fueld name and field vakue
function findById(source, id) {
  let res;
  id = id.replace(/ /g, '').replace(/\n/g, '').toLowerCase();
  for (let i = 0; i < source.length; i++) {
    if(source[i].id == id.toLowerCase()) {
      return source[i];
    }
  }

  return {
    error: `Could not find entity with id = ${id}`
  };
}

//Extract entity by fueld name and field vakue
function save(entities, entity) {
  entities.push(entity);
  return entity;
}

//Extract entity by fueld name and field vakue
function remove(source, id) {
  id = id.replace(/ /g, '').replace(/\n/g, '').toLowerCase();

  for (let i = 0; i < source.length; i++) {
    if(source[i].id == id.toLowerCase()) {
      source.splice(i, 1);
      return id;
    }
  }

  return {
    error: `Could not delete entity with id = ${id}. Entity not found`
  };
}

//generate random id
function generateId(size) {
  var id = '';
  var data = '0123456789qwertyuiopasdfghjklzxcvbnm';
  for (var i = 0; i < size; i++) {
    id += data[Math.floor(Math.random() * data.length)];
  }
  return id;
}

//Return repository by type
function getRepository(repositoryType) {
  switch (repositoryType) {
    case 'deviceDataAndPackets':
      return deviceDataAndPackets;
    case 'device':
      return devices;
    case 'gateway':
      return gateways;
    default:
      return getDevicesByType(repositoryType);
  }
}

function getDevicesByType(type) {
  return devices.filter(device => device.deviceType == type);
}

function isAuthorization(req) {
  return true;
  // console.log("Токен: " + req.header('Authorization'));
  //   console.log("Токен из куки: " + JSON.stringify( req.cookies));
  // // return req.header('Authorization') === jwt;
  // return req.header('authorization') === jwt || req.cookies.authorization === jwt;
}
