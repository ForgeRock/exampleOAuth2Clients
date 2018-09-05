"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "jsonEditor", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/openidm/ui/common/util/ResourceCollectionUtils"], function ($, _, JSONEditor, AbstractView, resourceDelegate, resourceCollectionUtils) {

    var LinkedView = AbstractView.extend({
        template: "templates/admin/linkedView/LinkedView.html",
        events: {
            "change #linkedViewSelect": "changeResource"
        },
        editors: {},

        render: function render(args, callback) {
            resourceDelegate.linkedView(args.id, args.resourcePath).then(_.bind(function (linkedData) {

                this.data.linkedData = linkedData;
                this.data.linkedResources = [];

                _.each(this.data.linkedData.linkedTo, function (resource, index) {
                    this.data.linkedResources.push(this.cleanLinkName(resource.resourceName, resource.linkQualifier));

                    //This second loop is to ensure that null returned first level values actually display in JSON editor
                    //Without this it will not display the textfields
                    _.each(resource.content, function (attribute, key) {
                        if (attribute === null) {
                            this.data.linkedData.linkedTo[index].content[key] = "";
                        }
                    }, this);
                }, this);

                this.parentRender(_.bind(function () {
                    this.loadEditor("all");

                    if (callback) {
                        callback();
                    }
                }, this));
            }, this));
        },

        cleanLinkName: function cleanLinkName(name, linkQualifier) {
            var cleanName = name.split("/");

            cleanName.pop();

            cleanName = cleanName.join("/");

            if (linkQualifier) {
                cleanName = cleanName + " - " + linkQualifier;
            }

            return cleanName;
        },

        changeResource: function changeResource(event) {
            event.preventDefault();

            this.loadEditor($(event.target).val());
        },

        loadEditor: function loadEditor(selectedIndex) {
            var linkToResource = "#resource/",
                resourceId,
                displayEditor = _.bind(function (selection) {
                if (this.editors[selection]) {
                    this.editors[selection].destroy();
                }

                if (this.data.linkedData.linkedTo.length > 0) {

                    this.$el.closest(".container").find("#linkedSystemsTabHeader").show();

                    if (this.data.linkedData.linkedTo[selection].content !== null) {
                        resourceId = _.last(this.data.linkedData.linkedTo[selection].resourceName.split("/"));
                        linkToResource += this.data.linkedData.linkedTo[selection].resourceName.replace(resourceId, "edit/" + resourceId);

                        this.$el.find("#linkToResource").attr("href", linkToResource);

                        resourceDelegate.getSchema(this.data.linkedData.linkedTo[selection].resourceName.split("/")).then(_.bind(function (schema) {
                            var propCount = 0;
                            if (schema.order) {
                                _.each(schema.order, function (prop) {
                                    schema.properties[prop].propertyOrder = propCount++;
                                });
                            }

                            schema.properties = resourceCollectionUtils.convertRelationshipTypes(schema.properties);

                            if (schema.allSchemas) {
                                delete schema.allSchemas;
                            }

                            this.editors[selection] = new JSONEditor(this.$el.find("#linkedViewContent")[0], {
                                theme: "bootstrap3",
                                iconlib: "fontawesome4",
                                disable_edit_json: true,
                                disable_properties: true,
                                disable_array_delete: true,
                                disable_array_reorder: true,
                                disable_array_add: true,
                                schema: schema,
                                horizontalForm: true
                            });

                            if (this.data.linkedData.linkedTo[selection].content._id) {
                                delete this.data.linkedData.linkedTo[selection].content._id;
                            }

                            _.each(this.data.linkedData.linkedTo[selection].content, function (value, key) {
                                if (_.isArray(value) && value.length === 0) {
                                    this.data.linkedData.linkedTo[selection].content[key] = undefined;
                                }
                            }, this);

                            this.editors[selection].setValue(this.data.linkedData.linkedTo[selection].content);

                            this.$el.find(".row select").hide();
                            this.$el.find(".row input").attr("disabled", true);
                        }, this));
                    } else {
                        this.$el.find("#linkedViewContent").text($.t("templates.admin.LinkedTemplate.recordMissing") + ': ' + this.data.linkedData.linkedTo[selection].resourceName);
                    }
                }
            }, this);

            if (selectedIndex === "all") {
                this.$el.find("#linkToResource").hide();
                _.each(this.data.linkedResources, function (resource, index) {
                    displayEditor(index);
                });
            } else {
                this.$el.find("#linkToResource").show();
                displayEditor(selectedIndex);
            }
        }
    });

    return LinkedView;
});
