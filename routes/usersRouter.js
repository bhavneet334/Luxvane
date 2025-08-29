const express = require('express');
const router = express.Router();

router.get('/', function(req,res){
    res.send("Hey, I am a user");
});

module.exports = router;