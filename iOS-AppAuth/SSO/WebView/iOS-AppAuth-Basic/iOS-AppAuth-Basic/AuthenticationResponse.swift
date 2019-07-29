//
//  AuthenticationResponse.swift
//  iOS-AppAuth-Basic
//
//  Created by Konstantin Lapine on 7/24/19.
//  Copyright © 2019 Forgerock. All rights reserved.
//

import Foundation

/**
 Container for JSON callbacks expected from the authentication endpoint.
 */
struct AuthenticationResponse: Codable {
    struct Callback: Codable {
        let type: String?
    }

    let authId: String?
    var callbacks: [Callback] = []
}
