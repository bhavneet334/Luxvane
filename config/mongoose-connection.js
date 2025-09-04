const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");
const config = require("config");

const uri = config.get("MONGODB_URI");

if(!uri){
    throw new Error("Setup the mongodb connection string in .env file");
}

mongoose.connect(uri)
.then(() => {
    dbgr("Connected to the database");
})
.catch(err => {
    dbgr("Mongodb connection error", err.message);
});

module.exports = mongoose;