"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/util/Base64"], function (base64) {

    var obj = {};

    /**
     * Encodes a header value as MIME base-64 encoded UTF-8 as per RFC 2047. This allows passing
     * Unicode characters beyond ASCII in a header value (which are limited to US-ASCII or ISO-8859-1).
     *
     * @param headerValue the header value to encode.
     * @returns {string} the base-64 encoded, UTF-8 MIME "text" token encoding of the header value.
     */
    obj.encodeHeader = function (headerValue) {
        return "=?UTF-8?B?" + base64.encodeUTF8(headerValue) + "?=";
    };

    return obj;
});
