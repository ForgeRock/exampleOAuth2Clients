//
//  ViewController.swift
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 1/28/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

// MARK: Importing the AppAuth SDK
import AppAuth

import UIKit
import WebKit

/**
 Shadows the `Swift.print` providing for extra output options.
 */
func print(_ items: Any..., separator: String = " ", terminator: String = "\n") {
    var output = items.map { "\($0)" }.joined(separator: separator)

    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let date = dateFormatter.string(from: Date())

    output = date + " " + output

    // Displaying logs in the UI
    textView.text += "\n" + output + "\n"

    let textViewBottom = NSMakeRange(textView.text.count - 1, 1)
    textView.scrollRangeToVisible(textViewBottom)

    // Accommodating an iOS bug that may prevent scrolling under certain circumstances.
    textView.isScrollEnabled = false
    textView.isScrollEnabled = true

    Swift.print(output)
}

class ViewController: UIViewController {
    /**
     OAuth 2 client ID.

     Dynamic client registration is not demonstrated in this example.
     */
    let clientId = "ios-appauth-basic"

    /**
     Scheme used in the redirection URI.

     This value is provided separately so that its presence in `Info.plist` can be easily checked and so that it can be reused with different redirection URIs.
     */
    let redirectionUriScheme = "https" // "com.forgeops.ios-appauth-basic"

    /**
     OAuth 2 redirection URI for the client.

     The redirection URI is provided as a computed property, so that it can refer to the class' instance properties.
     */
    var redirectionUri: String {
        return redirectionUriScheme + "://lapinek.github.io/oauth2redirect/ios-appauth-basic" // + ":/oauth2/forgeops/redirect"
    }

    /**
     Class property to store the authorization state.
     */
    private var authState: OIDAuthState?

    /**
     The key under which the authorization state will be saved in a keyed archive.
     */
    let authStateKey = "authState"

    /**
     OpenID Connect issuer URL, where the OpenID configuration can be obtained from.
     */
    let issuerUrl: String = "https://default.iam.example.com/am/oauth2"

    /**
     App Group name.

     Serves as a reference to the App Group for sharing the authentication state.
     */
    let appGroup = "group.com.forgerock.sso-webview"

    /**
     Cookies to be shared with the App Group.
     */
    let appGroupCookies = ["iPlanetDirectoryPro"]

    /**
     Reference to a request object built by AppAuth.

     This will be used to build AppAuth `OIDAuthorizationResponse` to continue authorization with the SDK after redirection event in the web view.
     */
    var oidAuthorizationRequest: OIDAuthorizationRequest? = nil

    /**
     Reference to the class providing web view.
     */
    var webViewController: WebViewController!

    /**
     Reference to the web view via its `tag` property.
     */
    var webViewTag = 1

    /**
     Completes successful authorization.

     This property serve as a placeholder for authorization completion handler for being called from a different context than one the authorization was initiated in. In this example, it sets the authorization state and performs callbacks—if any.
     */
    var authorizationCompletion: ((OIDAuthState?, Error?) -> Void)? = nil

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.

        // Displaying the app name as it appears on the user's device, giving preference to the `Display Name` general setting.
        navigationItem.title = (Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleName")) as? String

        loadState()

        showState()

        if authState == nil {
            authorizeRp(issuerUrl: issuerUrl, configuration: nil)
        }

        showUi()

        addTextView()
    }

    /**
     Calls the `userinfo_endpoint` associated with the current authorization state.
     */
    func getUserInfo() {
        guard let url = authState?.lastAuthorizationResponse.request.configuration.discoveryDocument?.userinfoEndpoint else {
            print("Userinfo endpoint not declared in discovery document.")

            return
        }

        let urlRequest = URLRequest(url: url)

        makeUrlRequestToProtectedResource(urlRequest: urlRequest){
            data, response, request in

            var text = "User Info:\n"

            text += "\nREQUEST:\n"
            text += "URL: " + (request.url?.absoluteString ?? "") + "\n"

            text += "HEADERS: \n"
            request.allHTTPHeaderFields?.forEach({
                header in

                text += "\"\(header.key)\": \"\(header.value)\"\n"
            })

            print(request.description)
            text += "\nRESPONSE:\n"
            text += "Status Code: " + String(response.statusCode) + "\n"

            text += "HEADERS:\n"
            response.allHeaderFields.forEach({
                header in

                text += "\"\(header.key)\": \"\(header.value)\"\n"
            })

            text += "\nDATA:\n"
            if let data = data {
                text += String(bytes: data, encoding: .utf8)!
            }

            print(text)
        }
    }
}

// MARK: OIDC Provider configuration
extension ViewController {
    /**
     Returns OIDC Provider configuration.

     In this method the endpoints are provided manually.
     */
    func getOIDCProviderConfiguration() -> OIDServiceConfiguration {
        let configuration = OIDServiceConfiguration.init(
            authorizationEndpoint: URL(string: "https://default.iam.example.com/am/oauth2/authorize")!,
            tokenEndpoint: URL(string: "https://default.iam.example.com/am/oauth2/access_token")!
        )

        return configuration
    }

    /**
     Returns OIDC Provider configuration.

     In this method the OP's endpoints are retrieved from the issuer's well-known OIDC configuration document location (asynchronously). The response is handled then with the passed in escaping callback.
     */
    func discoverOIDServiceConfiguration(_ issuerUrl: String, completion: @escaping (OIDServiceConfiguration?, Error?) -> Void) {
        // Checking if the issuer's URL can be constructed.
        guard let issuer = URL(string: issuerUrl) else {
            print("Error creating issuer URL for: \(issuerUrl)")

            return
        }

        print("Retrieving configuration for: \(issuer.absoluteURL)")

        // Discovering endpoints with an AppAuth convenience method.
        OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) {
            configuration, error in

            // Completing with the caller's callback.
            completion(configuration, error)
        }
    }
}

// MARK: Authorization methods
extension ViewController {
    /**
     Performs the authorization code flow.

     Attempts to perform a request to authorization endpoint by utilizing an AppAuth convenience method.
     Completes authorization code flow with automatic code exchange.
     The response is then passed to the completion handler, which lets the caller to handle the results.
     */
    func authorizeWithAutoCodeExchange(
        configuration: OIDServiceConfiguration,
        clientId: String,
        redirectionUri: String,
        scopes: [String] = [OIDScopeOpenID, OIDScopeProfile],
        completion: @escaping (OIDAuthState?, Error?) -> Void
        ) {
        // Checking if the redirection URL can be constructed.
        guard let redirectURI = URL(string: redirectionUri) else {
            print("Error creating redirection URL for : \(redirectionUri)")

            return
        }

        // Checking if the AppDelegate property holding the authorization session could be accessed.
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
            print("Error accessing AppDelegate")

            return
        }

        // Building authorization request.
        let request = OIDAuthorizationRequest(
            configuration: configuration,
            clientId: clientId,
            clientSecret: nil,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: nil
        )

        // Making authorization request.

        print("Initiating authorization request with scopes: \(request.scope ?? "no scope requested")")

        if #available(iOS 11, *) {
            appDelegate.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request) {
                authState, error in

                completion(authState, error)
            }
        } else {
            appDelegate.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self) {
                authState, error in

                completion(authState, error)
            }
        }
    }

    /**
     Makes token exchange request.

     The code obtained from the authorization request is exchanged at the token endpoint.
     */
    func makeTokenRequest(completion: @escaping (OIDAuthState?, Error?) -> Void) {
        guard let tokenExchangeRequest = self.authState?.lastAuthorizationResponse.tokenExchangeRequest() else {
            print("Error creating access token request.")

            return
        }

        print("Making token request with: ", tokenExchangeRequest)

        OIDAuthorizationService.perform(tokenExchangeRequest) {
            response, error in

            if let response = response {
                print("Received token response with access token: ", response.accessToken ?? "")
            } else {
                print("Error making token request: \(error?.localizedDescription ?? "")")
            }

            self.authState?.update(with: response, error: error)

            completion(self.authState, error)
        }
    }

    /**
     Performs the authorization code flow in two steps.

     Attempts to perform a request to authorization endpoint by utilizing an OIDAuthorizationService method.
     Completes authorization code flow with code exchange initiated manually by invoking a separate OIDAuthorizationService method.
     The response is then passed to the completion handler, which lets the caller to handle the results.

     This method is not used and is here for illustration purposes.
     */
    func authorizeWithManualCodeExchange(
        configuration: OIDServiceConfiguration,
        clientId: String,
        redirectionUri: String,
        scopes: [String] = [OIDScopeOpenID, OIDScopeProfile],
        completion: @escaping (OIDAuthState?, Error?) -> Void
        ) {
        // Checking if the redirection URL can be constructed.
        guard let redirectURI = URL(string: redirectionUri) else {
            print("Error creating redirection URL for : \(redirectionUri)")

            return
        }

        // Checking if the AppDelegate property holding the authorization session could be accessed.
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
            print("Error accessing AppDelegate")

            return
        }

        // Building authorization request.
        let request = OIDAuthorizationRequest(
            configuration: configuration,
            clientId: clientId,
            clientSecret: nil,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: nil
        )

        // Making authorization request.
        appDelegate.currentAuthorizationFlow = OIDAuthorizationService.present(request, presenting: self) {
            response, error in

            if let response = response {
                print("Received authorization response with code: \(response.authorizationCode ?? "")")

                let authState = OIDAuthState(authorizationResponse: response)

                self.setAuthState(authState)

                // Custom processing here.

                self.makeTokenRequest() {
                    authState, error in

                    completion(authState, error)
                }
            } else {
                print("Error making authorization request: \(error?.localizedDescription ?? "")")

                completion(nil, error)
            }
        }
    }

    /**
     Performs the authorization code flow using a web view.

     Attempts to make a request to the authorization endpoint by utilizing a web view.
     Allows the web view to handle the redirection.
     */
    func authorizeWithWebView(
        configuration: OIDServiceConfiguration,
        clientId: String,
        redirectionUri: String,
        scopes: [String] = [OIDScopeOpenID, OIDScopeProfile],
        completion: @escaping (OIDAuthState?, Error?) -> Void
        ) {
        // Checking if the redirection URL can be constructed.
        guard let redirectURI = URL(string: redirectionUri) else {
            print("Error creating redirection URL for : \(redirectionUri)")

            return
        }

        // Building authorization request.
        let request = OIDAuthorizationRequest(
            configuration: configuration,
            clientId: clientId,
            clientSecret: nil,
            scopes: scopes,
            redirectURL: redirectURI,
            responseType: OIDResponseTypeCode,
            additionalParameters: nil
        )

        // Making authorization request.

        print("Initiating authorization request with scopes: \(request.scope ?? "no scope requested")")

        // Using web view instead of built in AppAuth methods invoking an external user-agent.

        /**
         Reference to the completion handler to be called on successful authorization.

         The redirection URI will be processed in the web view navigation event. The code will be exchanged for tokens using the `makeTokenRequest()` method, which will need to follow by the completion callback passed in here from the `authorizeRp()` method. Since the navigation event will be handled in a different context, we need to preserve the completion block.
         */
        authorizationCompletion = completion

        /**
         The request object reference accessible from other methods.

         AppAuth methods will be used to complete the authorization flow after redirection from the authorization endpoint and need the original request details.
         */
        oidAuthorizationRequest = request

        // Dismissing any existing subview.
        view.viewWithTag(webViewTag)?.removeFromSuperview()

        // Dismissing any existing web view controller.
        webViewController = nil

        // Configuring the web view for JavaScript interactions.

        let userContentController = WKUserContentController()
        userContentController.add(self, name: "callback")

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = userContentController

        // Providing the web view class with initial parameters, including the URL to the authorization endpoint obtained from the AppAuth authorization request object.
        webViewController = WebViewController.init(
            initialUrl: request.authorizationRequestURL().absoluteString,
            appGroup: appGroup,
            appGroupCookies: appGroupCookies,
            webViewFrame: view.bounds,
            webViewConfiguration: configuration
        )

        // Setting this controller as the web view navigation delegate.
        webViewController.wkNavigationDelegate = self

        // Loading the view with the authorization URL.
        webViewController.loadWebView() {
            webView in

            // Tracking the view by its tag.
            webView.tag = self.webViewTag

            self.view.addSubview(webView)
        }
    }

    /**
     Authorizes the Relying Party with an OIDC Provider.

     - Parameter issuerUrl: The OP's `issuer` URL to use for OpenID configuration discovery
     - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
     - Parameter completion: (Optional) Completion handler to execute after successful authorization.
     */
    func authorizeRp(issuerUrl: String?, configuration: OIDServiceConfiguration?, completion: (() -> Void)? = nil) {
        /**
         Performs authorization with an OIDC Provider configuration.

         A nested function to complete the authorization process after the OP's configuration has became available.

         - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
         */
        func authorize(configuration: OIDServiceConfiguration) {
            print("Authorizing with configuration: \(configuration)")

            self.authorizeWithWebView(
                configuration: configuration,
                clientId: self.clientId,
                redirectionUri: self.redirectionUri
            ) {
                authState, error in

                if let authState = authState {
                    self.setAuthState(authState)

                    print("Successful authorization.")

                    self.showState()

                    if let completion = completion {
                        completion()
                    }
                } else {
                    print("Authorization error: \(error?.localizedDescription ?? "")")

                    self.setAuthState(nil)
                }
            }
        }

        if let issuerUrl = issuerUrl {
            // Discovering OP configuration
            discoverOIDServiceConfiguration(issuerUrl) {
                configuration, error in

                guard let configuration = configuration else {
                    print("Error retrieving discovery document for \(issuerUrl): \(error?.localizedDescription ?? "")")

                    self.setAuthState(nil)

                    return
                }

                authorize(configuration: configuration)
            }
        } else if let configuration = configuration {
            // Accepting passed-in OP configuration
            authorize(configuration: configuration)
        }
    }
}

// MARK: OIDAuthState methods
extension ViewController {
    /**
     Saves authorization state in a storage.

     As an example, the user's defaults database serves as the persistent storage.
     */
    func saveState() {
        var data: Data? = nil

        if let authState = self.authState {
            if #available(iOS 12.0, *) {
                data = try! NSKeyedArchiver.archivedData(withRootObject: authState, requiringSecureCoding: false)
            } else {
                data = NSKeyedArchiver.archivedData(withRootObject: authState)
            }
        }

        UserDefaults.standard.set(data, forKey: authStateKey)
        UserDefaults.standard.synchronize()

        print("Authorization state has been saved.")
    }

    /**
     Reacts on authorization state changes events.
     */
    func stateChanged() {
        self.saveState()

        /* if authState != nil {
            getUserInfo()
        } */
    }

    /**
     Assigns the passed in authorization state to the class property.
     Assigns this controller to the state delegate property.
     Reacts with UI changes.
     */
    func setAuthState(_ authState: OIDAuthState?) {
        if (self.authState != authState) {
            self.authState = authState

            self.authState?.stateChangeDelegate = self

            self.stateChanged()
        }

        showUi()
    }

    /**
     Loads authorization state from a storage.

     As an example, the user's defaults database serves as the persistent storage.
     */
    func loadState() {
        guard let data = UserDefaults.standard.object(forKey: authStateKey) as? Data else {
            return
        }

        var authState: OIDAuthState? = nil

        if #available(iOS 12.0, *) {
            authState = try! NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(data) as? OIDAuthState
        } else {
            authState = NSKeyedUnarchiver.unarchiveObject(with: data) as? OIDAuthState
        }

        if let authState = authState {
            print("Authorization state has been loaded.")

            self.setAuthState(authState)
        }
    }

    /**
     Displays selected information from the current authorization data.
     */
    func showState() {
        print("Current authorization state: ")

        print("Access token: \(authState?.lastTokenResponse?.accessToken ?? "none")")

        print("ID token: \(authState?.lastTokenResponse?.idToken ?? "none")")

        let idTokenClaims = getIdTokenClaims(idToken: authState?.lastTokenResponse?.idToken ?? "") ?? Data()
        print("ID token claims: \(String(describing: String(bytes: idTokenClaims, encoding: .utf8)))")

        print("Expiration date: \(String(describing: authState?.lastTokenResponse?.accessTokenExpirationDate))")
    }
}

// MARK: OIDAuthState delegates

extension ViewController: OIDAuthStateChangeDelegate {
    /**
     Responds to authorization state changes in the AppAuth library.
     */
    func didChange(_ state: OIDAuthState) {
        print("Authorization state change event.")

        self.stateChanged()
    }
}

extension ViewController: OIDAuthStateErrorDelegate {
    /**
     Reports authorization errors in the AppAuth library.
     */
    func authState(_ state: OIDAuthState, didEncounterAuthorizationError error: Error) {
        print("Received authorization error: \(error)")
    }
}

// MARK: URL request helpers
extension ViewController {
    /**
     Sends a URL request.

     Sends a predefined request and handles common errors.

     - Parameter urlRequest: URLRequest optionally crafted with additional information, which may include access token.
     - Parameter completion: Escaping completion handler allowing the caller to process the response.
     */
    func sendUrlRequest(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse, URLRequest) -> Void) {
        let task = URLSession.shared.dataTask(with: urlRequest) {
            data, response, error in

            DispatchQueue.main.async {
                guard error == nil else {
                    // Handling transport error
                    print("HTTP request failed \(error?.localizedDescription ?? "")")

                    return
                }

                guard let response = response as? HTTPURLResponse else {
                    // Expecting HTTP response
                    print("Non-HTTP response")

                    return
                }

                completion(data, response, urlRequest)
            }
        }

        task.resume()
    }

    /**
     Makes a request to a protected source that accepts tokens from the OIDC Provider.

     - Parameter urlRequest: URLRequest with pre-defined URL, method, etc.
     - Parameter completion: Escaping completion handler allowing the caller to process the response.
     */
    func makeUrlRequestToProtectedResource(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse, URLRequest) -> Void) {
        let currentAccessToken: String? = self.authState?.lastTokenResponse?.accessToken

        // Validating and refreshing tokens
        self.authState?.performAction() {
            accessToken, idToken, error in

            if error != nil {
                print("Error fetching fresh tokens: \(error?.localizedDescription ?? "")")

                // Replaying request to a protected resource after (re)authorization.
                self.authorizeRp(issuerUrl: self.issuerUrl, configuration: nil) {
                    self.makeUrlRequestToProtectedResource(urlRequest: urlRequest, completion: completion)
                }

                return
            }

            guard let accessToken = accessToken else {
                print("Error getting accessToken")

                return
            }

            if currentAccessToken != accessToken {
                print("Access token was refreshed automatically (\(currentAccessToken ?? "none") to \(accessToken))")
            } else {
                print("Access token was fresh and not updated \(accessToken)")
            }

            var urlRequest = urlRequest

            // Including the access token in the request
            var requestHeaders = urlRequest.allHTTPHeaderFields ?? [:]
            requestHeaders["Authorization"] = "Bearer \(accessToken)"
            urlRequest.allHTTPHeaderFields = requestHeaders

            self.sendUrlRequest(urlRequest: urlRequest) {
                data, response, request in

                guard let data = data, data.count > 0 else {
                    print("HTTP response data is empty.")

                    return
                }

                if response.statusCode != 200 {
                    // Server replied with an error
                    let responseText: String? = String(data: data, encoding: String.Encoding.utf8)

                    if response.statusCode == 401 {
                        // "401 Unauthorized" generally indicates there is an issue with the authorization grant; hence, putting OIDAuthState into an error state.

                        // Checking if the response is a valid JSON.
                        var json: [AnyHashable: Any]?

                        do {
                            json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
                        } catch {
                            print("JSON Serialization Error.")
                        }

                        let oauthError = OIDErrorUtilities.resourceServerAuthorizationError(
                            withCode: 0,
                            errorResponse: json,
                            underlyingError: nil
                        )

                        self.authState?.update(withAuthorizationError: oauthError)

                        print("Authorization Error (\(oauthError)). Response: \(responseText ?? "")")
                    } else {
                        print("HTTP: \(response.statusCode), Response: \(responseText ?? "")")
                    }
                }

                completion(data, response, urlRequest)
            }
        }
    }
}

// MARK: ID Token claims
extension ViewController {
    func getIdTokenClaims(idToken: String?) -> Data? {
        // Decoding ID token claims.

        var idTokenClaims: Data?

        if let jwtParts = idToken?.split(separator: "."), jwtParts.count > 1 {
            let claimsPart = String(jwtParts[1])

            let claimsPartPadded = padBase64Encoded(claimsPart)

            idTokenClaims = Data(base64Encoded: claimsPartPadded)
        }

        return idTokenClaims
    }

    /**
     Completes base64Encoded string to multiple of 4 to allow for decoding with NSData.
     */
    func padBase64Encoded(_ base64Encoded: String) -> String {
        let remainder = base64Encoded.count % 4

        if remainder > 0 {
            return base64Encoded.padding(toLength: base64Encoded.count + 4 - remainder, withPad: "=", startingAt: 0)
        }

        return base64Encoded
    }
}

// MARK: UI
extension ViewController {
    /**
     Responds to the UI and initiates the authorization flow.
     */
    @objc func signIn() {
        authorizeRp(issuerUrl: issuerUrl, configuration: nil)
    }

    /**
     Signs out from the app and, optionally, from the OIDC Provider.

     Resets the authorization state and signs out from the OIDC Provider using its [RP-initiated logout](https://openid.net/specs/openid-connect-session-1_0.html#RPLogout) `end_session_endpoint`.
     */
    @objc func signOut() {
        if let idToken = authState?.lastTokenResponse?.idToken, let endSessionEndpoint = authState?.lastTokenResponse?.request.configuration.endSessionEndpoint {
            // RP-initiated logout (https://openid.net/specs/openid-connect-session-1_0.html#RPLogout)

            var urlComponents = URLComponents(url: endSessionEndpoint, resolvingAgainstBaseURL: false)

            urlComponents?.queryItems = [URLQueryItem(name: "id_token_hint", value: idToken)]

            if let endSessionEndpointUrl = urlComponents?.url {
                let urlRequest = URLRequest(url: endSessionEndpointUrl)

                sendUrlRequest(urlRequest: urlRequest) {
                    data, response, request in

                    if !(200...299).contains(response.statusCode) {
                        // Handling server errors
                        print("RP-initiated logout HTTP response code: \(response.statusCode)")
                    }

                    if data != nil, data!.count > 0 {
                        // Handling RP-initiated logout errors
                        print("RP-initiated logout response: \(String(describing: String(data: data!, encoding: .utf8)))")
                    }
                }
            }
        }

        // Clearing the authorization state
        setAuthState(nil)
    }

    /**
     Wraps `getUserInfo` and makes it available for UI interaction.
     */
    @objc func callGetUserInfo() {
        getUserInfo()
    }

    /**
     Adds UI controls
     */
    func showUi() {
        if (authState == nil) {
            let signInButton = UIBarButtonItem(title: "Sign In", style: UIBarButtonItem.Style.plain, target: self, action: #selector(self.signIn))

            navigationItem.setLeftBarButton(signInButton, animated: true)

            navigationItem.rightBarButtonItem = nil
        } else {
            let signOutButton = UIBarButtonItem(title: "Sign Out", style: UIBarButtonItem.Style.plain, target: self, action: #selector(self.signOut))

            navigationItem.setLeftBarButton(signOutButton, animated: true)

            let urlRequestButton = UIBarButtonItem(title: "User Info", style: UIBarButtonItem.Style.plain, target: self, action: #selector(callGetUserInfo))

            navigationItem.setRightBarButton(urlRequestButton, animated: true)
        }
    }
}

// MARK: UI Extras
/**
 Provides container for text messages in the UI.
 */
let textView = UITextView()

extension ViewController {
    func addTextView() {
        view.backgroundColor = UIColor.white

        let label = UILabel()
        label.textAlignment = .center
        label.text = "Logs"
        view.addSubview(label)

        label.translatesAutoresizingMaskIntoConstraints = false

        if #available(iOS 11.0, *) {
            label.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 4).isActive = true
        } else {
            label.topAnchor.constraint(equalTo: topLayoutGuide.bottomAnchor, constant: 4).isActive = true
        }
        label.heightAnchor.constraint(equalToConstant: 32).isActive = true
        label.widthAnchor.constraint(equalToConstant: 64).isActive = true
        label.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true

        textView.backgroundColor = UIColor.groupTableViewBackground
        textView.translatesAutoresizingMaskIntoConstraints = false
        textView.isEditable = false
        view.addSubview(textView)

        textView.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 4).isActive = true

        if #available(iOS 11.0, *) {
            textView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8).isActive = true
            textView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 8).isActive = true
            textView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -8).isActive = true
        } else {
            textView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -8).isActive = true
            textView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 8).isActive = true
            textView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -8).isActive = true
        }
    }
}

// MARK: Delegate for the web view navigation events.
extension ViewController: WKNavigationDelegate {
    // Could be used to (automatically) load specific for the protection space cookies.
    func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {

        print(#function, challenge.protectionSpace.host, challenge.protectionSpace.authenticationMethod)

        completionHandler(.performDefaultHandling, nil)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print(#function)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        print(#function)
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        print(#function)
    }

    func webView(_ webView: WKWebView, didReceiveServerRedirectForProvisionalNavigation navigation: WKNavigation!) {
        print(#function)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print(#function, error.localizedDescription)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print(#function, error.localizedDescription)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        print(#function, navigationAction.request.url?.absoluteString ?? "")

        /**
         Handling the redirect from the authorization endpoint.

         Alternatively, for a custom URI scheme, one could use WKURLSchemeHandler; for example:
            let configuration = WKWebViewConfiguration()
            configuration.setURLSchemeHandler(your-class-adopting-the-WKURLSchemeHandler-protocol, forURLScheme: redirectionUriScheme)
            webView = WKWebView(frame: webViewFrame, configuration: configuration)
         */
        if navigationAction.request.url?.absoluteString.starts(with: redirectionUri) ?? false {
            print("Redirection URI: ", navigationAction.request.url?.absoluteString ?? "")

            /**
             Redirection URI query parameters.
             */
            var parameters: [String : String] = [:]

            if let urlComponents = URLComponents(url: navigationAction.request.url!, resolvingAgainstBaseURL: false) {
                let queryItems: [URLQueryItem]? = urlComponents.queryItems

                if let queryItems = queryItems {
                    parameters = queryItems.reduce(into: parameters) {result, queryItem in
                        result[queryItem.name] = queryItem.value
                    }
                }
            }

            // Checking if the web view is associated with an OIDAuthorizationRequest.
            if let oidAuthorizationRequest = oidAuthorizationRequest {
                // Creating an OIDAuthorizationResponse to initiate token exchange request with.
                let oidAuthorizationResponse = OIDAuthorizationResponse(request: oidAuthorizationRequest, parameters: parameters as [String : NSCopying & NSObjectProtocol])

                // Verifying that the state in the response matches the state in the request.
                if oidAuthorizationRequest.state == oidAuthorizationResponse.state, let _ = oidAuthorizationResponse.authorizationCode {
                    // Saving the response in the authentication state object.
                    let authState = OIDAuthState(authorizationResponse: oidAuthorizationResponse)

                    // Saving the authorization state.
                    setAuthState(authState)

                    // Performing the token exchange and providing the callback on completion.
                    makeTokenRequest() {
                        authState, error in

                        self.authorizationCompletion?(authState, error)
                    }
                } else {
                    setAuthState(nil)
                }

                decisionHandler(.cancel)

                view.viewWithTag(webViewTag)?.removeFromSuperview()

                webViewController = nil

                return
            }
        }

        // Allowing navigation to and saving cookies from the issuer site.
        if navigationAction.request.url?.host == (URL(string: issuerUrl))?.host {
            decisionHandler(.allow)

            // Capturing (authentication) cookies when they are present—after signing in at the authentication endpoint.
            WKWebsiteDataStore.default().httpCookieStore.getAllCookies() {
                cookies in

                let cookies = cookies.filter {
                    self.appGroupCookies.contains($0.name)
                }

                guard cookies.count > 0 else {
                    return
                }

                self.webViewController.saveCookies(cookies)
            }

            // Dummy script imitating page content.
            var scriptSource = ""
            if let scriptPath = Bundle.main.path(forResource: "WebViewScriptSource", ofType: "js") {
                scriptSource = try! String(contentsOfFile: scriptPath)
            }
            let script = WKUserScript(source: scriptSource, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
            webView.configuration.userContentController.addUserScript(script)

            return
        }

        print("Cancelling navigation to: ", navigationAction.request.url?.absoluteString ?? "")

        decisionHandler(.cancel)
    }

    // Checking the web view responses and reporting errors.
    func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
        print(#function)

        guard let statusCode = (navigationResponse.response as? HTTPURLResponse)?.statusCode else {
            print("Error: non-HTTP response")

            decisionHandler(.cancel)

            return
        }

        guard statusCode < 400 else {
            print("Error: HTTP status code ", statusCode)

            decisionHandler(.cancel)

            return
        }

        // Allowing navigation if no errors are detected.
        decisionHandler(.allow)
    }
}

// MARK: Conforming to WKScriptMessageHandler protocol
extension ViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        print(#function)

        if message.name == "callback", let messageBody = message.body as? String, let messageBodyData = messageBody.data(using: .utf8) {
            let decoder = JSONDecoder()
            var messageBodyJson: AuthenticationResponse?

            do {
                messageBodyJson = try decoder.decode(AuthenticationResponse.self, from: messageBodyData)

                messageBodyJson?.callbacks.forEach {
                    callback in

                    if callback.type == "code" {
                        /**
                         Example action against the web content.
                         */
                        let scriptSource = "(function () {document.body.style.backgroundColor = 'lightgreen'}())"

                        // Example action performed in the native app.

                        let webView = self.view.viewWithTag(webViewTag) as? WKWebView

                        let alert = UIAlertController(title: "Native Prompt", message: "Enter the code. \nThe correct one is: 0000", preferredStyle: UIAlertController.Style.alert)

                        alert.addTextField() {
                            textField in

                            alert.addAction(
                                UIAlertAction(title: NSLocalizedString("Cancel", comment: "Cancel Action"), style: UIAlertAction.Style.cancel) {
                                    (_: UIAlertAction) in

                                    webView?.removeFromSuperview()
                                }
                            )

                            alert.addAction(
                                UIAlertAction(title: NSLocalizedString("Submit", comment: "Submit Action"), style: UIAlertAction.Style.default) {
                                    (_: UIAlertAction) in

                                    let newValue = textField.text?.trimmingCharacters(in: .whitespacesAndNewlines)

                                    if (newValue != "0000") {
                                        webView?.removeFromSuperview()
                                    } else {
                                        // Performing the action against the web content.
                                        webView?.evaluateJavaScript(scriptSource, completionHandler: nil)
                                    }
                                }
                            )
                        }

                        present(alert, animated: false)
                    }
                }
            } catch {
                print("Error decoding callback message: ", error.localizedDescription)
            }
        }
    }
}
