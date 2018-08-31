"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["underscore", "handlebars", "xdate", "moment"], function (_, Handlebars, XDate, moment) {

    var obj = {};

    //format ISO8601; example: 2012-10-29T10:49:49.419+01:00
    Handlebars.registerHelper('date', function (unformattedDate, datePattern) {
        var date = obj.parseDateString(unformattedDate),
            formattedDate;

        if (!obj.isDateValid(date)) {
            return "";
        }

        if (datePattern && _.isString(datePattern)) {
            formattedDate = obj.formatDate(date, datePattern);
        } else {
            formattedDate = obj.formatDate(date);
        }

        return new Handlebars.SafeString(formattedDate);
    });

    obj.defaultDateFormat = "MMMM dd, yyyy";

    obj.formatDate = function (date, datePattern) {
        if (datePattern) {
            return new XDate(date).toString(datePattern);
        } else {
            return new XDate(date).toString(obj.defaultDateFormat);
        }
    };

    obj.isDateValid = function (date) {
        if (Object.prototype.toString.call(date) !== "[object Date]") {
            return false;
        }
        return !isNaN(date.getTime());
    };

    obj.isDateStringValid = function (dateString, datePattern) {
        return dateString.length === datePattern.length && moment(dateString, datePattern).isValid();
    };

    obj.parseStringValid = function (dateString, datePattern) {
        return dateString.length === datePattern.length && moment(dateString, datePattern).isValid();
    };

    obj.getDateFromEpochString = function (stringWithMilisFromEpoch) {
        return new XDate(parseInt(stringWithMilisFromEpoch, 10)).toDate();
    };

    obj.currentDate = function () {
        return new XDate().toDate();
    };

    obj.parseDateString = function (dateString, datePattern) {
        if (datePattern) {
            datePattern = datePattern.replace(/d/g, 'D');
            datePattern = datePattern.replace(/y/g, 'Y');
            return moment(dateString, datePattern).toDate();
        } else {
            return new XDate(dateString).toDate();
        }
    };

    return obj;
});
