"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "org/forgerock/openidm/ui/common/util/QueryFilterEditor", "org/forgerock/openidm/ui/common/delegates/ScriptDelegate", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate"], function ($, _, Handlebars, QueryFilterEditor, ScriptDelegate, UIUtils, ResourceDelegate) {

    var ResourceQueryFilterEditor = QueryFilterEditor.extend({
        events: {
            "change .expressionTree :input": "updateFilterNodeValue",
            "keyup .expressionTree input": "updateFilterNodeValue",
            "change .expressionTree": "editorOnChange",
            "click .expressionTree .add-btn": "addFilterNode",
            "click .expressionTree .remove-btn": "removeFilterNode"
        },
        model: {},

        render: function render(args, callback) {
            var _this2 = this;

            this.setElement(args.element);

            this.args = args;

            this.data = {
                config: {
                    ops: ["and", "or", "not", "expr"],
                    tags: ["pr", "equalityMatch", "approxMatch", "co", "greaterOrEqual", "gt", "lessOrEqual", "lt"]
                },
                showSubmitButton: false
            };

            this.data.filterString = args.queryFilter;

            if (args.loadSourceProps) {
                this.loadSourceProps = args.loadSourceProps;
            }

            Promise.all([this.loadSourceProps(), ResourceDelegate.getSchema(this.args.resource.split("/"))]).then(function (results) {
                var _results = _slicedToArray(results, 2),
                    sourceProps = _results[0],
                    schema = _results[1];

                _this2.model.schema = schema;
                _this2.model.sourceProps = sourceProps;

                if (_this2.data.filterString !== "") {
                    ScriptDelegate.parseQueryFilter(_this2.data.filterString).then(_.bind(function (queryFilterTree) {
                        this.data.queryFilterTree = queryFilterTree;
                        this.data.filter = this.transform(this.data.queryFilterTree);
                        this.delegateEvents(this.events);
                        this.renderExpressionTree(_.bind(function () {
                            this.changeToDropdown();
                            if (callback) {
                                callback();
                            }
                        }, this));
                    }, _this2));
                } else {
                    _this2.data.filter = { "op": "none", "children": [] };
                    _this2.delegateEvents(_this2.events);
                    _this2.renderExpressionTree(_.bind(function () {
                        this.changeToDropdown();
                        if (callback) {
                            callback();
                        }
                    }, _this2));
                }
            });
        },

        loadSourceProps: function loadSourceProps() {
            return ResourceDelegate.getSchema(this.args.resource.split("/")).then(function (resourceSchema) {
                var sourceProps = _.filter(_.keys(resourceSchema.properties), function (prop) {
                    var searchable = resourceSchema.properties[prop].searchable;

                    //if nativeType is available this is a system object
                    //in this case use nativeType
                    if (resourceSchema.properties[prop].nativeType) {
                        searchable = resourceSchema.properties[prop].nativeType === "string";
                    }

                    return searchable;
                }).sort();

                return sourceProps;
            });
        },

        removeFilterNode: function removeFilterNode(event) {
            this.removeNode(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
        },
        addFilterNode: function addFilterNode(event) {
            this.addNodeAndReRender(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
        },
        updateFilterNodeValue: function updateFilterNodeValue(event) {
            this.updateNodeValue(event, _.bind(function () {
                this.changeToDropdown();
            }, this));
            this.editorOnChange();
        },
        changeToDropdown: function changeToDropdown() {
            var _this3 = this;

            UIUtils.preloadPartial("partials/resource/_attributeSelectizeTemplate.html").then(function () {
                var _this = _this3;

                _this3.$el.find(".name").each(function (name, index) {
                    var _this$model = _this.model,
                        schema = _this$model.schema,
                        sourceProps = _this$model.sourceProps,
                        currentSelect = this,
                        newSelect = _this.createNameDropdown(this),
                        generateHtml = function generateHtml(item) {
                        var text = item.text,
                            value = item.value.slice(1);

                        return Handlebars.compile("{{> resource/_attributeSelectizeTemplate}}")({ text: text, value: value });
                    };

                    $(currentSelect).replaceWith(newSelect);

                    $(newSelect).selectize({
                        create: true,
                        options: sourceProps.map(function (prop) {
                            return { value: "/" + prop, text: schema.properties[prop].title || _.startCase(prop) };
                        }),
                        valueField: "value",
                        labelField: "text",
                        render: {
                            option: generateHtml
                        }
                    });

                    $(newSelect)[0].selectize.setValue($(newSelect).val());

                    $(newSelect)[0].selectize.on('option_add', function (value, data) {
                        if (_this.model.previousSelectizeAdd !== value) {
                            _this.model.previousSelectizeAdd = "/" + value;

                            $(newSelect)[0].selectize.removeOption(value);
                            $(newSelect)[0].selectize.addOption({ value: "/" + value, text: value });
                            $(newSelect)[0].selectize.addItem("/" + value);
                        }
                    });
                });

                _this3.editorOnChange();
            });
        },
        createNameDropdown: function createNameDropdown(input) {
            var baseElement = $('<select style="width:100%;" class="name form-control"></select>'),
                tempValue = $(input).val().replace("/", ""),
                displayValue;

            _.each(this.model.sourceProps, function (source) {
                if (source !== undefined) {
                    baseElement.append('<option value="/' + source + '">' + source + '</option>');
                }
            });

            if (tempValue.length > 0 && baseElement.find("option[value='/" + tempValue + "']").length === 0 && baseElement.find("option[value='/" + tempValue + "']").length === 0) {
                displayValue = tempValue.replace("/", "");

                baseElement.append('<option value="/' + tempValue + '">' + displayValue + '</option>');
            }

            baseElement.val("/" + tempValue);

            return baseElement;
        },
        editorOnChange: function editorOnChange() {
            if (this.args.onChange) {
                this.args.onChange();
            }
        }
    });

    return ResourceQueryFilterEditor;
});
