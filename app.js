const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
require('./config/mongoose-connection');
const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/owners', ownersRouter);
app.use('/owners/products', productsRouter);

app.get('/', (req, res) => {
  res.render('index');
});

const PORT = 4400 || process.env.port;

app.listen(PORT, () => {
  console.log('Server up and running');
});
