(function () {
    /*
     * This code is designed to execute within the main (top-level)
     * browser environment as part of a single-page applciation (SPA).
    */

    /*
     * Attach a hidden iframe onto the main document body that is used to perform
     * background access token renewal and OP-session checking, in addition
     * to handling the main PKCE-based authorization code flow performed in the foreground.
     */
    var iframe = document.createElement("iframe");
    iframe.setAttribute("src", "appAuth.html" + window.location.hash);
    iframe.setAttribute("id", "appAuthFrame");
    iframe.setAttribute("style", "display:none");
    document.getElementsByTagName("body")[0].appendChild(iframe);

    // track xhr requests which have failed due to token expiration
    var pendingQueue = [];
    function addRequestToPendingQueue(xhr) {
        pendingQueue.push(xhr);
    }

    /**
     * Accepts an xhr object that has been completed (after "loadend") and checks to see
     * if it includes a response header that indicated that it failed due to an invalid token
     * @returns boolean - true if due to invalid_token, false otherwise
     */
    function checkForTokenFailure(xhr) {
        var response_headers = xhr.getAllResponseHeaders()
            .split("\n")
            .map(function (header) {
                return header.split(": ");
            })
            .reduce(function (result, pair) {
                if (pair.length === 2) {
                    result[pair[0]] = pair[1];
                }
                return result;
            }, {});

        if (response_headers['www-authenticate'] && response_headers['www-authenticate'].match(/^Bearer /)) {
            var auth_details = response_headers['www-authenticate']
                .replace(/^Bearer /, '')
                .match(/[^,=]+=".*?"/g)
                .reduce(function (result, detail) {
                    var pair = detail.split('=');
                    result[pair[0]] = pair[1].replace(/"(.*)"/, "$1");
                    return result;
                }, {});

            if (auth_details['error'] === "invalid_token") {
                return true;
            }
        }

        return false;
    }

    /*
     * Override default implementations of the XMLHttpRequest object, so as to provide
     * the option to automatically renew tokens upon token failures.
     */
    var RealXHRSend = XMLHttpRequest.prototype.send;
    var RealEventListener = XMLHttpRequest.prototype.addEventListener;

    /**
     * Overrides the addEventListener method by adding a "queue" mechanism. This way all event listeners
     * will be notified in the order they requested, but only when we are ready for them to be notified.
     */
    XMLHttpRequest.prototype.addEventListener = function (name, callback) {
        if (!this.eventListenerCallbackQueue) {
            this.eventListenerCallbackQueue = {};
        }
        if (!this.eventListenerCallbackQueue[name]) {
            this.eventListenerCallbackQueue[name] = [callback];
        } else {
            this.eventListenerCallbackQueue[name].push(callback);
        }
    };

    /**
     * Override send method of all XHR requests in order to intercept invalid_token failures
     * Also use this opportunity to notify the appAuthFrame of xhr activity, so as to give it a chance
     * to check for OP session validity
     */
    XMLHttpRequest.prototype.send = function(data) {
        var xhr = this;
        var RealOnLoad = xhr.onload;

        // every event besides "loadend" will be just sent to the built-in event listener
        ["loadstart","progress","error","abort","load"].forEach(function (eventName) {
            if (this.eventListenerCallbackQueue && this.eventListenerCallbackQueue[eventName]) {
                this.eventListenerCallbackQueue[eventName].forEach(function (callback) {
                    RealEventListener.call(xhr, eventName, callback);
                });
            }
        });

        if (RealOnLoad) {
            xhr.addEventListener("loadend", RealOnLoad);
            xhr.onload = null;
        }

        // "loadend" will be handled by us, first
        RealEventListener.call(xhr, "loadend", function() {
            if (checkForTokenFailure(xhr)) {
                // It is possible that multiple simultaneous xhr requests will fail before we can renew the token.
                // This is why we add them all to a queue, while we wait for the new token to be available.
                addRequestToPendingQueue(xhr);
                // We ask the appAuthFrame to renew the tokens for us
                document.getElementById("appAuthFrame").contentWindow.postMessage("renewToken", document.location.origin);
            } else if (this.eventListenerCallbackQueue && this.eventListenerCallbackQueue["loadend"]) {
                xhr.eventListenerCallbackQueue["loadend"].forEach(function (callback) {
                    callback(xhr);
                });
            }
        }, false);

        // notify the appAuthFrame that we are making xhr requests
        document.getElementById("appAuthFrame").contentWindow.postMessage("xhrSend", document.location.origin);

        RealXHRSend.apply(this, arguments);
    };

    /**
     * Handle the "tokensRenewed" message so that we can complete the callbacks
     * for each of the failed xhr requests. We wait until then so that the xhr
     * failure handlers can immediately retry their request, knowing the tokens
     * will be current.
     */
    window.addEventListener("message", function (e) {
        if (e.origin !== document.location.origin) {
            return;
        }
        switch (e.data) {
            case "tokensRenewed":
                var xhr;
                while (xhr = pendingQueue.shift()) {
                    if (xhr.eventListenerCallbackQueue["loadend"]) {
                        xhr.eventListenerCallbackQueue["loadend"].forEach(function (callback) {
                            callback(xhr);
                        });
                    }
                }
            break;
        }

    }, false);
}());
