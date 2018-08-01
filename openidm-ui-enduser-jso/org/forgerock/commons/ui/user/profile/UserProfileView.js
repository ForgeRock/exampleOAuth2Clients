"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "form2js", "js2form", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "bootstrap"], function ($, _, form2js, js2form, AbstractUserProfileTab, AbstractView, Configuration, Constants, EventManager) {

    /**
     * Manages the tabs and routing amongst them for the user's profile
     * @exports org/forgerock/commons/ui/user/profile/UserProfileView
     */
    var UserProfileView = AbstractView.extend({
        template: "templates/user/UserProfileTemplate.html",
        partials: ["partials/form/_basicInput.html", "partials/form/_basicSaveReset.html"],
        events: {
            "click a[role=tab]": "updateRoute",
            "shown.bs.tab": "focusInput"
        },
        dynamicTabs: [],
        /**
         * Accepts an instance of AbstractUserProfileTab (or an extension of it) as a new tab
         * to include in the profile
         */
        registerTab: function registerTab(tabView) {
            this.dynamicTabs.push(tabView);
        },

        /**
         * Removes any tabs which had been added dynamically
         */
        resetTabs: function resetTabs() {
            this.dynamicTabs = [];
        },

        /**
         * As the tabs change, place the focus on the first editable form field
         */
        focusInput: function focusInput(event) {
            $($(event.target).attr("href")).find(":input:not([readonly]):first").focus();
        },

        /**
         * When clicking on a new tab, the route needs to be updated to reflect the new nav state
         */
        updateRoute: function updateRoute(event) {
            var tabPane = $($(event.target).attr("href")),
                form = tabPane.find("form"),
                tabRoute = form.attr("id");

            EventManager.sendEvent(Constants.ROUTE_REQUEST, { routeName: "profile", args: [tabRoute], trigger: false });
        },

        /**
         * Show the main view container along with any tabs which are declared statically within
         * the UserProfileView template. Then load any additional tabs which have been registered.
         * Finally, show the appropriate tab based on the "args" provided (via URL params).
         */
        render: function render(args, callback) {
            var tabName = args[0] || "details";

            this.data.user = Configuration.loggedUser.toJSON();

            this.parentRender(function () {

                // instantiate a profile tab view which covers the DOM elements created
                // statically as part of the UserProfileTemplate
                this.staticTabs = _.map(this.$el.find('.tab-content>.tab-pane'), function (tabPanel) {
                    var tab = new AbstractUserProfileTab({
                        el: tabPanel
                    });
                    //tab.delegateEvents();
                    return tab;
                });

                // build the dynamically-registered tabs
                $.when.apply($, _.map(this.dynamicTabs, function (tab) {
                    var promise = $.Deferred(),
                        tabDetail = tab.getTabDetail(),
                        tabPanel = $('<div role="tabpanel" class="tab-pane">');
                    tabPanel.attr('id', tabDetail.panelId);
                    this.$el.find(".tab-content").append(tabPanel);
                    tab.element = tabPanel[0];

                    this.$el.find(".fr-profile-nav").append($('<li role="presentation">').append($('<a href="#' + tabDetail.panelId + '" role="tab" data-toggle="tab">').html(tabDetail.label)));

                    tab.render(_.cloneDeep(this.data), _.bind(function () {
                        promise.resolve();
                    }, this));
                    return promise;
                }, this)).then(_.bind(function () {
                    var selectedTabId = this.$el.find('form#' + tabName).closest(".tab-pane").attr("id"),
                        selectedTab = this.$el.find("ul.fr-profile-nav a[href='#" + selectedTabId + "']");

                    _.each(this.staticTabs.concat(this.dynamicTabs), _.bind(function (tab) {
                        tab.reloadFormData(_.cloneDeep(this.data.user));
                    }, this));

                    selectedTab.tab('show');

                    this.$el.find("#" + selectedTabId).find(":input:not([readonly]):first").focus();

                    if (callback) {
                        callback();
                    }
                }, this));
            });
        }
    });

    return new UserProfileView();
});
