//
//  RequestViewController.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import UIKit

/**
    Provides interface for making arbitrary requests to protected resources.

    A method in the root controller is called that includes access token obtained from the OIDC Provider in the request header.
*/
class RequestViewController: UIViewController {
    let app = AppDelegate.shared.rootViewController

    override func viewDidLoad() {
        super.viewDidLoad()

        requestUrlTextView.text = (app.authState?.lastAuthorizationResponse.request.configuration.discoveryDocument?.userinfoEndpoint?.absoluteString) ?? ""
    }

    // MARK: IBActions

    @IBAction func sendRequest(_ sender: UIBarButtonItem) {
        self.requestUrlTextView.resignFirstResponder()

        let url = requestUrlTextView.text.trimmingCharacters(in: .whitespacesAndNewlines)

        guard URL(string: url) != nil else {
            app.customPrint("Invalid URL")

            return
        }

        app.makeUrlRequest(url: url, protected: true) {data, response in
            var requestResults = "No results"

            if data != nil {
                requestResults = String(bytes: data!, encoding: .utf8) ?? "No data was retrieved. Please see logs for details."
            }

            self.requestResultsTextView.insertText("\n" + requestResults + "\n")

            // Scrolling the text view to the last entry.

            let bottom = NSMakeRange(self.requestResultsTextView.text.count - 1, 1)

            self.requestResultsTextView.scrollRangeToVisible(bottom)
        }
    }

    // MARK: IBOutlets

    @IBOutlet weak var requestUrlTextView: UITextView!

    @IBOutlet weak var requestResultsTextView: UITextView!

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
