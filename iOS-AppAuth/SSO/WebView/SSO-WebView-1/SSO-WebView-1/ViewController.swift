//
//  ViewController.swift
//  SSO-WebView-1
//
//  Created by Konstantin Lapine on 7/19/19.
//  Copyright © 2019 ForgeRock AS.
//

import UIKit

class ViewController: UIViewController {
    var webViewController: WebViewController!

    /**
     Reference to the web view via its `tag` property.
     */
    var webViewTag = 1

    override func viewDidLoad() {
        super.viewDidLoad()

        // Displaying the app name as it appears on the user's device, giving preference to the `Display Name` general setting.
        navigationItem.title = (Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleName")) as? String

        showUi()
    }
}

// MARK: UI
extension ViewController {
    /**
     Adds UI controls
     */
    func showUi() {
        let loadWebViewButton = UIBarButtonItem(title: "Load", style: UIBarButtonItem.Style.plain, target: self, action: #selector(self.load))
        navigationItem.setLeftBarButton(loadWebViewButton, animated: true)

        let unloadWebViewButton = UIBarButtonItem(title: "Unload", style: UIBarButtonItem.Style.plain, target: self, action: #selector(self.unload))
        navigationItem.setRightBarButton(unloadWebViewButton, animated: true)
    }

    /**
     Response to the UI and unloads the web view.
     */
    @objc func unload() {
        view.viewWithTag(webViewTag)?.removeFromSuperview()

        webViewController = nil
    }

    /**
     Responds to the UI and loads the web view.
     */
    @objc func load() {
        unload()

        /**
         ForgeRock 7 example.
         */
        webViewController = WebViewController.init(
            initialUrl: "https://default.iam.example.com/enduser/",
            appGroup: "group.com.forgerock.sso-webview",
            appGroupCookies: ["iPlanetDirectoryPro"],
            webViewFrame: self.view.bounds
        )

        webViewController.loadWebView() {
            webView in

            webView.translatesAutoresizingMaskIntoConstraints = false
            webView.tag = self.webViewTag

            self.view.addSubview(webView)
        }

        return
    }
}
