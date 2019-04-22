//
//  DashboardTableViewController.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 Forgerock. All rights reserved.
//

import UIKit

class DashboardTableViewController: UITableViewController {
    // MARK: Dependencies

    /**
     Allows for custom printing implemented in the caller.

     Here, no options are taken for the `separator` and the `terminator`.
     */
    var customPrint: ((Any...) -> Void)?

    var signOut: (() -> Void)?

    var getNotifications: ((@escaping ([UserNotifications.Response.Notification]) -> Void) -> Void)?

    var deleteNotification: ((String?, @escaping (Data?, HTTPURLResponse) -> Void) -> Void)?

    /**
     Accepts a "pass through" dependency to be injected in the controller's children.

     The current simple app structure does not require use of containers, factories, etc.
     */

    var sampleUrls: [String] = []

    var makeUrlRequest: ((String, Bool, @escaping (Data?, HTTPURLResponse?, Error?, URLRequest) -> Void) -> Void)?

    // Dependencies: end
    
    var notifications: [UserNotifications.Response.Notification] = []

    // Table sections placeholder.
    var tableSections: [TableSection] = []

    // MARK: @IB

    @IBAction func signOut(_ sender: UIBarButtonItem) {
        self.dismiss(animated: true) {
            self.signOut?()
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Uncomment the following line to preserve selection between presentations
        // self.clearsSelectionOnViewWillAppear = false

        // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
        self.navigationItem.rightBarButtonItem = self.editButtonItem

        // set table sections
        tableSections.append(TableSection(title: "Notifications", cellReuseIdentifier: "DashboardNotificationsTableViewCell", dataIdentifier: "notifications"))
        tableSections.append(TableSection(title: "Miscellanea", cellReuseIdentifier: "DashboardRequestTableViewCell", dataIdentifier: "miscellanea"))
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Reload data on switching to the Dashboard tab.
        loadData()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return tableSections.count
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        var numberOfRows = 0

        switch tableSections[section].dataIdentifier {
        case "notifications":
            numberOfRows = notifications.count
        case "miscellanea":
            numberOfRows = 1
        default:
            numberOfRows = 0
        }

        return numberOfRows
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: tableSections[indexPath.section].cellReuseIdentifier, for: indexPath)

        switch tableSections[indexPath.section].dataIdentifier {
        case "notifications":
            cell.textLabel?.text = notifications[indexPath.row].message ?? ""

            var createDate: String?

            createDate = notifications[indexPath.row].createDate ?? "1970-01-01T00:00:00.000Z"

            if let dateString = createDate {
                let dateFormatter = DateFormatter()

                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
                dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)!

                let date = dateFormatter.date(from: dateString)

                if let date = date {
                    let dateFormatter = DateFormatter()

                    dateFormatter.dateFormat = "MMMM d, yyyy hh:mm aa"
                    dateFormatter.timeZone = TimeZone.current

                    createDate = dateFormatter.string(from: date)
                }
            }

            cell.detailTextLabel?.text = createDate ?? ""
        case "miscellanea":
            cell.textLabel?.text = "Make a Request to a Protected Resource"
        default:
            cell.textLabel?.text = "Error"
        }

        return cell
    }


    // Override to support conditional editing of the table view.
    override func tableView(_ tableView: UITableView, canEditRowAt indexPath: IndexPath) -> Bool {
        // Return false if you do not want the specified item to be editable.
        if (tableSections[indexPath.section].dataIdentifier != "notifications") {
            return false
        }
        
        return true
    }

    // Override to support editing the table view.
    override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCell.EditingStyle, forRowAt indexPath: IndexPath) {
        if editingStyle == .delete {
            guard let notificationId = notifications[indexPath.row]._id, let deleteNotification = deleteNotification else {
                customPrint?("Cannot delete notification.")

                return
            }

            deleteNotification(notificationId) {data, response in
                // For code simplicity, notification data is always reloaded when a notification is deleted.
                self.loadData()
            }
        } else if editingStyle == .insert {
            // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
        }    
    }

    /*
    // Override to support rearranging the table view.
    override func tableView(_ tableView: UITableView, moveRowAt fromIndexPath: IndexPath, to: IndexPath) {

    }
    */

    /*
    // Override to support conditional rearranging of the table view.
    override func tableView(_ tableView: UITableView, canMoveRowAt indexPath: IndexPath) -> Bool {
        // Return false if you do not want the item to be re-orderable.
        return true
    }
    */

    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        let viewController = segue.destination

        if let vc = viewController as? RequestViewController {
            vc.sampleUrls = sampleUrls

            vc.makeUrlRequest = {[unowned self] (url, protected, completion) in
                self.makeUrlRequest?(url, protected) {data, response, error, request in
                    completion(data, response, error, request)
                }
            }
        }
    }

    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return tableSections[section].title
    }
}

// MARK: Data loading

extension DashboardTableViewController {
    /**
        Loads data used in this view controller.
    */
    func loadData() {
        getNotifications?() {notifications in
            self.notifications = notifications

            self.tableView.reloadData()
        }
    }
}
