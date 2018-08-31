# Example OAuth2 Authorization Code Flow with a Public Client

This example OAuth2 client is based on the OpenIDM 6.0 end-user UI, which is a "[Single Page Application](https://en.wikipedia.org/wiki/Single-page_application)". The difference between this example IDM end-user interface and the copy shipped with IDM 6.0 is that this copy operates as a standards-based OAuth2 client. In practice, this means that this UI will initiate an OAuth2 flow with AM and end up with an access token that it includes with each request to the IDM REST endpoints.

Single Page Applications are called a "user-agent-based application" in the [OAuth2 Spec for Client Types](https://tools.ietf.org/html/rfc6749#section-2.1). As it says in the description for these sorts of clients, they are "public" clients - this means they are "incapable of maintaining the confidentiality of their credentials". These sorts of clients typically have no "client secret" associated with them, and so to obtain an access token they must be implemented with a grant type that does not require one.

Public clients have two types of grants available to implement - [Authorization Code](https://tools.ietf.org/html/rfc6749#section-4.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-4.2). Based on the descriptions in the specification, it may appear that an SPA should be built using the implicit grant; however, [industry trends and discussions](https://oauth.net/2/grant-types/implicit/) and [OAuth 2 best current practice](https://tools.ietf.org/id/draft-ietf-oauth-security-topics-07.html#rfc.section.3.3.2) that have emerged since the initial spec was written suggest that this is not the best choice after all. Instead, use of the authorization code grant as a public client is considered more secure.

This example OAuth2 application is implemented with the [AppAuth-JS](https://github.com/openid/AppAuth-JS/) library, which performs an authorization code grant flow as a public client. It serves as a contrast with the openidm-ui-enduser-jso example, which is basically identical to this one except it is implemented as an implicit grant with the JSO library.

In addition, this example is intended to serve as a template that you can copy-and-paste from when building your own OAuth2 public client single page applications. It is tested against the [ForgeRock Platform sample](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform)

## Running the sample

### Prerequisites

1. Install and run the [Platform sample](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform)

2. Register *appAuthClient* application with AM as a new OAuth2 Client

Sign in:
```
curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/authenticate' -X POST -H 'X-OpenAM-Username:amadmin' -H 'X-OpenAM-Password:password'
```

Note *tokenId* key in the results:

>{"tokenId":"AQIC5wM...3MTYxOA..*"...

Register a new OAuth2 public client. Note that you need to assign the above tokenId value to *iPlanetDirectoryPro* cookie:

```
curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/realm-config/agents/OAuth2Client/appAuthClient' -X PUT --data '{"coreOAuth2ClientConfig":{"defaultScopes":[],"redirectionUris":["http://localhost:8888/redirect.html"],"scopes":["openid","profile","consent_read","workflow_tasks","notifications"],"clientType":"Public","isConsentImplied":false,"subjectType":"Public","tokenEndpointAuthMethod":"client_secret_post"}}' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Cookie: iPlanetDirectoryPro=AQIC5wM...3MTYxOA..*'
```
>{"_id":"appAuthClient", . . . "_type":{"_id":"OAuth2Client","name":"OAuth2 Clients","collection":true}}

Alternatively you can add *appAuthClient* manually, utilizing the platform UI: [AM Console](http://am-service.sample.svc.cluster.local/openam/console)

* Sign in with *amadmin/password*
* Navigate to *Top Level Realm* > *Applications* > *OAuth 2.0
* Add new client:
    * "Client ID": "appAuthClient"
    * "Client type": "Public"
    * "Redirection URIs": ["http://localhost:8888/redirect.html"]
    * "Scope(s)": ["openid", "profile", "consent_read", "workflow_tasks", "notifications"]
* Click Save, then go to "Advanced"
    * "Token Endpoint Authentication Method": "client_secret_post"

### Serve the static files used for this sample

The easiest way to serve these files is probably to use the NPM package [http-server](https://www.npmjs.com/package/http-server):

    http-server -p 8888

By using this, you can access this example application at [http://localhost:8888/](http://localhost:8888/).


### Using the example application

When you open the example application at [http://localhost:8888/](http://localhost:8888/) it should initialize the authorization code flow and take you to AM to login. You can login with any valid user credentials; for example *jdoe/Passw0rd*. When you finish logging in and approve the scopes required for this application, you will see the standard IDM end-user interface.

If you look closely at the network traffic produced by your browser, you will see that each request to the IDM REST endpoints includes a header that looks like so:

    Authorization: Bearer d5MqRg-2TWzxzQq76r7fkDtd0M8

This is the primary new functionality that this client provides.

## Building your own copy of AppAuthJS

AppAuthJS is a new library that (as of this writing) does not have any releases. To build it as done for this example, you will need to check out the project locally from https://github.com/openid/AppAuth-JS/. Once checked out, you can build the stand-alone library like so:

1. `npm run-script compile`
2. `browserify --s AppAuth -o appAuth.js built/index.js`

This produces a file similar to the one shipped in this example under "/appAuth.js".

## Running AppAuth-JS in your own SPA

The below code is taken from index.html; it should serve as a simple starting point for you to use to introduce similar functionality into your own SPA. You will need to make sure to update the details in the "appAuthClient" section to reflect your actual application's settings. **Note the dependency on jQuery**

    <script type="text/javascript" src="libs/jquery-2.1.1-min.js"></script>
    <script type="text/javascript" src="appAuth.js"></script>
    <script>
    (function () {

        var appAuthClient = {
            /* These details will vary with your particular environment. */
            clientId: 'appAuthClient',
            redirectUri: 'http://localhost:8888/redirect.html',
            issuer: 'http://am-service.sample.svc.cluster.local/openam/oauth2',
            scopes: "openid profile consent_read workflow_tasks notifications",

            notifier: new AppAuth.AuthorizationNotifier(),
            authorizationHandler: new AppAuth.RedirectRequestHandler(),
            tokenHandler: new AppAuth.BaseTokenRequestHandler()
        };

        appAuthClient.authorizationHandler.setAuthorizationNotifier(appAuthClient.notifier);
        appAuthClient.notifier.setAuthorizationListener(function (request, response, error) {
            if (response) {
                appAuthClient.code = response.code;
            }
        });
        appAuthClient.authorizationHandler.completeAuthorizationRequestIfPossible();

        AppAuth.AuthorizationServiceConfiguration
        .fetchFromIssuer(appAuthClient.issuer)
        .then(function (response) {
            /*
                This call to the well-known endpoint can be avoided if you prefer to hard-code the
                configuration. If your AS does not change often doing so will improve performance.
            */
            appAuthClient.configuration = response;
        })
        .then(function () {
            var request;
            if (appAuthClient.code) {
                request = new AppAuth.TokenRequest(
                    appAuthClient.clientId,
                    appAuthClient.redirectUri,
                    AppAuth.GRANT_TYPE_AUTHORIZATION_CODE,
                    appAuthClient.code,
                    undefined
                );
                appAuthClient.tokenHandler
                .performTokenRequest(appAuthClient.configuration, request)
                .then(function (token_endpoint_response) {
                    /*
                        token_endpoint_response will contain values like so:
                        {
                            "accessToken": "d5MqRg-2TWzxzQq76r7fkDtd0M8",
                            "idToken": "eyJ0eX......35uNGtw",
                            "scope": "consent_read openid profile notifications workflow_tasks",
                            "tokenType": "Bearer",
                            "issuedAt": 1535666764,
                            "expiresIn": 3599
                        }

                        Use the accessToken in your XHR requests to any resource server endpoint as a header:

                            Authorization: `Bearer ${accessToken}`

                        You may want to save the accessToken value in localstorage or sessionstorage, otherwise
                        page refreshes will lose it. For simplicity this example merely saves it as a global variable,
                        to be used in the code that handles XHR requests.
                    */
                    ACCESS_TOKEN = token_endpoint_response.accessToken;

                    /*
                        Reset the hash to remove the url parameters included within
                        it and initialize the normal app logic based on the default route.
                    */
                    window.location.hash = "";
                });
            } else {
                request = new AppAuth.AuthorizationRequest(
                    appAuthClient.clientId,
                    appAuthClient.redirectUri,
                    appAuthClient.scopes,
                    AppAuth.AuthorizationRequest.RESPONSE_TYPE_CODE,
                    undefined, /* state */
                    { /* extra parameters */
                    });

                appAuthClient.authorizationHandler.performAuthorizationRequest(
                    appAuthClient.configuration,
                    request
                );
            }
        });
    }());
    </script>

When this executes, it will immediately initiate an authorization code grant flow. Upon returning from the authorization endpoint (via redirect.html) the code and state will be available as part of the hash fragment. Passing through the above logic a second time will result in the detection of this code and state and will therefore trigger a call to the token endpoint to fetch the access token.

You will need to use the access token elsewhere in your code when making XHR calls to the various resource server endpoints. Be sure to store it somewhere that is usable for that purpose.

Be sure to include redirect.html (or a similar endpoint) in your application so that the query string parameters provided as part of the authorization code redirect are transformed into URL hash fragment values in a way that is recognizable by AppAuth.
