//
//  WebViewController.swift
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 7/19/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

import Foundation
import WebKit

class WebViewController: NSObject {
    /**
     Accepts initial properties for the class.

     - Parameters:
     - initialUrl: Initial URL to load in the web view.
     - appGroup: Placeholder for App Group reference. App groups allow multiple apps produced by a single development team to access shared containers and communicate using interprocess communication (IPC).
     - appGroupCookies: Cookies to be shared with apps in the App Group.
     - webViewFrame: Frame to place the web view in.
     - webViewConfiguration: Configuration properties to initialize the web view with.
     */
    init(
        initialUrl url: String,
        appGroup group: String? = nil,
        appGroupCookies cookies: [String] = [],
        webViewFrame frame: CGRect = .zero,
        webViewConfiguration configuration: WKWebViewConfiguration? = WKWebViewConfiguration()
        ) {
        initialUrl = url
        appGroup = group
        appGroupCookies = cookies
        webViewFrame = frame
        webViewConfiguration = configuration
    }

    /**
     Indicates successful deallocation and allows to check for retaining cycles.
     */
    deinit {
        print("Deinit: ", String(describing: type(of: self)))
    }

    // Properties populated in init from parameters passed in by the consumer of this class.
    var initialUrl: String!
    var appGroup: String?
    var appGroupCookies: [String]!
    var webViewFrame: CGRect!
    var webViewConfiguration: WKWebViewConfiguration!

    /**
     Delegate for handling navigation events.

     The navigation events may need to be handled differently in consumers of this class. The delegate is to be optionally set by the consumers adopting the `WKNavigationDelegate` protocol, which is already defined in the `WebKit` framework. The potential for a strong reference is broken here (with the `weak` keyword), because the class is to be shared between the callers and serve as an API provider and the consumers should not have to be concerned about retaining cycles.
     */
    weak var wkNavigationDelegate: WKNavigationDelegate?

    var webView: WKWebView!

    /**
     Loads the web view.
     */
    func loadWebView(completion: @escaping (_: WKWebView) -> ()) {
        webView = WKWebView(frame: webViewFrame, configuration: webViewConfiguration)

        // Allows consumers of this class to optionally set their own navigation delegate; if none is provided, the web view uses the default delegate defined in this class.
        webView.navigationDelegate = wkNavigationDelegate ?? self

        /**
         Loads the pre-configured web view.
         */
        func load() {
            webView.load(URLRequest(url: URL(string: self.initialUrl)!))

            completion(webView)
        }

        /**
         Sets cookies in the web view.
         */
        func setCookies() {
            /**
             Cookies from a storage.
             */
            let cookies = loadCookies()

            /**
             Group of asynchronous operations to allow for setting multiple cookies loaded from the storage.
             */
            let dispatchGroup = DispatchGroup()

            // Loading shared cookies into the web view configuration.
            cookies.forEach {
                cookie in

                dispatchGroup.enter()

                webView.configuration.websiteDataStore.httpCookieStore.setCookie(cookie) {
                    print("Cookie set: ", cookie)

                    dispatchGroup.leave()
                }
            }

            // Loading the web view after all cookies, if any, have been set in the web view configuration.
            dispatchGroup.notify(queue: DispatchQueue.main) {
                load()
            }
        }

        // Clearing cache is an option; otherwise just call `setCookies()`
        WKWebsiteDataStore.default().fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) {
            records in

            let dispatchGroup = DispatchGroup()

            if records.count > 0 {
                records.forEach {
                    record in

                    dispatchGroup.enter()

                    WKWebsiteDataStore.default().removeData(ofTypes: record.dataTypes, for: [record]) {
                        dispatchGroup.leave()
                    }
                }

                dispatchGroup.notify(queue: DispatchQueue.main) {
                    print("WKWebsiteDataStore cache has been cleared.")

                    setCookies()
                }
            } else {
                setCookies()
            }
        }
    }
}

// MARK: Default delegate for the web view navigation events.
extension WebViewController: WKNavigationDelegate {
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

        // Capturing (authentication) cookies when they are present.
        WKWebsiteDataStore.default().httpCookieStore.getAllCookies() {
            cookies in

            let cookies = cookies.filter {
                self.appGroupCookies.contains($0.name)
            }

            if cookies.count > 0 {
                self.saveCookies(cookies)
            }
        }

        // Implementing a navigation policy—for example, allowing for encrypted connection only.
        if navigationAction.request.url?.scheme == "https" {
            decisionHandler(.allow)

            return
        }

        // Cancelling navigation otherwise.
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

// MARK: Session sharing; this could be a content of a separate session management module.
extension WebViewController {
    /**
     Saves cookies in a storage.

     Sharing session cookies is generally frowned upon, and such a bad practice should be only applied in a well controlled environments.
     */
    func saveCookies(_ cookies: [HTTPCookie]) {
        print("Saving cookies for: ", appGroup ?? "")

        var data: Data? = nil

        // Serializing the cookies data.
        if #available(iOS 12.0, *) {
            data = try! NSKeyedArchiver.archivedData(withRootObject: cookies, requiringSecureCoding: false)
        } else {
            data = NSKeyedArchiver.archivedData(withRootObject: cookies)
        }

        // `appGroup` can be used to identify a shared database. If `appGroup` is not defined, the `UserDefaults.standard` object, specific to the current app and user, is populated and no inter app data exchange is possible via `UserDefaults`.
        UserDefaults(suiteName: appGroup)?.set(data, forKey: "cookies")
    }

    /**
     Loads cookies from the storage.
     */
    func loadCookies() -> [HTTPCookie] {
        var cookies: [HTTPCookie] = []

        print("Loading cookies for: ", appGroup ?? "")

        // `appGroup` can be used to identify a shared database. If `appGroup` is not defined, the `UserDefaults.standard` object, specific to the current app and user, is used for data retrieval.
        guard let data = UserDefaults(suiteName: appGroup)?.value(forKey: "cookies") as? Data else {
            print("No App Group cookies found.")

            return []
        }

        if #available(iOS 12.0, *) {
            cookies = try! NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(data) as? [HTTPCookie] ?? []
        } else {
            cookies = NSKeyedUnarchiver.unarchiveObject(with: data) as? [HTTPCookie] ?? []
        }

        return cookies
    }
}
