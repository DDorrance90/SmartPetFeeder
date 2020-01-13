const mongoose = require('mongoose');
const uri = "mongodb+srv://smartpetfeeder:<APIKEY>@cluster0-gec5q.mongodb.net/DerekITEC345?retryWrites=true";
const MongoOptions = {
    useNewUrlParser: true
};
var User = new mongoose.Schema({
    id: {type: [String], index: true},
    displayName: String,
    deviceID: String,
    pictureURL: String,
    email: String,
    deviceName: String
    
});

var UserModel = mongoose.model('UserModel',User); 


function Connect () {
    mongoose.connect(uri, MongoOptions, (err) => {
        if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
        }
    });
}
mongoose.connection.once('open', () =>  {
    console.log("MongoDB Connected"); 
}); 

module.exports = {
    uri: uri,
    Connect: Connect,
    UserModel: UserModel
}; 