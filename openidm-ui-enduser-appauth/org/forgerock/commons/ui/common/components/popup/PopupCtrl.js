"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/components/popup/PopupView"], function (view) {
    var obj = {};

    obj.view = view;

    obj.init = function () {
        view.init();
    };

    obj.showBy = function (content, element) {
        view.setContent(content);
        view.show();
        view.setPositionBy(element);
    };

    obj.hide = function () {
        view.hide();
    };

    return obj;
});
