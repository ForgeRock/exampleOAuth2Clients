//
//  iOS_AppAuthTests.swift
//  iOS-AppAuthTests
//
//  Created by Konstantin Lapine on 2/12/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

import XCTest

@testable import iOS_AppAuth

/**
 Provides an example of a test class.
 */
class iOS_AppAuthTests: XCTestCase {
    var viewController: ViewController!

    var urlSession: URLSession!

    // Setting the storyboard to be able to dequeue the table cells with identifier.
    var storyboard: UIStoryboard!

    var tabBarController: UITabBarController!

    var dashboardTableViewController: DashboardTableViewController!

    override func setUp() {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        super.setUp()

        viewController = ViewController()

        urlSession = URLSession(configuration: .default)

        storyboard = UIStoryboard(name: "Main", bundle: nil)

        tabBarController = storyboard.instantiateViewController(withIdentifier: "TabBarController") as? UITabBarController

        tabBarController.viewControllers?.forEach {
            navigationController in

            let nv = navigationController as? UINavigationController

            nv?.viewControllers.forEach {
                viewController in

                if let vc = viewController as? DashboardTableViewController {
                    dashboardTableViewController = vc
                }
            }
        }
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        viewController = nil
        urlSession = nil
        storyboard = nil
        tabBarController = nil
        dashboardTableViewController = nil

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

    /**
     Provides an example of a test.

     Checks if the Dashboard is set and populated with the notifications data.
     */
    func testDashboardTableViewControllerNotifications() {
        // Given

        guard let _ = dashboardTableViewController else {
            XCTFail("Dashboard view controller is not present.")

            return
        }

        // When

        // There should be a notification section in the table view.
        let notificationSectionTitle = "Notifications"

        var notificationSectionIndex: Int?

        // Test values.
        let testNotificationMessage1 = "First Test Notification"
        let testNotificationMessage2 = "Second Test Notification"

        for sectionIndex in 0..<self.dashboardTableViewController.tableView.numberOfSections {
            let section = self.dashboardTableViewController.tableSections[0]

            if  section.title == notificationSectionTitle {
                notificationSectionIndex = sectionIndex

                break
            }
        }

        XCTAssertNotNil(notificationSectionIndex, "There should be a section in the dashboard table named \(notificationSectionTitle)")

        // Notifications are returned via escaping completion handler.
        let promise = expectation(description: "Completion handler")

        dashboardTableViewController.getNotifications = {
            completion in

            // Returning notifications of the same structure that is expected from the rest end-point.

            var notifications: [UserNotifications.Response.Notification] = []
            notifications.append(UserNotifications.Response.Notification(createDate: nil, message: testNotificationMessage1, _id: "1"))
            notifications.append(UserNotifications.Response.Notification(createDate: nil, message: testNotificationMessage2, _id: "2"))

            completion(notifications)

            promise.fulfill()
        }

        // There should be no notifications initially.
        XCTAssertEqual(self.dashboardTableViewController.tableView.numberOfRows(inSection: 0), 0, "There should be no notifications before data is loaded.")

        // Adding notifications data to the table view.
        dashboardTableViewController.loadData()

        waitForExpectations(timeout: 0, handler: nil)

        // then

        // Checking if the notification entries exist in the table view. Although the table view is driven by the data we still check if the UI components are populated correctly. Alternatively we could just check the `notifications` property of the UITableViewController.

        XCTAssertEqual(dashboardTableViewController.tableView.numberOfRows(inSection: notificationSectionIndex!), 2, "There should be two added notifications.")

        XCTAssertEqual(dashboardTableViewController.tableView.cellForRow(at: IndexPath(row: 1, section: notificationSectionIndex!))?.textLabel?.text, testNotificationMessage2, "Text label for the notification is not populated correctly.")
    }
}
