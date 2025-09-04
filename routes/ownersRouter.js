const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ownerModel = require('../models/owner-model');
const { generateToken } = require('../utils/generateToken');
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');

//create the first owner : only in dev mode
console.log('NODE_ENV in owner route:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  router.post('/create', async function (req, res) {
    try {
      let owners = await ownerModel.find();
      if (owners.length > 0) {
        return res
          .status(403)
          .send("You don't have permission to create a new owner");
      }

      let { fullname, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      let createdOwner = await ownerModel.create({
        fullname,
        email,
        password: hashedPassword,
      });
      res.status(201).send(createdOwner);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
}

//on clicking the owner route - redirects to login page
router.get('/', function (req, res) {
  res.redirect('/owners/login');
});

//on clicking the login route, rendering the login page
router.get('/login', function (req, res) {
  res.render('admin/login');
});

//logout route
router.get('/logout', function (req, res) {
  res.clearCookie('token');
  return res.redirect('/owners/login');
});

//on login, the form data should be validated and if it is the correct owner then can login
router.post('/login', async function (req, res) {
  const { email, password } = req.body;
  const owner = await ownerModel.findOne({ email });

  if (!owner) {
    return res.status(401).send('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, owner.password);
  if (!isMatch) {
    return res.status(401).send('Invalid credentials');
  }

  const token = generateToken(owner);
  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000, // cookies should also expire when token expires
  });
  return res.redirect('/owners/dashboard');
  // return res.render('admin/dashboard', { owner: req.owner });
});

router.get('/dashboard', isOwnerAuthenticated, function (req, res) {
  res.render('admin/dashboard', { owner: req.owner });
});

module.exports = router;
