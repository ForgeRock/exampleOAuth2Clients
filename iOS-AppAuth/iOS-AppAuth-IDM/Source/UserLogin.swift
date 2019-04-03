//
//  UserLogin.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import Foundation

/**
 Container for the signed in user information.

 Includes internal ID the user can be referenced by in API calls.
 */
struct UserLogin {
    struct Response: Codable {
        struct Authorization: Codable {
            let roles: [String]?
            let id: String?
        }

        let authenticationId: String?
        let authorization: Authorization?
    }

    let url = "https://default.iam.example.com/openidm/info/login"
}
