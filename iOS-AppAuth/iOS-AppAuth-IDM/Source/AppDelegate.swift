//
//  AppDelegate.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/7/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

// MARK: Importing the AppAuth SDK
import AppAuth

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

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

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
}

// MARK: Shared

extension AppDelegate {
    /**
     Creates a shared reference accessible from modules across the app.
     */
    static var shared: AppDelegate {
        return UIApplication.shared.delegate as! AppDelegate
    }

    /**
     Creates a reference to the root controller for sharing functionality.
     */
    var rootViewController: ViewController {
        let navigationController: UINavigationController = window?.rootViewController as! UINavigationController

        let viewController = navigationController.viewControllers.first as! ViewController

        return viewController
    }
}
