# Example OAuth2 Authorization Code Flow with Vert.x

This example is built using the OAuth2 client capabilities shipped as part of the Vert.x "Web" package, specifically the [OAuth2AuthHandler](https://vertx.io/docs/vertx-web/groovy/#_oauth2authhandler_handler). If you are using Vert.x to build your OAuth2 client application, this small example should help you get started quickly.

## Quick Start Sample Code

Copy and paste from these samples to get started building your own Vert.x OAuth 2 client.

### Configuring the Auth Provider

This is the core configuration that you will need to specify to match your use:

```groovy
def authProvider = OAuth2Auth.create(vertx, OAuth2FlowType.AUTH_CODE, [
    site:"https://default.iam.example.com/am",
    clientID: "vertxClient", // replace with your client id
    clientSecret: "vertxClientSecret", // replace with your client secret
    tokenPath:"/oauth2/access_token",
    authorizationPath:"/oauth2/authorize",
    introspectionPath:"/oauth2/introspect",
    useBasicAuthorizationHeader: false
])

router.route().handler(UserSessionHandler.create(authProvider))

def oauth2Handler = OAuth2AuthHandler.create(authProvider, "http://localhost:8888")
oauth2Handler.setupCallback(router.get("/callback"))

// scopes we want to request during login
oauth2Handler.addAuthority("fr:idm:profile")
oauth2Handler.addAuthority("openid")
```

This is an example which demonstrates how you would declare a protected area within your application. You can use the tokens you have gotten back from the OAuth 2.0 Authorization Server (AS) to identify the user and also make requests on their behalf to resource server endpoints:

```groovy
router.route("/protected")
    .handler(oauth2Handler)
    .handler({ routingContext ->
        // At this point we are logged in using the AM provider.
        // The access and id tokens are saved in the session.
        def user = routingContext.user()

        // If we want to use the details from the id_token to make local authorization
        // decisions, we can get them with user.idToken()
        user.setTrustJWT(true)
        def id_token = user.idToken()

        // Putting the prettily-encoded token into the context so it can be
        // shown in the template, for demo purposes
        routingContext.put("idTokenDetails", (new JsonObject(id_token)).encodePrettily())

        // We can use the access_token associated with the user to make
        // requests to any resource server endpoint which is expecting
        // tokens from AM. For example, these IDM endpoints:
        user.fetch("`https://default.iam.example.com`/openidm/info/login", { infoResponse ->
            if (infoResponse.failed()) {
                routingContext.response().end("Unable to read info login")
            } else {
                def infoDetails = infoResponse.result().jsonObject()
                def userPath = "${infoDetails.authorization.component}/${infoDetails.authorization.id}"
                user.fetch("https://default.iam.example.com/openidm/${userPath}", { userResponse ->
                    if (userResponse.failed()) {
                        routingContext.response().end("Unable to read user details")
                    } else {
                        routingContext.put("user", userResponse.result().jsonObject())
                        routingContext.next()
                    }
                })
            }
        })
    })
```

The [app.groovy](src/app.groovy) code has the full context of these two snippets. The intent is to merely provide a working example that you can refer to when building your own Vert.x application.

## Running the Sample

### Prerequisites

1. Install and run the [ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops).

2. Register *vertxClient* application with AM as a new OAuth2 Client:

```bash
curl -k 'https://default.iam.example.com/am/json/realms/root/realm-config/agents/OAuth2Client/vertxClient' \
-X PUT \
--data '{
    "userpassword": "vertxClientSecret",
    "redirectionUris": ["http://localhost:8888/callback"],
    "scopes": ["openid","fr:idm:profile"],
    "tokenEndpointAuthMethod": "client_secret_post"
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
The response is a JSON resource indicating successful registration.
The following extract shows some key fields:
```json
{"_id":"vertxClient", "_type":{"_id":"OAuth2Client","name":"OAuth2 Clients","collection":true}}
```

Alternatively you can add *vertxClient* manually, using the platform UI.
Browse to the [AM Console](https://default.iam.example.com/am/console) and use these hints:

* Sign in with *amadmin/password*
* Navigate to *Top Level Realm* > *Applications* > *OAuth 2.0*
* Add new client:
    * "Client ID": "vertxClient"
    * "Client Secret": "vertxClientSecret"
    * "Redirection URIs": ["http://localhost:8888/callback"]
    * "Scope(s)": ["openid", "profile"]
* Click Save, then go to "Advanced"
    * "Token Endpoint Authentication Method": "client_secret_post"


### Serve the application for this sample

The easiest way to execute this sample is by using Docker. This will automate the download and setup of your Vert.x execution environment.

```bash
docker build -t basicvertxclient:latest .
docker run -d -p 8888:8888 -p 5005:5005 basicvertxclient:latest
```

On Linux, you need to provide a separate flag (*--network host*) to get local host name resolution to work properly:

```bash
docker run -d --network host basicvertxclient:latest
```

Now you can access the application at <http://localhost:8888>.
