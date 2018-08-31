"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "form2js", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/util/BootstrapDialogUtils", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/URIUtils"], function ($, _, handlebars, form2js, AbstractView, BootstrapDialogUtils, Constants, Configuration, ConfigDelegate, EventManager, URIUtils) {
    var AbstractWidget = AbstractView.extend({
        noBaseTemplate: true,
        partials: ["partials/dashboard/_widgetHeader.html", "partials/dashboard/widget/_generalConfig.html"],
        data: {},
        model: {},
        events: {
            "click .widget-settings": "widgetSettings"
        },

        render: function render(args, callback) {
            this.element = args.element;
            this.data.widgetTitle = args.title;
            this.data.widgetType = args.widget.type;
            this.data.showConfigButton = args.showConfigButton;
            this.data.dashboardConfig = args.dashboardConfig;

            this.widgetRender(args, callback);
        },

        widgetSettings: function widgetSettings(event) {
            event.preventDefault();

            //We have to go outside the view scope to actually find the widgets proper location
            var currentConf = this.data.dashboardConfig,
                currentWidget = $(event.target).parents(".widget-holder"),
                widgetLocation = $(".widget-holder").index(currentWidget),
                self = this,
                currentTemplate = "dashboard/widget/_generalConfig",
                currentDashboard = URIUtils.getCurrentFragment().split("/")[1],
                config = currentConf.adminDashboards[currentDashboard].widgets[widgetLocation];

            if (this.model.overrideTemplate) {
                currentTemplate = this.model.overrideTemplate;
            }

            if (this.data.overrideConfig) {
                config = this.data.overrideConfig;
            }

            //Load in additional partials
            this.model.dialog = BootstrapDialogUtils.createModal({
                title: "Configure Widget",
                message: $(handlebars.compile("{{>" + currentTemplate + "}}")(config)),
                onshown: function onshown(dialogRef) {
                    if (self.customSettingsLoad) {
                        self.customSettingsLoad(dialogRef);
                    }
                },
                buttons: ["close", {
                    label: $.t("common.form.save"),
                    cssClass: "btn-primary",
                    id: "saveUserConfig",
                    action: function action(dialogRef) {
                        var config;

                        if (_.isUndefined(self.customSettingsSave)) {
                            config = form2js("widgetConfigForm", ".", true);
                        } else {
                            config = self.customSettingsSave(dialogRef, currentConf.adminDashboards[currentDashboard].widgets[widgetLocation]);
                        }

                        _.extend(currentConf.adminDashboards[currentDashboard].widgets[widgetLocation], config);
                        self.saveWidgetConfiguration(currentConf);
                        dialogRef.close();
                    }
                }]
            }).open();
        },
        saveWidgetConfiguration: function saveWidgetConfiguration(currentConfig) {
            var currentDashboard = URIUtils.getCurrentFragment().split("/")[1];

            ConfigDelegate.updateEntity("ui/dashboard", currentConfig).then(_.bind(function () {
                this.updateConfiguration(function () {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "dashboardWidgetConfigurationSaved");

                    EventManager.sendEvent(Constants.EVENT_CHANGE_VIEW, { route: {
                            view: "org/forgerock/openidm/ui/admin/dashboard/Dashboard",
                            role: "ui-admin",
                            url: "dashboard/" + currentDashboard,
                            forceUpdate: true
                        } });
                });
            }, this));
        },
        updateConfiguration: function updateConfiguration(callback) {
            ConfigDelegate.readEntity("ui/configuration").then(function (uiConf) {
                Configuration.globalData = uiConf.configuration;

                if (callback) {
                    callback();
                }
            });
        }
    });

    return AbstractWidget;
});
