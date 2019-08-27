# OAuth 2.0 Authorization Code Flow Example for a Confidential Client

The language used in this document leverages terminology defined in the
[OpenID Connect extension](https://openid.net/specs/openid-connect-core-1_0.html)
for the [OAuth 2.0. protocol](https://tools.ietf.org/html/rfc6749).

In this OAuth 2.0 [confidential client](https://tools.ietf.org/html/rfc6749#section-2.1) example the [Authorization Code Grant](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth) is implemented in a [Node.js](https://nodejs.org/en/) [Express](https://github.com/expressjs) web application with the [Passport](https://github.com/jaredhanson/passport#readme) and the [Passport-OpenID Connect](https://github.com/jaredhanson/passport-openidconnect#readme) middleware. The web application serves the role of an [OpenID Connect Relying Party](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (RP) authenticating against one or more [OpenID Providers](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (OP). The access token obtained during the authentication and authorization process can be used then for querying endpoints on the OP's [Resource Server](https://tools.ietf.org/html/rfc6749#section-1.1) (RS).

Node.js provides a means for performing communications between a [client application](https://tools.ietf.org/html/rfc6749#section-1.1) (client) and an [Authorization Server](https://tools.ietf.org/html/rfc6749#section-1.1) (AS) via a back-channel. This allows for secure client authentication using a confidential "client secret" registered with the AS. It also makes it possible to keep the ID token and the access token (obtained from the AS) away from the user agent.

The Passport middleware is employed for making requests to and handling the responses from an OP's [authorization endpoint](https://tools.ietf.org/html/rfc6749#section-3.1) and [token endpoint](https://tools.ietf.org/html/rfc6749#section-3.2). This functionality is driven by defining a Passport-OpenID Connect strategy specific to a combination of an OP and the RP, which this client application plays the role of. The strategy is populated with the OP's well-known endpoints and requested scopes, along with the RP's redirection URI, ID, and secret. In this example, Passport is also used for managing the authenticated user data in a local (Express) session.

***

## Core Functionality

A generic (OP-independent) version of the workflow utilized in this example is outlined with a few implementation steps below. Copying and pasting blocks of code in the order they are presented and providing the RP's and the OP's proprietary values instead of the placeholders should result in a working Node.js application performing authorization code flow, with following file structure:
```bash
.
+ node_modules
- routes
  oauth2.js
  protected.js
index.js
package-lock.json
package.json
```

The steps:

1. Collect information about the OP.

    In this step you gather the OP's endpoints that will be used in an instance of the Passport-OpenID Connect strategy. If supported by the OP, this information can be found at the [OpenID Provider Configuration Document](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) well-known endpoint. You can read more about OIDC discovery configuration and see a sample of the data returned from the well-known point in [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) (AM) [documentation](https://backstage.forgerock.com/docs/am/6/oidc1-guide/#configure-openid-connect-discovery). If you have an AM instance running you will be able to see a live version of the configuration document at `https://your-am-instance.example.com/oauth2/.well-known/openid-configuration`.

    At a minimum, you will need values for the following:

    * `issuer`
    * `authorization_endpoint`
    * `token_endpoint`
    * `userinfo_endpoint`

0. Collect information about the RP.

    The strategy will also need following details about the RP's registration with the OP:

    * `client_id`
    * `client_secret`
    * redirection URI
    * scopes available for this client  (to choose from when sending the authorization request)

    How to obtain the RP registration details is specific to the OP and not covered here. As an example, you can read [_Registering OAuth 2.0 Clients With the Authorization Service_](https://backstage.forgerock.com/docs/am/6.5/oauth2-guide/#register-oauth2-client) in the AM documentation on creating and obtaining client credentials and scopes for an AM account.

    For the purpose of this example, we will use `/oauth2/redirect` route for the redirection URI parameter. Note that the full and exact redirection URI, including scheme, host, port, and path, MUST be registered for the RP with the OP. For example: `http://localhost:3000/oauth2/redirect`

0. Create a Node.js application.

    You can start a Node.js project with `npm init` command run in a desired directory. The `-y` option allows for populating the `package.json` file with default values; omit this option if you'd like to enter the initial settings manually:

    ```bash
    npm init -y
    ```

    Install the dependencies:

    ```bash
    npm install express express-session passport passport-openidconnect axios
    ```

    By default, your primary entry point to the application is `index.js`. If you provided a different module ID for the `main` field, use your custom value instead of `index.js` references below.

    Create the main module. For example:
    ```bash
    touch index.js
    ```

    In the module, add dependencies and create the Express app:

    ```javascript
    /* index.js */

    var express = require('express');
    var session = require('express-session');
    var OidcStrategy = require('passport-openidconnect').Strategy;
    var passport = require('passport');

    var app = express();
    ```

0. Configure the Express session.

    In this example we employ a server-side session management middleware: [expressjs/session](https://github.com/expressjs/session). This means only a session identifier is stored on the client side, within a cookie.

    Please consult the expressjs/session [options](https://github.com/expressjs/session#sessionoptions) documentation on the parameters passed to the middleware when creating a new session. For example:

    ```javascript
    /* index.js */

    /* . . . */

    app.use(session({
      secret: 'CHANGE-IT',
      resave: false,
      saveUninitialized: true,
      cookie: {}
    }));
    ```

0. Configure an instance of the Passport-OpenID Connect strategy.

    Use the OP and the RP information retrieved in steps 1 and 2 to populate the strategy parameters and define the RP's callback function, which will run after successful authentication and authorization. The strategy will be used by Passport for implementing the authorization code flow. Remember, as an example, we are going to populate the `callbackURL` parameter with the `/oauth2/redirect` route.

    The callback function in this strategy may receive different number of arguments, which is defined in the Passport-OpenID Connect library (in `/node_modules/passport-openidconnect/lib/strategy.js`, currently `lines 220-246`). In the example below all the arguments are presented:

    * `issuer`: the [iss](https://tools.ietf.org/html/draft-ietf-oauth-json-web-token-32#section-4.1.1) claim
    * `sub`: the [sub](https://tools.ietf.org/html/draft-ietf-oauth-json-web-token-32#section-4.1.2) claim
    * `profile`: the authenticated user information
    * `jwtClaims`: [claims](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) included in the [id_token](https://openid.net/specs/openid-connect-core-1_0.html#Terminology)
    * `accessToken`: an [access token](https://tools.ietf.org/html/rfc6749#section-1.4)
    * `refreshToken`: a [refresh token](https://tools.ietf.org/html/rfc6749#section-1.5)
    * `tokenResponse`: a full response from the OP's token endpoint
    * `done`: call the next handler in Passport

    In addition, the request object can be received as the first argument in the callback by enabling `passReqToCallback` option, as described in the Passport [Authorize](http://www.passportjs.org/docs/authorize/) documentation.

    Define the strategy:

    ```javascript
    /* index.js */

    /* . . . */

    var oidcStrategy = new OidcStrategy({
      issuer: `issuer`,
      authorizationURL: `authorization_endpoint`,
      tokenURL: `token_endpoint`,
      userInfoURL: `userinfo_endpoint`,
      clientID: `client_id`,
      clientSecret: `client_secret`,
      callbackURL: '/oauth2/redirect',
      scope: `space separated scopes available for this client`
    }, function (issuer, sub, profile, jwtClaims, accessToken, refreshToken, tokenResponse, done) {
      /*
        tokens received from the token endpoint after successful authentication and authorization
        are saved for future use by passing the information received from the OP to the next handler
        in a single object provided as the second argument to the `done` method,
        allowing Passport to attach it to the request object (and to preserve it in the session), e.g.:
      */
      done(null, {
        profile: profile,
        accessToken: {
          token: accessToken,
          scope: tokenResponse.scope,
          token_type: tokenResponse.token_type,
          expires_in: tokenResponse.expires_in
        },
        idToken: {
          token: tokenResponse.id_token,
          claims: jwtClaims
        }
      });
    });
    ```

0. Configure Passport.

    The strategy, configured in the previous step, is utilized by Passport for performing the authentication requests and handling the results. After successful authentication and authorization, the user data retrieved from the OP is stored in a local session and is attached to the request object in subsequent requests. In addition to the comments below, please consult the [Passport Sessions](https://github.com/jaredhanson/passport#sessions) documentation on maintaining persistent login data in a Passport application.

    Note that in this example the entire user object defined in the strategy callback is stored in the session. Typically, you'd probably want to store only a user identifier in the session and retrieve the rest of the data from a local store, such as a database, in subsequent requests.

    ```javascript
    /* index.js */

    /* . . . */

    /* using the configured strategy in Passport */
    passport.use(oidcStrategy);

    /* initializing Passport and configuring it for maintaining persistent login sessions */
    app.use(passport.initialize());
    app.use(passport.session());

    /* storing user data received from the strategy callback in the session, i.e. in `req.session.passport.user` */
    passport.serializeUser(function (user, next) {
      next(null, user);
    });

    /* getting the user data back from session and attaching it to the request object, i.e. to `req.user` */
    passport.deserializeUser(function (user, next) {
      /*
        if only a user identifier is stored in the session, this is where
        the full data set could be retrieved, e.g. from a database, and passed to the next step
      */

      next(null, user);
    });
    ```

0. Check if the user is signed in.

    Before defining any routes, for every request, we can check if the user has been authenticated by utilizing a custom middleware, which could optionally be encapsulated in an external function/module and applied to individual routes. Alternatively, you could use a third party middleware for this purpose, such as [connect-ensure-login](https://github.com/jaredhanson/connect-ensure-login).

    In this example we will preserve the login status information and some rudimentary navigation content (to be sent back to the browser) in the request scope, by attaching both to the [res.locals](http://expressjs.com/en/api.html#res.locals) object.

    This example demonstrates the core functionality only. It does not employ any templating engine or views.

    ```javascript
    /* index.js */

    /* . . . */

    /*
      for each request, checking if the user is signed in and
      saving certain content in the response `locals` object to
      make it available in the next request handlers and in the views
    */
    app.use(function (req, res, next) {
      res.locals.authenticated = req.session.passport && req.session.passport.user;

      /*
        conditionally returning to browser navigation content, which is
        normally done with layouts and templates
      */
      res.locals.responseString = '';

      if (res.locals.authenticated) {
        res.locals.responseString += '<a href="/">Home</a><br />'
        res.locals.responseString += '<a href="/protected/profile">Profile</a><br />'
        res.locals.responseString += '<a href="/protected/logout">Sign Out</a><br />'
      } else {
        res.locals.responseString += '<a href="/oauth2/login">Sign in</a><br />';
      }

      res.locals.responseString += '<br />';

      next();
    });
    ```

0. Configure routes.

    For clarity, we will define routes of related purposes in separate modules and save them in `routes` sub-directory.
    For example:

    ```bash
    mkdir routes && cd routes && touch oauth2.js && touch protected.js && cd ..
    ```

    Create authentication routes in the `routes/oauth2.js` module:

    ```javascript
    /* routes/oauth2.js */

    var express = require('express');
    var passport = require('passport');

    var router = express.Router();

    /*
      initiating the authorization code flow by calling passport.authenticate middleware,
      passing in the configured strategy referenced by its default name and
      making the authentication request to the authorization endpoint specified in the strategy
    */
    router.get('/login', passport.authenticate('openidconnect', {failureRedirect: '/login'}));
    ```

    This route will take the user to the OP's authorization endpoint, specified in the strategy, and prompt the user to sign in. When signed in, the user may be prompted to authorize access to the scopes specified in the strategy; presence of such consent screen will depend on how the RP is configured with the OP.

    On successful authentication and authorization, the user will be taken to the redirection URI specified in the strategy (in the callbackURL parameter), which we populated with the `/oauth2/redirect` route. Create a handler for this route:

    ```javascript
    /* routes/oauth2.js */

    /* . . . */

    /* processing the redirection request */
    router.get('/redirect', function (req, res, next) {
      /*
        checking if an error is present in the response from the OP; if it is -
        redirecting to the Home screen and not processing the request any further
      */
      if (req.query.error) {
        return res.redirect('/?error=' + req.query.error);
      }

      /*
        if no error is encountered, proceeding to the next step,
        in which passport.authenticate middleware is used to make the token request
        with the configured strategy referenced by its default name
      */
      next();
    }, passport.authenticate('openidconnect', {
      failureRedirect: '/error'
    }), function (req, res) {
      /*
        when the token response is received and processed in the strategy callback,
        redirecting to a desired route, which in this case is the user profile screen
      */

      res.redirect('/protected/profile');
    });
    ```

    Export the configured `oauth2` router:

    ```javascript
    /* routes/oauth2.js */

    /* . . . */

    module.exports = router;
    ```

    Create routes that require protection in the `routes/protected.js` module. This way, it will be easy to control access to the routes in one place.

    The access token, received from the OP and preserved in the session, can be added as a [Bearer Token](https://tools.ietf.org/html/rfc6750#section-1.2) to the `Authorization` header in requests sent to the RS instances where the token is accepted. We will use [axios](https://github.com/axios/axios) for making back-channel XHR requests but any such library should do, including the built-in `HTTP` module.

    Instead of specifying an `Authorization` header for each request, this functionality could exist in a separate function/middleware and be applied universally to all requests sent to the RS instance(s). In this example we make a single protected resource request and, for the sake of simplicity, will add the header manually.

    Note that `res.locals` is appended with some additional content before it is sent back to the browser.

    The `baseURL` parameter in the `axiosInstance` below is NOT populated with a valid resource URL; it is important that you provide one. For example, to obtain basic user information, you could use the OP's `userinfo_endpoint` collected in step 1.

    ```javascript
    /* routes/protected.js */

    var express = require('express');
    /* adding axios, for making back-channel requests to the API(s) */
    var axios = require('axios');

    var router = express.Router();

    router.get('/profile', function (req, res) {
        var responseString = 'Profile<br /><br />';

        /*
          making request to a protected endpoint on the resource server
          including the access token from the session, where it has been stored;
          provide the `userinfo_endpoint` URL for your OP in the `baseURL` parameter
        */
        var axiosInstance = axios.create(
            {
                baseURL: `userinfo_endpoint`,
                timeout: 1024,
                headers: {
                    'Authorization': 'Bearer ' + req.session.passport.user.accessToken.token
                }
            }
        );

        axiosInstance.get()
        .then(function (response) {
            /* return user data to the browser */
            responseString += '<pre>' + JSON.stringify(response.data) + '</pre>';
        })
        .catch(function (e) {
            responseString = 'Error: <br /><pre>' + e.toString();
        })
        .then(function () {
            res.locals.responseString += responseString;

            res.send(res.locals.responseString);
        });
    });
    ```

    Since signing a user out makes the most sense when the user is signed in, `/logout` will be a part of the protected routes. Its implementation may depend on the OP; please consult the [OpenID Connect Session Management](https://openid.net/specs/openid-connect-session-1_0.html) specification on maintaining related OP and RP sessions. In this example the `/logout` route will terminate the local session only:

    ```javascript
    /* routes/protected.js */

    /* . . . */

    router.get('/logout', function (req, res, next) {
      req.logout();

      req.session.destroy();

      res.redirect('/');
    });
    ```

    Export the configured `protected` router:

    ```javascript
    /* routes/protected.js */

    /* . . . */

    module.exports = router;
    ```

0. Add routes to the main module.

    At the top of the main module, alongside the other `require` statements, add the two route modules you've created:

    ```javascript
    /* index.js */

    var oauth2Routes = require('./routes/oauth2');
    var protectedRoutes = require('./routes/protected');

    /* . . . */
    ```

    Add route handlers to the main module and place them *after* checking whether the user is logged in.

    ```javascript
    /* index.js */

    /* . . . */

    app.use('/oauth2', oauth2Routes);

    /*
      for protected routes, checking whether the user is signed in;
      otherwise redirecting the user to the login route
     */
    app.use('/protected', function (req, res, next) {
      if (!res.locals.authenticated) {
        res.redirect('/oauth2/login');
      }

      next();
    }, protectedRoutes);

    /* an error handler */
    app.use('/error', function (req, res) {
      res.send('Error');
    });

    /* the default handler, redirecting to the home screen */
    app.use('/', function (req, res) {
        var responseString = 'Home<br /><br />';

        res.locals.responseString += responseString;

        res.send(res.locals.responseString);
    });
    ```

    At the end of the main module, start the web server. For example:

    ```javascript
    /* index.js */

    /* . . . */

    app.listen(3000, function () {
        console.log('Listening on 3000');
    });
    ```

0. Run the application.

    In the application directory, start the application. For example:

    ```bash
    node index.js
    ```

    Visit the site in a browser. For example:

    [http://localhost:3000/](http://localhost:3000/)

    Click on the `Sign in` link. After being redirected to the login screen, sign in with any valid credentials existing in the OP.

    If prompted, authorize access to the displayed scopes.

    Successful authentication and authorization should redirect you to the user profile screen.

This concludes a quick intro to the essential parts. To run the full sample, allowing for simultaneous authentication with multiple OPs, and for more details on the implementation proceed to the next section.

***

## Full Example

This web application was started with the [Express application generator](https://expressjs.com/en/starter/generator.html) and then modified by implementing Passport-OpenID Connect strategies for two OPs: [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) (AM) and Google. The presentation and display has been aided by adding additional libraries, custom functionality, extra static content, and layout support. All code modifications against the default Express application have been supplied with leading and (when necessary) trailing "Example: " comments. These reference points may be used as a guideline for further customization, such as adding other OP definitions or modifying the existing ones.

### Prerequisites

0. Install and run the [ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops).

### Installing and Running the Application

1. Get the application.

    Download or clone the code from [https://github.com/ForgeRock/exampleOAuth2Clients](https://github.com/ForgeRock/exampleOAuth2Clients).

0. Register the application as an OAuth 2.0 Client in AM.

    The application needs to be registered as an RP with AM, which plays the role of OP in the running platform sample. Create the OAuth 2.0 client with one of the following options:

    * Option 1: API requests with cURL

      ```bash
      curl -k 'https://default.iam.example.com/am/json/realms/root/realm-config/agents/OAuth2Client/node-passport-openidconnect' \
      -X PUT \
      --data '{
          "userpassword": "password",
          "clientType": "Confidential",
          "redirectionUris": ["http://localhost:3000/forgerock/redirect"],
          "scopes": ["openid", "profile", "fr:idm:profile", "fr:idm:consent_read", "fr:idm:notifications"],
          "responseTypes": ["code"],
          "tokenEndpointAuthMethod": "client_secret_post",
          "isConsentImplied": false,
          "postLogoutRedirectUri": ["http://localhost:3000"]
      }' \
      -H 'Content-Type: application/json' \
      -H 'Accept: application/json' \
      -H 'Cookie: iPlanetDirectoryPro='$( \
        curl -k 'https://default.iam.example.com/am/json/realms/root/authenticate' \
        -X POST \
        -H 'X-OpenAM-Username:amadmin' \
        -H 'X-OpenAM-Password:password' \
        | sed -e 's/^.*"tokenId":"\([^"]*\)".*$/\1/'
      )
      ```

      The newly created client information will be displayed in the results.
      The following JSON extract shows some key fields:

      ```json
      {"_id":"node-passport-openidconnect", "_type":{"_id":"OAuth2Client","name":"OAuth2 Clients","collection":true}}
      ```

    * Option 2: Use the platform UI

      * Navigate to [AM Console](https://default.iam.example.com/am/console)
      * Sign in with _`amadmin/password`_
      * Navigate to: _Top Level Realm_ > _Applications_ > _OAuth 2.0_
      * Add new client:
          * "Client ID": "node-passport-openidconnect"
          * "Client secret": "password"
          * "Redirection URIs": ["http://localhost:3000/forgerock/redirect"]
          * "Scope(s)": ["openid", "profile", "fr:idm:profile", "fr:idm:consent_read", "fr:idm:notifications"]
      * Update the new client
          * _Core_ > "Client type": "Confidential"
          * _Advanced_ > "Response Types": ["code"]
          * _Advanced_ > "Token Endpoint Authentication Method": "client_secret_post"
          * _Advanced_ > "Implied consent": "disabled"
          * _OpenID Connect_ > "Post Logout Redirect URIs": ["http://localhost:3000"]
          * Save Changes

    In both cases, please note that "client_secret_post" is the value chosen for the token endpoint authentication method. This is because the [oauth](https://github.com/ciaranj/node-oauth#readme) library, employed by the strategies, sends the client credentials in the request body (instead of utilizing HTTP Basic authentication, recommended by the [OAuth 2.0 standard](https://tools.ietf.org/html/rfc6749#section-2.3.1)).

    The client ID and secret provided during client registration are to be used in the configuration file. For example:

    [forgerock/client-config.js](forgerock/client-config.js)
    ```javascript
    /* Example: client configuration settings (imported to and applied in ./oidc-strategy.js) */
    var config = {
      oauth: {
        client_id: 'node-passport-openidconnect',
        client_secret: 'password',
        callbackURL: '/forgerock/redirect',
        scope: 'openid profile fr:idm:profile fr:idm:consent_read fr:idm:notifications'
      }
    };

    /*
      potentially sensitive values can be overwritten by counterparts from ./client-config.js.ignore,
      which is not tracked by the repository and can be kept confidential
    */
    var fs = require('fs');

    if (fs.existsSync('./forgerock/client-config.js.ignore')) {
      config = require('./client-config.js.ignore');
    }

    module.exports = config;
    /* Example: end */
    ```

0. (Optional) Register the application as an OAuth 2.0 Client in Google.

    In order to authenticate with a Google account and authorize access to its resources, the application needs to be registered with that provider as well. If you don't have a Google account (for testing purposes) one can be created. See [Create your Google Account](https://accounts.google.com/signup/v2/webcreateaccount?continue=https%3A%2F%2Faccounts.google.com%2FManageAccount&flowName=GlifWebSignIn&flowEntry=SignUp).

    With the Google account in place, follow [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/OAuth2) guide for creating and obtaining client credentials and scopes that could be used in the application. In the `Authorized redirect URIs` section of the project that you created in [Google API Console](https://console.developers.google.com/apis/dashboard), add:

    *`http://localhost:3000/google/redirect`*

    In case of a Google client/RP, the default fake credentials saved in [google/client-config.js](google/client-config.js) will never work; hence, you'd need to replace them with the real ones: either in place or by creating a `google/client-config.js.ignore` file. For example:

    ```javascript
    /*
      client-config.js.ignore is not tracked by the repository; hence can be kept confidential
    */
    var config = {
      oauth: {
        client_id: '111111111111-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.apps.googleusercontent.com',
        client_secret: 'AAAAAAAAAAAAAAAAAAAAAAAA',
        callbackURL: '/google/redirect',
        scope: 'openid profile'
      }
    };

    module.exports = config;
    ```

0. Run the application.

    Navigate to the [node-passport-openidconnect](/node-passport-openidconnect) sub-directory.

    * Option 1: Node.js

      If you have [Node.js](https://nodejs.org/en/) installed, the application can be started from the command line:
      ```bash
      npm install && npm start
      ```

    * Option 2: Docker

      If you have [Docker](https://www.docker.com/) installed, you can run the application in a Docker container. The example below assumes the Docker server running on _`localhost`_ and port _`3000`_ has been exposed in the Docker file.

      Build the image from the provided [Dockerfile](Dockerfile):

      ```bash
      docker build -t node-passport-openidconnect .
      ```

      Run the container from the image:
      ```
      docker run -p 3000:3000 node-passport-openidconnect:latest
      ```
      The `docker ps` output shows the container is running:
      ```
      CONTAINER ID    IMAGE                                 COMMAND                CREATED          STATUS          PORTS                     NAMES
      d153a9591aa4    node-passport-openidconnect:latest    http-server -p 3000    5 seconds ago    Up 5 seconds    0.0.0.0:3000->3000/tcp    inexplicable_universe
      ```

      On Linux you explicitly allow for direct communications between the container and the host's network:

      ```
      docker run --network host node-passport-openidconnect:latest
      ```

      Please consult the [Docker documentation](https://docs.docker.com/network/host/) for details.

0. Use the application.

    You should be able now to access the running application at [http://localhost:3000/](http://localhost:3000/).

    The *Home* page presents two options for signing in:
    * ForgeRock
    * Google

    Using any of those or both will retrieve corresponding ID and access tokens and save them in the session. The tokens can be then reused throughout the life of the session. To renew expired access tokens visit the `Home` page and sign in again.

    Note that you may need to respond to the invalid certificate warning on ForgeRock's AM login page, because the authorization server is only accessible over HTTPS and is using a self-signed certificate. Node communications over insecure HTTPS have been allowed in the main module:

    [index.js](index.js)

    ```javascript
    /* FOR DEVELOPMENT ONLY: allow for self-signed/invalid certificates universally */
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    . . .
    ```

    Using the `Sign Out` link will terminate Passport and AM sessions, but Google account will stay signed in.

0. (Optional) Develop a custom OP strategy.

    The authentication strategies and routers are defined in a separate sub-directory for each OP:<br />
    [forgerock](forgerock)<br />
    [google](google)

    The strategies in this example are populated with hard-coded values. Clients' properties are exported from `client-config.js` files, while the endpoints for each OP are saved in `discovery.json` files. When [supported](https://openid.net/specs/openid-connect-discovery-1_0.html#IssuerDiscovery) by an OP, the discovery content could be obtained dynamically from the [OpenID Provider Configuration Documents](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig), which for the two OPs could be found at:

    * [ForgeRock AM](https://default.iam.example.com/am/oauth2/.well-known/openid-configuration)
    * [Google](https://accounts.google.com/.well-known/openid-configuration)

    To implement an additional OP, a separate, similarly organized sub-directory may be introduced in the code base.

    The actual routes are constructed for each OP in a shared module:<br />
    [routes/oauth2.js](routes/oauth2.js)

    Routes protected by login are defined in:<br />
    [routes/protected.js](routes/protected.js)

    The middleware for checking login status is imported from:<br />
    [utils.js](utils.js)

    The layout and views (except the "sign in" partials for each OP) are placed in:<br />
    [views](views)

    When instantiated with the `passport.use` call, the new strategy should receive a custom name and be referenced by that name in the strategy-specific routes and in the session. For example:

    [forgerock/routes.js](forgerock/routes.js)

    ```javascript
    /* Example: ForgeRock authentication routes */
    var router = require('express').Router();
    var Oauth2Router = require('../routes/oauth2');
    var oidcStrategy = require('./oidc-strategy');
    var strategyName = 'forgerock-oidc';

    module.exports = new Oauth2Router({
      router: router,
      strategy: oidcStrategy,
      strategyName: strategyName
    });
    /* Example: end */
    ```

    [routes/oauth2.js](routes/oauth2.js)

    ```javascript
    . . .
    /* loading the configured OP-specific strategy in Passport and overriding its default name */
    passport.use(args.strategyName, args.strategy);
    . . .
    ```

    Note that the `accounts` object in the session is populated with the authenticated user information referenced by the strategy name.

    [routes/oauth2.js](routes/oauth2.js)

    ```javascript
    . . .
    req.session.accounts[args.strategyName] = Object.assign({}, req.user);
    . . .
    ```

    Such naming convention allows for accommodating generic/shared code in the views and the protected routes. For example:

    [views/api.ejs](views/api.ejs)
    ```html
    . . .
    url = new URL(document.location + '../../../protected/server/<%= encodeURIComponent(strategyName) %>');
    . . .
    ```

    [routes/protected.js](routes/protected.js)
    ```javascript
    . . .
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
    . . .
    ```

    For each OP, a link to the login route should be included in the home page template:

    [views/index.ejs](views/index.ejs)

    ```html
    <!-- Example: home page template, including ForgeRock and Google login partials -->
    <p>Sign in with:</p>

    <p>
      <% include ../forgerock/views/_login.ejs %>
    </p>

    <p>
      <% include ../google/views/_login.ejs %>
    </p>
    <!-- Example: end -->
    ```

This concludes the full example.

# License

(The MIT License)
