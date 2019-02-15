//
//  UserAccount.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import Foundation

/**
    Container for identified user account information.
*/
struct UserAccount {
    struct Response: Codable {
        // let _id: String?
        // let _rev: String?
        let userName: String?
        // let cn: String?
        let givenName: String?
        let sn: String?
        let mail: String?
        let telephoneNumber: String?
        let description: String?
        let postalAddress: String?
        let address2: String?
        let city: String?
        let stateProvince: String?
        let postalCode: String?
    }

    let url = "https://sample.iam.forgeops.com/ig/openidm/managed/user/"

    var data: Response? = nil
}
