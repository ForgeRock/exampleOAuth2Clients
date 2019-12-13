<a name="module_forgerock/routes"></a>

## forgerock/routes
Express router for ForgeRock OAuth 2.0 client.

**Requires**: <code>module:express</code>  

* [forgerock/routes](#module_forgerock/routes)
    * [~forgerockRouter](#module_forgerock/routes..forgerockRouter) : <code>object</code>
        * [~get/authorize()](#module_forgerock/routes..forgerockRouter..get/authorize)
        * [~get/redirect()](#module_forgerock/routes..forgerockRouter..get/redirect)
        * [~get/deauthorize()](#module_forgerock/routes..forgerockRouter..get/deauthorize)
        * [~get/protected()](#module_forgerock/routes..forgerockRouter..get/protected)
        * [~get/protected/userinfo()](#module_forgerock/routes..forgerockRouter..get/protected/userinfo)
        * [~get/protected/login()](#module_forgerock/routes..forgerockRouter..get/protected/login)
        * [~get/protected/sub-authorized-instance()](#module_forgerock/routes..forgerockRouter..get/protected/sub-authorized-instance)
    * [~OpenIdClientHelper](#module_forgerock/routes..OpenIdClientHelper) : <code>function</code>
    * [~openIdClientHelperParams](#module_forgerock/routes..openIdClientHelperParams) : <code>object</code>
        * [.issuerMetadata](#module_forgerock/routes..openIdClientHelperParams.issuerMetadata) : <code>object</code>
        * [.clientMetadata](#module_forgerock/routes..openIdClientHelperParams.clientMetadata) : <code>object</code>
        * [.resources](#module_forgerock/routes..openIdClientHelperParams.resources) : <code>object</code>
        * [.customize()](#module_forgerock/routes..openIdClientHelperParams.customize) : <code>function</code>
    * [~subAuthorizedInstance](#module_forgerock/routes..subAuthorizedInstance) : <code>object</code>
    * [~completeDeauthorization(param0)](#module_forgerock/routes..completeDeauthorization)
    * [~introspectTokenSet(param0)](#module_forgerock/routes..introspectTokenSet) ⇒ <code>object</code>

<a name="module_forgerock/routes..forgerockRouter"></a>

### forgerock/routes~forgerockRouter : <code>object</code>
Express.js router.

**Kind**: inner namespace of [<code>forgerock/routes</code>](#module_forgerock/routes)  

* [~forgerockRouter](#module_forgerock/routes..forgerockRouter) : <code>object</code>
    * [~get/authorize()](#module_forgerock/routes..forgerockRouter..get/authorize)
    * [~get/redirect()](#module_forgerock/routes..forgerockRouter..get/redirect)
    * [~get/deauthorize()](#module_forgerock/routes..forgerockRouter..get/deauthorize)
    * [~get/protected()](#module_forgerock/routes..forgerockRouter..get/protected)
    * [~get/protected/userinfo()](#module_forgerock/routes..forgerockRouter..get/protected/userinfo)
    * [~get/protected/login()](#module_forgerock/routes..forgerockRouter..get/protected/login)
    * [~get/protected/sub-authorized-instance()](#module_forgerock/routes..forgerockRouter..get/protected/sub-authorized-instance)

<a name="module_forgerock/routes..forgerockRouter..get/authorize"></a>

#### forgerockRouter~get/authorize()
Starts the authorization code flow by calling
the `openid-client-helper` instance `authorize` middleware.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..forgerockRouter..get/redirect"></a>

#### forgerockRouter~get/redirect()
Handles redirection from the authorization endpoint by calling
the `openid-client-helper` instance `redirect` middleware.
Processes the redirection parameters, retrieves the token information,
and populates the authorization state.
Then, redirects to a protected route, which requires the client to be authorized.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..forgerockRouter..get/deauthorize"></a>

#### forgerockRouter~get/deauthorize()
Deauthorizes the client by calling
the `openid-client-helper` instance `deauthorize` middleware.
Provides optional custom `complete` handler to be executed after the client is deauthorized.

By default, if no `complete` function is passed in as an argument,
the `deauthorize` middleware attempts to perform [RP initiated logout](https://openid.net/specs/openid-connect-session-1_0-17.html#RPLogout)
by visiting the `end_session_endpoint` URI, if one is found in the issuer metadata.
Call `deauthorize` with no arguments to experience this default behavior.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
**Example** *(Use deauthorize with no custom completion handler)*  
```js
router.get('/deauthorize', unauthorized({
   redirectTo: '/forgerock/authorize'
}), deauthorize())
```
<a name="module_forgerock/routes..forgerockRouter..get/protected"></a>

#### forgerockRouter~get/protected()
This route handler displays the results of the initial resource-owner-approved authorization:
the ID token claims,
the "master" token set with the refresh token, and
the scopes available to the client.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..forgerockRouter..get/protected/userinfo"></a>

#### forgerockRouter~get/protected/userinfo()
This route handler uses the `openid-client-helper` `fetch` method for
making a call to a protected REST API, in this case the AM's userinfo endpoint, and
displays the results of the fetch request.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..forgerockRouter..get/protected/login"></a>

#### forgerockRouter~get/protected/login()
This route handler uses `openid-client-helper` `fetchMiddleware` for
making a call to a protected REST API, in this case the IDM login info endpoint, and
displays the results of the fetch request.

NOTE, while calling `fetchMiddleware` directly, as a middleware, is an option,
using the `openid-client-helper` `fetch` method and handling its results
in the route handler body may prove more practical in majority of the situations.
This route handler is mostly provided for the sake of complete coverage of the
public interface exposed by an `openid-client-handler` instance.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..forgerockRouter..get/protected/sub-authorized-instance"></a>

#### forgerockRouter~get/protected/sub-authorized-instance()
This route handler uses existing authorization data and
assigns it to the second instance of `openid-client-helper`.
Then, the route handler uses the instance's `fetch` method for making a call to a protected REST API,
in this case the IDM login info endpoint, and displays the results of the fetch request.

This may apply if `openid-client-helper` is not used for performing the authorization flow,
only for fetching data from protected resources.

**Kind**: inner method of [<code>forgerockRouter</code>](#module_forgerock/routes..forgerockRouter)  
<a name="module_forgerock/routes..OpenIdClientHelper"></a>

### forgerock/routes~OpenIdClientHelper : <code>function</code>
`openid-client-helper` constructor.

**Kind**: inner constant of [<code>forgerock/routes</code>](#module_forgerock/routes)  
<a name="module_forgerock/routes..openIdClientHelperParams"></a>

### forgerock/routes~openIdClientHelperParams : <code>object</code>
`openid-client-helper` instance configuration.
In this object we collect configuration options for instantiating `issuer` and `client`,
as described in [openid-client docs](https://github.com/panva/node-openid-client/tree/master/docs)
In addition, we add `resources` parameter, which includes information about
protected APIs, that will be authorized individually by the instance.

This configuration object will define the default behavior of the instance.
In some cases, the defaults defined in the configuration object
can be changed or amended by providing additional arguments when
calling the instance's methods and middleware.

**Kind**: inner constant of [<code>forgerock/routes</code>](#module_forgerock/routes)  

* [~openIdClientHelperParams](#module_forgerock/routes..openIdClientHelperParams) : <code>object</code>
    * [.issuerMetadata](#module_forgerock/routes..openIdClientHelperParams.issuerMetadata) : <code>object</code>
    * [.clientMetadata](#module_forgerock/routes..openIdClientHelperParams.clientMetadata) : <code>object</code>
    * [.resources](#module_forgerock/routes..openIdClientHelperParams.resources) : <code>object</code>
    * [.customize()](#module_forgerock/routes..openIdClientHelperParams.customize) : <code>function</code>

<a name="module_forgerock/routes..openIdClientHelperParams.issuerMetadata"></a>

#### openIdClientHelperParams.issuerMetadata : <code>object</code>
**Kind**: static property of [<code>openIdClientHelperParams</code>](#module_forgerock/routes..openIdClientHelperParams)  
**See**: [Configure openid-client-helper](https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure)  
**Properties**

| Name |
| --- |
| issuerMetadata | 

<a name="module_forgerock/routes..openIdClientHelperParams.clientMetadata"></a>

#### openIdClientHelperParams.clientMetadata : <code>object</code>
**Kind**: static property of [<code>openIdClientHelperParams</code>](#module_forgerock/routes..openIdClientHelperParams)  
**See**: [Configure openid-client-helper](https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure)  
**Properties**

| Name |
| --- |
| clientMetadata | 

<a name="module_forgerock/routes..openIdClientHelperParams.resources"></a>

#### openIdClientHelperParams.resources : <code>object</code>
**Kind**: static property of [<code>openIdClientHelperParams</code>](#module_forgerock/routes..openIdClientHelperParams)  
**See**: [Configure openid-client-helper](https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure)  
**Properties**

| Name |
| --- |
| resources | 

<a name="module_forgerock/routes..openIdClientHelperParams.customize"></a>

#### openIdClientHelperParams.customize() : <code>function</code>
Use this function to modify the default behavior of the underlying `openid-client` functionality
as described in the openid-client docs, the [Customizing](https://github.com/panva/node-openid-client/tree/master/docs#customizing) section.
The function will be called with references to `openid-client` objects as they become available.

**Kind**: static method of [<code>openIdClientHelperParams</code>](#module_forgerock/routes..openIdClientHelperParams)  
<a name="module_forgerock/routes..subAuthorizedInstance"></a>

### forgerock/routes~subAuthorizedInstance : <code>object</code>
Another instance of `openid-client-helper` to share the existing authorization state with.
You may carry out initial resource-owner-approved authorization with different software, like a `Passport.js` strategy, and
share the resulting refresh token with an instance of `openid-client-helper`.
Then, you'll be able to use the instance for performing API requests to authorized resources.
Because this instance of `openid-client-helper` will not by itself authorize the client,
it needs minimal set of issuer and client metadata.

**Kind**: inner constant of [<code>forgerock/routes</code>](#module_forgerock/routes)  
<a name="module_forgerock/routes..completeDeauthorization"></a>

### forgerock/routes~completeDeauthorization(param0)
Example completion handler for the `openid-client-helper` `deauthorize` middleware.
Attempts to perform [RP initiated logout](https://openid.net/specs/openid-connect-session-1_0-17.html#RPLogout) via the back-channel.
Redirects the user to a route after the logout. Because of redirection being performed by the application itself,
the route does not have to be registered for the relying party with the OpenID provider as a post logout redirect URI.
Shares deauthorization messages, if any, with the user via the `connect-flash` middleware.
The function accepts the route parameters and the `end_session_endpoint` URI.

**Kind**: inner method of [<code>forgerock/routes</code>](#module_forgerock/routes)  

| Param | Type | Description |
| --- | --- | --- |
| param0 | <code>object</code> |  |
| param0.req | <code>object</code> | The request object, available for the `deauthorize` middleware. |
| param0.res | <code>object</code> | The response object, available for the `deauthorize` middleware. |
| param0.next | <code>function</code> | The next middleware function. |
| param0.endSessionUrl | <code>string</code> | The `end_session_endpoint` URI generated by the `deauthorize` middleware. |

<a name="module_forgerock/routes..introspectTokenSet"></a>

### forgerock/routes~introspectTokenSet(param0) ⇒ <code>object</code>
Convenience function.
Allows to introspect both access and refresh tokens in a token set.
Gets an `openid-client` client instance with the `openid-client-helper` instance `getClient` method.
Then, uses [client.introspect](https://github.com/panva/node-openid-client/tree/master/docs#clientintrospecttoken-tokentypehint-extras)
to introspect individual tokens.

**Kind**: inner method of [<code>forgerock/routes</code>](#module_forgerock/routes)  
**Returns**: <code>object</code> - Introspection results with `access_token` and optional `refresh_token` as top level members.  

| Param | Type | Description |
| --- | --- | --- |
| param0 | <code>object</code> |  |
| param0.tokenSet | <code>object</code> | An object containing `access_token` and optional `refresh_token` as top level members. |

