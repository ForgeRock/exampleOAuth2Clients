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
        "required_long": {
            "name": "Not empty number",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = $(input).val();
                if (v === "") {
                    callback($.t("common.form.validation.required"));
                    return;
                }
                if (!v.match(/^([0-9]+)$/)) {
                    callback($.t("common.form.validation.shouldBeLong"));
                    return;
                }
                callback();
            }
        },
        "long": {
            "name": "Number",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = $(input).val();
                if (v !== "" && !v.match(/^([0-9]+)$/)) {
                    callback($.t("common.form.validation.shouldBeLong"));
                    return;
                }
                callback();
            }
        },
        "required_formattedDate": {
            "name": "Not empty, formatted date",
            "dependencies": ["org/forgerock/commons/ui/common/util/DateUtil"],
            "validator": function validator(el, input, callback, dateUtil) {
                var valueToReplace,
                    date,
                    v = $(input).val(),
                    dateFormat = $(input).parent().find('[name=dateFormat]').val();
                if (v === "") {
                    callback($.t("common.form.validation.required"));
                    return;
                }
                if (!dateUtil.isDateStringValid(v, dateFormat)) {
                    callback($.t("common.form.validation.wrongDateFormat") + " (" + dateFormat + ")");
                    return;
                } else {
                    date = dateUtil.parseDateString(v, dateFormat);
                    valueToReplace = dateUtil.formatDate(date, dateFormat);
                    if (dateUtil.isDateStringValid(valueToReplace, dateFormat)) {
                        $(input).val(valueToReplace);
                    } else {
                        callback($.t("common.form.validation.wrongDateFormat") + " (" + dateFormat + ")");
                        return;
                    }
                }
                callback();
            }
        },
        "formattedDate": {
            "name": "Not empty, formatted date",
            "dependencies": ["org/forgerock/commons/ui/common/util/DateUtil"],
            "validator": function validator(el, input, callback, dateUtil) {
                var valueToReplace,
                    date,
                    v = $(input).val(),
                    dateFormat = $(input).parent().find('[name=dateFormat]').val();
                if (v !== "") {
                    if (!dateUtil.isDateStringValid(v, dateFormat)) {
                        callback($.t("common.form.validation.wrongDateFormat") + " (" + dateFormat + ")");
                        return;
                    } else {
                        date = dateUtil.parseDateString(v, dateFormat);
                        valueToReplace = dateUtil.formatDate(date, dateFormat);
                        if (dateUtil.isDateStringValid(valueToReplace, dateFormat)) {
                            $(input).val(valueToReplace);
                        } else {
                            callback($.t("common.form.validation.wrongDateFormat") + " (" + dateFormat + ")");
                            return;
                        }
                    }
                }
                callback();
            }
        }, "required_max255": {
            "name": "Not empty and no more than 256 chars",
            "dependencies": [],
            "validator": function validator(el, input, callback) {
                var v = $(input).val();
                if (v === "") {
                    callback($.t("common.form.validation.required"));
                    return;
                }
                if (v.length > 255) {
                    callback($.t("common.form.validation.shouldBeNotMoreThen256"));
                    return;
                }
                callback();
            }
        }
    };

    return obj;
});
