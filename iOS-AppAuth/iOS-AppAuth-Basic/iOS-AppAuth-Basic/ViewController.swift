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
     Private-use URI scheme used by the app

     This value is provided separately so that its presence in `Info.plist` can be easily checked and so that it can be reused with different redirection URIs.
     */
    let redirectionUriScheme = "com.forgeops.ios-appauth-basic"

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
    private var authState: OIDAuthState?

    /**
     The key under which the authorization state will be saved in a keyed archive.
     */
    let authStateKey = "authState"

    /**
     OpenID Connect issuer URL, where the OpenID configuration can be obtained from.
     */
    let issuerUrl: String = "https://login.sample.forgeops.com/oauth2"

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
            print("Error creating issuer URL for: \(issuerUrl)")

            return
        }

        print("Retrieving configuration for: \(issuer.absoluteURL)")

        // Discovering endpoints with an AppAuth's convenience method.
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
            print("Error creating redirection URL for : \(redirectionUri)")

            return
        }

        // Checking if the AppDelegate property holding the authorization session could be accessed
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

        print("Initiating authorization request with scopes: \(request.scope ?? "DEFAULT_SCOPE")")

        appDelegate.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self) {
            authState, error in

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
        /**
         Performs authorization with an OIDC Provider configuration.

         A nested function to complete the authorization process after the OP's configuration has became available.

         - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
         */
        func authorize(configuration: OIDServiceConfiguration) {
            print("Authorizing with configuration: \(configuration)")

            self.authorizeWithAutoCodeExchange(
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
        if let idToken = authState?.lastTokenResponse?.idToken {
            /**
             OIDC Provider `end_session_endpoint`.

             At the moment, AppAuth does not support [RP-initiated logout](https://openid.net/specs/openid-connect-session-1_0.html#RPLogout), although it [may in the future](https://github.com/openid/AppAuth-iOS/pull/191), and the `end_session_endpoint` is not captured from the OIDC discovery document; hence, the endpoint may need to be provided manually.
             */
            if let endSessionEndpointUrl = URL(string: issuerUrl + "/connect/endSession" + "?id_token_hint=" + idToken) {
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

