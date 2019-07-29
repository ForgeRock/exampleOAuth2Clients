//
//  WebViewController.js
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 7/19/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

(function () {
    if (window.webkit) {
        var response = {
            "authId": "authId",
            "callbacks": [
                {
                    "type": "code",
                    "input": [],
                    "output": []
                }
            ]
        }

        window.webkit.messageHandlers.callback.postMessage(JSON.stringify(response))
    }
}())
