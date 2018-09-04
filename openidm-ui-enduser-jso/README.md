# OAuth 2.0 Implicit Flow example (for a Public Client)

This example demonstrates how ForgeRock Identity Management 6.0 (IDM) end-user UI can be modified to utilize standard OAuth 2.0 means for providing access to IDM resources. 

The [Implicit Grant](https://tools.ietf.org/html/rfc6749#section-1.3.2) is implemented in the example with [JSO JavaScript library](https://github.com/andreassolberg/jso) by initiating the flow, authenticating a user with ForgeRock Access Management (AM), obtaining an access token, and including the access token with each request to the IDM REST endpoints. 

In terms of [OAuth 2.0 standard](https://tools.ietf.org/html/rfc6749#section-1.1), this sample UI serves the role of a "client", AM is the "authorization server", and IG is the "resource server" protecting IDM's endpoints, while a user registered in AM represents the "resource owner". The "client", in this context, is an application requesting the protected resources on behalf of their owner. This environment is described in more detail in the article [Using IG to Protect IDM For Secure and Standards-Based Integration](https://forum.forgerock.com/2018/08/using-ig-protect-idm-secure-standards-based-integration/).

The IDM UI is a [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application), which corresponds to the "user-agent-based application" client profile in [OAuth 2.0 Client Types definitions](https://tools.ietf.org/html/rfc6749#section-2.1). As a "public client", not capable of maintaining the confidentiality of any credentials (including its own), the UI can only employ OAuth 2.0 [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2) Grants, which can be implemented without secure authentication _of the client_ with the authorization server. (In these scenarios, the "resource owner", i.e. AM user, can still be authenticated securely, but the client application that *may* not have to provide a "client secret" in the authorization flow.)

According to *current* OAuth 2.0 [best practices](https://tools.ietf.org/id/draft-ietf-oauth-security-topics-07.html#rfc.section.3.3.2) and [trends](https://oauth.net/2/grant-types/implicit/), the Authorization Code grant is the recommended flow for public clients. Even for public clients the Authorization Code grant provides better security, most notably by avoiding presence of the access token in the redirection URI and browser history. An implementation of the Authorization Code flow against the IDM end-user UI can be found in the `openidm-ui-enduser-appauth` example.

Despite security advantages the Authorization code flow provides, there may be cases when the Implicit flow is still employed, e.g. when the authorization server does not support [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) requests, which are necessary part of the Authorization Code grant for a public client. The following illustrates how an SPA application can employ the Implicit flow in the ForgeRock Identity Platform.

## Prerequisites

### 0. Install and run the [ForgeRock Platform sample](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform)

## Installing and running the application

### 1. Get the application

Download or clone the code from [https://github.com/ForgeRock/exampleOAuth2Clients](https://github.com/ForgeRock/exampleOAuth2Clients)

### 2. Register the application as an OAuth 2.0 Client in AM

The application needs to be registered with AM, which plays the role of [authorization server](https://tools.ietf.org/html/rfc6749#section-1.1) in the running platform sample. Create the OAuth 2.0 client with one of the following options:

* Option 1: API requests with cURL

  Sign in:
  ```bash
  curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/authenticate' \
  -X POST \
  -H 'X-OpenAM-Username:amadmin' \
  -H 'X-OpenAM-Password:password'
  ```

  Note `tokenId` key in the results:

  >{"tokenId":"AQIC5wM...3MTYxOA..*","successUrl":"http://client-service.sample.svc.cluster.local/user/#profile/details","realm":"/"}

  Assign the `tokenId` value to `iPlanetDirectoryPro` cookie in the next request:
  ```bash
  curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/realm-config/agents/OAuth2Client/openidm-ui-enduser-jso' \
  -X PUT \
  --data '{
      "clientType": "Public",
      "redirectionUris": ["http://localhost:8888"],
      "scopes": ["openid", "profile", "consent_read", "workflow_tasks", "notifications"],
      "isConsentImplied": false,
      "postLogoutRedirectUri": ["http://localhost:8888"]
    }' \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json' \
    -H 'Cookie: iPlanetDirectoryPro=AQIC5wM...3MTYxOA..*'
  ```

  The newly created client information will be displayed in the results:

  >{"_id":"openidm-ui-enduser-jso", . . . }

* Option 2: Utilizing the platform sample UI

  * Navigate to [AM Console](http://am-service.sample.svc.cluster.local/openam/console)
  * Sign in with *`amadmin/password`*
  * Navigate to: *Top Level Realm* > *Applications* > *OAuth 2.0* 
  * Add new client
      * "Client ID": "openidm-ui-enduser-jso"
      * "Redirection URIs": ["http://localhost:8888"]
      * "Scope(s)": ["openid", "profile", "consent_read", "workflow_tasks", "notifications"]
  * Update the new client
      * *Core* > "Client type": "Public"
      * *Advanced* > "Implied consent": "disabled"
      * *OpenID Connect* > "Post Logout Redirect URIs": ["http://localhost:8888"]
      * Save Changes

### 3. Run the application

Navigate to `/openidm-ui-enduser-jso` sub-directory and start an HTTP server.

* Example 1: Node.js

  If you have [Node.js](https://nodejs.org/en/) installed, get the [http-server](https://www.npmjs.com/package/http-server). On Windows sign in or run the command prompt *as administrator* and on Unix-like systems use *sudo* to execute following command:

  ```bash
  sudo npm install http-server -g
  ```

  Then, start the *http-server* instance:

  ```bash
  http-server -p 8888
  ```

* Example 2: Python

  ```bash
  python -m SimpleHTTPServer 8888
  ```

### 4. Using the application

You should be able now to visit the sample application at [http://localhost:8888](http://localhost:8888). The home page will attempt to initiate the Implicit flow with the authorization server, i.e. with the AM service:

`/index.html`
```html
<!-- JSO: initializing the client:  https://github.com/andreassolberg/jso#how-to-use -->

<!-- JSO: getting the library -->
<script type="text/javascript" src="https://unpkg.com/jso/dist/jso.js"></script>

<script>
    var JSO_CLIENT;
    
    /* JSO: 
        configuring the JSO object for ForgeRock OAuth 2.0 Provider with the client specific settings and assigning it to a global variable, accessible throughout the application 
    */
    JSO_CLIENT = new jso.JSO({
        providerID: "forgerock",
        client_id: "openidm-ui-enduser-jso",
        redirect_uri: window.location.origin,
        authorization: "http://am-service.sample.svc.cluster.local:80/openam/oauth2/authorize",
        scopes: { 
            request: [
                "openid",
                "profile",
                "consent_read",
                "workflow_tasks",
                "notifications"
            ]
        },
        debug: true
    });

    /* JSO: processing response from the authorization server */
    try {
        JSO_CLIENT.callback();
    } catch (e) {
        /* JSO: process error returned from the callback and, optionally, redirect to an appropriate screen */

        /* JSO: for example: if the resource owner (which we know and love as "user") denies access to its resources, the error may look like:
        {
            "error_description": "Resource Owner did not authorize the request",
            "state": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", 
            "error":"access_denied"
        }
        */

        var message;

        message = 'error';

        if (e.error) {
            message = e.error;

            if (e.error_description) {
                message += ': ' + e.error_description;
            }
        }

        if (message) {
            alert(message);
        }
        /* JSO: for example: end */
    }
</script>
<!-- JSO: initializing the client: end -->
```

Note that that the OAuth 2.0 specific code modifications are supplied with leading and (when necessary) trailing `"JSO: "` comments.  

If not currently signed in, the user is presented with the "SIGN IN" screen. Any valid AM user credentials can help to overcome the challenge, for example *`jdoe/Passw0rd`*. After signing in, the list of requested scopes is displayed on the authorization page. Denying or granting access to those will send the user back to the home page, according to the "redirect_uri" parameter, adding [error information](https://tools.ietf.org/html/rfc6749#section-4.2.2.1) in the former case and token information in the latter if the authorization was successful. The error information will be used by the JSO library to produce a JavaScript error, providing an option to catch and process the error's content. The token information will be stored locally, making it accessible for future use.

At this point, the access token received from AM can be included in each request to the IDM REST endpoints, e.g.:

`/org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate.js, #21-26`
```javascript
        /* JSO: getting tokens received in /index.html */
        return JSO_CLIENT.getToken()
        .then(function (token) {
            /* JSO: adding the authorization header with the access token to requests made to the resource server */
            ServiceInvoker.configuration.defaultHeaders["Authorization"] = "Bearer " + token.access_token;
            /* JSO: end */
```

Visiting the "LOG OUT" link attempts to sign the user out of AM, destroys locally stored token information, and redirects to the home page:

`/logout/index.html`

```html
<!-- JSO: getting the library: https://github.com/andreassolberg/jso#how-to-use -->
<script type="text/javascript" src="https://unpkg.com/jso/dist/jso.js"></script>

<!-- JSO: signing out -->
<script>
    (function () {
        var jso_client;
        var end_session_endpoint;
        var jso_token;
        
        /* JSO: setting default signing out URL to the home page */
        end_session_endpoint = window.location.origin;
        
        /* JSO: configuring the JSO object for ForgeRock OAuth 2.0 Provider with the client specific settings */
        jso_client = new jso.JSO({
            providerID: "forgerock",
            client_id: "openidm-ui-enduser-jso",
            authorization: "http://am-service.sample.svc.cluster.local:80/openam/oauth2/authorize",
            debug: true
        });

        /* JSO: checking if tokens received in /index.html are still available */
        jso_token = jso_client.checkToken();

        if (jso_token) {
            /* JSO: if the tokens received from AM are still maintained by the library */

            /* JSO: destroying locally stored tokens */
            jso_client.wipeTokens();

            /*
                JSO: setting the signing out URL to the authorization server's logout endpoint,
                thus ending the user's session in AM and returning to the redirection URI
            */

            end_session_endpoint = 'http://am-service.sample.svc.cluster.local/openam/oauth2/connect/endSession'
            + '?post_logout_redirect_uri=' + end_session_endpoint 
            + '&id_token_hint=' + jso_token.id_token;
        }

        /* JSO: redirecting to the signing out URL */
        window.location.replace(end_session_endpoint);
    }());
</script>
<!-- JSO: signing out: end -->
```

A similar implementation can be executed in your own SPA by reusing sections of the code marked with the example-specific comments.

# License

(The MIT License)
