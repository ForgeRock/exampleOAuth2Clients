"use strict";

/*
 * Copyright 2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "backgrid", "handlebars", "moment", "org/forgerock/openidm/ui/util/delegates/AMDelegate", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/user/profile/AbstractUserProfileTab", "org/forgerock/openidm/ui/common/resource/ResourceCollection", "backgrid-paginator"], function ($, _, Backgrid, Handlebars, moment, AMDelegate, BackgridUtils, Configuration, constants, AbstractUserProfileTab, ResourceCollection) {
    var SharingView = AbstractUserProfileTab.extend({
        template: "templates/profile/uma/ActivityTab.html",
        model: {},
        partials: ["partials/profile/_activityGridRow.html"],
        events: _.extend({
            "change .checkbox input": "formSubmit"
        }, AbstractUserProfileTab.prototype.events),
        /**
        Expected by all dynamic user profile tabs - returns a map of details necessary to render the nav tab
        **/
        getTabDetail: function getTabDetail() {
            return {
                "panelId": "activityTab",
                "label": $.t("common.user.profileMenu.activity")
            };
        },

        render: function render(args, callback) {
            var _this = this;

            $.when(AMDelegate.getResourceSet(), AMDelegate.getAuditHistory()).then(function (resourceSet, auditHistory) {
                _this.model.resourceSet = resourceSet.result;
                _this.data.auditHistory = auditHistory.result;

                //format eventTime
                _.each(_this.data.auditHistory, function (obj) {
                    obj.eventTime = moment(obj.eventTime).fromNow();
                    var resource = _.find(_this.model.resourceSet, { '_id': obj.resourceSetId }) || {};

                    if (!_.isUndefined(resource) && !_.isEmpty(resource.icon_uri)) {
                        obj.icon_uri = resource.icon_uri;
                    } else {
                        obj.icon_uri = "images/resource.png";
                    }

                    if (obj.type === "Policy_Updated") {
                        obj.action = $.t("templates.activity.updated");
                    } else {
                        obj.action = $.t("templates.activity.created");
                    }

                    resource.resourceSetName = obj.resourceSetName;
                    resource.action = obj.action;
                    resource.eventTime = obj.eventTime;
                });

                _this.parentRender(function () {
                    _this.buildActivityGrid();

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        buildActivityGrid: function buildActivityGrid() {
            var paginator, activityGrid;

            this.model.activityCollection = new ResourceCollection(this.data.auditHistory, {
                mode: "client"
            });

            this.$el.find("#activityGrid").empty();
            this.$el.find("#activityGrid-paginator").empty();

            activityGrid = new Backgrid.Grid({
                className: "backgrid",
                emptyText: $.t("templates.admin.ResourceList.noData"),
                columns: BackgridUtils.addSmallScreenCell([{
                    name: "",
                    sortable: false,
                    editable: false,
                    cell: Backgrid.Cell.extend({
                        className: "",
                        render: function render() {
                            this.$el.html(Handlebars.compile("{{> profile/_activityGridRow}}")({
                                "icon": this.model.get("icon_uri"),
                                "resourceSetName": this.model.get("resourceSetName") || this.model.get("name"),
                                "action": this.model.get("action") || "Resource Created",
                                "eventTime": this.model.get("eventTime")
                            }));
                            return this;
                        }
                    })
                }]),
                collection: this.model.activityCollection
            });

            paginator = new Backgrid.Extension.Paginator({
                collection: this.model.activityCollection,
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

            this.$el.find("#activityGrid").append(activityGrid.render().el);
            this.$el.find("#activityGrid-paginator").append(paginator.render().el);
        }
    });

    return new SharingView();
});
