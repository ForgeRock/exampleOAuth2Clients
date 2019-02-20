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
    // MARK: Dependencies

    var sampleUrls: [String?] = []

    var makeUrlRequest: ((String, Bool, @escaping (Data?, HTTPURLResponse?, Error?, URLRequest) -> Void) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()

        requestUrlTextView.text = sampleUrls.first ?? ""

        addSampleUrls()
    }

    // MARK: @IB

    @IBOutlet weak var includeAccessToken: UISwitch!

    @IBOutlet weak var requestUrlTextView: UITextView!

    @IBOutlet weak var requestResultsTextView: UITextView!

    @IBAction func sendRequest(_ sender: UIBarButtonItem) {
        requestUrlTextView.resignFirstResponder()

        let url = requestUrlTextView.text.trimmingCharacters(in: .whitespacesAndNewlines)

        guard URL(string: url) != nil else {
            addTextToResultsTextView("Invalid URL")

            return
        }

        makeUrlRequest?(url, self.includeAccessToken.isOn) {data, response, error, request in
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "HH:mm:ss"

            var text = ""

            text += dateFormatter.string(from: Date()) + "\n"

            text += "\nREQUEST:\n"
            text += "URL: " + (request.url?.absoluteString ?? "") + "\n"

            text += "HEADERS: \n"
            request.allHTTPHeaderFields?.forEach({header in
                text += "\"\(header.key)\": \"\(header.value)\"\n"
            })

            text += "\nRESPONSE:\n"

            if let response = response {
                text += "Status Code: " + String(response.statusCode) + "\n"

                text += "HEADERS:\n"
                response.allHeaderFields.forEach({header in
                    text += "\"\(header.key)\": \"\(header.value)\"\n"
                })
            } else {
                text += "Non-HTTP response\n"
            }

            text += "\nDATA:\n"
            if let data = data {
                text += String(bytes: data, encoding: .utf8)!
            }

            self.addTextToResultsTextView(text)
        }
    }

    func addTextToResultsTextView(_ text: String) {
        let text = "\n" + text + "\n"

        // requestResultsTextView.insertText(text)

        requestResultsTextView.text += text

        // Scrolling the text view to the last entry.

        let bottom = NSMakeRange(self.requestResultsTextView.text.count - 1, 1)

        self.requestResultsTextView.scrollRangeToVisible(bottom)

        // Accommodating an iOS bug that may prevent scrolling under certain circumstances.
        requestResultsTextView.isScrollEnabled = false
        requestResultsTextView.isScrollEnabled = true
    }

    func addSampleUrls() {
        var text = ""

        sampleUrls.enumerated().forEach({index, value in
            if let value = value {
                text += value + "\n"
            }
        })

        if text.count > 0 {
            text = "Sample URLs:\n" + text

            addTextToResultsTextView(text)
        }

    }
    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
