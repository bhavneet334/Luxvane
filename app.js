const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
require('./config/mongoose-connection');
const session = require('express-session');
const flash = require('connect-flash');
const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');

app.use(
  session({
    secret: 'someVerySecretKey', // change this
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(flash());

// Make flash messages available in all views
app.use(function (req, res, next) {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/owners', ownersRouter);
app.use('/owners/products', productsRouter);

app.get('/', (req, res) => {
  res.render('admin/login');
});

const PORT = 4400 || process.env.port;

app.listen(PORT, () => {
  console.log('Server up and running');
});
