//
//  User.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import Foundation

/**
    Container for signed in user information.
*/
class User {
    var login = UserLogin()
    var notifications = UserNotifications()
    var account = UserAccount()
}
