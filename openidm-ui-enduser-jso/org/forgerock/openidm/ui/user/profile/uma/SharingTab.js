"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "backgrid", "handlebars", "moment", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/common/resource/ResourceCollection", "org/forgerock/openidm/ui/user/profile/uma/ShareDialogView", "org/forgerock/openidm/ui/util/UmaUtils", "backgrid-paginator", "selectize"], function ($, _, Backgrid, Handlebars, moment, AMDelegate, BackgridUtils, Configuration, constants, eventManager, AbstractUserProfileTab, ResourceCollection, _ShareDialogView, UmaUtils) {
    var SharingView = AbstractUserProfileTab.extend({
        template: "templates/profile/uma/SharingTab.html",
        model: {},
        partials: ["partials/profile/_sharingGridEllipsis.html", "partials/profile/_shareDialog.html"],
        events: _.extend({
            "click .shareDialog": "ShareDialogView",
            "click .shareResource": "shareResource",
            "click .unshareResource": "unshareResource",
            "submit #sharing": "filterResources"
        }, AbstractUserProfileTab.prototype.events),

        /**
        Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
        **/
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "SharingTab",
                "label": $.t("common.user.profileMenu.sharing")
            };
        },

        render: function render(args, callback) {
            var _this2 = this;

            var filterString = this.$el.find("#sharingFilter").val();

            this.data = {};
            this.data.user = Configuration.loggedUser.authenticationId;

            if (args && args.filterString) {
                filterString = args.filterString;
            }

            $.when(AMDelegate.getResourceSet(filterString), AMDelegate.getPendingRequests()).then(function (resourceSet, pendingRequests) {
                _this2.data.pendingRequestCount = pendingRequests.resultCount;
                _this2.data.resourceSet = _.filter(resourceSet.result, function (resource) {
                    return resource.resourceOwnerId === _this2.data.user;
                });

                _.each(_this2.data.resourceSet, function (resource) {
                    if (_.has(resource, "policy.permissions") && resource.policy.permissions.length) {
                        if (resource.policy.permissions.length === 1) {
                            resource.shareText = $.t("templates.sharing.sharedWithOne");
                        } else {
                            resource.shareText = $.t("templates.sharing.sharedWithMany", { "number": resource.policy.permissions.length });
                        }
                    } else {
                        resource.shareText = $.t("templates.sharing.notShared");
                    }
                });

                _this2.parentRender(function () {
                    _this2.buildSharingGrid();

                    if (_this2.model.filterString) {
                        _this2.$el.find("#sharingFilter").val(_this2.model.filterString);
                    }

                    _this2.delegateEvents();

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        ShareDialogView: function ShareDialogView(e) {
            var _this3 = this;

            var id = $(e.target).closest("div").data("resource-id"),
                resource = _.find(this.data.resourceSet, function (set) {
                return id === set._id;
            }),
                args = {
                "id": id,
                "resource": resource
            };

            e.preventDefault();

            _ShareDialogView.render(args, function () {
                _this3.render({ "filterString": _this3.model.filterString });
            });
        },

        buildSharingGrid: function buildSharingGrid() {
            var paginator,
                sharingGrid,
                _this = this;

            this.model.sharingCollection = new ResourceCollection(this.data.resourceSet, {
                mode: "client"
            });

            this.$el.find("#sharingGrid").empty();
            this.$el.find("#sharingGrid-paginator").empty();

            sharingGrid = new Backgrid.Grid({
                className: "backgrid table-hover",
                emptyText: $.t("templates.admin.ResourceList.noData"),
                row: BackgridUtils.ClickableRow.extend({
                    callback: function callback(e) {
                        var $target = $(e.target).closest("div"),
                            _id = this.model.get("_id");

                        if (e) {
                            e.preventDefault();
                        }

                        if (!$target.hasClass("ellipsis-margin")) {
                            // clicking ellipsis should not navigate away
                            eventManager.sendEvent(constants.ROUTE_REQUEST, { "routeName": "resourceDetails", "args": [_id] });
                        }
                    }
                }),
                columns: BackgridUtils.addSmallScreenCell([{
                    name: "",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({
                        render: function render() {
                            var uri = this.model.get("icon_uri") || "images/resource.png",
                                name = this.model.get("name"),
                                display;

                            display = $('<div class="sharing-icon-margin">' + '<img class="fr-panel-logo img-rounded" src="' + uri + '"/>' + '<span class="fr-panel-name">' + name + '</span></div>');

                            this.$el.html(display);

                            return this;
                        }
                    })
                }, {
                    name: "shareText",
                    label: "",
                    cell: Backgrid.Cell.extend({
                        className: "text-muted"
                    }),
                    sortable: false,
                    editable: false
                }, {
                    name: "",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({
                        events: {
                            "click .editResource": "showResourceView"
                        },
                        className: "show-dropdown",
                        render: function render() {
                            var id = this.model.get("_id"),
                                currentResource = _.filter(_this.data.resourceSet, function (resource) {
                                return resource._id === id;
                            }),
                                shared = true;

                            if (currentResource[0].shareText === "Not shared") {
                                shared = false;
                            }

                            this.$el.html(Handlebars.compile("{{> profile/_sharingGridEllipsis}}")({
                                "_id": this.model.get("_id"),
                                "shared": shared
                            }));

                            return this;
                        },

                        showResourceView: function showResourceView(e) {
                            var _id = this.model.get("_id");

                            e.preventDefault();

                            eventManager.sendEvent(constants.ROUTE_REQUEST, { "routeName": "resourceDetails", "args": [_id] });
                        }
                    })
                }]),

                collection: this.model.sharingCollection
            });

            paginator = new Backgrid.Extension.Paginator({
                collection: this.model.sharingCollection,
                goBackFirstOnSort: false,
                windowSize: 0,
                controls: {
                    rewind: {
                        label: " ",
                        title: $.t("templates.backgrid.first")
                    },
                    back: {
                        label: " ",
                        title: $.t("templates.backgrid.previous")
                    },
                    forward: {
                        label: " ",
                        title: $.t("templates.backgrid.next")
                    },
                    fastForward: {
                        label: " ",
                        title: $.t("templates.backgrid.last")
                    }
                }
            });

            this.$el.find("#sharingGrid").append(sharingGrid.render().el);
            this.$el.find("#sharingGrid-paginator").append(paginator.render().el);
        },

        unshareResource: function unshareResource(e) {
            var _this4 = this;

            var id = $(e.target).closest("div").data("resource-id");

            e.preventDefault();

            UmaUtils.renderConfirmDialog({ "id": id }, function () {
                _this4.render();
            });
        },

        filterResources: function filterResources(e) {
            e.preventDefault();

            this.model.filterString = this.$el.find("#sharingFilter").val();
            this.render({ "filterString": this.model.filterString });
        }
    });

    return new SharingView();
});
