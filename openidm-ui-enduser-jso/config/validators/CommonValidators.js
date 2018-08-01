"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery"], function ($) {
    var obj = {
        "required": {
            "name": "Required field",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val();
                if (!v || v === "") {
                    callback([$.t("common.form.validation.required")]);
                } else {
                    callback();
                }
            }
        },
        "passwordConfirm": {
            "name": "Password confirmation",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var confirmValue = input.val(),
                    mainInput = el.find(":input#" + input.attr("passwordField"));

                if (mainInput.val() !== confirmValue) {
                    callback([$.t("common.form.validation.confirmationMatchesPassword")]);
                } else if (mainInput.attr("data-validation-status") === "error") {
                    callback(mainInput.data("validation-failures"));
                } else {
                    callback();
                }
            }
        },
        "minLength": {
            "name": "Minimum number of characters",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val(),
                    len = input.attr('minLength');

                if (v.length < len) {
                    callback([$.t("common.form.validation.MIN_LENGTH", { minLength: len })]);
                } else {
                    callback();
                }
            }
        },
        "atLeastXNumbers": {
            "name": "Minimum occurrence of numeric characters in string",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val(),
                    minNumbers = input.attr('atLeastXNumbers'),
                    foundNumbers = v.match(/\d/g);

                if (!foundNumbers || foundNumbers.length < minNumbers) {
                    callback([$.t("common.form.validation.AT_LEAST_X_NUMBERS", { numNums: minNumbers })]);
                } else {
                    callback();
                }
            }
        },
        "atLeastXCapitalLetters": {
            "name": "Minimum occurrence of capital letter characters in string",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = input.val(),
                    minCapitals = input.attr('atLeastXCapitalLetters'),
                    foundCapitals = v.match(/[(A-Z)]/g);

                if (!foundCapitals || foundCapitals.length < minCapitals) {
                    callback([$.t("common.form.validation.AT_LEAST_X_CAPITAL_LETTERS", { numCaps: minCapitals })]);
                } else {
                    callback();
                }
            }
        }
    };
    return obj;
});
