/*
  Example: configuring a new passport-openidconnect (https://github.com/jaredhanson/passport-openidconnect) strategy
  with the Google platform specific parameters, including the well-known enpoints,
  which can be obtained from the OpenID Provider Configuration Document: https://accounts.google.com/.well-known/openid-configuration
*/
var OidcStrategy = require('passport-openidconnect').Strategy;
var config = require('./client-config.js');
var fs = require('fs');
var discovery;

discovery = JSON.parse(fs.readFileSync('./google/discovery.json'));

module.exports = new OidcStrategy({
  issuer: discovery.issuer,
  authorizationURL: discovery.authorization_endpoint,
  tokenURL: discovery.token_endpoint,
  userInfoURL: discovery.userinfo_endpoint,
  clientID: config.oauth.client_id,
  clientSecret: config.oauth.client_secret,
  callbackURL: config.oauth.callbackURL,
  scope: config.oauth.scope
}, function (issuer, sub, profile, jwtClaims, accessToken, refreshToken, tokens, done) {
  /*
    tokens received from the token endpoint after successful authentication and authorization
    are saved for future use by passing the information received from the OP to the next handler
    in a single object provided as the second argument to the `done` method,
    allowing Passport to attach it to the request object (and to preserve it in the session), e.g.:
  */
  var idTokenSegments;
  var jwtClaimsStr;
  var jwtClaims;

  idTokenSegments = tokens.id_token.split('.');

  try {
    jwtClaimsStr = new Buffer(idTokenSegments[1], 'base64').toString();
    jwtClaims = JSON.parse(jwtClaimsStr);
  } catch (e) {
    console.log('Error parsing claims: ', e);
  }

  user = {
    tokens: tokens,
    public: {
      profile: profile,
      issuerInfo: {
        exampleUrls: [
          'https://www.googleapis.com/oauth2/v3/userinfo'
        ]
      },
      tokenInfo: {
        scope: tokens.scope,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        claims: {
          iat: jwtClaims.iat,
          exp: jwtClaims.exp
        }
      }
    }
  };

  done(null, user);
});
/* Example: end */
