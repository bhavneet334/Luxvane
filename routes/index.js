const express = require('express');
const router = reqiure('router');

router.get("/", function(req,res) {
    let error = req.flash("error");
    res.render("index", {error});
});

// router.get("/shop", isLoggedin, function(req,res){
//     res.render("shop");
// });

module.exports = router;