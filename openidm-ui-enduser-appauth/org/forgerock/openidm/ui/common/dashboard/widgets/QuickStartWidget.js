"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "backbone", "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget", "org/forgerock/commons/ui/common/main/EventManager", "backgrid", "org/forgerock/commons/ui/common/util/BackgridUtils", "faiconpicker"], function ($, _, Backbone, AbstractWidget, eventManager, Backgrid, BackgridUtils, faiconpicker) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
        template: "templates/dashboard/widget/QuickStartWidgetTemplate.html",
        model: {
            "overrideTemplate": "dashboard/widget/_quickStartConfig",
            "editedQuickCard": null
        },
        widgetRender: function widgetRender(args, callback) {
            this.data.cards = args.widget.cards;

            this.partials.push("partials/dashboard/widget/_quickStartConfig.html");

            _.each(this.data.cards, function (card) {
                card.name = $.t(card.name);

                if (card.event) {
                    this.events["click #" + card.uid] = function (e) {
                        e.preventDefault();
                        eventManager.sendEvent(card.event);
                    };
                }
            }, this);

            this.parentRender(_.bind(function () {
                if (callback) {
                    callback(this);
                }
            }, this));
        },
        customSettingsSave: function customSettingsSave(dialogRef, widget) {
            widget.cards = [];

            _.each(this.model.QuickObjectCollection.models, function (model) {
                widget.cards.push({
                    "name": model.attributes.name,
                    "icon": model.attributes.icon,
                    "href": model.attributes.href
                });
            });

            widget.size = dialogRef.$modalBody.find("#widgetSize").val();

            return widget;
        },
        customSettingsLoad: function customSettingsLoad(dialogRef) {
            var _this = this;

            this.model.QuickStartModel = Backbone.Model.extend({});
            this.model.QuickStartObjects = Backbone.Collection.extend({ model: this.model.QuickStartModel });
            this.model.QuickObjectCollection = new this.model.QuickStartObjects();

            _.each(this.data.cards, function (card) {
                this.model.QuickObjectCollection.add(card);
            }, this);

            this.model.quickObjectGrid = new Backgrid.Grid({
                className: "table backgrid",
                emptyText: $.t("dashboard.quickStart.noQuickStartLinks"),
                columns: BackgridUtils.addSmallScreenCell([{
                    name: "name",
                    cell: "string",
                    sortable: false,
                    editable: false
                }, {
                    name: "",
                    cell: BackgridUtils.ButtonCell([{
                        className: "fa fa-times grid-icon pull-right",
                        callback: function callback() {
                            this.model.destroy();
                        }
                    }, {
                        className: "fa fa-pencil grid-icon pull-right",
                        callback: function callback() {
                            _this.model.editedQuickCard = this.model;
                            _this.model.editedElement = this.el;

                            _this.clearQuickLinkForm(dialogRef);

                            dialogRef.$modalBody.find("#quickLinkName").val(this.model.attributes.name);
                            dialogRef.$modalBody.find("#quickLinkHref").val(this.model.attributes.href);
                            dialogRef.$modalBody.find("#quickLinkIcon").val(this.model.attributes.icon);

                            dialogRef.$modalBody.find(".fr-edit-well-header").html($.t("dashboard.quickStart.updateQuicklink"));
                            dialogRef.$modalBody.find("#createQuickLink").html("Update");

                            dialogRef.$modalBody.find(".iconpicker-container .input-group-addon i").attr("class", "fa " + this.model.attributes.icon);

                            dialogRef.$modalBody.find("#addQuickLink").hide();
                            dialogRef.$modalBody.find("#quickLinkAddHolder").show();
                        }
                    }]),
                    sortable: false,
                    editable: false
                }]),
                collection: this.model.QuickObjectCollection
            });

            dialogRef.$modalBody.find("#addQuickLink").bind("click", function () {
                dialogRef.$modalBody.find(".fr-edit-well-header").html($.t("dashboard.quickStart.addQuicklink"));
                dialogRef.$modalBody.find("#createQuickLink").html("Add");

                dialogRef.$modalBody.find("#addQuickLink").hide();
                dialogRef.$modalBody.find("#quickLinkAddHolder").show();
            });

            dialogRef.$modalBody.find("#cancelQuickLink").bind("click", function () {
                _this.clearQuickLinkForm(dialogRef);

                _this.model.editedQuickCard = null;
                _this.model.editedElement = null;

                dialogRef.$modalBody.find("#addQuickLink").show();
                dialogRef.$modalBody.find("#quickLinkAddHolder").hide();
            });

            dialogRef.$modalBody.find("#createQuickLink").bind("click", function () {
                if (!_.isNull(_this.model.editedQuickCard)) {
                    _this.model.editedQuickCard.attributes.name = dialogRef.$modalBody.find("#quickLinkName").val();
                    _this.model.editedQuickCard.attributes.href = dialogRef.$modalBody.find("#quickLinkHref").val();
                    _this.model.editedQuickCard.attributes.icon = dialogRef.$modalBody.find("#quickLinkIcon").val();

                    _this.clearQuickLinkForm(dialogRef);

                    dialogRef.$modalBody.find("#addQuickLink").show();
                    dialogRef.$modalBody.find("#quickLinkAddHolder").hide();

                    _this.model.editedQuickCard = null;
                    _this.model.editedElement = null;
                } else {
                    _this.model.QuickObjectCollection.add({
                        "name": dialogRef.$modalBody.find("#quickLinkName").val(),
                        "href": dialogRef.$modalBody.find("#quickLinkHref").val(),
                        "icon": dialogRef.$modalBody.find("#quickLinkIcon").val()
                    });
                }

                dialogRef.$modalBody.find("#addQuickLink").show();
                dialogRef.$modalBody.find("#quickLinkAddHolder").hide();

                _this.model.quickObjectGrid.render();
                _this.clearQuickLinkForm(dialogRef);
            });

            dialogRef.$modalBody.find("#quickLinkIcon").iconpicker({
                hideOnSelect: true
            });

            dialogRef.$modalBody.find("#quickStartGridHolder").append(this.model.quickObjectGrid.render().el);
        },

        clearQuickLinkForm: function clearQuickLinkForm(dialogRef) {
            dialogRef.$modalBody.find("#quickLinkName").val("");
            dialogRef.$modalBody.find("#quickLinkHref").val("");
            dialogRef.$modalBody.find("#quickLinkIcon").val("");
            dialogRef.$modalBody.find(".iconpicker-container .input-group-addon i").attr("class", "");
        }
    });

    widgetInstance.generateWidget = function (loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new Widget());

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});
