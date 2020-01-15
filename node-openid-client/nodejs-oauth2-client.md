# <a id="top"></a> Secure Implementation of OAuth 2.0 Clients in Node.js

An important security consideration in building a server-side [OAuth 2.0](https://oauth.net/2/) client is leakage of access tokens at the [resource server](https://tools.ietf.org/html/rfc6749#section-1.1). In this writing, we will discuss a mitigation technique related to this threat based on the use of resource-specific [access tokens](https://tools.ietf.org/html/rfc6749#section-1.4), and introduce a JavaScript library for implementing this approach in the [Node.js](https://nodejs.org) environment. Basic knowledge of the OAuth 2.0 framework will be helpful to and is expected of the reader.

## <a id="contents"></a> Contents

[Back to top](#top)

* [Server-side OAuth 2.0 Client](#server-side-oauth2-client)
* [Compromised Resource Server](#compromised-resource-server)
* [Mitigation Techniques](#mitigation-techniques)
* [Implementing Resource-Specific Access Tokens](#implementing-resource-specificity)
* [Relying on Refresh Tokens](#refresh-tokens)
* [Conclusion](#conclusion)

## <a id="server-side-oauth2-client"></a> Server-side OAuth 2.0 Client

[Back to Contents](#contents)

A server-side web application acting as an OAuth 2.0 [client](https://tools.ietf.org/html/rfc6749#section-1.1) is different from such a client in a single-page or a native application in two important ways:

* The client can run entirely in a secure server environment and have its secrets inaccessible to the end user.

  This qualifies it for a [confidential](https://tools.ietf.org/html/rfc6749#section-2.1) OAuth 2.0 client, which can authenticate to the [authorization server](https://tools.ietf.org/html/rfc6749#section-1.1) with safely kept credentials, and therefore, cannot be easily impersonated at the [token endpoint](https://tools.ietf.org/html/rfc6749#section-3).

  It also means that the tokens received by the client from the [authorization server](https://tools.ietf.org/html/rfc6749#section-1.1) can be requested _and used_ over a secure back channel and never be exposed to the front end. It is possible that only results of the calls made to protected APIs will be shared with the user interface.

  Hence, besides the client itself and the server it runs on, an access token issued by the authorization server is exposed to only one other party where it can potentially leak—the protected API it was sent to, the [resource server](https://tools.ietf.org/html/rfc6749#section-1.1) in OAuth 2.0 terms.

* The user data can be processed in the absence of the end user.

  In the most common application of OAuth 2.0 the [resource owner](https://tools.ietf.org/html/rfc6749#section-1.1) is the end user. A browser-based application cannot function when the user is offline. While a native application might be able to perform some activities when the user is not around, it is likely to be limited in what it can do and for how long, especially in the mobile environment. A server-side web application, like one that can be built with Node.js, may stay active regardless of the user's presence, and may need access to their resources to react to changes in the data, or to use it in long-running data processing tasks, as an example.

OAuth 2.0 adopted the idea of an unbounded bearer access token, which meant that a client application does not have to authenticate to the resource server, and no cryptography is required on the client side. This allowed for relatively simple OAuth 2.0 client implementations, but the down side has been that a lost or stolen access token grants the same access to a malicious party as it would do to a legitimate client.

As a result, in all parts of an OAuth 2.0 implementation, care should be taken to prevent leakage of access tokens into the hands of an unauthorized party.

## <a id="compromised-resource-server"></a> Compromised Resource Server

[Back to Contents](#contents)

In the server-side OAuth 2.0 client model described here, the authorization server, the client, and the resource servers communicate mostly over a secure back channel, and the access tokens may only leak during the transport or in the server environment itself.

> The only recommended _interactive_ OAuth 2.0 flow, performed in the front channel on behalf of a specific user, is the [authorization code grant](https://tools.ietf.org/html/rfc6749#section-1.3.1), in which the client software receives a code to be exchanged for an access token, and optionally, for a refresh token at the authorization server token endpoint. Because the code exchange is done via the secure back channel, a server-side confidential client is not susceptible to the attacks resulting in access token loss at the token endpoint—due to the client's ability to authenticate to the authorization server.

The standard remedies for protecting server environment from breaches apply here, and they are not OAuth 2.0 specific. There are, however, OAuth 2.0-specific measures to limit the extent of damage resulting from leakage of an access token due to a compromised or otherwise malicious resource server.

The resource server considerations come from the fact that the access tokens it receives may be valid for accessing other APIs in deployments with multiple resource servers. Then, a malicious party in control of one of the resource servers may be able to replay the token on another.

> Note that an authorization server acting as an [OpenID provider](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) may expose the resource owner profile information over the [UserInfo Endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo) and in this way, introduce an additional instance of a resource server.

The extent of the authorization associated with an access token is defined in its scope, which is normally expressed via a set of space-delimited string values. These values are interpreted by the resource server, and may be presented in an understandable way to the resource owner—for authorization. In the most common OAuth 2.0 use, the resource owner is a user, and the client is an application developed by a _third party_, the entity which does not initially have access to the user's data. An action is typically required from the user to give their consent for authorizing the third-party client with the scopes it needs. Authorizing all the scopes that the client currently needs in a single request will likely constitute for a better user experience, because trips to authorization server and back in the front channel may interrupt the user's activities and should probably be minimized.

> A _first-party_ application, managed by the same business entity as the one that controls the authorization system and maintains access to the user data, may not need to ask its users for explicit authorization consent; such an application may rely solely on the user's authentication. However, one can argue that OAuth 2.0 mostly aims to help with the business expansion by allowing third-party clients to access the first-party APIs.

Thus, initial authorization by the resource owner may result in a super-charged access token, which can be replayed at different resource servers.

## <a id="mitigation-techniques"></a> Mitigation Techniques

[Back to Contents](#contents)

The [OAuth 2.0 Security Best Current Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13) (BCP) suggests three techniques to limit the damage that may result from access tokens leaked at a resource server:

* [Metadata](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-4.8.1.1) about legitimate resource servers.

  Providing information about safe-to-visit resource servers implies that the client limits its activities to the servers in a white list.

  PROS

  * Is simple to implement.

  CONS

  * Relies exclusively on the client implementation; cannot not be enforced otherwise.
  * Does not help with the case of a legitimate resource server being compromised.
  * Is not described in the accepted OAuth 2.0 standards.

* [Sender-Constrained Access Tokens](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-4.8.1.2).

  PROS

  * The recommended by OAuth 2.0 Security BCP implementations of sender-constrained tokens are based on the existing TLS technology.
  * May be able to prevent replay of stolen access tokens on the compromised resource server itself.

  CONS

  * Moves away from the idea of unbounded bearer access token and brings additional complexity back to the client.
  * Cannot be implemented with the accepted OAuth 2.0 standards.

* [Audience Restricted Access Tokens](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-4.8.1.3).

  PROS

  * Relatively easy to adopt by OAuth 2.0 clients; does not require cryptography on the client side.
  * Can be implemented with a standard OAuth 2.0 parameter, the [scope](https://tools.ietf.org/html/rfc6749#section-3.3)—by utilizing resource-specific scope values.
  * Allows a client to use access tokens of different format, content, and life span when accessing multiple resources.
  * Can be independently implemented in an OAuth 2.0 client, and supported by the resource server and the authorization server.

  CONS

  * Does not prevent access token replay by a different sender on the corresponding resource server.

One may conclude that the metadata approach is not robust enough to render serious security benefits.

The sender-constrained access tokens can provide the best security, but may require the most effort in the client implementation. The techniques recommended by the BCP, [OAuth 2.0 Mutual TLS](https://tools.ietf.org/html/draft-ietf-oauth-mtls-17) and [OAuth 2.0 Token Binding](https://tools.ietf.org/html/draft-ietf-oauth-token-binding-08), need to be supported by authorization and resource servers and are still in the draft stage. This probably means they are likely to be deployed as needed and not adopted universally for some time.

On the other hand, making use of resource-specific access tokens gives both security and functional advantages. In its simplest form, audience restriction does not need to be accommodated by the authorization server or the resource server; the client may "simply" maintain separate access tokens associated with resource-specific scopes that do not overlap. One step further, the resource server can support audience restriction by accepting only access tokens with a unique and specific to this resource server scope. Further yet, authorization server can issue access tokens specific to a respective resource. The client may indicate what resource it needs the access token for via a unique and specific to the resource scope, or with the help of the proposed [resource indicators](https://tools.ietf.org/html/draft-ietf-oauth-resource-indicators), if they are supported by the authorization server.

Limiting the audience and the scope of an access token to a single resource server has been recommended from the start by the [OAuth 2.0 Bearer Token Usage](https://tools.ietf.org/html/rfc6750#section-5.2) RFC, and the recommendation was inherited by the [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html#AccessTokenRedirect) specification. Expressing a resource with a scope value allows resource-specific access tokens to operate in the environment already described by the accepted OAuth standards.

> Outside of specifications developed by the OAuth working group of the Internet Engineering Task Force (IETF), techniques like [Google Macaroons](https://research.google/pubs/pub41892/) may be employed to communicate restrictions applied to an access token.

The resource specificity, therefore, seems to be the most generic solution that can be commonly applied among OAuth 2.0 clients to mitigate damage from access tokens leakage at a malicious or a compromised resource server. In addition, maintaining separate access tokens for multiple resources allows a client to adopt various token requirements for different resource servers. The technique may also provide privacy benefits, for the information associated with an access token will not be shared between resources.

## <a id="implementing-resource-specificity"></a> Implementing Resource-Specific Access Tokens

[Back to Contents](#contents)

Maintaining resource specificity for the purposes of audience restriction, utilizing diverse access tokens, and preserving privacy does not necessarily require any cryptography in the client. It does, however, add complexity to its implementation because of the need to track, renew, and apply different access tokens to multiple resources.

> OAuth 2.0 token binding features separate access tokens for multiple resource servers as well.

To help with adopting resource-specific access tokens in a Node.js application, ForgeRock published an open source library, the [openid-client-helper](https://www.npmjs.com/package/openid-client-helper) NPM package. The library has an easy to use interface for building an OAuth 2.0 client extended to an OIDC [relying party](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) that will be able to:

* Perform common tasks associated with the authorization code grant.
* Automatically obtain and refresh resource-specific access tokens for registered resource servers.
* Automatically include the appropriate access tokens in requests made to protected resources.

The [openid-client-helper example](https://github.com/ForgeRock/exampleOAuth2Clients/tree/master/node-openid-client) demonstrates how to use this library in a Node.js application, with the [ForgeRock Cloud Platform](https://github.com/ForgeRock/forgeops) furnishing authorization and resource server components.

> While the openid-client-helper library has methods and middleware for authorizing and deauthorizing the client, its unique feature is ability to maintain and apply access tokens minted for a specific resource. The actual authorization may be performed with an external tool. For example, a [Passport.js](https://github.com/jaredhanson/passport) strategy may be employed for obtaining initial authorization data, as demonstrated in [another ForgeRock Node.js OAuth 2.0 client example](https://github.com/ForgeRock/exampleOAuth2Clients/tree/master/node-passport-openidconnect).

## <a id="refresh-tokens"></a> Relying on Refresh Tokens

[Back to Contents](#contents)

The openid-client-helper library uses a [refresh token](https://tools.ietf.org/html/rfc6749#section-1.5) for getting resource-specific access tokens after the initial authorization by the resource owner.

This is possible because the refresh token is associated with all the scope values (and optionally, all [resource indicators](https://tools.ietf.org/html/draft-ietf-oauth-resource-indicators-08#section-2)) that had been authorized. Then, this token can be exchanged for an access token associated with a selected subset of the authorized parameters. In addition, if supported by the authorization server, the resource-specific access tokens can be of different format, content, and expiration.

There may already be reasons for an OAuth 2.0 client to employ refresh tokens, in which case, relying on their presence is not an additional requirement:

* An OAuth 2.0 client can use a refresh token to reauthorize itself, even when the resource owner is not actively using the application. This allows the client to offer functionality based on the user's data in an ongoing basis, which many server-side client applications are designed to accomplish.

* Short-lived access tokens are considered by the OAuth 2.0 Security BCP as a [security advantage provided by refresh tokens](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-12#section-4.12). Reauthorization with a refresh token can be performed frequently via the back channel without breaking the user experience or relying on the saved user's consent.

  > The security benefits of short-lived access tokens may be limited, because loss of a "short-lived" access token in the context of an automated attack may still present a substantial danger. Nevertheless, a short life span is a desirable characteristic of an access token in many situations, since it provides an equivalent to a prompt revocation. This is particularly valuable if the authorization server issues stateless access tokens, which cannot normally be revoked at all.

Requesting access tokens for each resource server individually could be, therefore, an additional application of refresh tokens.

## <a id="conclusion"></a> Conclusion

[Back to Contents](#contents)

In OAuth 2.0 deployments with multiple resource servers, use of resource-specific access tokens provides security and functional benefits.

ForgeRock supplies a library for building an OAuth 2.0 client in the Node.js environment, the [openid-client-helper](https://www.npmjs.com/package/openid-client-helper) NPM package, which can automatically obtain, renew, and apply resource-specific access tokens. In deployments with multiple resource servers, this allows for improved security via the audience restricted access tokens, as described in the OAuth 2.0 Security BCP.

An example of putting this library in use can be found at [openid-client-helper example](https://github.com/ForgeRock/exampleOAuth2Clients/tree/master/node-openid-client).
