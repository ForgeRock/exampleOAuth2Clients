# Build OIDC-based SSO Into Your Single-Page App

This example OAuth2 [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) demonstrates how to implement standards-based Single-Sign On (SSO) using OpenID Connect (OIDC). To do so, it uses two libraries - [appauthhelper](https://www.npmjs.com/package/appauthhelper) and [oidcsessioncheck](https://www.npmjs.com/package/oidcsessioncheck). These are used within the context of the ForgeRock IDM 6.0 End-User UI. The intent of this project is to make it easy for you to build your own single-page application similarly.

## Two Independent Libraries Working Together

[appauthhelper](https://www.npmjs.com/package/appauthhelper) is a library designed to make it easy to build a [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE)-based single-paged application. It handles the initial login redirection and token acquisition. It helps establish a "session" in that it provides valid access and id tokens within browser session storage.

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
        authorizationEndpoint: "https://login.sample.forgeops.com/oauth2/authorize"
    };

    AppAuthHelper.init({
        clientId: commonSettings.clientId,
        authorizationEndpoint: commonSettings.authorizationEndpoint,
        scopes: "openid profile profile_update consent_read workflow_tasks notifications",
        tokenEndpoint: "https://login.sample.forgeops.com/oauth2/access_token",
        revocationEndpoint: "https://login.sample.forgeops.com/oauth2/token/revoke",
        endSessionEndpoint: "https://login.sample.forgeops.com/oauth2/connect/endSession",
        tokensAvailableHandler: function (claims) {
            // this function is called every time the tokens are either
            // originally obtained or renewed
            if (!document.getElementById("mainScript")) {
                var sessionCheck = new SessionCheck({
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
                mainScript.setAttribute("src", "libs/requirejs-2.1.14-min.js");
                mainScript.setAttribute("data-main", "main");
                mainScript.setAttribute("id", "mainScript");
                document.getElementsByTagName("body")[0].appendChild(mainScript);
            }
        }
    });

    // In this application, we want tokens immediately, before any user interaction is attempted
    AppAuthHelper.getTokens();

    // trigger logout from anywhere in the SPA by calling this global function
    window.logout = function () {
        AppAuthHelper.logout().then(function () {
            window.location.href = "";
        });
    };
}());
</script>
```

Notice how the `SessionCheck` module is initialized within the `tokensAvailableHandler`. This is required because `SessionCheck` can only operate once the user has logged in; it needs to know the name of that logged-in user. The name is available thanks to the `claims` details provided by `AppAuthHelper`.

The only other change to the IDM code that this example uses is here: [ServiceInvoker.js](./org/forgerock/commons/ui/common/main/ServiceInvoker.js#L49)

```javascript
_rejectHandler = function (jqXHR, textStatus, errorThrown) {
    if (!options.suppressEvents) {
        if (jqXHR.getResponseHeader("www-authenticate") && options.retryAttempts < 1) {
            // The access token may have been updated since the last attempt; update the request to use it.
            options.headers["Authorization"] = "Bearer " + sessionStorage.getItem("accessToken");
            options.retryAttempts++;
            $.ajax(options).then(resolveHandler, _rejectHandler);
        } else {
            if (errorCallback) {
                errorCallback(jqXHR);
            }
            promise.reject.apply(promise, arguments);
        }
    } else {
        if (errorCallback) {
            errorCallback(jqXHR);
        }
        promise.reject.apply(promise, arguments);
    }
};

// Add the access token to all xhr requests before they are sent
options.headers["Authorization"] = "Bearer " + sessionStorage.getItem("accessToken");
```

This is the code that actually uses the stored `accessToken` value as part of the requests to the IDM resource server endpoints. This code also demonstrates an example for how you can recover from expired token errors, thanks to the retry logic built into appauthhelper.

## Running the Example Application

### Prerequisites

1. Install and run the [Platform OAuth2 Sample](https://github.com/ForgeRock/forgeops-init/tree/master/6.5/oauth2).

2. Register the *appAuthClient* application with AM as a new OAuth2 Client.

```bash
curl -k 'https://login.sample.forgeops.com/json/realms/root/realm-config/agents/OAuth2Client/appAuthClient' \
    -X PUT --data '{
        "coreOAuth2ClientConfig": {
            "redirectionUris": [
                "http://localhost:8888/appAuthHelperRedirect.html",
                "http://localhost:8888/sessionCheck.html"
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
                "authorization_code",
                "implicit"
            ],
            "isConsentImplied": true,
            "clientType": "Public",
            "tokenEndpointAuthMethod": "client_secret_post"
        }
    }' \
    -H 'Content-Type: application/json' -H 'Accept: application/json' \
    -H 'Cookie: iPlanetDirectoryPro='$( \
        curl -k 'https://login.sample.forgeops.com/json/realms/root/authenticate' \
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
Browse to the [AM Console](https://login.sample.forgeops.com/console) and use these hints:

* Sign in with *amadmin/password*
* Navigate to *Top Level Realm* > *Applications* > *OAuth 2.0*
* Add new client:
    * "Client ID": "appAuthClient"
    * "Client type": "Public"
    * "Redirection URIs": ["http://localhost:8888/appAuthHelperRedirect.html", "http://localhost:8888/sessionCheck.html"]
    * "Scope(s)": ["openid", "profile", "profile_update", "consent_read", "workflow_tasks", "notifications"]
* Click Save, then go to "Advanced"
    * "Token Endpoint Authentication Method": "client_secret_post"
    * "Grant Types": "Authorization Code", "Implicit"
    * "Implied consent": true

**You MUST change the Token Endpoint Authentication Method to client_secret_post**. AM 6.0 requires that public clients using the authorization code grant be configured to use "client_secret_post" as the authentication method for the token endpoint. The default (client_secret_basic) will not work properly with AM 6.0.

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

When you open the example application at <http://localhost:8888/> it should initialize the authorization code flow and take you to AM to login. You can login with any valid user credentials; for example, *user.0/password*. When you finish logging in and approve the scopes required for this application, you will see the standard IDM end-user interface.

If you look closely at the network traffic produced by your browser, you will see that each request to the IDM REST endpoints includes a header that looks like so:

```http
Authorization: Bearer d5MqRg-2TWzxzQq76r7fkDtd0M8
```

This is the primary new functionality that this client provides.

If you open a new window or tab, you can go to the AS directly, <https://login.sample.forgeops.com/>, and log out. You will notice that if you go back to the window running the example app, when you perform any further interaction the application will redirect you back to the AS to login.
