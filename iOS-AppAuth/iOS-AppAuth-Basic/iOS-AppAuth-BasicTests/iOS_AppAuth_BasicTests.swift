//
//  iOS_AppAuth_BasicTests.swift
//  iOS-AppAuth-BasicTests
//
//  Created by Konstantin Lapine on 2/13/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

import XCTest

@testable import iOS_AppAuth_Basic

/**
 Provides an example of a test class.
 */
class iOS_AppAuth_BasicTests: XCTestCase {
    var viewController: ViewController!

    var urlSession: URLSession!

    override func setUp() {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        super.setUp()

        viewController = ViewController()

        urlSession = URLSession(configuration: .default)
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        viewController = nil
        urlSession = nil

        super.tearDown()
    }

    /**
     Provides an example of a test.

     Checks if custom URI scheme is necessary and has been set.
     */
    func testUriScheme() {
        if #available(iOS 11.0, *) {
            return
        }

        let noPrivateUseUriScheme = "No private-use URI scheme has been configured for the project."

        guard let urlTypes: [AnyObject] = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [AnyObject], urlTypes.count > 0 else {
            XCTFail(noPrivateUseUriScheme)

            return
        }

        guard let items = urlTypes[0] as? [String: AnyObject], let urlSchemes = items["CFBundleURLSchemes"] as? [AnyObject], urlSchemes.count > 0 else {
            XCTFail(noPrivateUseUriScheme)

            return
        }

        guard let urlScheme = urlSchemes[0] as? String else {
            XCTFail(noPrivateUseUriScheme)

            return
        }

        XCTAssertEqual(urlScheme, viewController.redirectionUriScheme, "The URI scheme in the Info.plist (URL Types -> Item 0 -> URL Schemes -> Item 0) does not match one used in the redirect URI, where the scheme is everything before the colon (:)."
        )
    }
}
