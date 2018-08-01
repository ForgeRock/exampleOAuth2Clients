"use strict";

/*
 * Copyright 2014-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/openidm/ui/common/util/FilterEditor", "org/forgerock/openidm/ui/common/delegates/ScriptDelegate"], function ($, _, FilterEditor, ScriptDelegate) {
    var tagMap = {
        "equalityMatch": "eq",
        "greaterOrEqual": "ge",
        "lessOrEqual": "le",
        "approxMatch": "sw"
    },
        invertedTagMap = _.invert(tagMap),
        QueryFilterEditor = FilterEditor.extend({
        transform: function transform(queryFilterTree) {
            if (_.has(queryFilterTree, "subfilters")) {
                return {
                    "op": queryFilterTree.operator,
                    "children": _.map(queryFilterTree.subfilters, this.transform, this)
                };
            } else if (_.has(queryFilterTree, "subfilter")) {
                return {
                    "op": queryFilterTree.operator === "!" ? "not" : queryFilterTree.operator,
                    "children": [this.transform(queryFilterTree.subfilter)]
                };
            } else {
                return {
                    "name": queryFilterTree.field,
                    "op": "expr",
                    "tag": invertedTagMap[queryFilterTree.operator] || queryFilterTree.operator,
                    "value": queryFilterTree.value,
                    "children": []
                };
            }
        },
        serialize: function serialize(node) {
            var prop,
                propType = "string"; //we are treating all properties as strings unless we have a schema available

            if (node) {
                if (this.model && this.model.resourceSchema && node.name) {
                    prop = this.model.resourceSchema.properties[node.name.replace("/", "")];

                    if (prop) {
                        propType = prop.type;
                    }
                }
                switch (node.op) {
                    case "expr":
                        if (node.tag === "pr") {
                            return [node.name, "pr"].join(" ");
                        } else {
                            var nodeValue = '"' + node.value + '"';

                            if (propType !== "string") {
                                nodeValue = node.value;
                            }

                            return [node.name, tagMap[node.tag] || node.tag, nodeValue].join(" ").trim();
                        }
                        break;
                    case "not":
                        return "!(" + this.serialize(node.children[0]) + ")";
                    case "none":
                        return "";
                    default:
                        var sc = _.map(node.children, this.serialize, this),
                            string = "(" + sc.join(" " + node.op + " ") + ")";
                        return string;
                }
            } else {
                return "";
            }
        },
        getFilterString: function getFilterString() {
            return this.serialize(this.data.filter);
        },
        createDataObject: function createDataObject(argsData) {
            var data = {
                config: {
                    ops: ["and", "or", "not", "expr"],
                    tags: ["pr", "equalityMatch", "approxMatch", "co", "greaterOrEqual", "gt", "lessOrEqual", "lt"]
                },
                showSubmitButton: false
            };
            if (argsData) {
                data = _.merge({}, data, argsData);
            }
            return data;
        },
        render: function render(args, callback) {
            this.setElement(args.element);

            this.data = this.createDataObject(args.data);

            this.data.filterString = args.queryFilter;
            if (this.data.filterString !== "") {
                ScriptDelegate.parseQueryFilter(this.data.filterString).then(_.bind(function (queryFilterTree) {
                    this.data.queryFilterTree = queryFilterTree;
                    this.data.filter = this.transform(this.data.queryFilterTree);
                    this.delegateEvents(this.events);
                    this.renderExpressionTree();
                }, this));
            } else {
                this.data.filter = { "op": "none", "children": [] };
                this.delegateEvents(this.events);
                this.renderExpressionTree();
            }

            if (callback) {
                callback();
            }
        }
    });

    return QueryFilterEditor;
});
