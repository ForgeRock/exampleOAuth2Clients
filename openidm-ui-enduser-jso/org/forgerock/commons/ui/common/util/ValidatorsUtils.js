"use strict";

/*
 * Copyright 2012-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore"], function ($, _) {
    var obj = {};

    obj.namePattern = new RegExp("^([A-Za'-\u0105\u0107\u0119\u0142\xF3\u015B\u017C\u017A" + "\u0104\u0106\u0118\u0141\xD3\u015A\u017B\u0179\xC0\xC8\xCC\xD2\xD9\xE0\xE8\xEC\xF2" + "\xF9\xC1\xC9\xCD\xD3\xDA\xDD\xE1\xE9\xED\xF3\xFA\xFD\xC2\xCA\xCE\xD4" + "\xDB\xE2\xEA\xEE\xF4\xFB\xC3\xD1\xD5\xE3\xF1\xF5\xC4\xCB\xCF\xD6\xDC" + "\u0178\xE4\xEB\xEF\xF6\xFC\u0178\xA1\xBF\xE7\xC7\u0152\u0153\xDF\xD8\xF8\xC5" + "\xE5\xC6\xE6\xDE\xFE\xD0\xF0-s])+$");
    obj.phonePattern = /^\+?([0-9\- \(\)])*$/;
    obj.emailPattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    obj.setErrors = function (el, validatorType, msg) {
        _.each(validatorType.split(' '), function (vt) {
            _.each(el.find("span[data-for-validator=" + vt + "]"), function (input) {
                var $input = el.find(input),
                    type = $input.attr("data-for-req"),
                    span = $input.prev("span");
                if (!type) {
                    type = $input.text();
                }

                if ($.inArray(type, msg) !== -1) {
                    span.removeClass('has-success');
                    span.addClass('has-error');
                } else {
                    span.removeClass('has-error');
                    span.addClass('has-success');
                }
            });
        });
    };

    obj.hideValidation = function ($input, el) {
        $input.nextAll("span").hide();
        $input.nextAll("div.validation-message:first").hide();
        el.find("div.validation-message[for='" + $input.attr('name') + "']").hide();
    };

    obj.showValidation = function ($input, el) {
        $input.nextAll("span").show();
        $input.nextAll("div.validation-message:first").show();
        el.find("div.validation-message[for='" + $input.attr('name') + "']").show();
    };

    obj.hideBox = function (el) {
        el.find(".group-field-errors").hide();
    };

    obj.showBox = function (el) {
        el.find(".group-field-errors").show();
    };

    return obj;
});
