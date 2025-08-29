const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if(!uri){
    throw new Error('Setup the mongodb connection string in .env file');
}

mongoose.connect(uri)
.then(() => {
    console.log("Connected to the database");
})
.catch(err => {
    console.log('Mongodb connection error', err.message);
});

module.exports = mongoose;