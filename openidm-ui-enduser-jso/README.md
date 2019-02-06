# OAuth 2.0 Implicit Grant Example for a Public Client

Herein we will use terminology of the [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html) (OIDC) extension for the [OAuth 2.0](https://tools.ietf.org/html/rfc6749) protocol, which will be used as means of authentication and authorization.

In the context of OAuth 2.0, a [Public Client](https://tools.ietf.org/html/rfc6749?#section-2.1) is a [client](https://tools.ietf.org/html/rfc6749?#section-1.1) not capable of secure authentication with the [Authorization Server](https://tools.ietf.org/html/rfc6749?#section-1.1) (AS). This definition loosely corresponds to `user-agent-based` and `native` application profiles described in [OAuth 2.0 Client Types](https://tools.ietf.org/html/rfc6749#section-2.1).

According to *current* [best practices](https://tools.ietf.org/id/draft-ietf-oauth-security-topics-07.html#rfc.section.3.3.2) and [trends](https://oauth.net/2/grant-types/implicit/), [Authorization Code Grant](https://tools.ietf.org/html/rfc6749?#section-4.1) is the recommended OAuth 2.0 flow for public clients, for it provides better security, most notably by avoiding presence of the access token in the redirection URI and browser history and by using the [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE) extension.

Despite the security advantages the authorization code grant provides, there may be cases where the [Implicit Grant](https://tools.ietf.org/html/rfc6749?#section-4.2) still should be employed, for example, when the AS does not support cross origin resource sharing ([CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)) requests, which are necessary part of the authorization code flow for a public client.

The implicit grant is implemented in this example with [JSO JavaScript library](https://github.com/andreassolberg/jso) (JSO) included in a [Single-page application](https://en.wikipedia.org/wiki/Single-page_application) (SPA), serving as an instance of a user-agent-based OAuth 2.0 client, playing the role of an [OpenID Connect Relying Party](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (RP). The client must be registered with an [OpenID Provider](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (OP); the library then needs to be provided with the information about this registration to implement the authentication flow. In this context the RP and the OP are special cases of a client and an authorization server, respectively. The end user is the [Resource Owner](https://tools.ietf.org/html/rfc6749?#section-1.1).

***

## Core Functionality

A generic (OP-independent) version of the workflow employed in this example is outlined in a few implementation steps below.

1. Collect information about the OP.

    In this step you gather the OP endpoints that will be used for making authentication requests by the JSO library. If supported by the OP, this information can be found in the [OpenID Provider Configuration Document](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) at the well-known endpoint. You can read more about OIDC discovery configuration and see a sample of the data returned from the well-known point in the [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) (AM) [documentation](https://backstage.forgerock.com/docs/am/6/oidc1-guide/#configure-openid-connect-discovery). If you have an AM instance running you will be able to see a live version of the configuration document at `https://your-am-instance.example.com/oauth2/.well-known/openid-configuration`.

    At a minimum, you will need the value for:

    * `authorization_endpoint`

0. Collect information about the RP.

    The library will also need following details about the RP registration with the OP:

    * `client_id`
    * redirection URI
    * scopes available for this client (to choose from when sending the authorization request)

    Obtaining the RP registration details is specific to the OP and not covered here. As an example, you can consult the section on [_Registering OAuth 2.0 Clients With the Authorization Service_](https://backstage.forgerock.com/docs/am/6/oauth2-guide/#register-oauth2-client) in the AM documentation for creating and obtaining client credentials and scopes for an AM account.

    After successful authentication and authorization the end-user may be redirected back to the home page, such as `http://localhost:8888`. Note that the full and exact redirection URI, including scheme, host, port, and path, MUST be registered for the RP with the OP.

0. Configure the JSO library in your application and implement the Implicit Flow

    Load the library from CDN (or a locally hosted module). For example:

    ```html
    <!-- loading the library -->
     <script type="text/javascript" src="https://unpkg.com/jso/dist/jso.js"></script>
    ```

    Initiate a JSO instance with the data you collected for the OP and the RP. Note that the example below is populated with placeholders; you'll need to provide actual valid values.

    ```html
    <script>
        /*
            configuring the JSO object for an OpenID Provider (OP) and a Relying Party (RP) and
            saving it in a global variable, accessible throughout the Single-page application
            (provide your OP and RP specific values in place of the placeholders marked by backticks);
            initiating request to the OP
        */
        var JSO_CLIENT;

        JSO_CLIENT = new jso.JSO({
            providerID: `your-local-identifier-for-the-OP`,
            client_id: `an-arbitrary-local-identifier-for-the-RP`,
            redirect_uri: window.location.origin,
            authorization: `authorization_endpoint`,
            scopes: {
                request: [
                    `scope1`,
                    `scope2`,
                    `etc.`
                ]
            },
            debug: true
        });
    </script>
    ```

    Use the callback method to check for the response from the OP when the user is redirected back to the home page.

    ```html
    <script>
        try {
            /*
                processing response from the OP and,
                if the authentication and the authorization were successful,
                saving the token response in the browser's localStorage
            */
            JSO_CLIENT.callback();
        } catch (e) {
            /*
                handling error returned from the callback function and, optionally, redirecting to an appropriate screen,
                for example: if the resource owner denies access to its resources, the error may look like:
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

            alert(message);
        }
    </script>
    ```

    The access token received from the OP can be used for making requests to protected endpoints on a [Resource Server](https://tools.ietf.org/html/rfc6749#section-1.1) (RS) where the token is recognized and accepted. As an _example_ of such request, you could use the OP's well known `userinfo_endpoint`, which could be discovered at the OpenID Provider Configuration Document. (In that case the OP would play the role of an RS.)

    ```html
    <script>
        /* getting tokens from the localStorage */
        JSO_CLIENT.getToken()
        .then(function (tokenResponse) {
            /*
                making request to a Resource Server (RS), which is
                to support CORS and to recognize the access token
            */
            var request;

            request = new XMLHttpRequest();

            /* . . . */

            /* and including the access token in the Authorization header */
            request.setRequestHeader('Authorization', 'Bearer ' +  tokenResponse.access_token);

            /* . . . */
        });
    </script>
    ```

    This concludes introduction to the essential parts. To see the implicit grant employed in an SPA utilizing its RS's endpoints, please proceed to the next section.

***

## Full Example

This example demonstrates how the [ForgeRock Identity Management](https://www.forgerock.com/platform/identity-management) (IDM) end-user UI can be modified to use standard OAuth 2.0 means for providing access to IDM resources.

The UI serves the role of an RP, [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) (AM) is the OP, and [ForgeRock Identity Gateway](https://www.forgerock.com/platform/identity-gateway) (IG) is the RS protecting IDM REST endpoints, while a user registered in AM represents the resource owner. This environment is described in more detail in the article on [_Using IG to Protect IDM For Secure and Standards-Based Integration_](https://forum.forgerock.com/2018/08/using-ig-protect-idm-secure-standards-based-integration/).

IDM UI is an SPA and, being a public client, is not capable of maintaining the confidentiality of any credentials (including its own). Hence, the application can only employ OAuth 2.0 [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2) Grants, both of which could be implemented without secure authentication of the _client_, that is, the RP. (In these scenarios, the resource owner, that is, an AM user, can still be authenticated securely, but the client application _may_ not have to provide a "client secret" in the authorization code flow.)

The following illustrates how an SPA application can employ the Implicit flow against the ForgeRock Identity Platform. An implementation of the authorization code flow can be found in the [openidm-ui-enduser-appauth](https://github.com/ForgeRock/exampleOAuth2Clients/tree/master/openidm-ui-enduser-appauth) example.

### Prerequisites

0. Install and run the [Platform OAuth2 Sample](https://github.com/ForgeRock/forgeops-init/tree/master/6.5/oauth2)

### Installing and Running the Application

1. Get the application.

    Download or clone the code from [https://github.com/ForgeRock/exampleOAuth2Clients](https://github.com/ForgeRock/exampleOAuth2Clients).

0. Register the application as an OAuth 2.0 Client in AM.

    The application needs to be registered with AM, which plays the role of an OP in the running platform sample. Create the OAuth 2.0 client with one of the following options:

    * Option 1: API requests with cURL

        ```bash
        curl -k 'https://login.sample.forgeops.com/json/realms/root/realm-config/agents/OAuth2Client/openidm-ui-enduser-jso' \
        -X PUT \
        --data '{
            "clientType": "Public",
            "redirectionUris": ["http://localhost:8888"],
            "scopes": [
                "openid",
                "profile",
                "profile_update",
                "consent_read",
                "workflow_tasks",
                "notifications"
            ],
            "isConsentImplied": false,
            "postLogoutRedirectUri": ["http://localhost:8888"],
            "grantTypes": ["implicit"]
            }' \
            -H 'Content-Type: application/json' \
            -H 'Accept: application/json' \
            -H 'Cookie: iPlanetDirectoryPro='$( \
                curl -k 'https://login.sample.forgeops.com/json/realms/root/authenticate' \
                -X POST \
                -H 'X-OpenAM-Username:amadmin' \
                -H 'X-OpenAM-Password:password' | sed -e 's/^.*"tokenId":"\([^"]*\).*$/\1/' \
            )
        ```

        The newly created client information will be displayed in the JSON output.
        The following example shows the key field:

        ```json
        {"_id":"openidm-ui-enduser-jso"}
        ```

    * Option 2: Using the platform UI

        * Navigate to [AM Console](https://login.sample.forgeops.com/console)
        * Sign in with *`amadmin/password`*
        * Navigate to: *Top Level Realm* > *Applications* > *OAuth 2.0*
        * Add new client
            * "Client ID": "openidm-ui-enduser-jso"
            * "Redirection URIs": ["http://localhost:8888"]
            * "Scope(s)": ["openid", "profile", "profile_update", "consent_read", "workflow_tasks", "notifications"]
        * Update the new client
            * *Core* > "Client type": "Public"
            * *Advanced* > "Implied consent": "disabled"
            * *Advanced* > "Grant Types": ["implicit"]
            * *OpenID Connect* > "Post Logout Redirect URIs": ["http://localhost:8888"]
            * Save Changes

0. Run the application.

    Navigate to the [openidm-ui-enduser-jso](./openidm-ui-enduser-jso) sub-directory and start an HTTP server.

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

0. Use the application.

    You should be able now to visit the sample application at [http://localhost:8888](http://localhost:8888). The home page will attempt to initiate the implicit flow with AM.

    Note that you may need to respond to the invalid certificate warning on AM login page, because the authorization server is only accessible over HTTPS and is using a self-signed certificate. You may also need to visit the resource server site, currently at `https://rs.sample.forgeops.com`, and proceed to accept another untrusted certificate - to enable XHRs perfromed by the UI. If the latter URL is not reachable, find one glowing red in the browser's network traffic after signing in the application.

    [index.html](index.html)
    ```html
    <!-- JSO: initializing the client:  https://github.com/andreassolberg/jso#how-to-use -->

    <!-- JSO: loading the library -->
    <script type="text/javascript" src="https://unpkg.com/jso/dist/jso.js"></script>
    <!-- JSO: the latest tested version:
        <script type="text/javascript" src="https://unpkg.com/jso@4.1.1/dist/jso.js"></script>
    -->

    <script>
        var JSO_CLIENT;

        /* JSO:
            configuring the JSO object for an OpenID Provider (OP) and a Relying Party (RP) and
            saving it in a global variable, accessible throughout the Single-page application
            (ForgeRock Access Management (AM) is the OP and a client registered with AM is the RP);
            initiating request to the OP
        */
        JSO_CLIENT = new jso.JSO({
            providerID: "forgerock",
            client_id: "openidm-ui-enduser-jso",
            redirect_uri: window.location.origin,
            authorization: "https://login.sample.forgeops.com/oauth2/authorize",
            scopes: {
                request: [
                    "openid",
                    "profile",
                    "profile_update",
                    "consent_read",
                    "workflow_tasks",
                    "notifications"
                ]
            },
            debug: true
        });

        try {
            /* JSO:
                processing response from the OP and,
                if the authentication and the authorization were successful,
                saving the token response in the browser's localStorage
            */
            JSO_CLIENT.callback();
        } catch (e) {
            /* JSO:
                handling error returned from the callback function and, optionally, redirecting to an appropriate screen,
                for example: if the resource owner denies access to its resources, the error may look like:
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
        }
    </script>
    <!-- JSO: initializing the client: end -->
    ```

    Note that the OAuth 2.0 related code modifications are supplied with leading and (when necessary) trailing `"JSO: "` comments.

    If not currently signed in, the user is presented with the "SIGN IN" screen. Any valid AM user credentials will help to overcome the challenge, for example, _`user.0/password`_. After signing in, the list of requested scopes is displayed on the authorization page. Denying or allowing access to those will send the user back to the home page, according to the `redirect_uri` parameter. If authorization was denied or not successful an [error response](https://tools.ietf.org/html/rfc6749#section-4.2.2.1) will be produced. The error information, provided in the redirection URI, will be used by the JSO library to produce a JavaScript error. This provides an option to catch and process the error's content. In case of successful authentication and authorization the token information will be stored locally, making it available for future use.

    At this point, the access token received from AM can be included in each request to the IDM REST endpoints. For example:

    [org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate.js](org/forgerock/openidm/ui/util/delegates/SiteConfigurationDelegate.js), lines #21-26

    ```javascript
    /* JSO: getting tokens received in /index.html */
    return JSO_CLIENT.getToken()
    .then(function (token) {
        /* JSO: adding the authorization header with the access token to requests made to the resource server */
        ServiceInvoker.configuration.defaultHeaders["Authorization"] = "Bearer " + token.access_token;
        /* JSO: end */
    ```

    Visiting the "LOG OUT" link attempts to sign the user out of AM, destroys locally stored token information, and redirects to the home page:

    [logout/index.html](logout/index.html)

    ```html
    <!-- JSO: loading the library: https://github.com/andreassolberg/jso#how-to-use -->
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
                authorization: "https://login.sample.forgeops.com/oauth2/authorize",
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

                end_session_endpoint = 'https://login.sample.forgeops.com/oauth2/connect/endSession'
                + '?post_logout_redirect_uri=' + end_session_endpoint
                + '&id_token_hint=' + jso_token.id_token;
            }

            /* JSO: redirecting to the signing out URL */
            window.location.replace(end_session_endpoint);
        }());
    </script>
    <!-- JSO: signing out: end -->
    ```

    A similar implementation can be included in your own SPA by reusing sections of the code marked with the example-specific comments.

## License

(The MIT License)
