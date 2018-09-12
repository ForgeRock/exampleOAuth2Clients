/* 
  Example: constructing OP-specific authentication routes
  with the OP's strategy and router passed in as arguments where
  the strategy is identified by its non-default, OP-specific, name
*/
var passport = require('passport');

module.exports = function (args) {
  args = args || {
    router: null,
    strategy: null,
    strategyName: 'openidconnect'
  };

  /* loading the configured OP-specific strategy in Passport and overriding its default name */
  passport.use(args.strategyName, args.strategy);

  /* 
    initiating the authorization code flow by calling passport.authenticate middleware,
    passing in the configured strategy referenced by its non-default name and
    making the authentication request to the authorization endpoint specified in the strategy
  */
  args.router.get('/login', passport.authenticate(args.strategyName, {
    failureRedirect: '/error'
  }));

  /* 
    providing route for the redirection URI specified in the strategy;      
    if the access token request is valid and authorized, 
    populating the session with information received from the authorization server and 
    processed in the strategy's callback function;
    note, that the req.user object is already set by Passport
  */
  args.router.get('/redirect', function (req, res, next) {
    /* 
      checking if an error is present in the response from AS; if it is - 
      redirecting to the Home screen and not processing the request any further
    */
    if (req.query.error) {
      return res.redirect('/');
    }

    /* 
      if no error is encountered, proceeding to the next step,
      in which passport.authenticate middleware is used to make the token request
      with the configured strategy referenced by its name 
    */
    next();
  }, passport.authenticate(args.strategyName, {
    failureRedirect: '/error'
  }), function (req, res, next) {
    /* 
      preserving OP information in the session and redirecting to a desired route,
      if the token response is received and processed in the strategy callback
    */
    req.session.accounts = req.session.accounts || {};

    req.session.accounts[args.strategyName] = Object.assign({}, req.user);

    res.redirect('/protected/profile');
  });

  return args.router;
};
/* Example: end */
