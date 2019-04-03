//
//  UserNotifications.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import Foundation

/**
 Container for user notifications.
 */
struct UserNotifications {
    struct Response: Codable {
        struct Notification: Codable {
            let createDate: String?
            let message: String?
            let _id: String?
        }

        var notifications: [Notification] = []
    }

    let url = "https://default.iam.example.com/openidm/endpoint/usernotifications/"
}
