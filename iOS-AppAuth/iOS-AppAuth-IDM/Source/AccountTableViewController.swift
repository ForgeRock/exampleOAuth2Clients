//
//  AccountTableViewController.swift
//  iOS-AppAuth
//
//  Created by Konstantin Lapine on 12/11/18.
//  Copyright © 2018 ForgeRock AS.
//

import UIKit

class AccountTableViewController: UITableViewController {
    // MARK: Dependencies

    /**
     Allows for custom printing implemented in the caller.

     Here, no options are taken for the `separator` and the `terminator`.
     */
    var customPrint: ((Any...) -> Void)?

    var signOut: (() -> Void)?

    var getUserAccount: ((@escaping (UserAccount.Response?, Error?) -> Void) -> Void)?

    var updateUserAccount: ((String, String, @escaping (Data?, HTTPURLResponse?, Error?, URLRequest) -> Void) -> Void)?
    // Dependencies: end

    // Placeholder for the signed in user account information.
    var accountData: [Dictionary<String, String>] = []

    // MARK: IBActions
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
        // self.navigationItem.rightBarButtonItem = self.editButtonItem
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        // Reload data on switching to the Account tab.
        loadData()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return accountData.count
    }

    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "AccountTableViewCell", for: indexPath)

        // Configure the cell...
        cell.textLabel?.text = self.accountData[indexPath.row]["label"]?.uppercased()

        cell.detailTextLabel?.text = self.accountData[indexPath.row]["value"]

        return cell
    }

    /*
     // Override to support conditional editing of the table view.
     override func tableView(_ tableView: UITableView, canEditRowAt indexPath: IndexPath) -> Bool {
     // Return false if you do not want the specified item to be editable.
     return true
     }
     */

    /*
     // Override to support editing the table view.
     override func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCellEditingStyle, forRowAt indexPath: IndexPath) {
     if editingStyle == .delete {
     // Delete the row from the data source
     tableView.deleteRows(at: [indexPath], with: .fade)
     } else if editingStyle == .insert {
     // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
     }
     }
     */

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

    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        tableView.sectionHeaderHeight = 64

        return "Personal Info"
    }


    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let field = accountData[indexPath.row]["label"] ?? ""
        let value = accountData[indexPath.row]["value"] ?? ""

        guard field.count > 0 else {
            return
        }

        let alert = UIAlertController(title: "", message: field.uppercased(), preferredStyle: UIAlertController.Style.alert)

        alert.addTextField() {
            textField in

            textField.text = value

            alert.addAction(
                UIAlertAction(title: NSLocalizedString("Cancel", comment: "Cancel Action"), style: UIAlertAction.Style.cancel, handler: nil)
            )

            alert.addAction(
                UIAlertAction(title: NSLocalizedString("Update", comment: "Update Action"), style: UIAlertAction.Style.default) {(_: UIAlertAction) in
                    let newValue = textField.text?.trimmingCharacters(in: .whitespacesAndNewlines)

                    if (newValue == value) {
                        return
                    }

                    self.updateUserAccount?(field, newValue ?? value) {
                        data, response, error, request in

                        if error != nil {
                            self.customPrint?("Error updating \(field).")
                        }

                        self.loadData()
                    }
                }
            )
        }

        present(alert, animated: false)
    }

    /*
     // MARK: - Navigation

     // In a storyboard-based application, you will often want to do a little preparation before navigation
     override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
     // Get the new view controller using segue.destination.
     // Pass the selected object to the new view controller.
     }
     */

}

// MARK: Data loading

extension AccountTableViewController {
    /**
     Loads data used in this view controller.
     */
    func loadData() {
        loadAccount()
    }

    /**
     Loads the signed in user account data.
     */
    func loadAccount() {
        self.accountData = []

        getUserAccount?() {
            userAccountResponse, error in

            guard userAccountResponse != nil else {
                self.customPrint?("Error retrieving user account data: \(error?.localizedDescription ?? "")")

                return
            }

            let mirror = Mirror(reflecting: userAccountResponse!)

            for child in mirror.children {
                if let label = child.label, let value = child.value as? String {
                    self.accountData.append(["label": label, "value": value])
                }
            }

            self.tableView.reloadData()
        }
    }
}
