"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "handlebars", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Router", "backgrid", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/components/Messages", "org/forgerock/commons/ui/common/main/AbstractCollection", "org/forgerock/commons/ui/common/main/AbstractModel", "org/forgerock/openidm/ui/common/util/ResourceCollectionUtils", "org/forgerock/openidm/ui/common/resource/ResourceCollectionSearchDialog", "org/forgerock/commons/ui/common/util/UIUtils", "d3", "backgrid-paginator", "backgrid-selectall"], function ($, _, Handlebars, AbstractView, constants, Router, Backgrid, BackgridUtils, resourceDelegate, messagesManager, AbstractCollection, AbstractModel, resourceCollectionUtils, ResourceCollectionSearchDialog, uiUtils, d3) {
    var RelationshipArrayView = AbstractView.extend({
        template: "templates/admin/resource/RelationshipArrayViewTemplate.html",
        noBaseTemplate: true,
        model: {},

        events: {
            "click .reload-grid-btn": "reloadGrid",
            "click .add-relationship-btn": "addRelationship",
            "click .remove-relationships-btn": "removeRelationships",
            "click .clear-filters-btn": "clearFilters",
            "click .toggle-chart": "toggleChart"
        },

        toggleChart: function toggleChart(event) {
            if (event) {
                event.preventDefault();
            }

            if (this.data.showChart) {
                this.data.showChart = false;

                this.$el.find('.relationshipListContainer').show();
                this.$el.find('.relationshipGraphContainer').hide();
            } else {
                this.data.showChart = true;

                this.$el.find('.relationshipListContainer').hide();
                this.$el.find('.relationshipGraphContainer').show();
            }
        },

        clearFilters: function clearFilters(event) {
            if (event) {
                event.preventDefault();
            }

            this.render(this.args);
            this.$el.find('.clear-filters-btn').prop('disabled', true);
        },
        addRelationship: function addRelationship(e) {
            if (e) {
                e.preventDefault();
            }

            this.openResourceCollectionDialog();
        },
        removeRelationships: function removeRelationships(e) {
            if (e) {
                e.preventDefault();
            }

            var confirmText = "";

            if (this.args.prop && this.args.prop.title) {
                confirmText = $.t("templates.admin.ResourceEdit.confirmDeleteSelectedSpecific", { "type": this.args.prop.title });
            } else {
                confirmText = $.t("templates.admin.ResourceEdit.confirmDeleteSelected");
            }

            uiUtils.confirmDialog(confirmText, "danger", _.bind(function () {
                var promise;
                /*
                loop over the selectedItems you want to delete and
                build "promise" by tacking on a "then" for each item
                */
                _.each(this.data.selectedItems, _.bind(function (relationship) {
                    if (!promise) {
                        //no promise exists so create it
                        promise = this.deleteRelationship(relationship);
                    } else {
                        //promise exists now "concat" a new "then" onto the original promise
                        promise = promise.then(_.bind(function () {
                            return this.deleteRelationship(relationship);
                        }, this));
                    }
                }, this));

                //"concat" the final "then" onto promise
                promise.then(_.bind(function (proms) {
                    this.reloadGrid(null, _.bind(function () {
                        messagesManager.messages.addMessage({ "message": $.t("templates.admin.ResourceEdit.deleteSelectedSuccess") });
                    }, this));
                }, this));
            }, this));
        },

        reloadGrid: function reloadGrid(event, callback) {
            if (event) {
                event.preventDefault();
            }
            this.render(this.args, callback);
        },
        getURL: function getURL() {
            return constants.host + constants.context + "/" + this.relationshipUrl;
        },
        getCols: function getCols() {
            var _this = this,
                selectCol = {
                name: "",
                cell: "select-row",
                headerCell: "select-all",
                sortable: false,
                editable: false
            },
                schema = this.schema,
                cols = [],
                relationshipPropName = this.data.prop.propName,
                relationshipProp = this.schema.properties[this.data.prop.propName].items;

            this.hasRefProperties = _.toArray(relationshipProp.properties._refProperties.properties).length > 1;

            cols.push({
                "name": "details",
                "label": $.t("templates.admin.ResourceEdit.details"),
                "cell": Backgrid.Cell.extend({
                    render: function render() {
                        var displayObject = resourceCollectionUtils.buildResourceDisplayObject(_this.schema, _this.data.prop, this.model.attributes, this.model.attributes),
                            routeArgs = this.model.attributes._ref.split("/"),
                            editRouteName = routeArgs[0] === "managed" ? "adminEditManagedObjectView" : "adminEditSystemObjectView",
                            href = Router.getLink(Router.configuration.routes[editRouteName], routeArgs),
                            link = '<a class="resourceEditLink" href="#' + href + '">' + displayObject.txt + '</a>';

                        if (displayObject.path.indexOf("repo") >= 0) {
                            link = "<span class='unEditable'>" + displayObject.txt + "</span>";
                        }

                        this.$el.html(link);

                        return this;
                    }
                }),
                sortable: false,
                editable: false
            });

            cols.push({
                "name": "type",
                "label": $.t("templates.admin.ResourceEdit.type"),
                "cell": Backgrid.Cell.extend({
                    render: function render() {
                        var propertyValuePath = resourceCollectionUtils.getPropertyValuePath(this.model.attributes),
                            txt = _.map(propertyValuePath.split("/"), function (item) {
                            return item.charAt(0).toUpperCase() + item.slice(1);
                        }).join(" "),
                            relationshipProp = _this.data.prop.items ? _this.data.prop.items : _this.data.prop,
                            resourceCollection = _.findWhere(relationshipProp.resourceCollection, { path: propertyValuePath });

                        if (resourceCollection && resourceCollection.label) {
                            txt = resourceCollection.label;
                        }

                        this.$el.html(txt);

                        return this;
                    }
                }),
                sortable: false,
                editable: false
            });

            if (this.hasRefProperties) {
                this.$el.find('.clear-filters-btn').show();
            }

            _.each(relationshipProp.properties._refProperties.properties, _.bind(function (col, colName) {
                if (colName !== "_id") {
                    cols.push({
                        "name": "/_refProperties/" + colName,
                        "label": col.title || col.label || colName,
                        "headerCell": BackgridUtils.FilterHeaderCell,
                        "cell": "string",
                        "sortable": true,
                        "editable": false,
                        "sortType": "toggle"
                    });
                }
            }, this));

            cols.unshift(selectCol);

            return cols;
        },
        toggleActions: function toggleActions() {
            if (this.data.selectedItems.length === 0) {
                this.$el.find('.remove-relationships-btn').prop('disabled', true);
            } else {
                this.$el.find('.remove-relationships-btn').prop('disabled', false);
            }
        },

        render: function render(args, callback) {
            this.args = args;
            this.element = args.element;
            this.relationshipUrl = args.prop.relationshipUrl;
            this.schema = args.schema;
            this.data.prop = args.prop;
            this.data.addResource = $.t("templates.admin.ResourceEdit.addResource", { resource: args.prop.title });
            this.data.removeResource = $.t("templates.admin.ResourceEdit.removeSelectedResource", { resource: args.prop.title });
            this.data.grid_id = "relationshipArrayList-" + args.prop.propName;
            this.grid_id_selector = "#" + this.data.grid_id;
            this.data.selectedItems = [];
            this.data.showChart = args.showChart || false;

            this.parentRender(function () {

                this.buildRelationshipArrayGrid(this.getCols(), args.onGridChange).then(function () {
                    if (callback) {
                        callback();
                    }
                });
            });
        },
        buildRelationshipArrayGrid: function buildRelationshipArrayGrid(cols, onGridChange) {
            var _this = this,
                grid_id = this.grid_id_selector,
                url = this.getURL(),
                pager_id = grid_id + '-paginator',
                RelationshipCollection = AbstractCollection.extend({
                initialize: function initialize(models, options) {
                    this.url = url;
                    this.model = AbstractModel.extend({
                        /*
                            By default AbstractModel sets the idAttribute to "_id".
                            In this grid the "_id" property is not actually the _id
                            of the relationship it is the _id of the resource being
                            displayed. There could be duplicates of this _id if a
                            relationship is created multiple times on the same resource.
                            Overriding the "idAttribute" by setting it to use "_refProperties._id"
                            allows the "duplicates" to be displayed/edited/removed.
                        */
                        idAttribute: "_refProperties._id"
                    });
                    this.state = _.extend({}, this.state, BackgridUtils.getState("_id"));
                    this.queryParams = _.extend({}, this.queryParams, BackgridUtils.getQueryParams({
                        _queryFilter: 'true',
                        _fields: ''
                    }));
                }
            }),
                relationshipGrid,
                paginator;

            this.model.relationships = new RelationshipCollection();

            this.model.relationships.on('sync', function () {
                if (onGridChange) {
                    onGridChange();
                }
            });

            relationshipGrid = new Backgrid.Grid({
                className: "backgrid table table-hover",
                emptyText: $.t("templates.admin.ResourceList.noData"),
                columns: BackgridUtils.addSmallScreenCell(cols),
                collection: _this.model.relationships,
                row: BackgridUtils.ClickableRow.extend({
                    callback: function callback(e) {
                        var $target = $(e.target),
                            isInternal = this.model.attributes._ref.indexOf("repo/internal") === 0;

                        if (isInternal && !$target.is("input")) {
                            e.preventDefault();
                        }

                        if ($target.is("input") || $target.is(".select-row-cell") || $target.hasClass("resourceEditLink") || $target.is(".unEditable")) {
                            return;
                        }

                        if (_this.hasRefProperties || isInternal) {
                            _this.openResourceCollectionDialog(this.model.attributes);
                        } else {
                            location.href = $target.closest("tr").find(".resourceEditLink").attr("href");
                        }
                    }
                })
            });

            paginator = new Backgrid.Extension.Paginator({
                collection: this.model.relationships,
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

            this.$el.find(grid_id).append(relationshipGrid.render().el);
            this.$el.find(pager_id).append(paginator.render().el);
            this.bindDefaultHandlers();

            return this.model.relationships.getFirstPage();
        },

        onRowSelect: function onRowSelect(model, selected) {
            if (selected) {
                if (!_.contains(this.data.selectedItems, model.attributes)) {
                    this.data.selectedItems.push(model.attributes);
                }
            } else {
                this.data.selectedItems = _.without(this.data.selectedItems, model.attributes);
            }
            this.toggleActions();
        },

        bindDefaultHandlers: function bindDefaultHandlers() {
            var _this = this;

            this.model.relationships.on("backgrid:selected", _.bind(function (model, selected) {
                this.onRowSelect(model, selected);
            }, this));

            this.model.relationships.on("backgrid:sort", BackgridUtils.doubleSortFix);

            this.model.relationships.on("sync", _.bind(function (collection) {
                var hasFilters = false;
                _.each(collection.state.filters, function (filter) {
                    if (filter.value.length) {
                        hasFilters = true;
                    }
                });

                if (hasFilters) {
                    this.$el.find('.clear-filters-btn').prop('disabled', false);
                } else {
                    this.$el.find('.clear-filters-btn').prop('disabled', true);
                }

                if (collection.models.length) {
                    this.loadChart(collection.models);
                    this.$el.find(".toggle-chart-buttons").show();
                } else {
                    this.data.showChart = false;
                    this.$el.find(".toggle-chart-buttons").hide();
                }
            }, this));
        },

        deleteRelationship: function deleteRelationship(value) {
            var deleteUrl = constants.host + constants.context + "/" + this.data.prop.relationshipUrl;

            return resourceDelegate.deleteResource(deleteUrl, value._refProperties._id);
        },
        createRelationship: function createRelationship(value) {
            var self = this,
                newVal = {
                _ref: value._ref,
                _refProperties: _.omit(value._refProperties, "_id", "_rev")
            },
                patchUrl = constants.host + constants.context + "/",
                patchUrlArray = this.data.prop.relationshipUrl.split("/");

            patchUrlArray.pop();

            patchUrl += patchUrlArray.join("/");

            return resourceDelegate.serviceCall({
                serviceUrl: patchUrl,
                url: "/" + this.data.prop.propName + "?_action=create",
                type: "POST",
                data: JSON.stringify(newVal),
                errorsHandlers: {
                    "error": {
                        status: "400"
                    },
                    "alreadyAdded": {
                        status: "412"
                    }
                },
                error: function error(e) {
                    if (e.status === 400 && e.responseJSON.message.indexOf("not null") > -1) {
                        messagesManager.messages.addMessage({ "type": "error", "message": $.t("templates.admin.ResourceEdit.conflictWithExistingRelationship") });
                    } else if (e.status === 400 && e.responseJSON.message.indexOf("duplicate relationship") > -1) {
                        var resourceRefArray = value._ref.split("/"),
                            resourceId = resourceRefArray.pop(),
                            serviceUrl = resourceDelegate.getServiceUrl(resourceRefArray);

                        //we need to get the resource so we can build a nice meaningful error display
                        resourceDelegate.readResource(serviceUrl, resourceId).then(function (resource) {
                            var displayObject = resourceCollectionUtils.buildResourceDisplayObject(self.schema, self.data.prop, value, resource);

                            messagesManager.messages.addMessage({ "type": "error", "message": $.t("templates.admin.ResourceEdit.cannotHaveDuplicateRelationship", { resource: displayObject.txt }) });
                        });
                    } else if (e.status === 412) {
                        messagesManager.messages.addMessage({ "type": "error", "message": $.t("templates.admin.ResourceEdit.alreadyConfigured") });
                    } else {
                        messagesManager.messages.addMessage({ "type": "error", "message": $.t("config.messages.CommonMessages.badRequestError") });
                    }
                }
            });
        },
        updateRelationship: function updateRelationship(value, oldValue) {
            var newVal = _.pick(value, "_ref", "_refProperties"),
                oldVal = _.pick(oldValue, "_ref", "_refProperties"),
                patchUrl = constants.host + constants.context + "/" + this.data.prop.relationshipUrl;

            //make sure there is actually a change before updating
            if (_.isEqual(newVal, oldVal)) {
                return $.Deferred().resolve();
            } else {
                return resourceDelegate.patchResourceDifferences(patchUrl, { id: value._refProperties._id, rev: value._refProperties._rev }, oldVal, newVal);
            }
        },
        openResourceCollectionDialog: function openResourceCollectionDialog(propertyValue) {
            var opts = this.getResourceCollectionDialogOptions(propertyValue);

            new ResourceCollectionSearchDialog().render(opts);
        },
        getResourceCollectionDialogOptions: function getResourceCollectionDialogOptions(propertyValue) {
            var _this2 = this;

            var isNew = !propertyValue,
                opts = {
                property: this.data.prop,
                propertyValue: propertyValue,
                schema: this.schema,
                /*
                 * if there is no propertyValue this is an "add new"
                 * in this case allow the ability to add multiple relationships
                 */
                multiSelect: isNew ? true : false
            };

            if (isNew) {
                opts.onChange = function (value, oldValue, newText, isFinalPromise) {
                    return _this2.createRelationship(value).then(function () {
                        if (isFinalPromise) {
                            _this2.args.showChart = _this2.data.showChart;
                            _this2.render(_this2.args);
                            messagesManager.messages.addMessage({ "message": $.t("templates.admin.ResourceEdit.addSuccess", { objectTitle: _this2.data.prop.title }) });
                        }
                    });
                };
            } else {
                opts.onChange = function (value, oldValue, newText) {
                    return _this2.updateRelationship(value, oldValue).then(function () {
                        _this2.render(_this2.args);
                        messagesManager.messages.addMessage({ "message": $.t("templates.admin.ResourceEdit.editSuccess", { objectTitle: _this2.data.prop.title }) });
                    });
                };
            }

            return opts;
        },
        loadChart: function loadChart(models) {
            this.$el.find("#relationshipGraphBody-" + this.data.prop.propName).empty();
            var elementSelector = "#relationshipGraphBody-" + this.data.prop.propName,
                treeData = {
                "name": this.data.prop.parentDisplayText,
                "parent": "null",
                "children": []
            },
                margin = {
                top: 20,
                right: 120,
                bottom: 20,
                left: 350
            },
                width = 1024 - margin.right - margin.left,
                height = 500 - margin.top - margin.bottom,
                i = 0,
                tree = d3.layout.tree().size([height, width]),
                diagonal = d3.svg.diagonal().projection(function (d) {
                return [d.y, d.x];
            }),
                svg = d3.select(elementSelector).append("svg").attr("width", width + margin.right + margin.left).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")"),
                root = null,
                update = function update(source) {
                var nodes = tree.nodes(root).reverse(),
                    links = tree.links(nodes),
                    nodeEnter,
                    node,
                    link;

                //Normalize for fixed-depth.
                nodes.forEach(function (data) {
                    data.y = data.depth * 180;
                });

                //Declare the nodes
                node = svg.selectAll("g.node").data(nodes, function (data) {
                    if (!data.id) {
                        data.id = ++i;
                    }

                    return data.id;
                });

                //Enter the nodes.
                nodeEnter = node.enter().append("g").attr("class", "node").attr("transform", function (data) {
                    return "translate(" + data.y + "," + data.x + ")";
                });

                //Add Circles
                nodeEnter.append("circle").attr("r", 10).style("fill", "#fff");

                //Add Text
                nodeEnter.append("svg:a").attr("xlink:href", function (data) {
                    return data.url;
                }).append("text").attr("x", function (data) {
                    return data.children || data._children ? -13 : 13;
                }).attr("dy", ".35em").attr("text-anchor", function (data) {
                    return data.children || data._children ? "end" : "start";
                }).text(function (data) {
                    return data.name;
                }).style("fill-opacity", 1);

                //Generate the paths
                link = svg.selectAll("path.link").data(links, function (d) {
                    return d.target.id;
                });

                //Add the paths
                link.enter().insert("path", "g").attr("class", "link").attr("d", diagonal);
            };

            _.each(models, _.bind(function (model) {
                var displayObject = resourceCollectionUtils.buildResourceDisplayObject(this.schema, this.data.prop, model.attributes, model.attributes),
                    routeArgs = model.attributes._ref.split("/"),
                    editRouteName = routeArgs[0] === "managed" ? "adminEditManagedObjectView" : "adminEditSystemObjectView",
                    child = { "name": displayObject.txt, "parent": "null" };

                // Can't link to internal roles, so filter them here
                if (!displayObject.path.match(/^repo\//)) {
                    child.url = "#" + Router.getLink(Router.configuration.routes[editRouteName], routeArgs);
                }

                treeData.children.push(child);
            }, this));

            root = treeData;

            update(root);
        }
    });

    return RelationshipArrayView;
});
