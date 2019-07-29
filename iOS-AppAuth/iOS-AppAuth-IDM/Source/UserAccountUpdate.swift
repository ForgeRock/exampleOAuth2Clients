//
//  UserAccountUpdate.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 1/5/19.
//  Copyright © 2019 ForgeRock AS.
//

import Foundation

/**
 Container for PATCH request payload
 */

struct UserAccountUpdate: Codable {
    struct Update: Codable {
        let operation: String
        let field: String
        let value: String
    }

    var body: [Update] = []
}
