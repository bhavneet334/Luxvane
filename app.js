const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config();

const mongoose = require('./config/mongoose-connection');
const session = require('express-session');
const flash = require('connect-flash');
const ownersRouter = require('./routes/ownersRouter');
const productsRouter = require('./routes/productsRouter');
const categoriesRouter = require('./routes/categoriesRouter');
const analyticsRouter = require('./routes/analyticsRouter');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(
  session({
    secret: process.env.MY_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    },
  }),
);

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:'],
        scriptSrcAttr: ["'unsafe-inline'"],
      },
    },
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/owners', apiLimiter);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/ready', (req, res) => {
  const dbState = mongoose.connection.readyState;

  const stateNameByCode = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStateName = stateNameByCode[dbState] || 'unknown';
  const isReady = dbState === 1;

  const payload = {
    status: isReady ? 'ok' : 'not_ready',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStateName,
      readyState: dbState,
    },
  };

  return res.status(isReady ? 200 : 503).json(payload);
});

app.use('/owners', ownersRouter);
app.use('/owners/categories', categoriesRouter);
app.use('/owners/products', productsRouter);
app.use('/owners/analytics', analyticsRouter);

app.get('/', (req, res) => {
  res.render('admin/login');
});

const PORT = process.env.PORT || 4400;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server up and running on ${PORT}`);
  });
}

module.exports = app;
