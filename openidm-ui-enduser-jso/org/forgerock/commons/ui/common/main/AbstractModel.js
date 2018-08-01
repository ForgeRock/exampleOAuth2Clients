"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "backbone", "org/forgerock/commons/ui/common/util/ObjectUtil", "org/forgerock/commons/ui/common/main/ServiceInvoker"], function ($, _, Backbone, ObjectUtil, ServiceInvoker) {
    /**
     * @exports org/forgerock/commons/ui/common/main/AbstractModel
     */
    return Backbone.Model.extend({
        idAttribute: "_id",
        additionalParameters: {},
        /**
         * @returns {string} The multiversion concurrency control revision associated with this object, or "*" if
         * undefined
         */
        getMVCCRev: function getMVCCRev() {
            return this.get("_rev") || "*";
        },
        /**
         * Overrides default backbone 'get' method to also accept JSONPointer syntax for property names
         * @param {string} key Either the simple property name or the JSONPointer to the property into a complex object
         * @example
         * this.get("simpleKey")
         * @example
         * this.get("/emailAddresses/0/type")
         */
        get: function get(key) {
            //if the key has a leading "/" then trim it off
            if (key.indexOf("/") === 0) {
                key = key.substring(1);
            }

            return _.reduce(key.split("/"), function (attr, key) {
                if (attr instanceof Backbone.Model) {
                    return attr.attributes[key];
                }

                return attr ? attr[key] : undefined;
            }, this.attributes);
        },
        /**
         * Overrides default sync to align with ForgeRock REST API
         */
        sync: function sync(method, model, options) {
            var parseResponse = function parseResponse(response) {
                if (options.parse) {
                    model.set(model.parse(response, options));
                    return model.toJSON();
                } else {
                    return response;
                }
            };
            switch (method) {
                case "create":
                    return ServiceInvoker.restCall(_.extend({
                        data: JSON.stringify(model.toJSON())
                    }, function () {
                        if (!_.isUndefined(model.id)) {
                            return {
                                "type": "PUT",
                                "headers": {
                                    "If-None-Match": "*"
                                },
                                "url": model.url + "/" + model.id + "?" + $.param(model.additionalParameters)
                            };
                        } else {
                            return {
                                "type": "POST",
                                "url": model.url + "?_action=create&" + $.param(model.additionalParameters)
                            };
                        }
                    }(), options)).then(parseResponse);
                case "read":
                    return ServiceInvoker.restCall(_.extend({
                        "url": model.url + "/" + model.id + "?" + $.param(model.additionalParameters),
                        "type": "GET"
                    }, options)).then(parseResponse);
                case "update":
                    return ServiceInvoker.restCall(_.extend({
                        "type": "PUT",
                        "data": JSON.stringify(model.toJSON()),
                        "url": model.url + "/" + model.id + "?" + $.param(model.additionalParameters),
                        "headers": {
                            "If-Match": model.getMVCCRev()
                        }
                    }, options)).then(parseResponse);
                case "patch":
                    return ServiceInvoker.restCall(_.extend({
                        "url": model.url + "/" + model.id + "?" + $.param(model.additionalParameters),
                        "type": "PATCH",
                        "data": JSON.stringify(ObjectUtil.generatePatchSet(model.toJSON(), model.previousAttributes())),
                        "headers": {
                            "If-Match": model.getMVCCRev()
                        }
                    }, options)).then(parseResponse);
                case "delete":
                    return ServiceInvoker.restCall(_.extend({
                        "url": model.url + "/" + model.id + "?" + $.param(model.additionalParameters),
                        "type": "DELETE",
                        "headers": {
                            "If-Match": model.getMVCCRev()
                        }
                    }, options)).then(parseResponse);
            }
        },
        /**
         * Provide additional url parameters to be included in REST calls
         * @param {Object} A simple map of string:string pairs to be included in the URL of subsequent REST calls
         * @example
         *
            {
                "_fields": "_id,sn",
                "_mimeType": "text/plain",
                "realm": "myRealm"
            }
         */
        setAdditionalParameters: function setAdditionalParameters(parametersMap) {
            _.each(_.keys(parametersMap), function (key) {
                if (!_.isString(parametersMap[key])) {
                    throw "Cannot set non-string value as additional parameter " + key;
                }
            });
            this.additionalParameters = parametersMap;
        }
    });
});
