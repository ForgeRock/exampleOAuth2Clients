"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/resource/ResourceEditViewRegistry"], function (AbstractView, ResourceEditViewRegistry) {
    var EditResourceView = AbstractView.extend({
        events: {},
        render: function render(args, callback) {
            var view,
                resource = args[1];

            if (args[0] === "system") {
                resource += "/" + args[2];
            }

            ResourceEditViewRegistry.getEditViewModule(resource).then(function (view) {
                view.render(args, callback);
            });
        }
    });

    return new EditResourceView();
});
