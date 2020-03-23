import io.vertx.core.json.JsonObject

import io.vertx.ext.web.Router
import io.vertx.ext.web.templ.HandlebarsTemplateEngine

import io.vertx.ext.web.handler.CookieHandler
import io.vertx.ext.web.handler.SessionHandler
import io.vertx.ext.web.handler.UserSessionHandler
import io.vertx.ext.web.handler.OAuth2AuthHandler
import io.vertx.ext.web.handler.TemplateHandler
import io.vertx.ext.web.sstore.LocalSessionStore

import io.vertx.ext.auth.oauth2.OAuth2Auth
import io.vertx.ext.auth.oauth2.OAuth2ClientOptions
import io.vertx.ext.auth.oauth2.OAuth2FlowType

def router  = Router.router(vertx)

router.route().handler(CookieHandler.create())
def store = LocalSessionStore.create(vertx)
def sessionHandler = SessionHandler.create(store)
router.route().handler(sessionHandler)

OAuth2ClientOptions opts = new OAuth2ClientOptions([
    site:"https://default.iam.example.com/am",
    clientID: "vertxClient", // replace with your client id
    clientSecret: "vertxClientSecret", // replace with your client secret
    tokenPath:"/oauth2/access_token",
    authorizationPath:"/oauth2/authorize",
    introspectionPath:"/oauth2/introspect",
    useBasicAuthorizationHeader: false
])
// necessary to work with self-signed certificate in development; should not be used in production
opts.setTrustAll(true)

def authProvider = OAuth2Auth.create(vertx, OAuth2FlowType.AUTH_CODE, opts)

router.route().handler(UserSessionHandler.create(authProvider))

def oauth2Handler = OAuth2AuthHandler.create(authProvider, "http://localhost:8888")
oauth2Handler.setupCallback(router.get("/callback"))

// scopes we want to request during login
oauth2Handler.addAuthority("profile")
oauth2Handler.addAuthority("openid")

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
        user.fetch("https://default.iam.example.com/openidm/info/login", { infoResponse ->
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

def engine = HandlebarsTemplateEngine.create()
def templateHandler = TemplateHandler.create(engine)
router.get("/*").handler(templateHandler)

def server  = vertx.createHttpServer()
server.requestHandler( router .&'accept').listen(8888)
