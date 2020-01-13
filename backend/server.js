/****************************************************************************************/
//   .----------------.  .----------------. 
//  | .--------------. || .--------------. |      Derek Dorrance
//  | |  ________    | || |  ________    | |      Salish Kootenai College
//  | | |_   ___ `.  | || | |_   ___ `.  | |      derekdorrance@student.skc.edu
//  | |   | |   `. \ | || |   | |   `. \ | |
//  | |   | |    | | | || |   | |    | | | |
//  | |  _| |___.' / | || |  _| |___.' / | |
//  | | |________.'  | || | |________.'  | |      SmartPetFeeder - Web Server
//  | |              | || |              | |
//  | '--------------' || '--------------' |
//   '----------------'  '----------------' 
/*****************************************************************************************/
const express = require('express'); 
const Data = require('./data');
const http = require('http'); 
const app = express(); 
const server = http.createServer(app); 
const path = require('path'); 
const router = express.Router(); 
const passport = require('passport');
var bodyParser   = require('body-parser');
var expressSession = require('express-session'); 
var MongoDBStore = require('connect-mongodb-session')(expressSession);
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const API_PORT = 5000; 
const uuid = require('uuid/v4'); 
const awsIot = require('aws-iot-device-sdk');
const AWS_KEY = path.join(__dirname,'./aws/private.pem.key') ;
const AWS_CERT = path.join(__dirname,'/aws/cert.pem.crt');
const  AWS_CA = path.join(__dirname,'/aws/AmazonRootCA1.pem');
var AWS_HOST = 'a2lhntaumznuq2-ats.iot.us-west-2.amazonaws.com'; 
const socket = require('socket.io')(server); 
var savedEvents = []; 
const nodeenv = app.get('env'); 

var session = expressSession({
  secret: 'Super Secret',
  maxAge: 60000,
  resave: true,
  saveUninitialized: true, 
  store: new MongoDBStore({
    uri: Data.uri,
    collection: 'Sessions'
  })//,

  //genid: req => {return uuid()} 
}); 

console.log(app.get('env')); 


if(nodeenv === 'production') {
  app.set('trust proxy', 1);
  //sessionConfig.cookie.secure = true; 
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}



app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session);

app.use(passport.initialize());
app.use(passport.session());
nodeenv === 'production' ? 
app.use('/api', authRequired, router) :
app.use('/api', router); 

socket.use((io, next) => {
  session(io.request, {}, next); 
}); 
//socket.use(authRequired); 

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
passport.use(new GoogleStrategy({
  clientID: "SOMEID.apps.googleusercontent.com",
  clientSecret: "APIKEY",
  callbackURL: "https://iotpetfeeder.tk/auth/google/callback",
  accesType: 'offline',
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
  (accessToken, refreshToken, profile, done) => {

      Data.UserModel.findOne({id: profile.id}, (err,user) => {
        if(err) 
          return done(err,null); 
        if(!user) {
          user = new Data.UserModel({
            id: profile.id,
            displayName: profile.displayName,
            pictureURL: profile.photos[0].value,
            email: profile.emails[0].value,
            deviceName: 'DerekPC'
          });
          user.save(err=> {
            if(err) {
              console.log(err);
            }
            return done(err,user);
          });
        } else {
          return done(err,user); 
        }
      });
  }
));


app.get('/auth/login',
  passport.authenticate('google', { scope: ['email', 'profile']  }));

app.get('/auth/logout', (req,res) => {
  req.session.destroy(() => {
    res.redirect('/'); 
  }); 
});
 
app.get('/auth', (req,res) => {
  if(req.isAuthenticated()) {
    res.json({isAuthenticated: true, loginName: req.user.displayName, imageUrl: req.user.pictureURL} ); 
  } else {
    res.json({isAuthenticated: false}); 
  }
}); 


app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/none' }),
  (req, res) => {
    res.redirect('/');
});

function authRequired(req, res, next) {

  if (!req.isAuthenticated()) {
        return res.send(401,'You need to be logged in to see this'); 
    }
    next();
}

server.listen(API_PORT, () => console.log('express listening on port ' + API_PORT)); 

Data.Connect();

global.thing = awsIot.thingShadow({
  keyPath: AWS_KEY,
  certPath: AWS_CERT,
  caPath: AWS_CA,
  host: AWS_HOST,
  region: 'us-west-2'
});

global.thing.on('connect', () => {
  console.log("Thing Connected");
}); 


global.thing.on('status', (thingName, stat, clientToken, stateObject)  => {
  if(clientToken == global.feedIotToken) {
    socket.emit('StatResponse', {message: "Run Feeder", status: stat}); 
  }
  if(clientToken == global.updateschedToken) {
    socket.emit('StatResponse',{message: "Schedule Update", status: stat } ); 
  }
  if(stateObject) {
    if(stateObject.state.reported) {
      socket.emit('update', {shadowName: "DerekPC",
                            isEmpty: stateObject.state.reported.isEmpty,
                            lastFeedTime: stateObject.state.reported.lastFeedTime, lastUpdate: stateObject.state.reported.lastUpdate }); 
      if(stateObject.state.desired.events) {
        savedEvents = stateObject.state.desired.events; 
      }
      
    }
  }
});
global.thing.on('delta', (thingName, stateObject) => {
   //   console.log('received delta on '+thingName+': '+
    //               JSON.stringify(stateObject));
});
global.feedIotToken = ""; 
socket.on('connection', (client) => {
  
  client.on('ConnectIotDevice', (thingName) => {
   global.thing.register(thingName, () =>{
      console.log("Registered ",thingName); 
      global.thing.get(thingName); 
    }); 
    global.thing.get(thingName);
  }); 
  client.on('DisconnectIotDevice', (thingName) => {
    global.thing.unregister(thingName); 
  })
  client.on('FetchSchedule', () => {
    client.emit('UpdateCalendar', savedEvents); 
  }); 
  client.on('UpdateSchedule', newEvents => {
 
    savedEvents = newEvents; 
    try {
      global.updateschedToken = global.thing.update('DerekPC', {state: { desired: { events: savedEvents }}}); 
    } catch(err) {
      console.log("update Shadow failed", err); 
    }
  }); 
  client.on('Feed', () => {
    global.feedIotToken = global.thing.update('DerekPC', {'state': { 'desired': { 'deviceRunning': 'On' }}}); 
  });
});