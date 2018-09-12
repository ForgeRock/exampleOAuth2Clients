/* Example: routes protected by login */
var router = require('express').Router();

router.get('/profile', function (req, res, next) {
  res.render('profile', {pageTitle: 'Profile'});
});

router.get('/api', function (req, res, next) {
  res.render('api', {pageTitle: 'Accessible API(s)'});
});

/* adding axios, for making back-channel requests to the API(s) */
var axios = require('axios');

/* 
  making request to a protected endpoint on a resource server
  including the access token stored in the session
*/
router.get('/server/:op', function (req, res, next) {
  var axiosInstance = axios.create(
    {
      baseURL: req.query.url,
      timeout: 1024,
      headers: {
        'Authorization': 'Bearer ' + req.session.accounts[req.params.op].tokens.access_token
      }
    }
  );

  axiosInstance.get()
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (e) {
      var error;

      error = e.response || e.request || {
        status: '500',
        statusText: '',
        error: {}
      }

      res.send({
        status: error.status,
        statusText: error.statusText,
        error: error.data
      });
    });
});

/* 
  if provided, using the authorization server's logout endpoint for ending the remote user session,
  which is identified by the "id_token_hint" parameter populated with the ID Token
*/
router.get('/logout', function (req, res, next) {
  Object.keys(req.session.accounts).forEach(function (e) {
    var user;

    user = req.session.accounts[e];

    if (user.public.issuerInfo.end_session_endpoint) {
      axios.get(user.public.issuerInfo.end_session_endpoint + '?id_token_hint=' + user.tokens.id_token)
        .then(function (response) {
          console.log('end session response status', response.status);
        })
        .catch(function (error) {
          console.log('error', error);
        })
        .then (function () {
        });
    }
  });

  /* ending the local session and redirecting the user to the home page */
  req.logout();

  req.session.destroy();

  res.redirect('/');
});

module.exports = router;
/* Example: end */
