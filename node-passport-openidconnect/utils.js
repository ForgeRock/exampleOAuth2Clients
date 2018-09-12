/* Example: custom utilities */
module.exports = {
  /* if the user is not signed in, redirecting the user to the home page for front-channel requests */
  ensureAuthenticated: function (req, res, next) {
    if (res.locals.authenticated) {
      next();
    } else {
      res.redirect('/');
    }
  },
  /* if the user is not signed in, sending back error information for back-channel/ajax requests */
  ensureAuthenticatedServer: function (req, res, next) {
    if (res.locals.authenticated) {
      next();
    } else {
      res.send({
        error: 'signed out',
        errorDescription: ''
      });
    }
  }
};
/* Example: end */
