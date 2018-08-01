"use strict";

/*
 * Copyright 2011-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/* eslint no-eval: 0 */

define(["jquery", "underscore", "handlebars", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/common/delegates/SearchDelegate", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/openidm/ui/admin/delegates/ConnectorDelegate", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function ($, _, Handlebars, constants, eventManager, searchDelegate, ResourceDelegate, ConnectorDelegate, ConfigDelegate) {
    var obj = {};

    obj.resourceCollectionCache = {};

    obj.displayTextDelimiter = ", ";

    obj.getDisplayText = function (prop, item, resourceCollectionIndex) {
        var pathToResource = obj.getPropertyValuePath(item),
            resourceKey = prop.items ? item._ref : pathToResource + "/" + item._id,
            validDisplayProps = _.reject(obj.autocompleteProps(prop, resourceCollectionIndex, false, item), function (p) {
            return p && !p.length || !eval("item." + p);
        }),
            txt = _.map(validDisplayProps, function (p) {
            return _.escape(eval("item." + p));
        }).join(obj.displayTextDelimiter);

        if (!obj.resourceCollectionCache[resourceKey]) {
            obj.resourceCollectionCache[resourceKey] = txt;
        }

        //if there is no txt try to use _id as the text
        if (!txt.length && item._id) {
            txt = item._id;
        }

        return txt;
    };

    /**
     *
     *
     * @param {Object} schema - the schema where the property being edited/displayed exists
     * @param {Object} property - the property being edited/displayed
     * @param {Object} resourceValue - an object containing the _ref property with a path to the resource
     * @param {Object} resourceValueAttributes - an object containing all the attributes for the resource that needs to be displayed
     * @returns {Object}
     */
    obj.buildResourceDisplayObject = function (schema, property, resourceValue, resourceValueAttributes) {
        var resourceValuePath = obj.getPropertyValuePath(resourceValue),
            resourceCollectionIndex = obj.getResourceCollectionIndex(schema, resourceValuePath, property.propName);

        return {
            txt: obj.getDisplayText(property, resourceValueAttributes, resourceCollectionIndex),
            path: resourceValuePath
        };
    };

    obj.autocompleteProps = function (prop, resourceCollectionIndex, showRaw, item) {
        var fields = [];

        if (prop.items && prop.items.resourceCollection && prop.items.resourceCollection[resourceCollectionIndex]) {
            fields = prop.items.resourceCollection[resourceCollectionIndex].query.fields;
        } else if (prop.resourceCollection && prop.resourceCollection[resourceCollectionIndex]) {
            fields = prop.resourceCollection[resourceCollectionIndex].query.fields;
        }

        /*
            If fields are not yet defined look to see if there is an "item" sent in to the function.
            If so look at the item and get all of the properties that aren't default relationship properties.
        */
        if (!fields.length && item) {
            _.each(_.omit(item, "_id", "_rev", "_ref", "_refProperties"), function (val, key) {
                if (typeof val === "string") {
                    fields.push(key);
                }
            });
        }

        //limit the number of displayFields to 4
        fields = fields.slice(0, 4);

        if (showRaw) {
            return fields;
        } else {
            fields = _.map(fields, function (field) {
                return field.replace("/", ".");
            });

            //we never want to display the _id field
            return _.pull(fields, "_id");
        }
    };

    obj.setupAutocompleteField = function (autocompleteField, prop, opts, resourceCollectionIndex, propertyValue) {
        return obj.getAllAvailableResourceCollections().then(function (allAvailableResourceCollections) {
            obj.resourceCollectionIndex = resourceCollectionIndex;

            if (prop.items && prop.items.resourceCollection && !prop.items.resourceCollection.length) {
                prop.items.resourceCollection = allAvailableResourceCollections;
            }

            if (prop.resourceCollection && !prop.resourceCollection.length) {
                prop.resourceCollection = allAvailableResourceCollections;
            }

            var pathToResource = prop.items ? prop.items.resourceCollection[resourceCollectionIndex].path : prop.resourceCollection[resourceCollectionIndex].path,
                initialLoad = true,
                defaultOpts = {
                valueField: '_id',
                searchField: obj.autocompleteProps(prop, resourceCollectionIndex),
                create: false,
                preload: true,
                hideSelected: true,
                placeholder: $.t("templates.admin.ResourceEdit.search", { objectTitle: prop.title || prop.name }),
                render: {
                    item: function item(_item, escape) {
                        var txt = obj.getDisplayText(prop, _item, resourceCollectionIndex);
                        return "<div>" + txt + "</div>";
                    },
                    option: function option(item, escape) {
                        var txt = obj.getDisplayText(prop, item, resourceCollectionIndex);
                        return "<div>" + txt + "</div>";
                    }
                },
                load: function load(query, callback) {
                    var queryFilter;

                    if (prop.items) {
                        queryFilter = prop.items.resourceCollection[resourceCollectionIndex].query.queryFilter;
                    } else {
                        queryFilter = prop.resourceCollection[resourceCollectionIndex].query.queryFilter;
                    }

                    searchDelegate.searchResults(pathToResource, obj.autocompleteProps(prop, resourceCollectionIndex, true), query, null, queryFilter).then(function (result) {
                        var convertNestedProps = function convertNestedProps(item) {
                            _.each(obj.autocompleteProps(prop, resourceCollectionIndex), function (propName) {
                                if (propName.indexOf(".") > -1) {
                                    item[propName] = eval("item." + propName);
                                }
                            });
                            return item;
                        },
                            modifiedResult = _.map(result, function (item) {
                            return convertNestedProps(item);
                        });

                        if (prop.parentObjectId) {
                            //filter out any values that are the same as the parentObjectId
                            modifiedResult = _.reject(modifiedResult, function (mr) {
                                return mr._id === prop.parentObjectId;
                            });
                        }

                        callback(modifiedResult);
                    }, function () {
                        callback();
                    });
                },
                onLoad: function onLoad(data) {
                    if (initialLoad && propertyValue && !_.isEmpty(propertyValue)) {
                        var value = _.last(propertyValue._ref.split("/"));

                        this.addOption(propertyValue);
                        this.setValue(value);
                        initialLoad = false;
                    }
                }
            };

            if (autocompleteField[0].selectize) {
                autocompleteField[0].selectize = null;
                autocompleteField.next().remove();
            }

            autocompleteField.selectize(_.extend({}, defaultOpts, opts || {}));
        });
    };

    obj.getHeaderValues = function (fields, schema) {
        return _.map(fields, function (field) {
            var propField = function propField() {
                return eval("schema." + field.replace("/", ".properties."));
            };

            if (schema && propField() && propField().title && propField().title.length) {
                return propField().title;
            } else {
                return field;
            }
        });
    };

    obj.showResource = function (resourcePath) {
        var args = resourcePath.split("/"),
            routeName = args[0] !== "system" ? "adminEditManagedObjectView" : "adminEditSystemObjectView";

        if (args.length >= 3) {
            eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: routeName, args: args });
        }
    };

    /**
     * convertRelationshipTypes loops over every property looking for
     * arrays of relationship types or single value relationship types
     * once found the type is converted to "string" for jsonEditor and the
     * typeRelationship flag is set to true
     *
     * this function is recursive...when a property is an object the function
     * calls itself to deal with cases where relationship types are nested
     *
     * @param {Object[]} properties
     * @returns {Object[]}
     */
    obj.convertRelationshipTypes = function (properties) {
        _.each(properties, function (prop, key) {
            if (prop.type === "object") {
                prop = obj.convertRelationshipTypes(prop.properties);
            }

            if (prop.type === "array" && prop.items) {
                if (prop.items.type === "relationship" && _.has(properties, key)) {
                    prop.items.type = "string";
                    prop.items.typeRelationship = true;
                }
            }

            if (prop.type === "relationship" && _.has(properties, key)) {
                prop.type = "string";
                prop.typeRelationship = true;
            }
        });

        return properties;
    };

    /**
     * getFieldsToExpand loops over every property looking for single value relationship types
     * once found a string of a list of properties defined in the resourceCollection.query.fields property
     * is constructed for the use in the _fields parameter of a query url
     *
     * this function is recursive...when a property is an object the function
     * calls itself to deal with cases where relationship types are nested
     *
     * @param {Object[]} properties
     * @returns {String}
     */
    obj.getFieldsToExpand = function (properties) {
        var fieldsArray = ["*"],
            addFields = function addFields(propName, fields) {
            fieldsArray.push(propName + "/_id");
            _.each(fields, function (field) {
                if (field.indexOf("/") > 0) {
                    field = field.split("/")[0];
                }

                fieldsArray.push(propName + "/" + field);
            });
        },
            isNullableRelationship = function isNullableRelationship(propType) {
            return _.isArray(propType) && _.includes(propType, "relationship");
        };

        _.each(properties, function (prop, key) {
            if (prop.type === "object") {
                prop = obj.getFieldsToExpand(prop.properties);
            }

            if (prop.type === "relationship" || isNullableRelationship(prop.type)) {
                if (prop.resourceCollection && prop.resourceCollection.length) {
                    _.map(prop.resourceCollection, function (resourceCollection) {
                        addFields(key, resourceCollection.query.fields);
                    });
                } else if (prop.resourceCollection) {
                    addFields(key, "*");
                }
            }
        });

        return fieldsArray.join(",");
    };
    /**
     * takes in a relationship object, turns the _ref property into an array,
     * drops off the last array item (the _id of the object), and returns
     * just the path to the resource collection it comes from
     *
     * example: passing in "managed/user/88b0a909-9b19-4bc0-bd83-902ad1d20439"
     *          returns "managed/user"
     *
     *
     * @param {Object} propertyValue
     * @returns {string}
     */
    obj.getPropertyValuePath = function (propertyValue) {
        var propertyValuePathArr = propertyValue._ref ? propertyValue._ref.split("/") : [];

        propertyValuePathArr.pop();

        return propertyValuePathArr.join("/");
    };

    /**
     * finds the index of the resource collection in a relationship property's schema definition
     * based on the resource collection's path
     *
     * @param {Object} schema
     * @param {Object} propertyValue
     * @param {string} propName
     * @returns {int}
     */

    obj.getResourceCollectionIndex = function (schema, propertyValuePath, propName, allAvailableResourceCollections) {
        var resourceCollections = schema.properties[propName].resourceCollection,
            resourceCollectionIndex;

        if (schema.properties[propName].items) {
            resourceCollections = schema.properties[propName].items.resourceCollection;
        }

        if (!resourceCollections.length) {
            resourceCollections = allAvailableResourceCollections || [];
        }

        resourceCollectionIndex = _.findIndex(resourceCollections, _.bind(function (resourceCollection) {
            return resourceCollection.path === propertyValuePath;
        }, this));

        return resourceCollectionIndex;
    };

    obj.getAllAvailableResourceCollections = function () {
        var currentConnectorsPromise = ConnectorDelegate.currentConnectors(),
            availableConnectorsPromise = ConnectorDelegate.availableConnectors(),
            managedPromise = ConfigDelegate.readEntity("managed"),
            resourceCollections = [];

        return $.when(currentConnectorsPromise, managedPromise).then(_.bind(function (connectors, managedObjects) {
            var connectorConfigPromises = [];

            _.each(managedObjects.objects, _.bind(function (managed) {
                var fields = _.filter(managed.schema.order, function (propName) {
                    var property = managed.schema.properties[propName];
                    return property.type === "string" && property.viewable && !property.ecryption && property.scope !== "private" && !property.isVirtual;
                });

                if (fields.length > 4) {
                    fields = fields.slice(0, 4);
                }

                resourceCollections.push({
                    path: "managed/" + managed.name,
                    label: managed.schema.title,
                    query: {
                        queryFilter: "true",
                        fields: fields
                    }
                });
            }, this));

            if (!connectors.length) {
                return resourceCollections;
            } else {
                _.each(connectors, _.bind(function (connector) {
                    var connectorConfigPromise = ConfigDelegate.readEntity(connector.config.replace("config/", ""));

                    connectorConfigPromises.push(connectorConfigPromise.then(function (connectorConfig) {
                        _.each(connectorConfig.objectTypes, function (otSchema, ot) {
                            var fields = [];

                            if (ot !== "__ALL__") {
                                _.each(otSchema.properties, function (property, key) {
                                    if (property.nativeName === "__NAME__") {
                                        fields.push(key);
                                    } else if (property.nativeType === "string" && property.type === "string" && !property.flags) {
                                        fields.push(key);
                                    }
                                });

                                resourceCollections.push({
                                    path: "system/" + connector.name + "/" + ot,
                                    label: obj.toProperCase(connector.name) + "/" + obj.toProperCase(ot),
                                    query: {
                                        queryFilter: "true",
                                        fields: fields
                                    }
                                });
                            }
                        });
                    }));
                }, this));

                return $.when.apply($, connectorConfigPromises).then(function () {
                    return resourceCollections;
                });
            }
        }, this));
    };

    obj.toProperCase = function (name) {
        return name.charAt(0).toUpperCase() + name.substr(1);
    };

    Handlebars.registerHelper('nestedLookup', function (property, key) {
        return property[key];
    });

    return obj;
});
