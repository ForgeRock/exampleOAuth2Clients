/* FOR DEVELOPMENT ONLY: allow for self-signed/invalid certificates universally */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

/* Example: adding layout support */
var expressLayouts = require('express-ejs-layouts');

/* Example: adding dependencies for OIDC flow */
var passport = require('passport');
var utils = require('./utils');
var session = require('express-session');
var protectedRoutes = require('./routes/protected');

/* Example: adding ForgeRock OP specific routes */
var forgerockRoutes = require('./forgerock/routes');

/* Example: adding Google OP specific routes */
var googleRoutes = require('./google/routes');
/* Example: end */

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* Example: loading layout support */
app.use(expressLayouts);

/* Example: configuring local session */
app.use(session(
  {
    secret: 'CHANGE-IT',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000
    }
  }
));

/* Example: initializing Passport and configuring it for persistent login sessions */
app.use(passport.initialize());
app.use(passport.session());

/* Example: storing user data received from the strategy callback in the session, i.e. in `req.session.passport.user` */
passport.serializeUser(function (user, next) {
  next(null, user);
});

/* Example: getting the user data back from session and attaching it to the request object, i.e. to `req.user` */
passport.deserializeUser(function (user, next) {
  /*
    Example: if only a user identifier is stored in the session, this is where
    the full set could be retrieved, e.g. from a database, and passed to the next step
  */

  next(null, user);
});

/*
  Example: for each request, checking if the user is signed in and
  saving data in the response's `locals` object to make
  it available in the next request handlers and in the views
*/
app.use(function (req, res, next) {
  res.locals.authenticated = req.session.passport && req.session.passport.user;

  if (res.locals.authenticated) {
    res.locals.accounts = {};

    Object.keys(req.session.accounts).forEach(function (e) {
      res.locals.accounts[e] = req.session.accounts[e].public;
    });
  }

  res.locals.originalUrl = req.originalUrl;

  next();
});

/* Example: loading ForgeRock OP specific routes */
app.use('/forgerock', forgerockRoutes);

/* Example: loading Google OP specific routes */
app.use('/google', googleRoutes);

/*
  Example: loading login protected routes and checking whether the user is signed in
  conditionally applying custom handlers to front-channel and back-channel requests
*/
app.use('/protected/server', utils.ensureAuthenticatedServer, protectedRoutes);
app.use('/protected', utils.ensureAuthenticated, protectedRoutes);
/* Example: end */

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
