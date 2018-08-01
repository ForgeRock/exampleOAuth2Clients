"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "form2js", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/openidm/ui/common/delegates/PolicyDelegate"], function ($, _, form2js, ValidatorsManager, PolicyDelegate) {
    var obj = {};

    // the various policies that we don't want to actually bind in the browser
    obj.excludedClientSidePolicies = ["valid-type"];
    // related to above, the various requirements that we don't want to show in the browser
    obj.excludedClientSideRequirements = ["VALID_TYPE"];

    /**
      A method which is passed to form2js for the purposes of determining
      the name and value for any given form node. Primarily necessary for working
      with JSONEditor form instances, which have complex input names such as:
         name="root[mail]"
      */
    obj.nodeCallbackHandler = function (isJsonEditor, node) {
        if (!node.getAttribute || !node.getAttribute("name")) {
            return false;
        }

        if (isJsonEditor) {
            return {
                "name": node.getAttribute('name').match(/(\[.*?\])/g).map(function (field) {
                    return field.replace(/\[|\]/g, '');
                }).join("."),
                "value": node.value
            };
        } else {
            return {
                "name": node.getAttribute("name"),
                "value": node.value
            };
        }
    };

    ValidatorsManager.afterBindValidators = [
    /**
        Registers a new function within the common ValidatorManager to execute
        after the core bindValidators, so that the extra policies returned from
        the policy service can be used to define new validation entries.
    */
    function (containerElement, baseEntity, callback) {
        // baseEntity is required for any of the policy-related features
        if (baseEntity) {
            containerElement.attr("data-validator-baseEntity", baseEntity);
            PolicyDelegate.readEntity(baseEntity).then(_.bind(function (allEntityPolicies) {
                // look into the containerElement for every property with a policy declared,
                // and bind validation handlers for each property found.
                _.each(allEntityPolicies.properties, function (property) {
                    var input,
                        filteredPolicies = _.filter(property.policies, function (policy) {
                        return !_.contains(obj.excludedClientSidePolicies, policy.policyId);
                    }),
                        policyNames = _.map(filteredPolicies, "policyId"),
                        existingValidators,
                        jsonPathName = PolicyDelegate.jsonPointerToPath(property.name);

                    if (containerElement.hasClass("jsonEditor")) {
                        // could be improved to support more complex properties
                        input = containerElement.find("[name$='\\[" + jsonPathName + "\\]']");
                    } else {
                        input = containerElement.find("[name='" + jsonPathName + "']");
                    }
                    if (input.length) {
                        existingValidators = input.attr("data-validator");

                        if (existingValidators) {
                            policyNames = policyNames.concat(existingValidators.split(' '));
                        }

                        input.attr("data-validator", policyNames.join(" "));

                        _.each(filteredPolicies, function (policy) {
                            obj.registerRemotePolicyFunction(baseEntity, policy);
                            input.data("validatorParams-" + policy.policyId, policy.params);
                        });

                        ValidatorsManager.bindValidatorsForField(containerElement, input);
                    }
                }, this);

                if (callback) {
                    callback();
                }
            }, this));
        } else if (callback) {
            callback();
        }
    }];

    obj.getTranslationForPolicyFailure = function (policyFailure) {
        if (_.has(policyFailure, "params.disallowedFields")) {
            policyFailure.params.disallowedFields = policyFailure.params.disallowedFields.map(function (f) {
                var jsonPathName = PolicyDelegate.jsonPointerToPath(f),
                    field = $("input[name='" + jsonPathName + "']"),
                    label;

                if (field.length) {
                    label = $("label[for='" + field.attr('id') + "']").text();
                }
                if (label) {
                    return label;
                } else {
                    return f;
                }
            }).join(', ');
        } else if (_.has(policyFailure, "params.validTypes")) {
            policyFailure.params.validTypes = policyFailure.params.validTypes.join(", ");
        }

        return $.t("common.form.validation." + policyFailure.policyRequirement, policyFailure.params);
    };

    /**
     * @typedef PolicyRequirement
     * @type {object}
     * @property {string} policyRequirement - the specified requirement
     */

    /**
     * @typedef FailedPolicyRequirement
     * @type {object}
     * @property {PolicyRequirement[]} policyRequirements - list of policies
     * @property {string} property - the property to which the list of policies will be applied
     */

    /**
     * Translates an array of raw failedPolicyRequirement objects into an array of localized, readable messages
     * @param  {FailedPolicyRequirement[]} failedPolicyRequirements
     * @return {string[]}
     */
    obj.failedPolicyRequirementObjectsToStrings = function (failedPolicyRequirements) {
        return _.chain(failedPolicyRequirements).groupBy('property').pairs().map(function (a) {
            return " - " + a[0] + ": " + _.chain(a[1]).pluck('policyRequirements').map(function (pr) {
                return _.map(pr, obj.getTranslationForPolicyFailure);
            }).value().join(", ");
        }).value();
    };

    /**
      Helper which translates the array of policy failures into an array of localized, readable messages
    */
    obj.processPolicyFailures = function (failures) {
        return _(failures).filter(function (policyFailure) {
            return !_.contains(obj.excludedClientSideRequirements, policyFailure.policyRequirement);
        }).map(obj.getTranslationForPolicyFailure).value();
    };

    /**
        Registers the remote policy as if it were a browser-based validation function
    */
    obj.registerRemotePolicyFunction = function (baseEntity, policyFunctionObject) {
        if (!_.has(ValidatorsManager.configuration.validators, policyFunctionObject.policyId)) {
            // client-side evaluation possible, based on the function definition provided from the backend
            if (policyFunctionObject.policyFunction && policyFunctionObject.policyFunction.length) {
                ValidatorsManager.configuration.validators[policyFunctionObject.policyId] = {
                    dependencies: [],
                    // maps the interface expected for front-end validators to the interface expected for
                    // backend policy function
                    validator: function validator(container, element, callback) {
                        var policyFunction,
                            failures,
                            nodeMap = obj.nodeCallbackHandler(container.hasClass("jsonEditor"), element[0]);

                        // this function is returned from the backend (as part of an administrative specification) so
                        // it should be safe to evaluate.
                        policyFunction = eval("(" + policyFunctionObject.policyFunction + ")"); // eslint-disable-line no-eval
                        failures = policyFunction.call({ failedPolicyRequirements: [] }, form2js(container[0], '.', true, _.curry(obj.nodeCallbackHandler)(container.hasClass("jsonEditor"))), nodeMap.value.length ? nodeMap.value : undefined, element.data("validatorParams-" + policyFunctionObject.policyId) || {}, nodeMap.name);

                        callback(obj.processPolicyFailures(failures));
                    }
                };
            } else {
                // server-side validation required
                ValidatorsManager.configuration.validators[policyFunctionObject.policyId] = {
                    dependencies: [],
                    // This evaluates "all" remote policies for the given data,
                    // not just the one for the current policy.
                    validator: obj.evaluateAllRemotePolicies
                };
            }
        }
    };

    obj.validateProperyDebounceWait = 5;
    /**
        Rate-limited version of the function from the policy delegate, so that repeated
        calls to this function within a very short window do not result in numerous repeated
        REST calls. Note the 5ms window - this is just big enough to capture calls which all
        originated from the same event.
    */
    obj.debouncedValidateProperty = _.debounce(PolicyDelegate.validateProperty, obj.validateProperyDebounceWait, { 'leading': true, 'trailing': false });

    /**
        For a given element, get all of the policies which apply.
        It is expected that this will be called multiple times in quick
        succession, when multiple remote policies are declared for the element.
        This is why it uses the above debounced delegate function.
     */
    obj.evaluateAllRemotePolicies = function (container, element, callback) {
        var nodeMap = obj.nodeCallbackHandler(container.hasClass("jsonEditor"), element[0]);
        obj.debouncedValidateProperty(container.attr("data-validator-baseEntity"), {
            "fullObject": form2js(container[0], '.', true, _.curry(obj.nodeCallbackHandler)(container.hasClass("jsonEditor"))),
            "value": nodeMap.value,
            "property": nodeMap.name
        }).then(function (result) {
            callback(obj.processPolicyFailures(result.failedPolicyRequirements));
        });
    };

    return obj;
});
