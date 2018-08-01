"use strict";

/*
 * Copyright 2011-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "handlebars", "jsonEditor", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/openidm/ui/common/util/CommonUIUtils", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/openidm/ui/common/linkedView/LinkedView", "org/forgerock/commons/ui/common/components/Messages", "org/forgerock/openidm/ui/common/resource/RelationshipArrayView", "org/forgerock/openidm/ui/common/resource/ResourceCollectionRelationshipsView", "org/forgerock/openidm/ui/common/resource/ResourceCollectionSearchDialog", "org/forgerock/openidm/ui/common/util/ResourceCollectionUtils", "org/forgerock/openidm/ui/common/delegates/ResourceDelegate", "org/forgerock/commons/ui/common/main/Router", "org/forgerock/commons/ui/common/main/ServiceInvoker", "org/forgerock/commons/ui/common/util/UIUtils", "org/forgerock/commons/ui/common/main/ValidatorsManager", "bootstrap"], function ($, _, handlebars, JSONEditor, AbstractView, CommonUIUtils, constants, eventManager, LinkedView, messagesManager, RelationshipArrayView, ResourceCollectionRelationshipsView, ResourceCollectionSearchDialog, ResourceCollectionUtils, ResourceDelegate, router, serviceInvoker, uiUtils, ValidatorsManager) {
    var EditResourceView = AbstractView.extend({
        template: "templates/admin/resource/EditResourceViewTemplate.html",
        tabViewOverrides: {},
        events: {
            "click .saveBtn": "save",
            "keyup": "fireEventsFromForm",
            "click #backBtn": "backToList",
            "click #deleteBtn": "deleteObject",
            "click .resetBtn": "reset",
            "onValidate": "onValidate"
        },
        partials: ["partials/resource/_relationshipDisplay.html"],
        render: function render(args, callback) {
            var _this2 = this;

            var resourceReadPromise,
                objectId = args[0] === "managed" ? args[2] : args[3],
                displayField;

            ResourceDelegate.getSchema(args).then(function (schema) {
                var readUrl = void 0;

                _this2.data.args = args;
                _this2.data.objectType = args[0];
                _this2.data.isSystemResource = false;
                _this2.data.serviceUrl = ResourceDelegate.getServiceUrl(args);
                _this2.objectName = args[1];

                readUrl = _this2.data.serviceUrl + "/" + objectId + "?_fields=" + ResourceCollectionUtils.getFieldsToExpand(schema.properties);

                if (_this2.data.objectType === "system") {
                    _this2.data.isSystemResource = true;
                    _this2.objectName += "/" + args[2];
                    readUrl = _this2.data.serviceUrl + "/" + objectId;
                    _this2.data.systemType = args[4];
                }

                if (objectId) {
                    resourceReadPromise = serviceInvoker.restCall({
                        url: readUrl
                    });

                    _this2.objectId = objectId;
                    _this2.data.newObject = false;
                } else {
                    resourceReadPromise = $.Deferred().resolve({});
                    _this2.data.newObject = true;
                }

                resourceReadPromise.then(function (resource) {
                    _this2.data.objectTitle = schema.title || _this2.objectName;
                    _this2.data.schema = schema;

                    if (_this2.data.isSystemResource) {
                        _this2.data.objectTitle = _this2.objectName;
                    }

                    if (!_this2.data.newObject) {
                        if (_this2.data.isSystemResource) {
                            displayField = _.chain(schema.properties).map(function (val, key) {
                                val.name = key;
                                return val;
                            }).where({ nativeName: "__NAME__" }).value();

                            if (displayField.length !== 0) {
                                displayField = displayField[0].name;
                            } else {
                                displayField = _.keys(schema.properties)[0];
                            }
                        } else {

                            _.map(schema.order, function (propName) {
                                if (!displayField && schema.properties[propName].viewable) {
                                    displayField = propName;
                                }
                            });
                        }

                        _this2.data.objectDisplayText = resource[displayField];
                    }

                    _this2.data.backBtnText = $.t("templates.admin.ResourceEdit.backToList", { objectTitle: _this2.data.objectTitle });

                    _this2.parentRender(function () {
                        schema = _this2.handleArrayOfTypes(schema);
                        _this2.setupEditor(resource, schema);

                        ValidatorsManager.bindValidators(_this2.$el.find("#resource"), [_this2.data.objectType, _this2.objectName, _this2.objectId || "*"].join("/"), function () {
                            _this2.editor.on('change', function () {
                                _this2.showPendingChanges();
                            });

                            if (!_this2.data.newObject) {
                                _this2.linkedView = new LinkedView();
                                _this2.linkedView.element = "#linkedView";

                                _this2.linkedView.render({ id: resource._id, resourcePath: _this2.data.objectType + "/" + _this2.objectName + "/" });
                            }

                            if (callback) {
                                callback();
                            }

                            _this2.$el.find("input[type='text']:visible")[0].focus();
                        });

                        _this2.setTabChangeEvent();
                        _this2.replaceIconImage();
                    });
                });
            });
        },
        setupEditor: function setupEditor(resource, schema) {
            var _this3 = this;

            var propCount = 0,
                filteredProperties,
                filteredObject = resource;

            this.oldObject = $.extend(true, {}, filteredObject);

            filteredProperties = ResourceCollectionUtils.convertRelationshipTypes(_.omit(schema.properties, function (p) {
                return !p.viewable && p.type !== "relationship";
            }));

            _.each(filteredProperties, function (prop) {
                if (!_.isUndefined(prop.description)) {
                    delete prop.description;
                }
            });

            if (!_.isEmpty(filteredProperties)) {
                filteredObject = _.pick(filteredObject, _.keys(filteredProperties));
            }

            JSONEditor.defaults.options = {
                theme: "bootstrap3",
                iconlib: "fontawesome4",
                disable_edit_json: true,
                disable_array_reorder: true,
                disable_collapse: true,
                disable_properties: true,
                show_errors: "never",
                formHorizontal: true
            };

            if (schema.order) {
                _.each(schema.order, function (prop) {
                    schema.properties[prop].propertyOrder = propCount++;

                    if (!_.has(filteredObject, prop) && schema.properties[prop].viewable && schema.properties[prop].type === "object" && _.keys(schema.properties[prop].properties).length > 0) {

                        //set all sub props to null
                        _.each(schema.properties[prop].properties, function (subProperty, key) {
                            _.set(filteredObject, [prop, key], null);
                        });
                    } else if (schema.properties[prop].viewable && !_.has(filteredObject, prop)) {
                        filteredObject[prop] = null;
                    }
                });
            }

            if (this.data.isSystemResource) {
                schema.title = this.data.objectTitle;

                if (this.data.newObject) {
                    _.each(schema.properties, function (p) {
                        p.required = true;
                    });
                }
            }

            this.editor = new JSONEditor(document.getElementById("resource"), { schema: _.omit(schema, "allSchemas") });
            this.editor.setValue(filteredObject);
            this.$el.find(".jsonEditor .help-block").hide();

            this.convertResourceCollectionFields(filteredObject, schema).then(function () {
                _this3.$el.find(".json-editor-btn-collapse").prop("disabled", true);
            });

            if (this.data.isSystemResource) {
                this.$el.find(".row select").hide();
                this.$el.find(".row input").prop("disabled", true);
                this.$el.find(".row button").hide();
            }
        },

        showPendingChanges: function showPendingChanges() {
            var changedFields = this.generateChangedFieldsList(),
                filteredChangedFields = this.filterUndefinedBooleanFields(changedFields);

            this.showHidePendingChangesElement(filteredChangedFields);
        },

        /**
         *
         * @typedef {object} Field
         * @property {string} propertyName - the name of the corresponding schema property
         * @property {string} title - the title of the the corresponding schema property
         * @property {*} newValue - value of the changed field
         */

        /**
         * Diff the current state of the form against the previous to create an
         * array of changed Fields
         * @return {Field[]}
         */
        generateChangedFieldsList: function generateChangedFieldsList() {
            var _this4 = this;

            var newValue = _.extend({}, this.oldObject, this.getFormValue()),
                changedFields = [];

            _.each(newValue, function (val, key) {
                var relationshipType = _this4.data.schema.properties[key] && _this4.data.schema.properties[key].typeRelationship,
                    hasVal = !!(val && val.toString().length) || val === 0;

                if (!_this4.oldObject[key] && hasVal || !relationshipType && _this4.oldObject[key] && !_.isEqual(_this4.oldObject[key], val) || relationshipType && hasVal && !_.isEqual(JSON.parse(val), _this4.oldObject[key])) {
                    if (_this4.data.schema.properties && _this4.data.schema.properties[key] && _this4.data.schema.properties[key].title && _this4.data.schema.properties[key].title.length) {
                        changedFields.push({ propertyName: key, title: _this4.data.schema.properties[key].title, newValue: val });
                    } else {
                        changedFields.push({ propertyName: key, newValue: val, title: key });
                    }
                }
            });

            return changedFields;
        },

        /**
         * jsonEditor will set undefined boolean fields to be false casuing them to seem like
         * they have changed. This function filters out such fields before passing to pending changes
         * rendering
         * @param  {Field[]} changedFields
         * @return {Field[]} filtered list of changed Fields
         */
        filterUndefinedBooleanFields: function filterUndefinedBooleanFields(changedFields) {
            var _this5 = this;

            var getNestedBooleanPaths = function getNestedBooleanPaths(schemaProperty) {
                var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                // traverse schema and collect path steps to any nested boolean properties
                if (schemaProperty.type === "boolean") {
                    return path.concat(schemaProperty.propName);
                } else if (schemaProperty.type === "object") {
                    return _.pairs(schemaProperty.properties).map(function (propertyPair) {
                        return [schemaProperty.propName].concat(getNestedBooleanPaths(_.last(propertyPair)));
                    }).reduce(function (acc, nestedPath) {
                        if (_.some(nestedPath, _.isArray)) {
                            return acc.concat(_.tail(nestedPath).map(function (stepTail) {
                                return [_.first(nestedPath)].concat(stepTail);
                            }));
                        } else {
                            return acc.concat([nestedPath]);
                        }
                    }, []);
                } else {
                    return path;
                }
            },
                checkForBooleanChanges = function checkForBooleanChanges(field, pathArray) {
                return _.some(pathArray.map(function (path) {
                    if (_.has(_this5.oldObject, path)) {
                        return true;
                    } else {
                        return _.isArray(path) ? _.get(field.newValue, _.tail(path)) : field.newValue;
                    }
                }));
            };

            return changedFields.filter(function (field) {
                var schemaProperty = _this5.data.schema.properties[field.propertyName],
                    nestedBooleanPaths = getNestedBooleanPaths(schemaProperty);

                return _.isEmpty(nestedBooleanPaths) ? true : checkForBooleanChanges(field, nestedBooleanPaths);
            });
        },

        /**
         * Add/remove changes pending element from the dom based on the current state of the form
         * @param  {Field[]} changedFields list of fields that have changed.
         */
        showHidePendingChangesElement: function showHidePendingChangesElement(changedFields) {
            var noChanges = _.isEmpty(changedFields),
                fieldsHtml = changedFields.length ? "<br/>- " + changedFields.map(function (field) {
                return field.title;
            }).join("<br/>- ") : "";

            //we don't want to show changesPending on new objects
            if (!this.data.newObject) {
                this.$el.find(".changedFields").html(fieldsHtml);
                this.$el.find(".resetBtn").attr("disabled", noChanges);
                this.$el.find(".resourceChangesPending")[noChanges ? "hide" : "show"]();
            }
        },

        getFormValue: function getFormValue() {
            var _this6 = this;

            var formVal = JSON.parse(JSON.stringify(this.editor.getValue()).replace(/"\s+|\s+"/g, '"'));

            _.each(formVal, function (v, k) {
                if (_.isString(v)) {
                    formVal[k] = _.trim(v);
                }
            });

            if (!this.data.newObject) {
                /*
                The following _.each() was placed here to account for JSONEditor.setValue()
                turning a property that exists but has a null value into an empty text field.
                Upon calling JSONEditor.getValue() the previously null property will be set to and empty string.
                 This loop filters out previously null values that have not been changed.
                */
                _.each(_.keys(formVal), function (key) {
                    // The old property must be null or undefined
                    if (_this6.oldObject[key] === null || _this6.oldObject[key] === undefined) {
                        var isObject = _.isObject(formVal[key]),
                            falseyNotZero = !formVal[key] && formVal[key] !== 0,
                            isEmpty = _.isEmpty(formVal[key]),
                            isEmptyString = _.isString(formVal[key]) && isEmpty,
                            nonNumeric = !_.isNumber(formVal[key]),
                            isNotTrue = formVal[key] !== true,
                            isFalseOrEmpty = falseyNotZero || isEmptyString && nonNumeric && isNotTrue;

                        // The property isn't an object and it is false or empty
                        // OR it is an object and empty
                        if (!isObject && isFalseOrEmpty || isObject && isEmpty) {
                            formVal[key] = _this6.oldObject[key];
                        } else if ((_this6.oldObject[key] === null || _this6.oldObject[key] === undefined) && formVal[key] === 0) {
                            //special case for number fields set to null or undefined in the oldObject and 0 in the JSONEditor
                            formVal[key] = undefined;
                        }
                    }
                });
            } else {
                _.each(this.$el.find(".resourceCollectionValue"), function (element) {
                    try {
                        formVal[$(element).attr("propname")] = JSON.parse($(element).val());
                    } catch (e) {
                        // Ignored
                    }
                });
            }

            return formVal;
        },

        save: function save(e, callback) {
            var _this7 = this;

            var formVal = CommonUIUtils.replaceEmptyStringWithNull(this.getFormValue()),
                successCallback = function successCallback(editedObject, xhr) {
                var msg = _this7.data.newObject ? "templates.admin.ResourceEdit.addSuccess" : "templates.admin.ResourceEdit.editSuccess",
                    editRouteName = !_this7.data.isSystemResource ? "adminEditManagedObjectView" : "adminEditSystemObjectView";

                messagesManager.messages.addMessage({ "message": $.t(msg, { objectTitle: _this7.data.objectTitle }) });
                _this7.data.editedObject = editedObject;

                if (_this7.data.newObject) {
                    _this7.data.args.push(editedObject._id);
                    eventManager.sendEvent(constants.EVENT_CHANGE_VIEW, { route: router.configuration.routes[editRouteName], args: _this7.data.args, callback: callback });
                } else if (!_.isUndefined(xhr)) {
                    _this7.render(_this7.data.args, callback);
                }
            };

            if (e) {
                e.preventDefault();

                if ($(e.currentTarget).attr("disabled") === "disabled") {
                    return false;
                }
            }

            //Prevent trailing whitespace on strings
            _.each(formVal, function (val, key) {
                if (_.isString(val)) {
                    formVal[key] = val.trim();
                }
            });

            if (this.data.newObject) {
                formVal = _.omit(formVal, function (val) {
                    return val === "" || val === null;
                });

                ResourceDelegate.createResource(this.data.serviceUrl, formVal._id, formVal, successCallback);
            } else if (!this.data.isSystemResource) {
                _.each(this.$el.find(".resourceCollectionValue"), function (element) {
                    var val = $(element).val();

                    if (val.length) {
                        val = JSON.parse($(element).val());
                    } else {
                        val = null;
                    }
                    formVal[$(element).attr("propname")] = val;
                });

                ResourceDelegate.patchResourceDifferences(this.data.serviceUrl, { id: this.oldObject._id, rev: this.oldObject._rev }, this.oldObject, _.extend({}, this.oldObject, formVal), successCallback);
            } else {
                ResourceDelegate.updateResource(this.data.serviceUrl, this.oldObject._id, formVal, successCallback);
            }
        },
        backToList: function backToList(e) {
            if (e) {
                e.preventDefault();
            }

            if (!this.data.isSystemResource) {
                eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: "adminListManagedObjectView", args: this.data.args });
            } else {
                var args = [this.data.systemType, this.data.args[2]]; //["provisioner.openicf_ldap", "account"]

                eventManager.sendEvent(constants.ROUTE_REQUEST, { routeName: "connectorDataView", args: args });
            }
        },
        reset: function reset(e) {
            var _this8 = this;

            var thisTab = this.$el.find('.nav-tabs .active a')[0].hash;

            if (e) {
                e.preventDefault();
            }

            if ($(e.currentTarget).attr("disabled") === "disabled") {
                return false;
            }

            this.render(this.data.args, function () {
                _this8.$el.find('a[href="' + thisTab + '"]').tab('show');
            });
        },

        deleteObject: function deleteObject(event, callback) {
            var _this9 = this;

            if (event) {
                event.preventDefault();
            }

            uiUtils.confirmDialog($.t("templates.admin.ResourceEdit.confirmDelete", { objectTitle: this.data.objectTitle }), "danger", function () {
                ResourceDelegate.deleteResource(_this9.data.serviceUrl, _this9.objectId, function () {
                    messagesManager.messages.addMessage({ "message": $.t("templates.admin.ResourceEdit.deleteSuccess", { objectTitle: _this9.data.objectTitle }) });
                    _this9.backToList();

                    if (callback) {
                        callback();
                    }
                });
            });
        },
        /**
         * looks through the resource's schema, finds all relationship fields, and either converts
         * the JSONEditor representation of the field to a relationship UI in the case of singleton relationships
         * or in the case of arrays of relationships it converts that into its own tab with it's own grid of data
         * and actions
         *
         * @param {Object} filteredObject
         * @param {Object} schema
         * @returns {promise}
         */

        convertResourceCollectionFields: function convertResourceCollectionFields(filteredObject, schema) {
            var _this = this,
                _getFields,
                _convertField,
                convertArrayField,
                showRelationships,
                addTab;

            _getFields = function getFields(properties, parent) {
                var promises = void 0;

                promises = _.map(properties, function (prop, key) {
                    prop.propName = key;

                    if (prop.type === "object") {
                        var newparent = void 0;

                        if (parent) {
                            newparent = parent + "\\." + key;
                        } else {
                            newparent = "\\." + key;
                        }

                        return _getFields(prop.properties, newparent);
                    }

                    if (parent) {
                        prop.selector = parent + "\\." + key;
                    } else {
                        prop.selector = "\\." + key;
                    }

                    if (prop.type === "array") {
                        if (prop.items && prop.items.resourceCollection && _.has(filteredObject, key)) {
                            prop.parentObjectId = _this.objectId;
                            prop.relationshipUrl = _this.data.objectType + "/" + _this.objectName + "/" + _this.objectId + "/" + prop.propName;
                            prop.typeRelationship = true;
                            prop.parentDisplayText = _this.data.objectDisplayText;

                            return convertArrayField(prop);
                        }
                    }

                    if (prop.resourceCollection) {
                        return _convertField(prop);
                    }
                    // nothing special needed for this field
                    return $.Deferred().resolve();
                });

                return $.when.apply($, promises);
            };

            /**
             * converts a singleton relationship field into a button that opens an instance of ResourceCollectionSearchDialog
             * if the property has no value the button will be a create button
             * if the property has a value the button will be a link button with the related resource's display text and the resource's icon
             */
            _convertField = function convertField(prop) {
                var el = _this.$el.find("#0-root" + prop.selector.replace(/\./g, "-")),
                    //this is the JSONEditor field to be hidden and changed by the button/dialog
                editButtonId = "relationshipLink-" + prop.propName,
                    removeButtonId = "removeRelationshipLink-" + prop.propName,
                    relationshipDisplay = $(handlebars.compile("{{> resource/_relationshipDisplay}}")({
                    "newRelationship": true,
                    "displayText": $.t("templates.admin.ResourceEdit.addResource", { resource: prop.title }),
                    "editButtonId": editButtonId
                })),
                    propertyValuePath = void 0,
                    iconClass = void 0,
                    resourceCollectionSchema = void 0,
                    resourceEditPath = function resourceEditPath() {
                    var val = JSON.parse(el.val()),
                        route = "resource/",
                        pathArray = val._ref.split("/");

                    pathArray.pop();

                    route += pathArray.join("/") + "/edit/" + val._id;

                    return route;
                };

                if (el.val() && el.val().length && el.val() !== "null") {
                    propertyValuePath = ResourceCollectionUtils.getPropertyValuePath(JSON.parse(el.val()));
                    resourceCollectionSchema = _.findWhere(_this.data.schema.allSchemas, { name: propertyValuePath.split("/")[propertyValuePath.split("/").length - 1] });

                    if (resourceCollectionSchema) {
                        iconClass = resourceCollectionSchema.schema.icon;
                    }

                    relationshipDisplay = $(handlebars.compile("{{> resource/_relationshipDisplay}}")({
                        "iconClass": iconClass || "fa-cube",
                        "displayText": ResourceCollectionUtils.getDisplayText(prop, JSON.parse(el.val()), ResourceCollectionUtils.getResourceCollectionIndex(_this.data.schema, propertyValuePath, prop.propName)),
                        "editButtonText": $.t("templates.admin.ResourceEdit.updateResource", { resource: prop.title }),
                        "removeButtonText": $.t("templates.admin.ResourceEdit.removeResource", { resource: prop.title }),
                        "propName": prop.propName,
                        "resourceEditPath": resourceEditPath()
                    }));
                }

                relationshipDisplay.click(function (e) {
                    var opts = {
                        property: prop,
                        propertyValue: el.val(),
                        schema: _this.data.schema,
                        onChange: function onChange(value, originalPropertyValue, newText) {
                            _this.editor.getEditor("root" + prop.selector.replace("\\", "")).setValue(JSON.stringify(value));
                            relationshipDisplay.remove();
                            _convertField(prop);
                            _this.$el.find("#resourceEditLink-" + prop.propName).text(newText);
                        }
                    };

                    if ($(e.target).attr("id") === editButtonId || $(e.target).closest(".updateRelationshipButton").attr("id") === editButtonId) {
                        e.preventDefault();

                        new ResourceCollectionSearchDialog().render(opts);
                    }

                    if ($(e.target).attr("id") === removeButtonId || $(e.target).closest(".removeRelationshipButton").attr("id") === removeButtonId) {
                        e.preventDefault();

                        _this.editor.getEditor("root" + prop.selector.replace("\\", "")).setValue("null");

                        relationshipDisplay.remove();
                        _convertField(prop);
                        _this.showPendingChanges();
                    }
                });

                el.attr("style", "display: none !important");
                el.attr("propname", prop.propName);
                el.addClass("resourceCollectionValue");

                if (prop.viewable) {
                    el.after(relationshipDisplay);
                } else {
                    el.closest(".row").find(".control-label").hide();
                }

                return $.Deferred().resolve();
            };

            convertArrayField = function convertArrayField(prop) {
                var doConversion = function doConversion(tabView) {
                    _this.editor.getEditor('root' + prop.selector.replace("\\", "")).destroy();

                    //in case this relationship array field is returned by default
                    //remove it from the original version of the resource
                    if (_this.oldObject[prop.propName]) {
                        delete _this.oldObject[prop.propName];
                    }

                    return addTab(prop, {
                        templateId: "tabContentTemplate",
                        tabView: tabView,
                        viewId: "relationshipArray-" + prop.propName,
                        contentId: "resource-" + prop.propName,
                        contentClass: "resourceCollectionArray",
                        headerText: prop.title
                    });
                };

                //check for tabViewOverride
                if (_this.tabViewOverrides[prop.propName]) {
                    doConversion(_this.tabViewOverrides[prop.propName]);
                } else {
                    doConversion(new RelationshipArrayView());
                }
            };

            showRelationships = function showRelationships(prop) {
                return addTab(prop, {
                    templateId: "relationshipsTemplate",
                    tabView: new ResourceCollectionRelationshipsView(),
                    viewId: "resourceCollectionRelationship-" + prop.propName,
                    contentId: "relationship-" + prop.propName,
                    contentClass: "resourceCollectionRelationships",
                    headerText: prop.resourceCollection.label
                });
            };

            addTab = function addTab(prop, opts) {
                var tabHeader = _this.$el.find("#tabHeaderTemplate").clone(),
                    tabContent = _this.$el.find("#" + opts.templateId).clone(),
                    promise = $.Deferred();

                if (!_this.data.newObject) {
                    tabHeader.attr("id", "tabHeader_" + opts.contentId);
                    tabHeader.find("a").attr("href", "#" + opts.contentId).text(opts.headerText);
                    tabHeader.show();

                    tabContent.attr("id", opts.contentId);
                    tabContent.find("." + opts.contentClass).attr("id", opts.viewId);

                    _this.$el.find("#linkedSystemsTabHeader").before(tabHeader);
                    _this.$el.find("#resource-linkedSystems").before(tabContent);

                    opts.tabView.render({ element: "#" + opts.viewId, prop: prop, schema: schema, onChange: opts.onChange }, function () {
                        promise.resolve();
                    });
                } else {
                    promise.resolve();
                }

                return promise;
            };

            return _getFields(schema.properties);
        },
        /**
        * This function looks for instances of properties whose schema.type is an array
        * then grabs the first value of the array that is not "null" and sets the type to
        * that value so jsonEditor does not have to decide on types. The reason we are
        * doing this is because we set empty values to null anyway so if a user wants
        * to set a value to null all they will have to do is set the value to an empty string
        * in the case of string types, no array values for array types, false for boolean type,
        * or empty object for object types.
        **/
        handleArrayOfTypes: function handleArrayOfTypes(schema) {
            _.each(schema.properties, function (property) {

                if (_.isArray(property.type)) {
                    property.type = _.pull(property.type, "null")[0];
                }
            });

            return schema;
        },
        /**
        * This function sets an event for each bootstrap tab on "show" which looks for any
        * pending form changes in the currently visible tab. If there are changes the the tab
        * change is halted and a dialog is displayed asking the user if he/she would like to discard
        * or save the changes before actually changing tabs.
        *
        * @param {string} tabId - (optional) specific tab on which to set the change event...otherwise the event will be set on all tabs
        **/
        setTabChangeEvent: function setTabChangeEvent(tabId) {
            var _this10 = this;

            var scope = this.$el;

            if (tabId) {
                scope = scope.find("#" + tabId);
            }

            //look for all bootstrap tabs within "scope"
            scope.on('show.bs.tab', 'a[data-toggle="tab"]', function (e) {
                //check to see if there are changes pending
                if (_this10.$el.find(".resourceChangesPending:visible").length) {
                    //stop processing this tab change
                    e.preventDefault();
                    //throw up a confirmation dialog
                    _this10.confirmSaveChanges(e.target.hash, function () {
                        //once confirmed save the form then continue showing the new tab
                        _this10.save(false, function () {
                            _this10.$el.find('a[href="' + e.target.hash + '"]').tab('show');
                        });
                    });
                }
            });
        },
        /**
         * @param {string} newTab a string representing a hash address to the anchor of the new tab to be viewed
         * @param {Function} confirmCallback Fired when the "Save Changes" button is clicked
         *
         * @example
         *  AdminUtils.confirmSaveChanges("#password", () => {
          *      //Useful stuff here
         *  });
         */
        confirmSaveChanges: function confirmSaveChanges(newTab, confirmCallback) {
            var _this11 = this;

            var overrides = {
                title: $.t("templates.admin.ResourceEdit.warningPendingChanges"),
                okText: $.t("common.form.save"),
                cancelText: $.t("templates.admin.ResourceEdit.discard"),
                cancelCallback: function cancelCallback() {
                    _this11.render(_this11.data.args, function () {
                        _this11.$el.find('a[href="' + newTab + '"]').tab('show');
                    });
                }
            };

            if (!ValidatorsManager.formValidated(this.$el)) {
                overrides.okText = $.t("common.form.cancel");
                confirmCallback = $.noop();
            }

            uiUtils.confirmDialog("", "danger", confirmCallback, overrides);
        },

        // fools JSONeditor to fire change event on keyup
        fireEventsFromForm: function fireEventsFromForm(event) {
            /*
                Make sure we are not typing into a selectize input.
                We don't want to save or blur when trying to filter selections.
            */
            if (!$(event.target).parent().hasClass("selectize-input")) {
                // allows for enter to trigger save but not when the button is on focus because the button will handle that event
                if (event.keyCode === constants.ENTER_KEY && !$(event.target).hasClass("saveBtn")) {
                    this.save();
                } else {
                    // keeps the state unchanged but shows changesPending
                    $(event.target).blur();
                    $(event.target).focus();
                }
            }
        },
        replaceIconImage: function replaceIconImage() {
            var _this12 = this;

            var imageDefined = false;

            /*
                Loop over all the string properties and check each value to see if it ends with one of the image type suffixes.
                If the string is an image link replace the resource-avatar icon with the returned image. If the image
                tries to load and fails just show the default icon.
            */
            _.each(_.filter(this.data.schema.properties, { type: "string" }), function (property) {
                if (!imageDefined) {
                    var propertyValue = _this12.oldObject[property.propName],
                        propertyIsAnImage = false;

                    _.each([".png", ".jpg", ".jpeg", ".gif"], function (imageType) {
                        if (_.isString(propertyValue) && _.endsWith(propertyValue.toLowerCase(), imageType)) {
                            propertyIsAnImage = true;
                            imageDefined = true;
                        }
                    });

                    if (propertyIsAnImage) {
                        var imageDisplay = $("<img width='100' class='image-circle'>");

                        imageDisplay.attr("src", propertyValue);

                        imageDisplay[0].onerror = function () {
                            imageDisplay.hide();
                            _this12.$el.find(".resource-avatar").show();
                        };

                        _this12.$el.find(".resource-avatar").before(imageDisplay);
                        _this12.$el.find(".resource-avatar").hide();
                    }
                }
            });
        }
    });

    return new EditResourceView();
});
