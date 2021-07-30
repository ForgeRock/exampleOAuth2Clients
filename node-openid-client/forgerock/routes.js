/* example-start */

'use strict'

// 0. NUMBERED DOUBLE SLASH COMMENTS, LIKE THIS ONE, DIVIDE CODE IN THIS TEMPLATE INTO SECTIONS.
// THE CORE FUNCTIONALITY IS COVERED IN THE FIRST FIVE.

/**
 * Express router for ForgeRock OAuth 2.0 client.
 * @module forgerock/routes
 * @requires express
 */

// 1. IMPORT DEPENDENCIES.

/**
 * Express.js module.
 * @ignore
 */
const express = require('express')

/**
 * `openid-client-helper` constructor.
 * @const
 * @type {function}
 */
const OpenIdClientHelper = require('openid-client-helper')

/**
 * Express.js router.
 * @const
 * @type {object}
 * @namespace forgerockRouter
 */
const router = express.Router()

// 2. CONFIGURE `OPENID-CLIENT-HELPER` INSTANCE.

/**
 * `openid-client-helper` instance configuration.
 * In this object we collect configuration options for instantiating `issuer` and `client`,
 * as described in [openid-client docs]{@link https://github.com/panva/node-openid-client/tree/master/docs}
 * In addition, we add `resources` parameter, which includes information about
 * protected APIs, that will be authorized individually by the instance.
 *
 * This configuration object will define the default behavior of the instance.
 * In some cases, the defaults defined in the configuration object
 * can be changed or amended by providing additional arguments when
 * calling the instance's methods and middleware.
 *
 * @const
 * @type {object}
 */
const openIdClientHelperParams = {
  /**
   * @see [Configure openid-client-helper]{@link https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure}
   * @property issuerMetadata
   * @type {object}
   */
  issuerMetadata: {
    issuer: 'https://default.iam.example.com/am/oauth2',
    revocation_endpoint: 'https://default.iam.example.com/am/oauth2/token/revoke'
  },
  /**
   * @see [Configure openid-client-helper]{@link https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure}
   * @property clientMetadata
   * @type {object}
   */
  clientMetadata: {
    client_id: 'node-openid-client',
    client_secret: 'password',
    // token_endpoint_auth_method: 'client_secret_post', // The default is 'client_secret_basic'.
    redirect_uri: 'http://localhost:3000/forgerock/redirect',
    post_logout_redirect_uri: 'http://localhost:3000'
  },
  /**
   * @see [Configure openid-client-helper]{@link https://github.com/ForgeRock/openid-client-helper#how-to-make-it-work-configure}
   * @property resources
   * @type {object}
   */
  resources: {
    'https://default.iam.example.com/am/': {
      scope: 'profile'
    },
    'https://default.iam.example.com/openidm/': {
      scope: 'openid fr:idm:*'
    }
  },
  /** Use this function to modify the default behavior of the underlying `openid-client` functionality
   * as described in the openid-client docs, the [Customizing]{@link https://github.com/panva/node-openid-client/tree/master/docs#customizing} section.
   * The function will be called with references to `openid-client` objects as they become available.
   * @type {function}
   */
  customize: ({
    custom,
    Issuer,
    issuer,
    client
  }) => {
    if (Issuer) {
      /**
       * Do something with the `openid-client` `Issuer` class.
       */
    }
    if (issuer) {
      /**
       * Do something with the `openid-client` `issuer` instance
       * and the `issuer.Client` constructor.
       */
    }
    if (client) {
      /**
       * Do something with the `openid-client` `client` instance.
       *
       * In this case, allow for one second skew between the client and the issuer.
       * @ignore
       */
      client[custom.clock_tolerance] = 1
    }
  }
}

/**
 * Methods imported from the `openid-client-helper` instance.
 * @see [openid-client-helper]{@link https://github.com/ForgeRock/openid-client-helper/tree/master/docs}
 */
const {
  authorize,
  redirect,
  unauthorized,
  deauthorize,
  fetch,
  fetchMiddleware,
  getClient,
  getAuthorization,
  getClaims,
  getWWWAuthenticateHeaderAttributes
} = OpenIdClientHelper(openIdClientHelperParams)

// 3. IMPLEMENT THE AUTHORIZATION CODE FLOW WITH THE `OPENID-CLIENT-HELPER` MIDDLEWARE.

/**
 * Starts the authorization code flow by calling
 * the `openid-client-helper` instance `authorize` middleware.
 * @name get/authorize
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/authorize', authorize())

/**
 * Handles redirection from the authorization endpoint by calling
 * the `openid-client-helper` instance `redirect` middleware.
 * Processes the redirection parameters, retrieves the token information,
 * and populates the authorization state.
 * Then, redirects to a protected route, which requires the client to be authorized.
 * @name get/redirect
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/redirect', redirect(), (req, res) => {
  res.redirect('/forgerock/protected')
})

/**
 * Deauthorizes the client by calling
 * the `openid-client-helper` instance `deauthorize` middleware.
 * Provides optional custom `complete` handler to be executed after the client is deauthorized.
 *
 * By default, if no `complete` function is passed in as an argument,
 * the `deauthorize` middleware attempts to perform [RP initiated logout]{@link https://openid.net/specs/openid-connect-session-1_0-17.html#RPLogout}
 * by visiting the `end_session_endpoint` URI, if one is found in the issuer metadata.
 * Call `deauthorize` with no arguments to experience this default behavior.
 *
 * @example <caption>Use deauthorize with no custom completion handler</caption>
 * router.get('/deauthorize', unauthorized({
 *    redirectTo: '/forgerock/authorize'
 * }), deauthorize())
 *
 * @name get/deauthorize
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/deauthorize', unauthorized({
  redirectTo: '/forgerock/authorize'
}), deauthorize({
  complete: completeDeauthorization
}))

// 4. GET AUTHORIZATION DATA WITH THE `OPENID-CLIENT-HELPER` PUBLIC METHODS.

/**
 * This route handler displays the results of the initial resource-owner-approved authorization:
 * the ID token claims,
 * the "master" token set with the refresh token, and
 * the scopes available to the client.
 * @name get/protected
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/protected', unauthorized({
  redirectTo: '/forgerock/authorize'
}), async (req, res) => {
  /**
   * Use the public `getAuthorization` method exposed by the `openid-client-helper` instance
   * to get the current authorization state and the "master" token set,
   * which is a top level member of the authorization state.
   * The content of this the token set will be rendered in the browser.
   */
  const tokenSet = getAuthorization({
    req
  })
  .tokenSet

  /**
   * Use the public `getClaims` method exposed by the `openid-client-helper` instance
   * to get decoded ID token claims about the resource owner from the ID token in the token set.
   * The decoded claims will be rendered in the browser.
   */
  const idTokenClaims = (function () {
    try {
      return getClaims({
        tokenSet: tokenSet
      })
    } catch (e) {
      return `error: ${e.message}`
    }
  }())

  /** Introspect tokens in the tokens set with`introspectionResults`, a local  convenience method.
   * By introspecting the tokens and displaying the results, you will be able to
   * compare OAuth 2.0 scopes available to the client application with the scopes granted to individual resources.
   * This is normally a function of a resource (server) and is done here for demonstrational purposes only.
   * The introspection results will be rendered in the browser.
   */
  const introspectionResults = await introspectTokenSet({
    tokenSet
  })

  /**
   * Provide dynamic content for rendering in the browser
   * via [res.locals]{@link https://expressjs.com/en/api.html#res.locals}
   */
  res.locals = {
    title: 'Authorized by ForgeRock',
    subTitle: 'Claims',
    subContent: idTokenClaims,
    tokenSet: tokenSet,
    introspectionResults: introspectionResults
  }

  /**
   * Render the page.
   */
  res.render('forgerock-protected')
})

// 5. MAKE CALL TO A PROTECTED API WITH THE `OPENID-CLIENT-HELPER` `FETCH` METHOD.

/**
 * This route handler uses the `openid-client-helper` `fetch` method for
 * making a call to a protected REST API, in this case the AM's userinfo endpoint, and
 * displays the results of the fetch request.
 * @name get/protected/userinfo
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/protected/userinfo', unauthorized({
  redirectTo: '/forgerock/authorize'
}), async (req, res) => {
  /**
   * Make a fetch request to the protected userinfo endpoint.
   */
  const response = await fetch(
    'https://default.iam.example.com/am/oauth2/userinfo',
    undefined, // Use default options for this request.
    req // Provide request/session/user context.
  )

  if (getWWWAuthenticateHeaderAttributes(response).error === 'invalid_token') {
    /**
     * If access token cannot be refreshed automatically, by the helper instance,
     * the client may need to be reauthorized.
     */
    res.redirect('/forgerock/authorize')
  }

  /**
   * Parse the fetch results.
   */
  var fetchResults
  try {
    fetchResults = await response.json()
  } catch (e) {
    fetchResults = {
      error: e.message
    }
  }

  /**
   * Use the `openid-client-helper` instance `getAuthorization` method
   * to get the current authorization state and the resource-specific token set.
   * The content of this object will be rendered in the browser.
   */
  const tokenSet = ((getAuthorization({
    req
  })
  .resources || {})['https://default.iam.example.com/am/'] || {})
  .tokenSet

  /** Introspect tokens in the tokens set with`introspectionResults`, a local  convenience method.
   * By introspecting the tokens and displaying the results, you will be able to
   * see the scopes granted to this individual resource.
   * This is normally a function of a resource (server) and is done here for demonstrational purposes only.
   * The introspection results will be rendered in the browser.
   */
  const introspectionResults = await introspectTokenSet({
    tokenSet
  })

  /**
   * Provide dynamic content for rendering in the browser
   * via [res.locals]{@link https://expressjs.com/en/api.html#res.locals}
   */
  res.locals = {
    title: 'Userinfo Endpoint',
    subTitle: 'User Info',
    subContent: fetchResults,
    tokenSet: tokenSet,
    introspectionResults: introspectionResults
  }

  /**
   * Render the page.
   */
  res.render('forgerock-protected')
})

// 6. OPTIONAL.
// METHODS REFERENCED IN THIS SECTION ALLOW FOR EXTRA FLEXIBILITY
// BUT MAY NOT NECESSARILY REPRESENT TYPICAL USE CASES.

/**
 * This route handler uses `openid-client-helper` `fetchMiddleware` for
 * making a call to a protected REST API, in this case the IDM login info endpoint, and
 * displays the results of the fetch request.
 *
 * NOTE, while calling `fetchMiddleware` directly, as a middleware, is an option,
 * using the `openid-client-helper` `fetch` method and handling its results
 * in the route handler body may prove more practical in majority of the situations.
 * This route handler is mostly provided for the sake of complete coverage of the
 * public interface exposed by an `openid-client-handler` instance.
 *
 * @name get/protected/login
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/protected/login', unauthorized({
  redirectTo: '/forgerock/authorize'
}), fetchMiddleware(
  'https://default.iam.example.com/openidm/info/login',
  undefined, // Use default options for this request.
  /**
   * Executes after the fetch request is completed.
   * Will receive the route params and the results of the fetch request.
   *
   * Here, in case of an error the next middleware is called.
   * If the access token cannot be refreshed automatically, the client is redirected to the authorization endpoint.
   * Otherwise, the results are attached to the response object, so that they become available in the route handler.
   */
  function ({
    req,
    res,
    next,
    response,
    error
  }) {
    if (error) {
      next(error)
      return
    }

    if (getWWWAuthenticateHeaderAttributes(response).error === 'invalid_token') {
      res.redirect('/forgerock/authorize')
      return
    }

    res.locals['https://default.iam.example.com/openidm/'] = response
    next()
  }
), async (req, res) => {
  /**
   * Get the fetch response saved by the `fetchMiddleware` completion handler.
   */
  const response = res.locals['https://default.iam.example.com/openidm/']

  /**
   * Parse the fetch results.
   */
  var fetchResults
  try {
    fetchResults = await response.json()
  } catch (e) {
    fetchResults = {
      error: e.message
    }
  }

  /**
   * Use the `openid-client-helper` instance `getAuthorization` method
   * to get the current authorization state and the resource-specific token set.
   * The content of this object will be rendered in the browser.
   */
  const tokenSet = ((getAuthorization({
    req
  })
  .resources || {})['https://default.iam.example.com/openidm/'] || {})
  .tokenSet

  /** Introspect tokens in the tokens set with`introspectionResults`, a local  convenience method.
   * By introspecting the tokens and displaying the results, you will be able to
   * see the scopes granted to this individual resource.
   * This is normally a function of a resource (server) and is done here for demonstrational purposes only.
   * The introspection results will be rendered in the browser.
   */
  const introspectionResults = await introspectTokenSet({
    tokenSet
  })

  /**
   * Provide dynamic content for rendering in the browser
   * via [res.locals]{@link https://expressjs.com/en/api.html#res.locals}
   */
  res.locals = {
    title: 'Info Login Endpoint',
    subTitle: 'Info Login',
    subContent: fetchResults,
    tokenSet: tokenSet,
    introspectionResults: introspectionResults
  }

  /**
   * Render the page.
   */
  res.render('forgerock-protected')
})

/**
 * Another instance of `openid-client-helper` to share the existing authorization state with.
 * You may carry out initial resource-owner-approved authorization with different software, like a `Passport.js` strategy, and
 * share the resulting refresh token with an instance of `openid-client-helper`.
 * Then, you'll be able to use the instance for performing API requests to authorized resources.
 * Because this instance of `openid-client-helper` will not by itself authorize the client,
 * it needs minimal set of issuer and client metadata.
 * @const
 * @type {object}
 */
const subAuthorizedInstance = OpenIdClientHelper({
  issuerMetadata: {
    issuer: openIdClientHelperParams.issuerMetadata.issuer
  },
  clientMetadata: {
    client_id: openIdClientHelperParams.clientMetadata.client_id,
    client_secret: openIdClientHelperParams.clientMetadata.client_secret
  },
  resources: {
    'https://default.iam.example.com/openidm/': {
      scope: 'openid fr:idm:*'
    }
  }
})

/**
 * This route handler uses existing authorization data and
 * assigns it to the second instance of `openid-client-helper`.
 * Then, the route handler uses the instance's `fetch` method for making a call to a protected REST API,
 * in this case the IDM login info endpoint, and displays the results of the fetch request.
 *
 * This may apply if `openid-client-helper` is not used for performing the authorization flow,
 * only for fetching data from protected resources.
 *
 * @name get/protected/sub-authorized-instance
 * @function
 * @memberof module:forgerock/routes~forgerockRouter
 * @inner
 */
router.get('/protected/sub-authorized-instance', unauthorized({
  redirectTo: '/forgerock/authorize'
}), async (req, res) => {
  /**
   * Reference to the authorization state in the additional `openid-client-helper` instance.
   * This authorization state is currently empty.
   */
  const authorization = subAuthorizedInstance.getAuthorization({
    req
  })

  /**
   * Get the "master" token set, that contains an active refresh token,
   * in this case—from the authorized instance of `openid-client-helper`.
   *
   * Assigning by reference will result in sharing the "master" token set between the helper instances.
   * This will help to keep the refresh token valid in both instances
   * when the authorization server reissues refresh token; for example,
   * due to [refresh token rotation]{@link https://tools.ietf.org/html/rfc6749#section-10.4}.
   */
  authorization.tokenSet = getAuthorization({
    req
  }).tokenSet

  /**
   * Make a fetch request to the protected login info endpoint.
   */
  const response = await subAuthorizedInstance.fetch(
    'https://default.iam.example.com/openidm/info/login',
    undefined, // Use default options for this request.
    req // Provide request/session/user context.
  )

  if (subAuthorizedInstance.getWWWAuthenticateHeaderAttributes(response).error === 'invalid_token') {
    /**
     * If access token cannot be refreshed automatically, by the helper instance,
     * the client may need to be reauthorized.
     */
    res.redirect('/forgerock/authorize')
  }

  /**
   * Parse the fetch results.
   */
  var fetchResults
  try {
    fetchResults = await response.json()
  } catch (e) {
    fetchResults = {
      error: e.message
    }
  }

  /**
   * Use the `openid-client-helper` instance `getAuthorization` method
   * to get the current authorization state and the resource-specific token set.
   * The content of this object will be rendered in the browser.
   */
  const tokenSet = ((subAuthorizedInstance.getAuthorization({
    req
  })
  .resources || {})['https://default.iam.example.com/openidm/'] || {})
  .tokenSet

  /** Introspect tokens in the tokens set with`introspectionResults`, a local  convenience method.
   * By introspecting the tokens and displaying the results, you will be able to
   * see the scopes granted to this individual resource.
   * This is normally a function of a resource (server) and is done here for demonstrational purposes only.
   * The introspection results will be rendered in the browser.
   */
  const introspectionResults = await introspectTokenSet({
    tokenSet
  })

  /**
   * Provide dynamic content for rendering in the browser
   * via [res.locals]{@link https://expressjs.com/en/api.html#res.locals}
   */
  res.locals = {
    title: 'Info Login by Sub-authorized Instance',
    subTitle: 'Info Login by Sub-authorized Instance',
    subContent: fetchResults,
    tokenSet: tokenSet,
    introspectionResults: introspectionResults
  }

  /**
   * Render the page.
   */
  res.render('forgerock-protected')
})

/**
 * Example completion handler for the `openid-client-helper` `deauthorize` middleware.
 * Attempts to perform [RP initiated logout]{@link https://openid.net/specs/openid-connect-session-1_0-17.html#RPLogout} via the back-channel.
 * Redirects the user to a route after the logout. Because of redirection being performed by the application itself,
 * the route does not have to be registered for the relying party with the OpenID provider as a post logout redirect URI.
 * Shares deauthorization messages, if any, with the user via the `connect-flash` middleware.
 * The function accepts the route parameters and the `end_session_endpoint` URI.
 * @param {object} param0
 * @param {object} param0.req The request object, available for the `deauthorize` middleware.
 * @param {object} param0.res The response object, available for the `deauthorize` middleware.
 * @param {function} param0.next The next middleware function.
 * @param {string} param0.endSessionUrl The `end_session_endpoint` URI generated by the `deauthorize` middleware.
 */
function completeDeauthorization ({
  req,
  res,
  next,
  endSessionUrl
}) {
  function complete () {
    req.flash('openid-client-helper-info', flashMessages)
    res.redirect('/')
  }

  const protocol = endSessionUrl.split(':')[0]
  const flashMessages = []
  const authorization = getAuthorization({
    req
  })

  /**
   * If still authorized, inform the user.
   */
  if (authorization.tokenSet) {
    flashMessages.unshift('Authorized')

    return complete()
  }

  /**
   * Check for any messages and errors created during deauthorization.
   */
  if (authorization.deauthorized) {
    const messages = authorization.deauthorized.messages || {}
    const errors = authorization.deauthorized.errors || {}

    Object.keys(messages).forEach((key) => {
      flashMessages.push(`${key}: ${messages[key].message}`)
    })
    Object.keys(errors).forEach((key) => {
      flashMessages.push(`${key}: ${errors[key].message}`)
    })
  }

  /**
   * Perform RP-initiated logout via the back-channel.
   */
  if (['http', 'https'].indexOf(protocol) !== -1) {
    new Promise((resolve, reject) => {
      require(protocol).get(endSessionUrl, (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          if (data.length) {
            /**
             * If the authorization server attempts to display any content,
             * this information needs to be conveyed to the user.
             * The remote content can be displayed via the `flash` messages:
             * @example <caption>Adding a message to flash on the rendered page.</caption>
             * messages[endSessionUrl] = { message: data }
             *
             * Alternatively, the end user can be taken to and have a chance to
             * interact with the `end_session_endpoint`, as demonstrated here.
             */
            res.redirect(endSessionUrl)
          }

          resolve()
        })
      }).on('error', (e) => {
        flashMessages.push(`error: ${e.message}`)

        resolve()
      })
    })
    .finally(() => {
      complete()
    })
  } else {
    complete()
  }
}

/**
 * Convenience function.
 * Allows to introspect both access and refresh tokens in a token set.
 * Gets an `openid-client` client instance with the `openid-client-helper` instance `getClient` method.
 * Then, uses [client.introspect]{@link https://github.com/panva/node-openid-client/tree/master/docs#clientintrospecttoken-tokentypehint-extras}
 * to introspect individual tokens.
 * @param {object} param0
 * @param {object} param0.tokenSet An object containing `access_token` and optional `refresh_token` as top level members.
 * @returns {object} Introspection results with `access_token` and optional `refresh_token` as top level members.
 */
async function introspectTokenSet ({
  tokenSet = {}
}) {
  const introspectionResults = {}

  try {
    const client = await getClient()

    introspectionResults.access_token = await client.introspect(tokenSet.access_token, 'access_token')

    if (tokenSet.refresh_token) {
      introspectionResults.refresh_token = await client.introspect(tokenSet.refresh_token, 'refresh_token')
    }
  } catch (e) {
    introspectionResults.error = e.message
  }

  return introspectionResults
}

// 7. EXPORT.

module.exports = router

/* example-end */
