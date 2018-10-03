# Build PKCE into your Single-Page App with AppAuth for JavaScript

This example OAuth2 [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) demonstrates how to implement the [AppAuth-JS](https://github.com/openid/AppAuth-JS/) library. The intent of this project is to make it easy for you to build your own application similarly.

## Why PKCE for a Single-Page App?

Single-page applications are called a "user-agent-based application" in the [OAuth2 Spec for Client Types](https://tools.ietf.org/html/rfc6749#section-2.1). As it says in the description for these sorts of clients, they are "public" clients - this means they are "incapable of maintaining the confidentiality of their credentials". These sorts of clients typically have no "client secret" associated with them, and so to obtain an access token they must be implemented with a grant type that does not require one.

Public clients have two types of grants available to implement - [Authorization Code](https://tools.ietf.org/html/rfc6749#section-4.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-4.2). Based on the descriptions in the specification, it may appear that a SPA should be built using the implicit grant; however, [industry trends](https://oauth.net/2/grant-types/implicit/) and [best current practices](https://tools.ietf.org/id/draft-ietf-oauth-security-topics-07.html#rfc.section.3.3.2) that have emerged since the initial spec was written suggest that this is not the best choice after all. Instead, use of the authorization code grant as a public client is considered more secure.

While the authorization code grant is an improvement over implicit, there is one additional concern remaining - the risk of exposing the code during redirection. Any malicious third party that is able to intercept a public client's code could use that code to obtain an access token. The [PKCE](https://tools.ietf.org/html/rfc7636) extension to OAuth2 was designed specifically to protect against this type of exposure. While it should be very difficult to intercept an authorization code served over HTTPS, using PKCE provides a valuable additional layer of protection.

## Quick Start Code Blocks

Copy and paste from these code blocks to get started using AppAuth-JS in your single-page app. These sample blocks are licensed under the same terms as AppAuth-JS: [Apache 2](https://github.com/openid/AppAuth-JS/blob/05d7bb15df950d81df299e2e5001546e89a3dc43/LICENSE).

You can see a full example of how all of these blocks are put together within [index.html](./index.html);.

 - Include the main libraries. **Note the dependency on jQuery**. You can get appAuth.js from this sample or you can build it yourself following the directions provided below. There will be an "**AppAuth**" global variable available after including it this way.

    ```
    <script type="text/javascript" src="libs/jquery-2.1.1-min.js"></script>
    <script type="text/javascript" src="appAuth.js"></script>
    ```

 - Provide the client details in an object and initialize library. The string values will vary with your particular environment.
    ```
    var appAuthClient = {
        clientId: "appAuthClient",
        redirectUri: "http://localhost:8888/redirect.html",
        scopes: "openid profile consent_read workflow_tasks notifications",
        configuration: new AppAuth.AuthorizationServiceConfiguration({
            "authorization_endpoint": "http://am-service.sample.svc.cluster.local:80/openam/oauth2/authorize",
            "token_endpoint": "http://am-service.sample.svc.cluster.local:80/openam/oauth2/access_token"
        }),
        notifier: new AppAuth.AuthorizationNotifier(),
        authorizationHandler: new AppAuth.RedirectRequestHandler(),
        tokenHandler: new AppAuth.BaseTokenRequestHandler()
    };

    appAuthClient.authorizationHandler.setAuthorizationNotifier(appAuthClient.notifier);
    appAuthClient.notifier.setAuthorizationListener(function (request, response, error) {
        if (response) {
            appAuthClient.request = request;
            appAuthClient.response = response;
            appAuthClient.code = response.code;
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

 - Handle the redirect from the AS with a specific URL that can translate the URL query string values into values passed via the hash. The hash value will be provided to the SPA and read by AppAuth for the next steps. You can use something like this example from [redirect.html](./redirect.html):

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

 - The *tokenResponseHandler* function above will be responsible for taking the access token received from the AS and putting it somewhere so that your application can use it. Your application will need to be altered to include this access token in the XHR requests it makes to resource server endpoints. Requests must include the token as a header, like so:

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
    You may want to save the accessToken value in localStorage or sessionStorage, otherwise page refreshes will lose it.

## The Working Example Application

This example OAuth2 client is based on the [IDM 6.0](https://www.forgerock.com/platform/identity-management) end-user UI, which is a single-page app. The difference between this example and the copy shipped with IDM 6.0 is that this copy operates as a standards-based OAuth2 client using AppAuth-JS. In practice, this means that this UI will initiate a PKCE-based OAuth2 flow with AM and end up with an access token that it includes with each request to the IDM REST endpoints. It is tested against this [sample ForgeRock Platform deployment](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform).

This example serves as a contrast with the openidm-ui-enduser-jso example, which is basically identical to this one except it is implemented as an implicit grant with the JSO library. See the above discussion as to the differences between implicit and authorization code grants.

## Running the sample

### Prerequisites

1. Install and run the [Platform sample](https://github.com/ForgeRock/forgeops/tree/master/samples/fr-platform)

2. Register *appAuthClient* application with AM as a new OAuth2 Client

Sign in:
```
curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/authenticate' \
    -X POST -H 'X-OpenAM-Username:amadmin' -H 'X-OpenAM-Password:password'
```

Note *tokenId* key in the results:

>{"tokenId":"AQIC5wM...3MTYxOA..*"...

Register a new OAuth2 public client. Note that you need to assign the above tokenId value to *iPlanetDirectoryPro* cookie:

```
curl 'http://am-service.sample.svc.cluster.local/openam/json/realms/root/realm-config/agents/OAuth2Client/appAuthClient' \
    -X PUT --data '{
        "coreOAuth2ClientConfig": {
            "redirectionUris": [
                "http://localhost:8888/redirect.html",
                "http://localhost:8888/checkSession.html"
            ],
            "scopes": [
                "openid",
                "profile",
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
    -H 'Cookie: iPlanetDirectoryPro=AQIC5wM...3MTYxOA..*'
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

**You MUST change the Token Endpoint Authentication Method to client_secret_post**. AM 6.0 requires that public clients using the authorization code grant be configured to use "client_secret_post" as the authentication method for the token endpoint. The default (client_secret_basic) will not work properly with AM 6.0.

### Serve the static files used for this sample

The easiest way to serve these files is probably to use the NPM package [http-server](https://www.npmjs.com/package/http-server):

    http-server -p 8888

By using this, you can access this example application at [http://localhost:8888/](http://localhost:8888/).


### Using the example application

When you open the example application at [http://localhost:8888/](http://localhost:8888/) it should initialize the authorization code flow and take you to AM to login. You can login with any valid user credentials; for example *user.0/password*. When you finish logging in and approve the scopes required for this application, you will see the standard IDM end-user interface.

If you look closely at the network traffic produced by your browser, you will see that each request to the IDM REST endpoints includes a header that looks like so:

    Authorization: Bearer d5MqRg-2TWzxzQq76r7fkDtd0M8

This is the primary new functionality that this client provides.

## Building your own copy of AppAuthJS

AppAuthJS is a new library that (as of this writing) does not have any releases. To build it as done for this example, you will need to check out the project locally from https://github.com/openid/AppAuth-JS/. Once checked out, you can build the stand-alone library like so:

1. `npm install`
2. `npm run-script compile`
3. `browserify --s AppAuth -o appAuth.js built/index.js`

This produces a file similar to the one shipped in this example under "/appAuth.js". This file was built from this commit: https://github.com/openid/AppAuth-JS/tree/05d7bb15df950d81df299e2e5001546e89a3dc43
