"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "jsonEditor", "org/forgerock/commons/ui/common/main/Router"], function ($, _, JSONEditor, router) {
    var JSONEditorPostBuild = JSONEditor.AbstractEditor.prototype.postBuild;
    JSONEditor.AbstractEditor.prototype.postBuild = function () {
        var ret = JSONEditorPostBuild.apply(this, arguments),


        //showHideRelationshipFields shows and hides the correct properties in the managed schema editor
        //when the "type" or "itemType" property is changed to/from relationship
        showHideRelationshipFields = function showHideRelationshipFields(container, schemapath, type) {
            var typeLength = type.length + 1,
                typeSelect;

            //any field that has a schemapath ending in "type" or "itemType" needs to have an onChange event attached to it
            if (schemapath.substr(schemapath.length - typeLength) === "." + type) {
                typeSelect = container.parent().parent().find("select");

                typeSelect.change(function () {
                    var arrayItemProps = $(this).parent().closest(".row").find(".well:first").find(".row:lt(2)");

                    if ($(this).val() === "Relationship" && type === "type") {
                        //this is not an array of relationships so hide relationship properties:
                        //"Return by Default", "Reverse Relationship", and "Reverse Property Name"
                        arrayItemProps.hide();
                    } else if ($(this).val() === "Relationship" && type === "itemType") {
                        //this is an array of relationships so show
                        //"Return by Default", "Reverse Relationship", and "Reverse Property Name"
                        arrayItemProps.show();
                    }
                });
            }
        };

        if (this.path && this.input && this.label && !this.input.id && !this.label.htmlFor) {
            this.input.id = (this.jsoneditor.options.uuid || this.jsoneditor.uuid) + "-" + this.path.replace(/\./g, "-");
            this.label.htmlFor = (this.jsoneditor.options.uuid || this.jsoneditor.uuid) + "-" + this.path.replace(/\./g, "-");

            if (this.jsoneditor.options.formHorizontal) {
                $(this.jsoneditor.element).addClass("form-horizontal");
                $(this.label).addClass("col-sm-2");
                $(this.input).wrap("<div class='col-sm-10'></div>");
            }

            //if this json editor is for the Managed Object Schema Editor handle relationship fields
            if (_.contains(router.currentRoute.view, "AddEditManagedView")) {
                showHideRelationshipFields($(this.container), $(this.container).data("schemapath"), "type");
                showHideRelationshipFields($(this.container), $(this.container).data("schemapath"), "itemType");
            }
        }

        if (this.jsoneditor.options.disable_array_delete_all) {
            $(this.jsoneditor.element).find('.json-editor-btn-delete[title="Delete All"]').addClass("hidden");
        }

        return ret;
    };
});
