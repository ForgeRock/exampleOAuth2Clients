/*
  Example: configuring a new passport-openidconnect (https://github.com/jaredhanson/passport-openidconnect) strategy
  with the ForgeRock platform specific parameters, including the well-known enpoints,
  which can be obtained from the OpenID Provider Configuration Document:
  https://login.sample.forgeops.com/oauth2/.well-known/openid-configuration
*/
var OidcStrategy = require('passport-openidconnect').Strategy;
var clientConfig = require('./client-config.js');
var fs = require('fs');
var discovery;

discovery = JSON.parse(fs.readFileSync('./forgerock/discovery.json'));

module.exports = new OidcStrategy({
  issuer: discovery.issuer,
  authorizationURL: discovery.authorization_endpoint,
  tokenURL: discovery.token_endpoint,
  userInfoURL: discovery.userinfo_endpoint,
  clientID: clientConfig.oauth.client_id,
  clientSecret: clientConfig.oauth.client_secret,
  callbackURL: clientConfig.oauth.callbackURL,
  scope: clientConfig.oauth.scope
}, function (issuer, sub, profile, jwtClaims, accessToken, refreshToken, tokenResponse, done) {
  /*
    tokens received from the token endpoint after successful authentication and authorization
    are saved for future use by passing the information received from the OP to the next handler
    in a single object provided as the second argument to the `done` method,
    allowing Passport to attach it to the request object (and to preserve it in the session), e.g.:
  */

  user = {
    tokens: tokenResponse,
    public: {
      profile: profile,
      issuerInfo: {
        exampleUrls: [
          'https://login.sample.forgeops.com/oauth2/userinfo',
          'https://rs.sample.forgeops.com/openidm/config/ui/dashboard',
          'https://rs.sample.forgeops.com/openidm/info/login',
          'https://rs.sample.forgeops.com/openidm/managed/user/:authorization.id (from https://rs.sample.forgeops.com/openidm/info/login)'
        ],
        /*
          populating the "end_session_endpoint" value with the authorization server's logout endpoint,
          which will be used in the code for ending the user's session in AM
        */
        end_session_endpoint: discovery.end_session_endpoint
      },
      tokenInfo: {
        scope: tokenResponse.scope,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
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
