//
//  OIDExternalUserAgentiOSSafariViewController.swift
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 7/8/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//
//  Credit:
//  https://gist.github.com/WilliamDenniss/18f3779b4a310361bb955cf4e534f29c
//  https://gist.github.com/ugenlik/2a543f351e9b9425800b48266760dc85

import UIKit
import SafariServices
import AppAuth

/**
 Allows library consumers to bootstrap an SFSafariViewController as they see fit.

 Useful for customizing tint colors and presentation styles.
 */
protocol OIDSafariViewControllerFactory {
    /**
     Creates and returns a new SFSafariViewController.

     - Parameter url: The URL which the SFSafariViewController should load initially.
     */
    func safariViewControllerWithURL(url: URL) -> SFSafariViewController
}

/**
 A special-case iOS external user-agent that always uses SFSafariViewController (on iOS 9+).

 Most applications should use the more generic OIDExternalUserAgentIOS to get the default AppAuth user-agent handling with the benefits of Single Sign-on (SSO) for all supported versions of iOS.
 */
class OIDDefaultSafariViewControllerFactory: NSObject, OIDSafariViewControllerFactory {
    func safariViewControllerWithURL(url: URL) -> SFSafariViewController {
        if #available (iOS 11, *) {
            return SFSafariViewController(url: url)
        } else {
            return SFSafariViewController(url: url, entersReaderIfAvailable: false)
        }
    }
}

var gSafariViewControllerFactory: OIDSafariViewControllerFactory?

class OIDExternalUserAgentIOSSafariViewController: NSObject {
    var _presentingViewController:UIViewController = UIViewController.init()
    var _externalUserAgentFlowInProgress:Bool = false
    weak var _session:OIDExternalUserAgentSession?
    weak var _safariVC:SFSafariViewController?

    /**
     Obtains the current OIDSafariViewControllerFactory; creating a new default instance if required.
     */
    class func safariViewControllerFactory() -> OIDSafariViewControllerFactory {
        if let safariViewControllerFactory = gSafariViewControllerFactory {
            return safariViewControllerFactory
        }

        gSafariViewControllerFactory = OIDDefaultSafariViewControllerFactory.init()

        print("Forcing optional to unwrap; shouldn't fail.")

        return gSafariViewControllerFactory!
    }


    /**
     Allows library consumers to change the OIDSafariViewControllerFactory used to create new instances of SFSafariViewController.

     Useful for customizing tint colors and presentation styles.

     - Parameter factory: The OIDSafariViewControllerFactory to use for creating new instances of SFSafariViewController.
     */
    class func setSafariViewControllerFactory(factory: OIDSafariViewControllerFactory) {
        gSafariViewControllerFactory = factory
    }

    /**
     Unavailable. Please use initWithPresentingViewController:
     */
    @available(*, unavailable, message: "Please use initWithPresentingViewController")

    override init() {
        fatalError("Unavailable. Please use initWithPresentingViewController")
    }

    /**
     The designated initializer.

     - Parameter presentingViewController: The view controller from which to present the SFSafariViewController.
     */
    required init(presentingViewController: UIViewController) {
        super.init()

        self._presentingViewController = presentingViewController
    }

    func cleanUp() {
        _safariVC = nil
        _session = nil
        _externalUserAgentFlowInProgress = false
    }
}

// MARK: OIDExternalUserAgent
extension OIDExternalUserAgentIOSSafariViewController: OIDExternalUserAgent {
    func present(_ request: OIDExternalUserAgentRequest, session: OIDExternalUserAgentSession) -> Bool {
        if _externalUserAgentFlowInProgress {
            return false
        }

        _externalUserAgentFlowInProgress = true
        _session = session

        var openedSafari = false
        let requestURL = request.externalUserAgentRequestURL()

        if #available(iOS 9.0, *) {
            let Y = OIDExternalUserAgentIOSSafariViewController.self
            let safariVC = Y.safariViewControllerFactory().safariViewControllerWithURL(url: requestURL!)

            safariVC.delegate = self

            _safariVC = safariVC
            _presentingViewController.present(safariVC, animated: true, completion: nil)

            openedSafari = true
        } else {
            // Falling back to Safari.
            openedSafari = UIApplication.shared.openURL(requestURL!)
        }

        if !openedSafari {
            self.cleanUp()

            let error = OIDErrorUtilities.error(with: .safariOpenError, underlyingError: nil, description: "Unable to open Safari.")

            session.failExternalUserAgentFlowWithError(error)
        }

        return openedSafari
    }


    func dismiss(animated: Bool, completion: @escaping () -> Void) {
        if !_externalUserAgentFlowInProgress {
            // Ignore this call if there is no authorization flow in progress.
            return
        }

        guard let safariVC:SFSafariViewController = _safariVC else {
            completion()

            self.cleanUp()

            return
        }

        self.cleanUp()

        if #available(iOS 9.0, *) {
            safariVC.dismiss(animated: true, completion: completion)
        }
        else{
            completion()
        }
    }
}

// MARK: SFSafariViewControllerDelegate
extension OIDExternalUserAgentIOSSafariViewController: SFSafariViewControllerDelegate {
    func safariViewControllerDidFinish(_ controller: SFSafariViewController) {
        if controller != _safariVC {
            // Ignore this call if the safari view controller do not match.
            return
        }

        if !_externalUserAgentFlowInProgress {
            // Ignore this call if there is no authorization flow in progress.
            return
        }

        guard let session = _session else { return }

        self.cleanUp()

        let error = OIDErrorUtilities.error(with: .programCanceledAuthorizationFlow, underlyingError: nil, description: nil)

        session.failExternalUserAgentFlowWithError(error)
    }
}
