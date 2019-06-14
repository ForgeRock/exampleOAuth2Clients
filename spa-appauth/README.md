# Build OIDC-based SSO Into Your Single-Page App

This example OAuth2 [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) demonstrates how to implement standards-based Single-Sign On (SSO) using OpenID Connect (OIDC). To do so, it uses two libraries - [appauthhelper](https://www.npmjs.com/package/appauthhelper) and [oidcsessioncheck](https://www.npmjs.com/package/oidcsessioncheck). These are used within the context of a trivial JavaScript application. The intent of this project is to make it easy for you to build your own single-page application with similar ease.

## Two Independent Libraries Working Together

[appauthhelper](https://www.npmjs.com/package/appauthhelper) is a library designed to make it easy to build a [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE)-based single-paged application. It handles the initial login redirection and token acquisition. It helps establish a "session" in that it provides valid access and id tokens within browser storage. It also allows you to transparently use the access token in your requests to resource server endpoints, without having to add any extra logic within your application code. Should the access token expire while the user's session is still valid in the OP, this library will transparently acquire a new token and replay the request for you.

[oidcsessioncheck](https://www.npmjs.com/package/oidcsessioncheck) is a library designed to allow any type of web-based OIDC Relying Party (RP) to associate its local session with the session at the OpenID Provider (OP). It makes no assumptions about how the RP session was established.

These two libraries have legitimate independent uses. When operating together, however, they provide a powerful pattern for constructing single-paged apps that operate as OIDC clients and retain the valuable single-sign on experience that is often required. Refer to the READMEs for each library for details about how they operate.  This example application is merely a demonstration of how you can put them together for maximum benefit.

## Primary Example Code

Within [index.html](./index.html) you'll see the main code uses the two libraries (appauthhelper and oidcsessioncheck). This code handles all work related to fetching tokens and making them available for the SPA to use. Here it is:

```html
<script src="node_modules/oidcsessioncheck/sessionCheckGlobal.js"></script>
<script src="node_modules/appauthhelper/appAuthHelperBundle.js"></script>

<script>
(function () {
    var commonSettings = {
        clientId: "appAuthClient",
        authorizationEndpoint: "https://default.iam.example.com/am/oauth2/authorize"
    };

    var sessionCheck = null;

    AppAuthHelper.init({
        clientId: commonSettings.clientId,
        authorizationEndpoint: commonSettings.authorizationEndpoint,
        scopes: "openid fr:idm:profile fr:idm:profile_update fr:idm:consent_read fr:idm:notifications",
        tokenEndpoint: "https://default.iam.example.com/am/oauth2/access_token",
        revocationEndpoint: "https://default.iam.example.com/am/oauth2/token/revoke",
        endSessionEndpoint: "https://default.iam.example.com/am/oauth2/connect/endSession",
        resourceServers: {
            "https://default.iam.example.com/am/oauth2/userinfo": "profile",
            "https://default.iam.example.com/openidm": "openid"
        },
        tokensAvailableHandler: function (claims) {
            // this function is called every time the tokens are either
            // originally obtained or renewed
            if (!sessionCheck) {
                sessionCheck = new SessionCheck({
                    clientId: commonSettings.clientId,
                    opUrl: commonSettings.authorizationEndpoint,
                    subject: claims.sub,
                    invalidSessionHandler: function () {
                        AppAuthHelper.logout().then(function () {
                            window.location.href = "";
                        });
                    },
                    cooldownPeriod: 5
                });
                // check the validity of the session immediately
                sessionCheck.triggerSessionCheck();

                // check every minute
                setInterval(function () {
                    sessionCheck.triggerSessionCheck();
                }, 60000);
                // check with every captured event
                document.addEventListener("click", function () {
                    sessionCheck.triggerSessionCheck();
                });
                document.addEventListener("keypress", function () {
                    sessionCheck.triggerSessionCheck();
                });

                // load the main SPA app
                var mainScript = document.createElement("script");
                mainScript.setAttribute("src", "app.js");
                document.getElementsByTagName("body")[0].appendChild(mainScript);
            }
        }
    });
    // In this application, we want tokens immediately, before any user interaction is attempted
    AppAuthHelper.getTokens();
}());
</script>
```

Notice how the `SessionCheck` module is initialized within the `tokensAvailableHandler`. This is required because `SessionCheck` can only operate once the user has logged in; it needs to know the name of that logged-in user. The name is available thanks to the `claims` details provided by `AppAuthHelper`.

Once the tokens are available, the main SPA code can be loaded. This is what is what "app.js" is meant to represent. In this case, app.js is a trivial bit of jQuery code which makes a single request to the resource server and displays the result in the browser. It is more remarkable for what it does not do - it doesn't need to have any code to handle access tokens. This is because appAuthHelper intercepts the request and handles all logic related to the access token.

## Running the Example Application

### Prerequisites

1. Install and run the [ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops/tree/master/dev).

2. Register the *appAuthClient* application with AM as a new OAuth2 Client.

```bash
curl -k 'https://default.iam.example.com/am/json/realms/root/realm-config/agents/OAuth2Client/appAuthClient' \
    -X PUT --data '{
        "coreOAuth2ClientConfig": {
            "redirectionUris": [
                "http://localhost:8888/appAuthHelperRedirect.html",
                "http://localhost:8888/sessionCheck.html"
            ],
            "scopes": [
                "openid",
                "profile"
            ],
            "grantTypes": [
                "authorization_code",
                "implicit"
            ],
            "isConsentImplied": true,
            "clientType": "Public",
            "tokenEndpointAuthMethod": "none"
        }
    }' \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    -H 'Cookie: iPlanetDirectoryPro='$( \
        curl -k 'https://default.iam.example.com/am/json/realms/root/authenticate' \
        -X POST \
        -H 'X-OpenAM-Username:amadmin' \
        -H 'X-OpenAM-Password:password' \
        | sed -e 's/^.*"tokenId":"\([^"]*\)".*$/\1/' \
    )
```

The response is a JSON resource indicating successful registration.
The following extract shows some key fields:
```json
{"_id":"appAuthClient", "_type":{"_id":"OAuth2Client","name":"OAuth2 Clients","collection":true}}
```

Alternatively you can add *appAuthClient* manually, using the platform UI.
Browse to the [AM Console](https://default.iam.example.com/am/console) and use these hints:

* Sign in with *amadmin/password*
* Navigate to *Top Level Realm* > *Applications* > *OAuth 2.0*
* Add new client:
    * "Client ID": "appAuthClient"
    * "Client type": "Public"
    * "Redirection URIs": ["http://localhost:8888/appAuthHelperRedirect.html", "http://localhost:8888/sessionCheck.html"]
    * "Scope(s)": ["openid", "profile"]
* Click Save, then go to "Advanced"
    * "Token Endpoint Authentication Method": "none" (for pre-AM 7 select "client_secret_post" instead)
    * "Grant Types": "Authorization Code", "Implicit"
    * "Implied consent": true

Note that this client is registered with implied consent enabled ("isConsentImplied": true). This is a typical option used for clients which are owned by the same organization as the OAuth 2.0 Authorization Server (AS). Either this option or the "Saved Consent Attribute Name" feature of the OAuth2 Provider service is required for the silent access token renewal and session check behavior to work properly.

### Installing the Dependencies

```bash
npm i oidcsessioncheck appauthhelper
```

### Serving the Static Files Used for This Sample

The easiest way to serve these files is probably to use the NPM package [http-server](https://www.npmjs.com/package/http-server):

```bash
http-server -p 8888
```

By using this, you can access this example application at <http://localhost:8888/>.


### Using the Example Application

When you open the example application at <http://localhost:8888/> it should initialize the authorization code flow and take you to AM to login. You can login with any valid user credentials; for example, *user.0/password*. When you finish logging in and approve the scopes required for this application, you will see the basic client interface.

If you look closely at the network traffic produced by your browser, you will see that each request to the resource server REST endpoints includes a header that looks like so:

```http
Authorization: Bearer d5MqRg-2TWzxzQq76r7fkDtd0M8
```

If you open a new window or tab, you can go to the AS directly, <https://default.iam.example.com/am/>, and log out. You will notice that if you go back to the window running the example app, when you perform any further interaction the application will redirect you back to the AS to login.
