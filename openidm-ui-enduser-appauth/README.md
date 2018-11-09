# Build PKCE into your Single-Page App with AppAuth for JavaScript

This example OAuth2 [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) demonstrates how to implement the [AppAuth-JS](https://github.com/openid/AppAuth-JS/) library. The intent of this project is to make it easy for you to build your own application similarly.

## Why PKCE for a Single-Page App?

Single-page applications are called a "user-agent-based application" in the [OAuth2 Spec for Client Types](https://tools.ietf.org/html/rfc6749#section-2.1). As it says in the description for these sorts of clients, they are "public" clients - this means they are "incapable of maintaining the confidentiality of their credentials". These sorts of clients typically have no "client secret" associated with them, and so to obtain an access token they must be implemented with a grant type that does not require one.

Public clients have two types of grants available to implement - [Authorization Code](https://tools.ietf.org/html/rfc6749#section-4.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-4.2). Based on the descriptions in the specification, it may appear that a SPA should be built using the implicit grant; however, [industry trends](https://oauth.net/2/grant-types/implicit/) and [best current practices](https://tools.ietf.org/id/draft-ietf-oauth-security-topics-07.html#rfc.section.3.3.2) that have emerged since the initial spec was written suggest that this is not the best choice after all. Instead, use of the authorization code grant as a public client is considered more secure.

While the authorization code grant is an improvement over implicit, there is one additional concern remaining - the risk of exposing the code during redirection. Any malicious third party that is able to intercept a public client's code could use that code to obtain an access token. The [PKCE](https://tools.ietf.org/html/rfc7636) extension to OAuth2 was designed specifically to protect against this type of exposure. While it should be very difficult to intercept an authorization code served over HTTPS, using PKCE provides a valuable additional layer of protection.

## Single Sign-On Experience with OAuth2 / OpenID Connect

Oftentimes OAuth2 clients have their own session, independent of the session maintained by the authorization server (AS). This is most typically the case when the owner of the client application is not the same as the owner of the AS. However, when the client and AS are owned by the same organization, it may be beneficial and desirable that the user have a more seamless log in and log out experience between each of the clients and the AS.

For this to be possible, the client application needs to be able to silently check the status of the user's session on the AS. The client can rely upon the presence of a session cookie maintained by the AS as the means by which this silent authorization can occur. This is done by the use of a hidden iframe that attempts an authorization code grant using the "prompt=none" request parameter. This is possible so long as the client has either already obtained the necessary consent from the user for the scopes requested, or if the client is configured to have "implied" consent.

Logging out within any of these types of client applications (or directly within the AS) should cause all of them to log out. This is called single log-off. When the client logs off, it should revoke the access tokens it obtained and it should use the id token as a parameter to end the session at the AS. This general approach to session management within an client is described in the [OpenID Connect Session Management specification](https://openid.net/specs/openid-connect-session-1_0.html). This example provides code that makes it easy to operate a SPA client in this manner.

## Quick Start Code Blocks

All of the code shared in this project is licensed under the same terms as AppAuth-JS: [Apache 2](https://github.com/openid/AppAuth-JS/blob/05d7bb15df950d81df299e2e5001546e89a3dc43/LICENSE).

### Implementing Single Sign-On Behavior

This project provides example helper code designed to make single sign-on and single log-off easy to implement in your SPA. Follow these steps to get it working in your application.

#### Files to copy
Get started by including these files within your application:

- [appAuth.js](./appAuth.js) - core code from [AppAuth-JS](https://github.com/openid/AppAuth-JS/)
- [appAuth.html](./appAuth.html) - content running within child iframe that uses appAuth.js to handle all client interaction
- [appAuthFrame.js](./appAuthFrame.js) - content executed within top-level frame that embeds appAuth.html and provides extensions to the XMLHttpRequest implementation necessary for silent token renewal and session checking
- [redirect.html](./redirect.html) - handles the return from the AS, translating the search string parameters into hash values

#### Client settings to update
After you have copied these files, you will need to edit [appAuth.html](./appAuth.html) to set the values that are specific to your client. These are the main settings you'll need to update:

    var sessionCheckDelayInSeconds = 5;
    var appAuthClient = {
        clientId: 'appAuthClient',
        scopes: "openid profile profile_update consent_read workflow_tasks notifications",
        redirectUri: appBasePath+'/redirect.html',
        configuration: new AppAuth.AuthorizationServiceConfiguration({
            "authorization_endpoint": "https://login.sample.svc.cluster.local/oauth2/authorize",
            "token_endpoint": "https://login.sample.svc.cluster.local/oauth2/access_token",
            "revocation_endpoint": "https://login.sample.svc.cluster.local/oauth2/token/revoke",
            "end_session_endpoint": "https://login.sample.svc.cluster.local/oauth2/connect/endSession"
        }),

`sessionCheckDelayInSeconds` is the minimum time to wait between XHR calls to check for session validity at the OP

`clientId` is the id for your public client within the OP

`scopes` is the space-delimited list of scope values that your client needs to obtain in the access token it is requesting. Be sure to always include "openid" in order to get an id_token.

`*_endpoint` These are the various URLs to your "OpenID Provider" (OP), which is the OpenID Connect term used to describe the OAuth2 Authorization Server. You can read these from your OP's [discovery document](https://openid.net/specs/openid-connect-discovery-1_0.html) (e.g. https://login.sample.svc.cluster.local/oauth2/.well-known/openid-configuration)

#### Integrating into your SPA
Next, you will need to add this code to your SPA. This should be added to the base response HTML (the primary or "single" page).

    <script src="appAuthFrame.js"></script>

This script will add the hidden iframe to your document body. The iframe will then attempt a silent authorization code flow to the AS. If this is unsuccessful (for example, when the user isn't logged in to the AS) then interactive authorization is required. The top level window will be redirected to the AS, as is normal for the authorization code flow. When the user returns to the SPA (via the redirect.html page) the parameters provided during the redirect will be passed down to the iframe. This will allow the iframe to complete the authorization code flow, finally setting the "accessToken" and "idToken" values within the browser sessionStorage.

Use the [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API to send and receive messages from the iframe regarding when the token states have changed. For example, consider this code (based on the example within [index.html](./index.html)):

    // handle various token-related events issued from the appAuthFrame as appropriate in the SPA context
    // "appAuthLoaded" - the iframe is ready to start working. Send it a "login" message whenever you're ready to get tokens.
    // "tokensAvailable" - the access token and id token are now saved in sessionStorage
    // "tokensRenewed" - the access token and id token that were in sessionStorage have been replaced with updated tokens
    // "tokensRemoved" - there are no longer tokens available (probably due to a logout event)
    window.addEventListener("message", function (e) {
        if (e.origin !== document.location.origin) {
            return;
        }
        switch (e.data) {
            case "tokensRenewed":
            case "tokensAvailable":
                // load the main SPA app once the tokens are available / fresh
                if (!document.getElementById("mainScript")) {
                    var mainScript = document.createElement("script");
                    mainScript.setAttribute("src", "app.js");
                    mainScript.setAttribute("id", "mainScript");
                    document.getElementsByTagName("body")[0].appendChild(mainScript);
                }
                break;
            case "tokensRemoved":
                // reset the SPA if the tokens are gone, triggering a new login flow
                window.location.href = "";
                break;
            case "appAuthLoaded":
                // In this application, we want tokens immediately, before any user interaction is attempted
                document.getElementById("appAuthFrame").contentWindow.postMessage("getTokens", document.location.origin);
                break;
        }
    }, false);

    // trigger logout from anywhere in the SPA by calling this global function
    window.logout = function () {
        document.getElementById("appAuthFrame").contentWindow.postMessage("removeTokens", document.location.origin);
    };

You can see that there are four message values possible to receive - `appAuthLoaded`, `tokensAvailable`, `tokensRenewed`, and `tokensRemoved`. Listen for these messages and add the necessary code for your SPA to react appropriately. In this example, the main SPA JavaScript code is not being loaded at all until the either the "tokensRenewed" or "tokensAvailable" messages are received. Depending on your needs, you may want to start your SPA and allow user interaction before making any requests which require tokens. In this example, we don't wait - we try to get tokens immediately.

There are two message values that you can pass to the appAuthFrame - `getTokens` and `removeTokens`. Passing `getTokens` may involve redirecting the user to the AS in order to log in. If the user is already logged into the AS, or if there are already valid tokens kept in sessionStorage, then it may not involve redirection. In any case, once the tokens are obtained in sessionStorage, you can expect to receive either the `tokensAvailable` or `tokensRenewed` messages to be sent back. Passing the `removeTokens` message will revoke the access token and will use the id token to attempt to log out within the AS. Once the tokens are removed, you will receive a `tokensRemoved` message. From this point you can decide what to do within your SPA without having tokens available. In this example, it simply reloads the SPA, triggering a fresh login process.

#### Using Tokens

Once `tokensAvailable` or `tokensRenewed` has been received, your application can start using them. You can read them from sessionStorage, like so: `sessionStorage.getItem("accessToken")` and `sessionStorage.getItem("idToken")`. The accessToken value should be used when making requests to resource server endpoints. You provide the value as an "Authorization" request header. An example of doing this with jQuery:

```
$.ajax({
    url: "https://rs-service.sample.svc.cluster.local/openidm/endpoint/usernotifications/",
    headers: {
        "Authorization": "Bearer " + sessionStorage.getItem("accessToken")
    }
})
```

You can also read the details about the authenticated user (called "claims") from the idToken value. Claims are useful for your application, particularly if you need your application to behave differently for different types of users. You can read the claims with some simple code like so:

```
function getIdTokenClaims(id_token) {
    return JSON.parse(
        atob(
            id_token.split('.')[1]
            .replace('-', '+')
            .replace('_', '/')
        )
    );
}

getIdTokenClaims(sessionStorage.getItem("idToken")) // -> returns a map of values like so:
/*
{
    "at_hash": "7LsOpEFOK4zH46H96iDOHg",
    "sub": "amadmin",
    "auditTrackingId": "b2e094db-b135-4504-85a2-05897fcb7e6c-31192",
    "iss": "https://login.sample.svc.cluster.local/oauth2",
    "tokenName": "id_token",
    "aud": "appAuthClient",
    "c_hash": "X7O8AL3Zt4B2Cr6BwmeFmg",
    "acr": "0",
    "org.forgerock.openidconnect.ops": "xJ-cc7K4RQR6gx4kNrfLIIRNg5k",
    "s_hash": "I3riYOxd8FcFEm0aPZrxaw",
    "azp": "appAuthClient",
    "auth_time": 1540235130,
    "realm": "/",
    "exp": 1540238731,
    "tokenType": "JWTToken",
    "iat": 1540235131
}
*/
```

Depending on the settings in your authorization server, there may be more claim values included. See the [OpenID Connect spec on claims](https://openid.net/specs/openid-connect-core-1_0.html#Claims) for more details.

#### Expired Token Renewal

Please also note that appAuthFrame.js includes code that will help you recover from failures related to access token expiration. If the lifetime of the access token is shorter than the lifetime of the user's session in the AS, then it is possible to silently obtain fresh access tokens. In order to make this as transparent as possible to the user, the XMLHttpRequest implementation within the main SPA context has been overridden. With this code in place, the failure callback will not be triggered until there is a new token obtained. This will allow you to retry your failed XHR call immediately. For example, if you use jQuery your XHR handler code for requesting resource server endpoints could look like so:

```
function resourceServerRequest(options) {
    var _rejectHandler,
        promise = $.Deferred();

    options.headers = options.headers || {};
    options.retryAttempts = 0;

    _rejectHandler = function (jqXHR) {
        if (jqXHR.getResponseHeader("www-authenticate") && options.retryAttempts < 1) {
            options.headers["Authorization"] = "Bearer " + sessionStorage.getItem("accessToken");
            options.retryAttempts++;
            $.ajax(options).then(promise.resolve, _rejectHandler);
        } else {
            promise.reject(jqXHR);
        }
    };

    options.headers["Authorization"] = "Bearer " + sessionStorage.getItem("accessToken");
    $.ajax(options).then(promise.resolve, _rejectHandler);
    return promise;
}
```

With this function defined, you can make a call like so:

```
resourceServerRequest({
    url: "https://rs-service.sample.svc.cluster.local/openidm/endpoint/usernotifications/"
}).then(function (response) { console.log(response); });
```

Even if your accessToken had expired, the code will not see the error response. `resourceServerRequest` will recover from the failure and will resolve the promise using the successful response.

### Implementing AppAuth-JS directly

If you do not want the SPA session to be tied to the session in the AS, or if you prefer to have more direct control over the use of AppAuth-JS within your SPA, then you can refer to these details to integrate AppAuth-JS into your application.

You can see a full example of how all of these blocks are put together within [appAuth.html](./appAuth.html);.

 - Include the main library. You can get appAuth.js from this sample or you can build it yourself following the directions provided below. There will be an "**AppAuth**" global variable available after including it this way.

    ```
    <script type="text/javascript" src="appAuth.js"></script>
    ```

 - Provide the client details in an object and initialize library. The string values will vary with your particular environment.
    ```
    var opBasePath = "https://login.sample.svc.cluster.local";
    var appBasePath = (document.location.origin + document.location.pathname).split('/').slice(0,-1).join('/');
    var appAuthClient = {
        clientId: 'appAuthClient',
        scopes: "openid profile profile_update consent_read workflow_tasks notifications",
        redirectUri: appBasePath+'/redirect.html',
        configuration: new AppAuth.AuthorizationServiceConfiguration({
            "authorization_endpoint": opBasePath + "/oauth2/authorize",
            "token_endpoint": opBasePath + "/oauth2/access_token",
            "revocation_endpoint": opBasePath + "/oauth2/token/revoke"
        }),
        notifier: new AppAuth.AuthorizationNotifier(),
        authorizationHandler: new AppAuth.RedirectRequestHandler(),
        tokenHandler: new AppAuth.BaseTokenRequestHandler({
            // fetch-based alternative to built-in jquery implementation
            xhr: function (settings) {
                return new Promise(function (resolve, reject) {
                    fetch(settings.url, {
                        method: settings.method,
                        body: settings.data,
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: settings.headers
                    }).then(function (response) {
                        if (response.ok) {
                            response.json().then(resolve);
                        } else {
                            reject(response.statusText);
                        }
                    }, reject);
                });
            }
        })
    };

    appAuthClient.authorizationHandler.setAuthorizationNotifier(appAuthClient.notifier);
    appAuthClient.notifier.setAuthorizationListener(function (request, response, error) {
        if (response) {
            appAuthClient.request = request;
            appAuthClient.response = response;
            appAuthClient.code = response.code;
        }
        if (error) {
            appAuthClient.error = error;
        }
    });
    var completeRequestPromise = appAuthClient.authorizationHandler.completeAuthorizationRequestIfPossible();
    ```
    *See the section after next for how to handle the redirectUri value*

 - Log the user in via redirection to the AS. You can decide when to initiate this redirection - it could be immediately after they load the SPA, when they click a "login" link, or when they attempt to access a protected resource.

    ```
     var request = new AppAuth.AuthorizationRequest({
         client_id: appAuthClient.clientId,
         redirect_uri: appAuthClient.redirectUri,
         scope: appAuthClient.scopes,
         response_type: AppAuth.AuthorizationRequest.RESPONSE_TYPE_CODE,
         extras: { 'prompt': 'consent', 'access_type': 'offline' }
     });

     appAuthClient.authorizationHandler.performAuthorizationRequest(
         appAuthClient.configuration,
         request
     );
    ```

 - Handle the redirect from the AS with a specific URL that can translate the search string values into values passed via the hash. The hash value will be provided to the SPA and read by AppAuth for the next steps. You can use something like this example from [redirect.html](./redirect.html):

    ```
    var REDIRECT_URI = '/'; // location of the SPA
    document.addEventListener('DOMContentLoaded', function() {
      var queryString = window.location.search.substring(1); // includes '?'
      var path = [REDIRECT_URI, queryString].join('#');
      setTimeout(function() {
        window.location.assign(path);
      }, 0);
    });
    ```

 - Complete the login process by calling the token endpoint. This will use the code and state from that were sent in via the hash fragment from the above redirect handler. Be sure the *completeRequestPromise* variable from the first block has resolved before you run this.
     ```
     if (appAuthClient.code) {
         var extras = {};
         if (appAuthClient.request && appAuthClient.request.internal) {
             extras['code_verifier'] = appAuthClient.request.internal['code_verifier'];
         }
         request = new AppAuth.TokenRequest({
             client_id: appAuthClient.clientId,
             redirect_uri: appAuthClient.redirectUri,
             grant_type: AppAuth.GRANT_TYPE_AUTHORIZATION_CODE,
             code: appAuthClient.code,
             extras: extras
         });
         appAuthClient.tokenHandler
            .performTokenRequest(appAuthClient.configuration, request)
            .then(tokenResponseHandler); // SEE BELOW
    }
     ```

 - The *tokenResponseHandler* function above will be responsible for taking the access token and id token received from the AS and putting them somewhere that your application can read from. Your application will need to be altered to include this access token in the XHR requests it makes to resource server endpoints. Requests must include the token as a header, like so:

    ```
    Authorization: Bearer ${accessToken}
    ```

    The *tokenResponseHandler* function is called with a single argument - an object which represents the direct JSON response from token endpoint. For example, the object will be structured like so:
    ```
    {
        "accessToken": "d5MqRg-2TWzxzQq76r7fkDtd0M8",
        "idToken": "eyJ0eX......35uNGtw",
        "scope": "consent_read openid profile notifications workflow_tasks",
        "tokenType": "Bearer",
        "issuedAt": 1535666764,
        "expiresIn": 3599
    }
    ```

    An example implementation of *tokenResponseHandler* is provided below:
    ```
    var tokenResponseHandler = function (token_endpoint_response) {
        // keep tokens within sessionStorage, to be read elsewhere in application as part of XHR calls
        sessionStorage.setItem('accessToken', token_endpoint_response.accessToken);
        sessionStorage.setItem('idToken', token_endpoint_response.idToken);
    };
    ```
    You probably want to save the accessToken value in localStorage or sessionStorage, otherwise page refreshes will lose it.

## The Working Example Application

This example OAuth2 client is based on the [IDM 6.0](https://www.forgerock.com/platform/identity-management) end-user UI, which is a single-page app. The difference between this example and the copy shipped with IDM 6.0 is that this copy operates as a standards-based OAuth2 client using AppAuth-JS. In practice, this means that this UI will initiate a PKCE-based OAuth2 flow with AM and end up with an access token that it includes with each request to the IDM REST endpoints. It is tested against this [sample ForgeRock Platform deployment](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform).

This example serves as a contrast with the openidm-ui-enduser-jso example, which is basically identical to this one except it is implemented as an implicit grant with the JSO library. See the above discussion as to the differences between implicit and authorization code grants.

## Running the sample

### Prerequisites

1. Install and run the [Platform sample](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform)

2. Register *appAuthClient* application with AM as a new OAuth2 Client

Sign in:
```
curl -k 'https://login.sample.svc.cluster.local/json/realms/root/authenticate' \
    -X POST -H 'X-OpenAM-Username:amadmin' -H 'X-OpenAM-Password:password'
```

Note *tokenId* key in the results:

>{"tokenId":"AQIC5wM...3MTYxOA..*"...

Register a new OAuth2 public client. Note that you need to assign the above tokenId value to *iPlanetDirectoryPro* cookie:

```
curl -k 'https://login.sample.svc.cluster.local/json/realms/root/realm-config/agents/OAuth2Client/appAuthClient' \
    -X PUT --data '{
        "coreOAuth2ClientConfig": {
            "redirectionUris": [
                "http://localhost:8888/redirect.html"
            ],
            "scopes": [
                "openid",
                "profile",
                "profile_update",
                "consent_read",
                "workflow_tasks",
                "notifications"
            ],
            "grantTypes": [
                "authorization_code"
            ],
            "isConsentImplied": true,
            "clientType": "Public",
            "tokenEndpointAuthMethod": "client_secret_post"
        }
    }' \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    -H 'Cookie: iPlanetDirectoryPro=AQIC5wM...3MTYxOA..*'
```
>{"_id":"appAuthClient", . . . "_type":{"_id":"OAuth2Client","name":"OAuth2 Clients","collection":true}}

Alternatively you can add *appAuthClient* manually, utilizing the platform UI: [AM Console](https://login.sample.svc.cluster.local/console)

* Sign in with *amadmin/password*
* Navigate to *Top Level Realm* > *Applications* > *OAuth 2.0
* Add new client:
    * "Client ID": "appAuthClient"
    * "Client type": "Public"
    * "Redirection URIs": ["http://localhost:8888/redirect.html"]
    * "Scope(s)": ["openid", "profile", "profile_update", "consent_read", "workflow_tasks", "notifications"]
* Click Save, then go to "Advanced"
    * "Token Endpoint Authentication Method": "client_secret_post"
    * "Implied consent": true

**You MUST change the Token Endpoint Authentication Method to client_secret_post**. AM 6.0 requires that public clients using the authorization code grant be configured to use "client_secret_post" as the authentication method for the token endpoint. The default (client_secret_basic) will not work properly with AM 6.0.

Note that this client is registered with implied consent enabled ("isConsentImplied": true). This is a typical option used for clients which are owned by the same organization as the AS. Either this option or the "Saved Consent Attribute Name" feature of the OAuth2 Provider service is required for the silent access token renewal and session check behavior to work properly.

### Serve the static files used for this sample

The easiest way to serve these files is probably to use the NPM package [http-server](https://www.npmjs.com/package/http-server):

    http-server -p 8888

By using this, you can access this example application at [http://localhost:8888/](http://localhost:8888/).


### Using the example application

When you open the example application at [http://localhost:8888/](http://localhost:8888/) it should initialize the authorization code flow and take you to AM to login. You can login with any valid user credentials; for example *user.0/password*. When you finish logging in and approve the scopes required for this application, you will see the standard IDM end-user interface.

If you look closely at the network traffic produced by your browser, you will see that each request to the IDM REST endpoints includes a header that looks like so:

    Authorization: Bearer d5MqRg-2TWzxzQq76r7fkDtd0M8

This is the primary new functionality that this client provides.

If you open a new window or tab, you can go to the AS directly (https://login.sample.svc.cluster.local/) and log out. You will notice that if you go back to the window running the example app, when you perform any further interaction the application will redirect you back to the AS to login.

## Building your own copy of AppAuthJS

AppAuthJS is a new library that (as of this writing) does not have any releases. To build it as done for this example, you will need to check out the project locally from https://github.com/openid/AppAuth-JS/. Once checked out, you can build the stand-alone library like so:

1. `npm install`
2. `npm run-script compile`
3. `browserify --s AppAuth -o appAuth.js built/index.js`

This produces a file similar to the one shipped in this example under "/appAuth.js". This file was built from this commit: https://github.com/openid/AppAuth-JS/tree/05d7bb15df950d81df299e2e5001546e89a3dc43
