//
//  OIDExternalUserAgentIOSSafari.swift
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 7/8/19.
//  Copyright © 2019 Forgerock AS.
//

import UIKit
import AppAuth

class OIDExternalUserAgentIOSSafari: NSObject {
    var _presentingViewController: UIViewController = UIViewController.init()
    var _externalUserAgentFlowInProgress: Bool = false
    weak var _session: OIDExternalUserAgentSession?

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
        _session = nil
        _externalUserAgentFlowInProgress = false
    }
}

// MARK: OIDExternalUserAgent
extension OIDExternalUserAgentIOSSafari: OIDExternalUserAgent {
    func present(_ request: OIDExternalUserAgentRequest, session: OIDExternalUserAgentSession) -> Bool {
        if _externalUserAgentFlowInProgress {
            return false
        }

        _externalUserAgentFlowInProgress = true
        _session = session

        var openedSafari = false
        let requestURL = request.externalUserAgentRequestURL()

        if #available(iOS 10.0, *) {
            openedSafari = UIApplication.shared.canOpenURL(requestURL!)

            UIApplication.shared.open(requestURL!, options: [:], completionHandler: nil)
        } else {
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

        completion()

        self.cleanUp()

        return
    }
}
