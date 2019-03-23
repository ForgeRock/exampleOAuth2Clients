# <a id="top"></a>OAuth 2.0 Authorization Code Grant protected by PKCE for an iOS App with the AppAuth SDK

## Contents

* [Preface](#preface)
* [Introduction](#intro)
* [Building a simple app with Swift and AppAuth](#simple)
* [ForgeRock example](#full)
* [Conclusion](#conclusion)

## <a id="preface"></a> Preface: A note about standards

_"The   analysis   found   a   positive   and   significant   contribution   of   standards   to   productivity – supporting  37.4%  of  annual  labour  productivity  growth  in  the  UK  economy  over  the  period  1921  to  2013,  which  translates  into  approximately  28.4%  of  annual  GDP  growth –  a  similar  finding to that of other recent national level studies in France and Germany."_

_"One of the first [standards] to be introduced in the UK [was] the standardization of the number of tram gauge specifications . . . "_

British Standards Institution, 2015

_"And the Lord said, Behold, the people is one, and they have all one language; and this they begin to do: and now nothing will be restrained from them, which they have imagined to do."_

KJB

It is easy to see how adopting standards makes a railroad an efficient way of transporting goods (and their consumers), because all interested parties are in agreement on direction, schedule, and the wheel gauge. At the same time, creativity is somewhat limited in that area. After all, it is hard to do wheelies or donuts on a train, for it's just not built for such flexibility. (That's why it was the technology of choice in the infamous _[trolley problem](https://en.wikipedia.org/wiki/Trolley_problem)_.)

Neil deGrasse Tyson said once, "If you want to be more creative, be less productive." On the way to delivering a software solution, the developer must strike a balance between creativity and productivity at every stage. In the process of inventing computers, defining network protocols and programming languages, and creating operating systems, libraries, services, and applications, the number of participants increases with each level of abstraction. Consequently, on the way up this "food chain", the effects of underlying quality and presence of stable interfaces in the lower level solution become more profound. At the same time, the original research _should_ play a less important role, so that any extra capacities may be allocated for addressing proprietary, specific business needs. A standard, technical or _de facto_, is an _accepted_ level of such abstraction. The wider it is accepted, the more support it will receive from the community, and the more efficiently it may be exploited. Efficiency drives productivity when business solutions are found more readily and with less effort, which is important, because the gains in effort are multiplied by the number of participants.

Thus, it seems, a software solution provider needs to identify the highest (that is, easiest to deal with) widely accepted level of abstraction that can be employed in its service/product. Then, that standard should be employed. The least amount of creativity should be _required_ from the consumers. Any non-standard solution should be sought-after only if there is no standard approach to address a particular issue. Of course, there is developer pride and other more pragmatic concerns that may lead to competing standards:

![how standards proliferate](README_files/standards.more.better.png)

In the context of REST API protection, however, there seems to be a clear leader&mdash;the [OAuth 2.0](https://tools.ietf.org/html/rfc6749) authorization framework with extensions galore*. In this document we will leverage terminology defined in OAuth 2.0 protocol and one of its extensions: [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html). We will also take into consideration the current best practices for building native OAuth 2.0 clients; that is, applications running on the end-user's (mobile) device.

> \* The number of OAuth 2.0 extensions resembles a relatively long branch in the evolutionary tree that has not been trimmed by natural selection. Time will tell whether it remains, produces a new genus, or is surpassed by a competitor and goes extinct, leaving only fossils at tools.ietf.org.

## <a id="intro"></a> Introduction

[Back to top](#top)

Recommendations for OAuth 2.0 implementation in Native Apps are summarized in [RFC8252](https://tools.ietf.org/html/rfc8252) and provide following key points:

1. OAuth 2.0 authorization requests from native apps should only be made through external user-agents (as opposed to embedded user-agents, like "web views"), typically the system browser or its programmatic instantiation called the "in-app browser tab".

    Employing an external user-agent keeps the end-user credentials away from the native client and may provide access to the system browser's session information, thus allowing for single sign on (SSO) experience. The browser's URL address bar may also serve as a security device providing the end-user with an option to make an informed decision before falling victim of a phishing attack. The "in-app browser tab" implementation is to allow for accessing the browser's authentication state and security context without leaving the native app.

0. The authorization request should be made with the [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1) grant.

    In most cases native apps cannot maintain the confidentiality of a client secret, making them [OAuth 2.0 public clients](https://tools.ietf.org/html/rfc6749#section-2.1), for the (statically included) secret would be shared between instances of an app and available for retrieval. Public clients have two types of grants available to implement: [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1) and [Implicit](https://tools.ietf.org/html/rfc6749#section-1.3.2).

    In both cases a native app needs to be able to serve the redirection URI. In the context of a mobile iOS application the [Private-Use (custom) URI Scheme Redirection](https://tools.ietf.org/html/rfc8252#section-7.1) is most commonly employed. Multiple apps can potentially register the same private-use URI scheme on a device and be able to intercept the authorization response. The authorization code grant allows for mitigating interception attacks with the [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE) extension, which is not applicable in its current implementation to the implicit grant.

    In addition, the Authorization Code grant provides an option for re-obtaining access tokens without user interaction by utilizing refresh tokens.

0. In order to prevent [Client Impersonation](https://tools.ietf.org/html/rfc8252#section-8.6) the authorization
   server should not process authorization requests for a public client automatically,
   without user consent or interaction.

   Using PKCE by itself does not cover a peculiar case of a malicious client _initiating_ the authorization code grant with its own `code_challenge` from the same device where a legitimate app exists and the resource owner is already authenticated, [impersonating](https://tools.ietf.org/html/rfc8252#section-8.6) the legitimate app.

   In this case the end-user should be called for interaction prior to completing the authorization request. This can be achieved by requiring a consent screen. For example, the authorization server may ask the user to authorize the client for accessing certain predefined `scopes` associated with the client's account.

   ### The "first-party" apps

   Often, mobile applications are developed by the same business entity as the one they consume resources from. These apps may be described as "first-party" clients. In the context of a "first-party" application the consent screen may seem redundant and distracting. In order to avoid it, the client needs to authenticate with the authorization server. A client _may_ be identified by employing the [Claimed "https" Scheme URI Redirection](https://tools.ietf.org/html/rfc8252#section-7.2), which in Apple's case is called [Universal Links](https://developer.apple.com/documentation/uikit/core_app/allowing_apps_and_websites_to_link_to_your_content/enabling_universal_links). With the client identity confirmed no explicit consent dialog may be required from the authorization server.

   Apple, however, does not seem to allow switching between apps without user consent. As a result, there are currently reports ([example](http://www.openradar.appspot.com/19944416)) that App Store rejects apps using mobile Safari for redirection flows:

   > We noticed an issue in your app that contributes to a lower quality user experience than Apple users expect . . . Upon launching the app, a web page in mobile Safari opens for logging in . . . , then returns the user to the app. The user should be able to log in without opening Safari first.

   This means that in iOS (bear with me, I am getting to the point) one is to use designated "in-app browser tab" classes for visiting the authorization server endpoints:

   * [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) (iOS 12.0+)
   * [SFAuthenticationSession](https://developer.apple.com/documentation/safariservices/sfauthenticationsession) (iOS 11.0–12.0 Deprecated)
   * [SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller) (iOS 9.0+)

    The authentication classes, `ASWebAuthenticationSession` and `SFAuthenticationSession`, will _automatically_ present a dialog asking the end-user to give explicit consent to access the website’s data (and the existing login information) in Safari every time the authentication endpoint is visited. This makes the consent screen unavoidable in the current implementation of the authentication classes. On the other hand, this provides consistent user experience when consent is needed, for example, to prevent client impersonation when a private-use URI scheme is employed.

    > [According to Apple](https://developer.apple.com/support/app-store/), less than ten percent of all devices are using iOS below version 11.

    ### The single sign on (SSO) experience

    In addition, none of the authentication classes seem to share session (i.e. transient) cookies with their other instances or mobile Safari. In turn, this means one needs to use persistent cookies in order to implement SSO in iOS in a compliant with `RFC8252` way. Even then, there have been reports ([example](http://www.openradar.me/radar?id=5036182937272320)) of slow/unreliable synchronization between the classes and mobile Safari cookie jars. On the other hand, if no SSO is needed this sharing cookies policy seems to be covering the client impersonation case when session cookies are used for the end-user authentication.

The included example iOS applications play the role of an [OpenID Connect](https://openid.net/connect/) (OIDC) [Relying Party](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (RP) and use the [AppAuth-iOS SDK](https://github.com/openid/AppAuth-iOS) for authorizing the RP against an [OIDC Provider](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) (OP). The AppAuth SDK follows the best practices described in `RFC8252` by extending the OAuth 2.0 protocol with PKCE and employing an external user agent for visiting the OP's authentication and authorization endpoints. Access tokens obtained during the authorization process are then included as [Bearer Token](https://tools.ietf.org/html/rfc6750) value of the `Authorization` header in requests made to protected endpoints on a [Resource Server](https://tools.ietf.org/html/rfc6749#section-1.1) (RS).

***

## <a id="simple"></a>Building a simple app with Swift and AppAuth

[Back to top](#top)

The purpose of this exercise is to build from scratch (step-by-step, each of which will be commented on) the most basic app capable of performing HTTP requests to a resource protected with OAuth 2.0. Xcode 10 and Swift 4 environment and iOS 9-12 targets will be assumed. The AppAuth SDK for iOS will be employed to perform the authorization flow.

> The URIs and the private-use scheme used below serve demonstrational purposes; feel free to replace them with your own OP and RP specifics.

> The completed Xcode project is located on [GitHub](https://github.com/ForgeRock/exampleOAuth2Clients/) under `/iOS-AppAuth/iOS-AppAuth-Basic` and could be used as a quick reference. A [short video](https://forgerock.wistia.com/medias/r7yn6bpfle) demonstrates the final result.

We will build the app in a few implementation steps:

* [Enabling TLS in development environment](#simple-https)
* [Collecting information about the OP](#simple-op)
* [Collecting information about the RP](#simple-rp)
* [Setting up Xcode project and adding the AppAuth SDK](#simple-xcode)
* [Copy 'n' Paste](#simple-app)
* [In fine](#simple-conclusion)

0. <a id="simple-https"></a>Enabling TLS in development environment

    [Back to Building a simple app with Swift and AppAuth](#simple)

    If your OAuth 2.0 development servers (the OP and the RS) require HTTPS and use self-signed certificates you will need to accommodate that as described in [Apple's Technical Q&A: HTTPS and Test Servers](https://developer.apple.com/library/archive/qa/qa1948/_index.html).

    To install a CA root certificate on an iOS device simulator, for example, drag and drop the certificate file on a, preferably `Settings`, screen, follow the installation prompt, and, on a more recent version of iOS, enable the certificate in `General` > `About` > `Certificate Trust Settings`. It may take more than one attempt to engage the installation process. In that case don't get discouraged and keep trying; eventually the simulator will cooperate.

    > A [short video](https://forgerock.wistia.com/medias/1wft6023jm) shows the installation flow on an iOS 12.1 simulator.

0. <a id="simple-op"></a>Collecting information about the OP

    [Back to Building a simple app with Swift and AppAuth](#simple)

    The AppAuth SDK for iOS provides an option to specify location of the [OpenID Provider Configuration Document](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) if it is supported by the OP. In this case, all endpoints necessary for the authorization flow could be obtained automatically by the SDK from the well-known location.

    > You can read more about OIDC discovery configuration and see a sample of the data returned from the well-known endpoint in [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) (AM) [documentation](https://backstage.forgerock.com/docs/am/6/oidc1-guide/#configure-openid-connect-discovery). If you have an AM instance running you will be able to see a live version of the configuration document at `https://your-am-instance/oauth2/.well-known/openid-configuration`.

    Alternatively, the OP's endpoints that will be used in the authorization process can be provided manually. In this case, you will need values for the following items described in the [OpenID Provider Metadata](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata) specification:

    * _issuer_
    * _authorization_endpoint_
    * _token_endpoint_
    * (optional) _userinfo_endpoint_
    * (optional) _end_session_endpoint_

0. <a id="simple-rp"></a>Collecting information about the RP

    [Back to Building a simple app with Swift and AppAuth](#simple)

    You will need following details about the RP (i.e. client) registration with the OP, as described in the [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749) spec:

    * _client_id_
    * _redirect_uri_
    * _scope_: the scopes available for this client (to choose from when sending the authorization request)

    Means to obtain the RP registration details are specific to the OP and not covered here. For example, you can consult the [Registering OAuth 2.0 Clients With the Authorization Service](https://backstage.forgerock.com/docs/am/6/oauth2-guide/#register-oauth2-client) guide on creating and obtaining client credentials and scopes for an RP registered with ForgeRock Access Management.

    > You could also refer to the [ForgeRock example](#full) section, where the process of registering a client is described in the context of a running ForgeRock platform sample.

    For the purpose of this example, we will use a private-use URI scheme for the redirection URI: `com.forgeops.ios-appauth-basic:/oauth2/forgeops/redirect`.

    > AppAuth also supports [Universal Links](https://developer.apple.com/documentation/uikit/core_app/allowing_apps_and_websites_to_link_to_your_content). However, because of the extra steps required for trying this approach (including the app been deployed in the App Store), we will not cover it here.

    Note, that the full and exact redirection URI MUST be registered for the RP with the OP.

0. <a id="simple-xcode"></a>Setting up [Xcode](https://developer.apple.com/xcode/) project and adding the AppAuth SDK

    For the purposes of this example, we will assume Xcode 10 environment, Swift 4.2, and the sample application built down to iOS 9.0 - to demonstrate some important differences in versions below iOS 11.

    > According to unofficial market share stats, less than one percent of all devices are using iOS below version 9.

    Follow the steps below:

    1. Creating the project

        Create a new `Single View App` Xcode project for `iOS` choosing `Swift` as the language:

        > File > New > Project... > Single View App

        Follow the prompts and provide Product Name and Organization details. Save the new project at desired location.

        > If desired, provide a `Display Name` that will appear on the iOS device.

    0. Installing the dependency manager

        Install [Carthage](https://github.com/Carthage/Carthage).

        We will add the AppAuth framework to the project with Carthage. This unobtrusive dependency manager makes no changes to the Xcode project, making it easy to maintain.

        > You can also add the SDK as a static library or with [CocoaPods](https://guides.cocoapods.org/using/getting-started.html), as described in the [AppAuth for iOS documentation](https://github.com/openid/AppAuth-iOS#setup).

    0. Setting AppAuth as a project dependency

        Navigate to the project root (that is, where `your-project-name.xcodeproj` is located) and create a `Cartfile` file; add the following line:

        > github "openid/AppAuth-iOS" "master"

        For example:

        ```bash
        echo 'github "openid/AppAuth-iOS" "master"' > Cartfile
        ```

        In the project root, run:

        ```bash
        carthage bootstrap --platform ios
        ```

        This will build the AppAuth framework for `iOS` in your project under `Carthage` directory, according to the dependency specified in `Cartfile` and to the provided `--platform` option.

        > Not providing the platform option will result in building frameworks for all supported platforms, which won't hurt but may prove unnecessary.

        > The artifacts created by Carthage (namely `Carthage/Build` and `Carthage/Checkouts`) may be optionally committed to version control. This is advisable if the dependencies are not recreated (and possibly updated) in the project's other instances.

    0. Setting up AppAuth framework

        In the Xcode project Navigator select the project and then the target under `TARGETS`. Under `General` tab, scroll down to `Linked Frameworks and Libraries` and add the AppAuth framework:

        Click on `+` and then on `Add Other...` , navigate to _`your-project-root`_ > `Carthage` > `Build` > `iOS`, and select `AppAuth.framework`; then, click `Open`.

        ![Screenshot](README_files/xcode.target.general.frameworks.png)

        Next switch over to the target's `Build Phases` tab and add a new `Run Script` build phase:

        Click on `+`, select `New Run Script Phase`, expand the newly created `Run Script` entry, and add the following shell command _under_ `Shell` (do not change the Shell path):

        ```bash
        /usr/local/bin/carthage copy-frameworks
        ```

        Under `Input Files` click on `+` and add:

        ```bash
        $(SRCROOT)/Carthage/Build/iOS/AppAuth.framework
        ```

        ![Screenshot](README_files/xcode.target.build-phases.run-script.png)

        > At any point of building the app, including this very point, you can change the iOS deployment target under `Building Settings`.

0. <a id="simple-app"></a>Copy 'n' Paste

    [Back to Building a simple app with Swift and AppAuth](#simple)

    Organizing the code for this app will consist of several distinct steps; after each step you should be able to build and run the app. Copy-and-paste is all you need to do to get started, but along the way we will also explain what the steps do:

    * [Handling OAuth 2.0 redirection](#simple-app-redirection)
    * [Making AppAuth available in the main controller](#simple-app-appauth)
    * [Providing OP configuration to the authorization services](#simple-app-op)
    * [Providing RP configuration to the authorization services](#simple-app-rp)
    * [Making authorization request](#simple-app-request)
    * [Maintaining authorization state](#simple-app-state)
    * [Authorizing the RP](#simple-app-auth)
    * [Making API requests](#simple-app-api)
    * [Decoding ID Token](#simple-app-id)
    * [Optional](#simple-app-ui)
    * [Completely Optional](#simple-app-ui-extra)

    1. <a id="simple-app-redirection"></a>Handling OAuth 2.0 redirection

        [Back to Copy 'n' Paste](#simple-app)

        In iOS 11-12 environment, AppAuth employs designated authentication classes serving as the "in-app browser tabs" for making authorization requests:

        * [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) (iOS 12.0+)
        * [SFAuthenticationSession](https://developer.apple.com/documentation/safariservices/sfauthenticationsession) (iOS 11.0–12.0 Deprecated)

        In the current AppAuth implementation these classes are initialized with the [callbackURLScheme](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/2990952-init) argument which allows the app to receive the redirection URI the authorization request was made with.

        ### Supporting older iOS versions

        In iOS 9-10, however, [SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller) is used to perform the authorization request. This view controller does not provide an option to be initialized with a private-use callback scheme; hence, one needs to be added to be the project's `Info.plist` in order for the app to be able to respond to the redirection URI.

        > The same applies to iOS versions below 9, which use mobile Safari as the external user-agent.

        To specify the redirection URI scheme in `Info.plist`:

        * Add `URL types` key to `Information Property List` (the corresponding "raw" value is `CFBundleURLTypes`; right click on the key list and check "Show Raw Keys/Values" to have it shown).
        * Fully expand the key and populate it with a single `URL Schemes` (`CFBundleURLSchemes`) item.
        * Populate `URL Schemes` with a single item of the type `String` with the scheme of your redirection URI. The scheme is everything before the colon (`:`). For example, if the redirect URI is `com.forgeops.ios-appauth-basic:/oauth2/forgeops/redirect`, then the scheme would be `com.forgeops.ios-appauth-basic`.

        ![Screenshot](README_files/xcode.info.plist.url-scheme.png)

        With the URL scheme registered, the redirection URI will be delivered to the app. This will bring it to the foreground and call the AppDelegate's [application(_:open:options:)](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623112-application) method. (AppAuth will automatically close the external user agent instance.)

        > Please see the conditions for invoking this method in its documentation referenced above.

        In `application(_:open:options:)` the incoming URL can be parsed and an AppAuth handler for the authorization response can be provided. We will need to import the AppAuth SDK first; at the top of `AppDelegate.swift` add:

        ```swift
        // AppDelegate.swift

        // MARK: Importing the AppAuth SDK
        import AppAuth
        ```

        Then provide the following declarations to the AppDelegate class that will create a placeholder for the authorization session and refer to it during the redirection:

        ```swift
        // AppDelegate.swift

        class AppDelegate: UIResponder, UIApplicationDelegate {

            // . . .

            /**
            An AppAuth property to hold the session, in order to continue the authorization flow from the redirection.
            */
            var currentAuthorizationFlow: OIDExternalUserAgentSession?

            func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
                /*
                Sending the redirection URL to the existing AppAuth flow, if any, for handling the authorization response.
                */
                if let authorizationFlow = self.currentAuthorizationFlow, authorizationFlow.resumeExternalUserAgentFlow(with: url) {
                    self.currentAuthorizationFlow = nil

                    return true
                }

                return false
            }

            // . . .
        ```

        > Don't worry about lack of indentation in the comments, when pasted in Xcode  they will be aligned according to the convention in place.

    0. <a id="simple-app-appauth"></a>Making AppAuth available in the main controller

        [Back to Copy 'n' Paste](#simple-app)

        In order to make AppAuth functionality available in the main view controller, at the top of (automatically created) `ViewController.swift` import the AppAuth SDK:

        ```swift
        // ViewController.swift

        // MARK: Importing the AppAuth SDK
        import AppAuth
        ```

    0. <a id="simple-app-op"></a>Providing OP configuration to the authorization services

        [Back to Copy 'n' Paste](#simple-app)

        Ultimately, the AppAuth library performs client authorization via an `OIDAuthorizationRequest` instance initiated with the following parameters:

        * _configuration_: an AppAuth's `OIDServiceConfiguration` instance
        * _clientId_: the RP's client ID as it's been registered on the OP's authorization server
        * _clientSecret_ (optional): may be populated for dynamically registered clients
        * _scopes_: the (subset of) scopes provided in the RP registration
        * _redirectURL_: a redirection URI associated with the RP registration
        * _additionalParameters_ (optional): whatever else that may be handled at the [OAuth 2.0 Authorization Endpoint](https://tools.ietf.org/html/rfc6749#section-3.1)

        ### Option 1

        The configuration parameter contains the OP's endpoint information and can be provided to the AppAuth authorization service manually. For example, add following extension to the main view controller (outside of the class definition):

        ```swift
        // ViewController.swift

        // . . .

        // MARK: OIDC Provider configuration
        extension ViewController {
            /**
            Returns OIDC Provider configuration.

            In this method the endpoints are provided manually.
            */
            func getOIDCProviderConfiguration() -> OIDServiceConfiguration {
                let configuration = OIDServiceConfiguration.init(
                    authorizationEndpoint: URL(string: "https://sample.iam.forgeops.com/am/oauth2/authorize")!,
                    tokenEndpoint: URL(string: "https://sample.iam.forgeops.com/am/oauth2/access_token")!
                )

                return configuration
            }
        }
        ```

        > `authorizationEndpoint` and `tokenEndpoint` are necessary for authorization of an existing client. To enable additional interactions with the OP, e.g. dynamic client registration, RP initiate logout, etc., other endpoints may be provided.

        ### Option 2

        Alternatively, if the OP supports issuer discovery, the configuration object may be populated automatically from the issuer's `/.well-known/openid-configuration` endpoint, as described in the [OpenID Connect Discovery specs](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig). Doing so has advantage of dynamically accessing the OP's current endpoint information. This, however, is done by making an HTTP request; hence, obtaining the configuration becomes a slower asynchronous task which requires a completion handler. For example, add the following method to the extension you just created:

        ```swift
        // ViewController.swift

        // . . .

        // MARK: OIDC Provider configuration
        extension ViewController {
            // . . .

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
                OIDAuthorizationService.discoverConfiguration(forIssuer: issuer) {configuration, error in
                    // Completing with the caller's callback.
                    completion(configuration, error)
                }
            }
        }
        ```

        > Both methods could be implemented to accommodate different OIDC Providers.

    0. <a id="simple-app-rp"></a>Providing RP configuration to the authorization services

        [Back to Copy 'n' Paste](#simple-app)

        Whichever way the issuer configuration is obtained, to initiate an `OIDAuthorizationRequest` instance you will need to provide `clientId`, `scopes`, and `redirectURL` parameters. Add following definitions to the main _class_:

        ```swift
        // ViewController.swift

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

            // . . .
        ```

        > The OP and RP properties can also be made available as global variables or in other ways. It seems reasonable to assume that an app represents a single OAuth 2.0 Client or OIDC Relying Party.

    0. <a id="simple-app-request"></a>Making authorization request

        [Back to Copy 'n' Paste](#simple-app)

        The AppAuth SDK allows for obtaining an authorization code and manually exchanging it for a token at the OP's `token_endpoint`. Alternatively, the code exchange can be performed automatically. In this example we will follow the latter pattern by adding the following method to the main class (via an extension):

         ```swift
        // ViewController.swift

        // . . .

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

                appDelegate.currentAuthorizationFlow = OIDAuthState.authState(byPresenting: request, presenting: self) {authState, error in
                    completion(authState, error)
                }
            }
        }
        ```

        > In theory, an RP may be authorized with multiple providers; hence, it may be beneficial to allow the caller of the authorization method to handle the authorization response (differently for different OPs) via the completion handler.

    0. <a id="simple-app-state"></a>Maintaining authorization state

        [Back to Copy 'n' Paste](#simple-app)

        We can now make an authorization request, but we are not quite ready to handle it. If authorization is successful, an authorization state object becomes available and needs to be maintained.

        From AppAuth documentation:

        > OIDAuthState is a class that keeps track of the authorization and token requests and responses, and provides a convenience method to call an API with fresh tokens. This is the only object that you need to serialize to retain the authorization state of the session.

        In this example we will cover a single OP scenario and maintain only one authorization state instance. In the main class definition, add a property to hold a single authorization state:

        ```swift
        // ViewController.swift

        class ViewController: UIViewController {
            // . . .

            /**
            Class property to store the authorization state.
            */
            private var authState: OIDAuthState?

            // . . .
        ```

        The authorization state (that may contain token information) will be updated with responses received from the authorization server and cleared out on errors. It can be changed in the app code and also in the AppAuth SDK internally. The authorization state can also be serialized and saved in a user specific storage, being preserved between app launches; then, every time the state changes the persistent storage will need to be updated.

        First, we will add another property to the main class to specify the key under which the authorization state will be stored:

        ```swift
        // ViewController.swift

        class ViewController: UIViewController {
            // . . .

            /**
            The key under which the authorization state will be saved in a keyed archive.
            */
            let authStateKey = "authState"

            // . . .
        }
        ```

        Then we will provide a set of methods for setting, saving, and loading the authorization state and group them under another extension for the main class:

        ```swift
        // ViewController.swift

        // . . .

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
            }

            /**
            Assigns the passed in authorization state to the class property.
            Assigns this controller to the state delegate property.
            */
            func setAuthState(_ authState: OIDAuthState?) {
                if (self.authState != authState) {
                    self.authState = authState

                    self.authState?.stateChangeDelegate = self

                    self.stateChanged()
                }
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

                print("Expiration date: \(String(describing: authState?.lastTokenResponse?.accessTokenExpirationDate))")
            }
        }
        ```

        > Initially, `self.authState?.stateChangeDelegate = self` line will produce an error in Xcode, because we didn't conform to the `stateChangeDelegate` property protocol yet; please see below.

        To accommodate the authorization state change events that occur in the SDK itself, we will implement a delegate by adopting the AppAuth's `OIDAuthStateChangeDelegate` protocol in a separate main class extension:

        ```swift
        // ViewController.swift

        // . . .

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
        ```

        In addition, the app will log any authorization errors that may occur in the SDK by implementing yet another delegate:

        ```swift
        // ViewController.swift

        // MARK: OIDAuthState delegates

        // . . .

        extension ViewController: OIDAuthStateErrorDelegate {
            /**
            Reports authorization errors in the AppAuth library.
            */
            func authState(_ state: OIDAuthState, didEncounterAuthorizationError error: Error) {
                print("Received authorization error: \(error)")
            }
        }
        ```

    0. <a id="simple-app-auth"></a>Authorizing the RP

        [Back to Copy 'n' Paste](#simple-app)

        In the extension marked "Authorization methods" add following method that will accept the OP's issuer URL (which can be used for OIDC discovery) or an already built OP configuration object:

        ```swift
        // ViewController.swift

        // . . .

        // MARK: Authorization methods
        extension ViewController {
            // . . .

            /**
            Authorizes the Relying Party with an OIDC Provider.

            - Parameter issuerUrl: The OP's `issuer` URL to use for OpenID configuration discovery
            - Parameter configuration: Ready to go OIDServiceConfiguration object populated with the OP's endpoints
            */
            func authorizeRp(issuerUrl: String?, configuration: OIDServiceConfiguration?) {
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
                    ) {authState, error in
                        if let authState = authState {
                            self.setAuthState(authState)

                            print("Successful authorization.")

                            self.showState()
                        } else {
                            print("Authorization error: \(error?.localizedDescription ?? "")")

                            self.setAuthState(nil)
                        }
                    }
                }

                if let issuerUrl = issuerUrl {
                    // Discovering OP configuration
                    discoverOIDServiceConfiguration(issuerUrl) {configuration, error in
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

        // . . .
        ```

        > In the code example above we added the new method to the extension marked "Authorization methods", so that related functionality is kept in groups. This, however, is not necessary and the method can exist in any part of the main class definition.

        At the time the app is launched you can always authorize the RP or check for an existing authorization state saved in the user's storage and only authorize if none is found.

        Let's assume that the OP supports OIDC Discovery, its OpenID configuration document is available at the well-known endpoint, and we are not afraid to use it (as mentioned before, doing so involves making an HTTP request, a relatively slow and asynchronous operation). In that case, `discoverOIDServiceConfiguration` method will be utilized for obtaining the OP's endpoint configuration.

        Whichever way the configuration is obtained, it will be passed to `authorizeWithAutoCodeExchange` method for constructing the authorization request. When the flow is completed, the authorization state will be set or an error will be handled. In our example we will modify the `viewDidLoad` handler and also add the `issuerUrl` property to the main class (so that it can hold a default value):

        ```swift
        // ViewController.swift

        class ViewController {
            // . . .

            /**
            OpenID Connect issuer URL, where the OpenID configuration can be obtained from.
            */
            let issuerUrl: String = "https://sample.iam.forgeops.com/am/oauth2"

            override func viewDidLoad() {
                super.viewDidLoad()
                // Do any additional setup after loading the view, typically from a nib.

                loadState()

                showState()

                if authState == nil {
                    authorizeRp(issuerUrl: issuerUrl, configuration: nil)
                }
            }
        }
        ```

        Build and run the application. It should prompt you to sign in at the OP's authentication endpoint and provide a means for authorizing the application. In your Xcode project logs you should see access and ID tokens obtained from the OP that could be further used in the application for making calls to the OIDC Provider and a Resource Server endpoints.

    0. <a id="simple-app-api"></a>Making API requests

        [Back to Copy 'n' Paste](#simple-app)

        In the above implementation re-launching the app on the same device (simulator) will load the authorization state saved in the previous session and the authorization flow will not be triggered. This, however, does not mean that the tokens saved from the last session are still valid. A model OAuth 2.0 client should probably check if the authorization server provided a token expiration date, which is captured by AppAuth in the `accessTokenExpirationDate` property of the last token response, but the token can be revoked before its scheduled expiration date. The client, therefore, should be able to accommodate an invalid token by obtaining a fresh one. The AppAuth's authorization state object provides `performAction()` method to do this automatically and use a refresh token if needed and if one is provided by the OP. On completion valid tokens may become available and an API call can be made. Or, in case of an error, re-authorization can be triggered.

        First we will add a generic request sender. The reason you may want one is that not all requests sent from your RP need to be protected. When making unprotected requests, you wouldn't want to deal with token validation or to send your access tokens to an unprepared-to-handle-them party. For example, this may be the case for manual exchange of the authorization code at the OP's token endpoint or when an [RP-initiated logout](https://openid.net/specs/openid-connect-session-1_0.html#RPLogout) is performed. Hence, a non-protected request could be crafted differently but still be made with the generic method below:

        ```swift
        // ViewController.swift

        // . . .

        // MARK: URL request helpers
        extension ViewController {
            /**
            Sends a URL request.

            Sends a predefined request and handles common errors.

            - Parameter urlRequest: URLRequest optionally crafted with additional information, which may include access token.
            - Parameter completion: Escaping completion handler allowing the caller to process the response.
            */
            func sendUrlRequest(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse, URLRequest) -> Void) {
                let task = URLSession.shared.dataTask(with: urlRequest) {data, response, error in
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
        }

        // . . .
        ```

        > Alternatively, you can call the data task directly from wherever a request needs to be made and handle the response (or lack of it) there. You can also pass the data task errors and non-HTTP responses from this method back to the original caller (via the completion handler) instead of making hard returns here. The latter approach is demonstrated in the more advanced [ForgeRock example](#full).

        Then add the API caller:

        ```swift
        // ViewController.swift

        // . . .

        // MARK: URL request helpers
        extension ViewController {
            // . . .

            /**
            Makes a request to a protected source that accepts tokens from the OIDC Provider.

            - Parameter urlRequest: URLRequest with pre-defined URL, method, etc.
            - Parameter completion: Escaping completion handler allowing the caller to process the response.
            */
            func makeUrlRequestToProtectedResource(urlRequest: URLRequest, completion: @escaping (Data?, HTTPURLResponse, URLRequest) -> Void) {
                let currentAccessToken: String? = self.authState?.lastTokenResponse?.accessToken

                // Validating and refreshing tokens
                self.authState?.performAction() {accessToken, idToken, error in
                    if error != nil {
                        print("Error fetching fresh tokens: \(error?.localizedDescription ?? "")")

                        self.authorizeRp(issuerUrl: self.issuerUrl, configuration: nil)

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

                    self.sendUrlRequest(urlRequest: urlRequest) {data, response, request in
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
        ```
        > An error and/or a non-processable response could be detected and handled at any stage of making a request and also deferred (via escaping completion handlers) to the request maker where the information can be processed in a certain way. For example, an API request to a protected source expects some parsable data, even if an internal error occurs, but calling an RP-initiated logout endpoint may produce no data to handle.

        Let's now prepare a call to the userinfo endpoint, the location for which we should be able to retrieve from the OIDC configuration document captured by AppAuth in the authorization state:

         ```swift
        // ViewController.swift

        class ViewController {
            // . . .

            /**
            Calls the `userinfo_endpoint` associated with the current authorization state.
            */
            func getUserInfo() {
                guard let url = authState?.lastAuthorizationResponse.request.configuration.discoveryDocument?.userinfoEndpoint else {
                    print("Userinfo endpoint not declared in discovery document.")

                    return
                }

                let urlRequest = URLRequest(url: url)

                makeUrlRequestToProtectedResource(urlRequest: urlRequest){data, response, request in
                    var text = "User Info:\n"

                    text += "\nREQUEST:\n"
                    text += "URL: " + (request.url?.absoluteString ?? "") + "\n"

                    text += "HEADERS: \n"
                    request.allHTTPHeaderFields?.forEach({header in
                        text += "\"\(header.key)\": \"\(header.value)\"\n"
                    })

                    print(request.description)
                    text += "\nRESPONSE:\n"
                    text += "Status Code: " + String(response.statusCode) + "\n"

                    text += "HEADERS:\n"
                    response.allHeaderFields.forEach({header in
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
        ```

        Finally, add a conditional `getUserInfo()` call in the `stateChanged` handler, so that every time authorization state becomes available a request is made to the userinfo endpoint:

         ```swift
        // ViewController.swift

        // . . .

        // MARK: OIDAuthState methods
        extension ViewController {
            // . . .

            /**
            Reacts on authorization state changes events.
            */
            func stateChanged() {
                self.saveState()

                if authState != nil {
                    getUserInfo()
                }
            }

            // . . .
        }

        // . . .
        ```

    0. <a id="simple-app-id"></a>Decoding ID Token

        [Back to Copy 'n' Paste](#simple-app)

        Instead of (or along with) using the raw content of the ID token, we could decode the Base64 encoded string and get the token claims:

         ```swift
        // ViewController.swift

        // . . .

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
        ```

        Now, you should be able to get the decoded ID token content and print it out in the `showState` helper, for example:

         ```swift
        // ViewController.swift

        // . . .

        // MARK: OIDAuthState methods
        extension ViewController {
            // . . .

            func showState() {
                // . . .

                let idTokenClaims = getIdTokenClaims(idToken: authState?.lastTokenResponse?.idToken ?? "") ?? Data()
                print("ID token claims: \(String(describing: String(bytes: idTokenClaims, encoding: .utf8)))")

                // . . .
            }
        }

        // . . .
        ```

        Build and run the app. You should be able to see the user information in the logs. The white screen you see on the device simulator is the canvas to fill with functionality relying on OAuth 2.0 authorization.

    0. <a id="simple-app-ui"></a>Optional

        [Back to Copy 'n' Paste](#simple-app)

        Currently, there is no means in the app to reset the authorization state or sign out from the OP. There is also no UI to initiate the API call. We will add some basic controls to the app to complete the picture, but this part should not require elaborate comments as the actual UI implementation will greatly depend on your own app design. To abstract from the storyboard environment we will add all the UI pieces programmatically.

        In the `application(_:didFinishLaunchingWithOptions:)` method of `AppDelegate.swift` add a navigation controller to the app:

         ```swift
        // AppDelegate.swift

            // . . .

            func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
                // Override point for customization after application launch.

                // Building the interface manually
                let viewController = ViewController()
                let navigationController: UINavigationController = UINavigationController(rootViewController: viewController)

                window?.rootViewController = navigationController
                window?.makeKeyAndVisible()

                return true
            }

            // . . .
        ```

        Add the following extension to the main view controller:

         ```swift
        // ViewController.swift

        // . . .

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

                        sendUrlRequest(urlRequest: urlRequest) {data, response, request in
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
        ```

        > At this point you may want to remove the `getUserInfo()` call from the `stateChanged` event handler, so that the user information is not requested every time the authorization state becomes available.

        Then add a `showUi()` call at the end of the `setAuthState` method:

         ```swift
        // ViewController.swift

        // . . .

        // MARK: OIDAuthState methods
        extension ViewController {
            // . . .

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

            // . . .
        }

        // . . .
        ```

        Now the app provides controls for signing in and out and initiating a call to the userinfo endpoint. Terminating the app without signing out should preserve the authorization state and not trigger the authorization flow on re-launching. Signing out will require the resource owner (i.e. the user) to re-authorize the app in order to be able to retrieve the user info.

    0. <a id="simple-app-ui-extra"></a>Completely optional

        [Back to Copy 'n' Paste](#simple-app)

        So far the app prints messages in the Xcode console, while vast portions of real estate on the device screen are not used and the logs are only visible when the app is built and run directly from the Xcode project. It seems we could use the empty portions of the UI for something useful, like a large text area to dump the logs in there as well:

         ```swift
        // ViewController.swift

        // . . .

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
        ```

        Then, add an `addTextView()` call at the end of the `viewDidLoad` event handler:

        ```swift
        // ViewController.swift

        class ViewController {
            // . . .

            override func viewDidLoad() {
                super.viewDidLoad()
                // Do any additional setup after loading the view, typically from a nib.

                // . . .

                addTextView()
            }

            // . . .
        }
        ```

        With the container in place, we can add the log output to the textView by defining a global function that will shadow the native `Swift.print`:

         ```swift
        // ViewController.swift

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
            textView.insertText("\n" + output + "\n")

            let textViewBottom = NSMakeRange(textView.text.count - 1, 1)
            textView.scrollRangeToVisible(textViewBottom)

            // Accommodating an iOS bug that may prevent scrolling under certain circumstances.
            textView.isScrollEnabled = false
            textView.isScrollEnabled = true

            Swift.print(output)
        }

        class ViewController: UIViewController {

        // . . .
        ```

        > Of course, we could add a designated print method to the main class definition and call it instead of the built-in `Swift.print` in the first place. Creating useful helpers, however, was not the main focus of this exercise and would provide clear benefits only in the optional steps. Since polluting global space is probably not the best practice, feel free to replace the `print()` calls with ones to a custom method, which you can easily create from the `print` function above by moving it into the main class definition (and renaming it as well). Remember, that calls to the class methods inside closures will require explicit `self.` prefix.

        We could also display the app name in the navigation bar to indicate which application is currently in the foreground. At the beginning of `viewDidLoad` event handler specify the navigation item title:

        ```swift
        // ViewController.swift

        // . . .

        class ViewController: UIViewController {
            // . . .

            override func viewDidLoad() {
                super.viewDidLoad()
                // Do any additional setup after loading the view, typically from a nib.

                // Displaying the app name as it appears on the user's device, giving preference to the `Display Name` general setting.
                navigationItem.title = (Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleName")) as? String

                // . . .
            }

            // . . .
        }
        ```

        Build and run the app.

0. <a id="simple-conclusion"></a>In fine

    [Back to Building a simple app with Swift and AppAuth](#simple)

    Whether or not you performed the optional steps, the resulting iOS app provides a starting point to work with the Authorization Code grant extended by PKCE and utilizing the AppAuth SDK for automatic code exchange and tokens renewal. If you need it, the SDK also provides convenience methods allowing for lower level interaction with OAuth 2.0/OIDC endpoints, which is covered in the [official API documentation](http://openid.github.io/AppAuth-iOS/docs/latest/annotated.html) and demonstrated in the [official examples](https://github.com/openid/AppAuth-iOS/tree/master/Examples).

***

## <a id="full"></a>ForgeRock example

[Back to top](#top)

The ForgeRock platform provides server ingredients for setting up OAuth 2.0 flows: [ForgeRock Access Management](https://www.forgerock.com/platform/access-management) plays the role of the [OpenID Provider](https://openid.net/specs/openid-connect-core-1_0.html#Terminology) and [ForgeRock Identity Management](https://www.forgerock.com/platform/identity-management) may serve as the [Resource Server](https://tools.ietf.org/html/rfc6749#section-1.1). The easiest way to see it in action is setting up and running the [ForgeRock platform sample tailored for OAuth 2.0 development](https://github.com/ForgeRock/forgeops-init/tree/master/7.0/oauth2/development).

With this environment in place, you will be able to evaluate a more advanced iOS OAuth 2.0 client built following the same principles as the basic application described above and, in fact, having the latter used as the starting point. A [short video](https://forgerock.wistia.com/medias/3dft2ndyvh) demonstrates the app running on an iOS simulator.

The application code can be found in the [Example OAuth2 Clients](https://github.com/ForgeRock/exampleOAuth2Clients/) project on GitHub under `/iOS-AppAuth/iOS-AppAuth-IDM`. Consult the [ForgeRock example README](https://github.com/ForgeRock/exampleOAuth2Clients/tree/master/iOS-AppAuth#full) for more information.

***

## <a id="conclusion"></a>Conclusion

Both example apps referred here follow the best practices described in RFC8252 and rely on their implementation in the AppAuth SDK. The RFC is concerned with security issues existing in "third-party" applications that cannot be trusted by the end-user. Addressing these concerns comes with limitations in the iOS environment: a mandatory end-user consent dialog and extra steps that may be required for implementing a single sign on experience. Nevertheless, with the AppAuth SDK we've demonstrated the most universal approach for implementing OAuth 2.0 authorization flows in native iOS apps. The examples can serve as a quick reference for the most basic tasks these types of applications may perform when consuming data from a REST API.
