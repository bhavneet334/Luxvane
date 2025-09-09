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
const categoriesRouter = require('./routes/categoriesRouter');
const logger = require('./utils/logger');

app.use(
  session({
    secret: process.env.MY_SECRET_KEY,
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/owners', ownersRouter);
app.use('/owners/categories', categoriesRouter);
app.use('/owners/products', productsRouter);

app.get('/', (req, res) => {
  res.render('admin/login');
});

const PORT = process.env.PORT || 4400;

app.listen(PORT, () => {
  logger.info(`Server up and running on ${PORT}`);
});
