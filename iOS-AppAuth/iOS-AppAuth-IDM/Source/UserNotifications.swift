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
            let notificationSubtype: String?
            let notificationType: String?
            let receiverId: String?
            let requester: String?
            let requesterId: String?
            let _id: String?
            let _rev: String?
        }

        var notifications: [Notification] = []
    }

    let url = "https://sample.iam.forgeops.com/ig/openidm/endpoint/usernotifications/"

    var data = Response()

    var records: [UserNotifications.Response.Notification] {
        get {
            return data.notifications
        }
    }
}
