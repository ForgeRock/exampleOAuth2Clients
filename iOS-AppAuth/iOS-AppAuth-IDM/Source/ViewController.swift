//
//  ViewController.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/7/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

// MARK: AppAuth: Importing the SDK
import AppAuth

import UIKit

class ViewController: UIViewController {
    /**
     OAuth 2 client ID.

     Dynamic client registration is not demonstrated in this example.
     */
    let clientId = "ios-appauth-idm"

    /**
     Private-use URI scheme used by the app

     This value is provided separately so that its presence in `Info.plist` can be easily checked and so that it can be reused with different redirection URIs.
     */
    let redirectionUriScheme = "com.forgeops.ios-appauth-idm"

    /**
     OAuth 2 redirection URI for the client.

     The redirection URI is provided as a computed property, so that it can refer to the class' instance properties.
     */
    var redirectionUri: String {
        return redirectionUriScheme + ":/oauth2/forgeops/redirect"
    }

    /**
     Class property to store the authorization state.
     */
    var authState: OIDAuthState?

    /**
     The key under which the authorization state will be saved in a keyed archive.
     */
    let authStateKey = "authState"

    /**
     OpenID Connect issuer URL, where the OpenID configuration can be obtained from.
     */
    let issuerUrl: String = "https://login.sample.forgeops.com/oauth2"

    // Activity indicator for the splash screen.
    private let activityIndicatorView = UIActivityIndicatorView(style: .whiteLarge)

    // MARK: View Controller events

    // Responding to the view controller events.
    override func viewDidLoad() {
        super.viewDidLoad()

        // Displaying activity indicator while loading.

        let activityIndicatorBackgroundColor = UIColor(red: CGFloat(153.0/255.0), green: CGFloat(153.0/255.0), blue: CGFloat(153.0/255.0), alpha: 1)

        view.addSubview(activityIndicatorView)

        activityIndicatorView.frame = view.bounds
        activityIndicatorView.backgroundColor = activityIndicatorBackgroundColor
        activityIndicatorView.startAnimating()

        // Displaying the app name as it appears on the user's device, giving preference to the `Display Name` general setting.
        navigationItem.title = (Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleName")) as? String

        // Loading any preexisting authorization state.
        loadState()

        showState()

        if authState == nil {
            // Authorizing the app with the specified OIDC Provider if no authorization state exists from previous session.
            authorizeRp(issuerUrl: issuerUrl, configuration: nil)
        }
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        activityIndicatorView.frame = view.bounds
    }

    override func didRotate(from fromInterfaceOrientation: UIInterfaceOrientation) {
        UIView.animate(withDuration: 0.4) {
            self.activityIndicatorView.frame = self.view.bounds
        }
    }

    // MARK: @IB

    /**
     Allows user to start authorization manually.
     */
    @IBAction func signIn(_ sender: UIBarButtonItem) {
        authorizeRp(issuerUrl: issuerUrl, configuration: nil)
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
            authorizationEndpoint: URL(string: "https://login.sample.forgeops.com/oauth2/authorize")!,
            tokenEndpoint: URL(string: "https://login.sample.forgeops.com/oauth2/access_token")!
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
            customPrint("Error creating issuer URL for: \(issuerUrl)")

            return
        }

        customPrint("Retrieving configuration for: \(issuer.absoluteURL)")

        // Discovering endpoints with an AppAuth's convenience method.
        OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) {configuration, error in
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
     The response is handled then with the passed in escaping callback allowing the caller to handle the results.
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
            customPrint("Error creating redirection URL for : \(redirectionUri)")

            return
        }

        // Checking if the AppDelegate property that holds the authorization session could be accessed.
        guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
            customPrint("Error accessing AppDelegate")

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

        customPrint("Initiating authorization request with scopes: \(request.scope ?? "DEFAULT_SCOPE")")

        appDelegate.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self) {authState, error in
            completion(authState, error)
        }
    }

    /**
     Authorizes the Relying Party with an OIDC Provider.

     - Parameter issuerUrl: The OP's `issuer` URL to use for OpenID configuration discovery
     - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
     - Parameter completion: (Optional) Completion handler to execute after successful authorization.
     */
    func authorizeRp(issuerUrl: String?, configuration: OIDServiceConfiguration?, completion: (() -> Void)? = nil) {
        activityIndicatorView.startAnimating()

        /**
         Performs authorization with an OIDC Provider configuration.

         A nested function to complete the authorization process after the OP's configuration has became available.

         - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
         */
        func authorize(configuration: OIDServiceConfiguration) {
            customPrint("Authorizing with configuration: \(configuration)")

            self.authorizeWithAutoCodeExchange(
                configuration: configuration,
                clientId: self.clientId,
                redirectionUri: self.redirectionUri,
                scopes: [
                    OIDScopeOpenID,
                    OIDScopeProfile,
                    "profile_update",
                    "consent_read",
                    "workflow_tasks",
                    "notifications"
                ]
            ) {authState, error in
                if let authState = authState {
                    self.setAuthState(authState)

                    self.customPrint("Successful authorization.")

                    self.showState()

                    if let completion = completion {
                        completion()
                    }
                } else {
                    self.customPrint("Authorization error: \(error?.localizedDescription ?? "")")

                    self.setAuthState(nil)
                }
            }
        }

        if let issuerUrl = issuerUrl {
            // Discovering OP configuration
            discoverOIDServiceConfiguration(issuerUrl) {configuration, error in
                guard let configuration = configuration else {
                    let message = "Error retrieving discovery document for \(issuerUrl): \(error?.localizedDescription ?? "")"

                    self.customPrint(message)

                    self.setAuthState(nil)

                    // Allowing the end user to re-try.

                    let alert = UIAlertController(title: "ERROR", message: message, preferredStyle: .actionSheet)

                    let alertRetryAction = UIAlertAction(title: "Retry", style: .default) {(_: UIAlertAction) in
                        self.authorizeRp(issuerUrl: issuerUrl, configuration: nil)
                    }
                    alert.addAction(alertRetryAction)

                    let alertCancelAction = UIAlertAction(title: "Cancel", style: .cancel) {(_: UIAlertAction) in
                        self.activityIndicatorView.stopAnimating()
                    }
                    alert.addAction(alertCancelAction)

                    self.present(alert, animated: true, completion: nil)

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

        customPrint("Authorization state has been saved.")
    }

    /**
     Reacts on authorization state changes events.
     */
    func stateChanged() {
        self.saveState()
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

            if self.authState != nil {
                showUi()
            } else {
                self.presentedViewController?.dismiss(animated: true, completion: nil)
            }
        }

        activityIndicatorView.stopAnimating()
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
            customPrint("Authorization state has been loaded.")

            self.setAuthState(authState)
        }
    }

    /**
     Displays selected information from the current authorization data.
     */
    func showState() {
        customPrint("Current authorization state: ")

        customPrint("Access token: \(authState?.lastTokenResponse?.accessToken ?? "none")")

        customPrint("ID token: \(authState?.lastTokenResponse?.idToken ?? "none")")

        let idTokenClaims = getIdTokenClaims(idToken: authState?.lastTokenResponse?.idToken ?? "") ?? Data()
        customPrint("ID token claims: \(String(describing: String(bytes: idTokenClaims, encoding: .utf8)))")

        customPrint("Expiration date: \(String(describing: authState?.lastTokenResponse?.accessTokenExpirationDate))")
    }
}

// MARK: OIDAuthState delegates

extension ViewController: OIDAuthStateChangeDelegate {
    /**
     Responds to authorization state changes in the AppAuth library.
     */
    func didChange(_ state: OIDAuthState) {
        customPrint("Authorization state change event.")

        self.stateChanged()
    }
}

extension ViewController: OIDAuthStateErrorDelegate {
    /**
     Reports authorization errors in the AppAuth library.
     */
    func authState(_ state: OIDAuthState, didEncounterAuthorizationError error: Error) {
        customPrint("Received authorization error: \(error)")
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
    func sendUrlRequest(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse?, Error?, URLRequest) -> Void) {
        let task = URLSession.shared.dataTask(with: urlRequest) {data, response, error in
            DispatchQueue.main.async {
                if error != nil {
                    // Handling transport error
                    self.customPrint("HTTP request failed \(error?.localizedDescription ?? "")")

                    // return
                }

                let response = response as? HTTPURLResponse

                if response == nil {
                    // Expecting HTTP response
                    self.customPrint("Non-HTTP response")

                    // return
                }

                completion(data, response, error, urlRequest)
            }
        }

        task.resume()
    }

    /**
     Makes a request to a protected source that accepts tokens from the OIDC Provider.

     - Parameter urlRequest: URLRequest with pre-defined URL, method, etc.
     - Parameter completion: Escaping completion handler allowing the caller to process the response.
     */
    func makeUrlRequestToProtectedResource(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse?, Error?, URLRequest) -> Void) {
        let currentAccessToken: String? = self.authState?.lastTokenResponse?.accessToken

        // Validating and refreshing tokens
        self.authState?.performAction() {accessToken, idToken, error in
            if error != nil {
                self.customPrint("Error fetching fresh tokens: \(error?.localizedDescription ?? "")")

                // Replaying request to a protected resource after (re)authorization.
                self.authorizeRp(issuerUrl: self.issuerUrl, configuration: nil) {
                    self.makeUrlRequestToProtectedResource(urlRequest: urlRequest, completion: completion)
                }

                return
            }

            guard let accessToken = accessToken else {
                self.customPrint("Error getting accessToken")

                return
            }

            if currentAccessToken != accessToken {
                self.customPrint("Access token was refreshed automatically (\(currentAccessToken ?? "none") to \(accessToken))")
            } else {
                self.customPrint("Access token was fresh and not updated \(accessToken)")
            }

            var urlRequest = urlRequest

            // Including the access token in the request
            var requestHeaders = urlRequest.allHTTPHeaderFields ?? [:]
            requestHeaders["Authorization"] = "Bearer \(accessToken)"
            urlRequest.allHTTPHeaderFields = requestHeaders

            self.sendUrlRequest(urlRequest: urlRequest) {data, response, error, request in
                guard let data = data, data.count > 0 else {
                    self.customPrint("HTTP response data is empty.")

                    return
                }

                if let response = response, response.statusCode != 200 {
                    // Server replied with an error
                    let responseText: String? = String(data: data, encoding: String.Encoding.utf8)

                    if response.statusCode == 401 {
                        // "401 Unauthorized" generally indicates there is an issue with the authorization grant; hence, putting OIDAuthState into an error state.

                        // Checking if the response is a valid JSON.
                        var json: [AnyHashable: Any]?

                        do {
                            json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
                        } catch {
                            self.customPrint("JSON Serialization Error.")
                        }

                        let oauthError = OIDErrorUtilities.resourceServerAuthorizationError(
                            withCode: 0,
                            errorResponse: json,
                            underlyingError: nil
                        )

                        self.authState?.update(withAuthorizationError: oauthError)

                        self.customPrint("Authorization Error (\(oauthError)). Response: \(responseText ?? "")")
                    } else {
                        self.customPrint("HTTP: \(response.statusCode), Response: \(responseText ?? "")")
                    }
                }

                completion(data, response, error, request)
            }
        }
    }

    /**
     Prepares and initiates a URL request.

     Creates a URL request from passed in parameters. If the requested resource is protected allows for additional preparations; otherwise sends it to the data task implementation.
     */
    func makeUrlRequest(
        url: String,
        method: String = "GET",
        body: Data? = nil,
        protected: Bool = false,
        completion: @escaping (Data?, HTTPURLResponse?, Error?, URLRequest)
        -> Void
        ) {
        guard let url = URL(string: url) else {
            customPrint("Invalid URL")

            return
        }

        var urlRequest = URLRequest(url: url)

        urlRequest.httpMethod = method

        if (["PATCH","DELETE"].contains(urlRequest.httpMethod)) {
            urlRequest.cachePolicy = NSURLRequest.CachePolicy.reloadIgnoringLocalAndRemoteCacheData

            var headers = urlRequest.allHTTPHeaderFields ?? [:]
            headers["Content-Type"] = "application/json"
            urlRequest.allHTTPHeaderFields = headers

            if (body != nil) {
                urlRequest.httpBody = body
            }
        }

        if protected {
            makeUrlRequestToProtectedResource(urlRequest: urlRequest) {data, response, error, request in
                completion(data, response, error, request)
            }
        } else {
            sendUrlRequest(urlRequest: urlRequest) {data, response, error, request in
                completion(data, response, error, request)
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
     Loads the UI.

     Presents the authorized app UI and obtains login information for the authenticated user.
     */
    func showUi() {
        // Obtaining the user info, including their internal ID.
        makeUrlRequest(url: UserLogin().url, protected: true) {data, response, error, request in
            let userLoginResponse = self.decodeJson(UserLogin.Response.self, from: data!)

            guard let authenticationId = userLoginResponse?.authenticationId else {
                self.customPrint("Error retrieving user ID.")

                return
            }

            self.customPrint("authenticationId: \(authenticationId)")

            let tabBarController = self.storyboard?.instantiateViewController(withIdentifier: "TabBarController") as! UITabBarController

            // MARK: Injecting dependencies

            let customPrint = {[unowned self] (_ items: Any...) -> Void in
                self.customPrint(items)
            }

            let signOut = {[unowned self] in
                self.signOut()
            }

            var sampleUrls: [String] = []
            if let sampleUrl = self.authState?.lastAuthorizationResponse.request.configuration.discoveryDocument?.userinfoEndpoint?.absoluteString {
                sampleUrls.append(sampleUrl)
            }
            sampleUrls.append("https://rs.sample.forgeops.com/openidm/config/ui/dashboard")
            sampleUrls.append("https://rs.sample.forgeops.com/openidm/info/login")

            tabBarController.viewControllers?.forEach {navigationController in
                let nv = navigationController as? UINavigationController

                nv?.viewControllers.forEach {viewController in
                    if let vc = viewController as? DashboardTableViewController {
                        vc.sampleUrls = sampleUrls

                        vc.customPrint = customPrint

                        vc.signOut = signOut

                        vc.getNotifications = {[unowned self] (completion) in
                            self.makeUrlRequest(url: UserNotifications().url, protected: true) {data, response, error, request in
                                guard let json = self.decodeJson(UserNotifications.Response.self, from: data!) else {
                                    self.customPrint("Error retrieving user notifications: cannot decode JSON.")

                                    return
                                }

                                completion(json.notifications)
                            }
                        }

                        vc.deleteNotification = {[unowned self] (notificationId, completion) in
                            self.makeUrlRequest(
                                url: UserNotifications().url + (notificationId ?? ""),
                                method: "DELETE",
                                protected: true
                            ) {data, response, error, request in
                                completion(data, response!)
                            }
                        }

                        // Injecting a "pass through" dependency to be injected in the controller's children
                        vc.makeUrlRequest = {[unowned self] (url, protected, completion) in
                            guard let url = URL(string: url) else {
                                customPrint("Invalid URL")

                                return
                            }

                            let urlRequest = URLRequest(url: url)

                            func completeUrlRequest(data: Data?, response: HTTPURLResponse?, error: Error?, request: URLRequest) {
                                completion(data, response, error, request)
                            }

                            if protected {
                                self.makeUrlRequestToProtectedResource(urlRequest: urlRequest, completion: completeUrlRequest)
                            } else {
                                self.sendUrlRequest(urlRequest: urlRequest, completion: completeUrlRequest)
                            }
                        }
                    } else if let vc = viewController as? AccountTableViewController {
                        vc.customPrint = customPrint

                        vc.signOut = signOut

                        vc.getUserAccount = {[unowned self] completion in
                            let url = UserAccount().url + (userLoginResponse?.authorization?.id ?? "")!

                            var userAccountResponse: UserAccount.Response?

                            self.makeUrlRequest(url: url, protected: true) {data, response, error, request in
                                if let data = data {
                                    userAccountResponse = self.decodeJson(UserAccount.Response.self, from: data)
                                }

                                completion(userAccountResponse, error)
                            }
                        }

                        vc.updateUserAccount = {[unowned self] (field, value, completion) in
                            let url = UserAccount().url + (userLoginResponse?.authorization?.id ?? "")!

                            let update = UserAccountUpdate.Update(
                                operation: "replace",
                                field: field,
                                value: value
                            )

                            var json = Data()

                            var body = UserAccountUpdate().body

                            body.append(update)

                            let encoder = JSONEncoder()

                            do {
                                json = try encoder.encode(body)
                            } catch {
                                self.customPrint("Error updating user account: JSON encoding error.")
                            }

                            self.makeUrlRequest(url: url, method: "PATCH", body: json, protected: true) {data, response, error, request in
                                completion(data, response, error, request)
                            }
                        }
                    }
                }
            }
            // Injecting dependencies: end

            self.present(tabBarController, animated: true) {
            }
        }
    }

    /**
     Signs out from the app and, optionally, from the OIDC Provider.

     Resets the authorization state and signs out from the OIDC Provider using its [RP-initiated logout](https://openid.net/specs/openid-connect-session-1_0.html#RPLogout) `end_session_endpoint`.
     */
    func signOut() {
        if let idToken = authState?.lastTokenResponse?.idToken {
            /**
             OIDC Provider `end_session_endpoint`.

             At the moment, AppAuth does not support [RP-initiated logout](https://openid.net/specs/openid-connect-session-1_0.html#RPLogout), although it [may in the future](https://github.com/openid/AppAuth-iOS/pull/191), and the `end_session_endpoint` is not captured from the OIDC discovery document; hence, the endpoint may need to be provided manually.
             */
            if let endSessionEndpointUrl = URL(string: issuerUrl + "/connect/endSession" + "?id_token_hint=" + idToken) {
                let urlRequest = URLRequest(url: endSessionEndpointUrl)

                sendUrlRequest(urlRequest: urlRequest) {data, response, error, request in
                    if data != nil, data!.count > 0 {
                        // Handling RP-initiated logout errors
                        self.customPrint("RP-initiated logout response: \(String(describing: String(data: data!, encoding: .utf8)))")
                    }
                }
            }
        }

        // Clearing the authorization state
        setAuthState(nil)
    }
}

// MARK: Helpers
extension ViewController {
    /**
     Provides options for custom print output.
     */
    func customPrint(_ items: Any..., separator: String = " ", terminator: String = "\n") {
        var output = items.map { "\($0)" }.joined(separator: separator)

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let date = dateFormatter.string(from: Date())

        output = date + " " + output

        Swift.print(output)
    }

    /**
     Decodes JSON according to specified `Type`.
     */
    func decodeJson<T: Codable>(_ type: T.Type, from: Data) -> T? {
        var decoded: T?

        let decoder = JSONDecoder()

        do {
            decoded = try decoder.decode(type, from: from)
        } catch {
            customPrint("JSON decoding error")

            return nil
        }

        return decoded!
    }
}
