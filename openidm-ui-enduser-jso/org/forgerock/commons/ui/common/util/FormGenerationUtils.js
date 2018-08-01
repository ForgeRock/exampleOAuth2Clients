"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "org/forgerock/commons/ui/common/util/DateUtil"], function ($, dateUtil) {

    var obj = {};

    obj.standardErrorSpan = '<span class="error">x</span>';

    obj.standardErrorMessageTag = '<div class="validation-message"></div>';

    obj.generateTemplateFromFormProperties = function (definition, formValues) {
        var formTemplate = "",
            formFieldDescription,
            i;
        for (i = 0; i < definition.formProperties.length; i++) {
            formFieldDescription = definition.formProperties[i];
            formFieldDescription.value = obj.getValueForKey(formFieldDescription._id, formValues);
            if (formFieldDescription._id !== '_formGenerationTemplate') {
                formTemplate = formTemplate + this.generateTemplateLine(formFieldDescription._id, formFieldDescription);
            }
        }
        return formTemplate;
    };

    obj.getValueForKey = function (key, formValues) {
        var i, formValueEntry;
        if (!formValues) {
            return null;
        }
        for (i = 0; i < formValues.length; i++) {
            formValueEntry = formValues[i];
            if (formValueEntry[key]) {
                return formValueEntry[key];
            }
        }
    };

    obj.generateTemplateLine = function (formFieldId, formFieldDescription) {
        var handlebarsValueExpression, valueExpression, formFieldDisplayName, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired, formFieldType, formFieldVariableExpression, formFieldVariableName, formFieldDefaultExpression, formFieldValue, formFieldDateFormat;

        formFieldIsReadable = formFieldDescription.readable;

        formFieldIsWritable = formFieldDescription.writable && formFieldDescription.readable;

        formFieldIsRequired = formFieldDescription.required && formFieldDescription.writable && formFieldDescription.readable;

        formFieldType = formFieldDescription.type;

        formFieldDisplayName = formFieldDescription.name;

        formFieldVariableName = formFieldDescription.variableName ? formFieldDescription.variableName : formFieldId;

        formFieldVariableExpression = formFieldDescription.variableExpression ? formFieldDescription.variableExpression.expressionText : null;
        formFieldDefaultExpression = formFieldDescription.defaultExpression ? formFieldDescription.defaultExpression.expressionText : null;
        formFieldValue = formFieldDescription.value ? formFieldDescription.value : null;

        if (formFieldValue) {
            valueExpression = formFieldValue;
        } else if (formFieldVariableExpression) {
            valueExpression = formFieldVariableExpression;
        } else if (formFieldDefaultExpression) {
            valueExpression = formFieldDefaultExpression;
        }

        if (valueExpression) {
            handlebarsValueExpression = valueExpression.replace(/\$\{/g, '{{variables.');
            handlebarsValueExpression = handlebarsValueExpression.replace(/\}/g, '}}');
        }

        if (!formFieldType || !formFieldType.name || formFieldType.name === 'string') {
            return this.generateStringTypeField(formFieldVariableName, formFieldDisplayName, handlebarsValueExpression, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired);
        } else if (formFieldType.name === 'enum') {
            return this.generateEnumTypeField(formFieldVariableName, formFieldDisplayName, formFieldType.values, handlebarsValueExpression, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired);
        } else if (formFieldType.name === 'long') {
            return this.generateLongTypeField(formFieldVariableName, formFieldDisplayName, handlebarsValueExpression, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired);
        } else if (formFieldType.name === 'boolean') {
            return this.generateBooleanTypeField(formFieldVariableName, formFieldDisplayName, handlebarsValueExpression, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired);
        } else if (formFieldType.name === 'date') {
            formFieldDateFormat = formFieldType.datePattern;
            return this.generateDateTypeField(formFieldVariableName, formFieldDisplayName, handlebarsValueExpression, formFieldIsReadable, formFieldIsWritable, formFieldIsRequired, formFieldDateFormat);
        }
    };

    obj.generateDateTypeField = function (elementName, elementDisplayName, value, isReadable, isWritable, isRequired, dateFormat) {
        var fieldTagStartPart = '<div class="field">',
            fieldTagEndPart = '</div>',
            label = "",
            input,
            dateFormatInput,
            validatorMessageTag;
        if (isReadable) {
            label = this.generateLabel(elementDisplayName);
        }

        if (value && value.match(new RegExp("^\\{\\{variables\\."))) {
            value = "{{date " + value.substring(2).slice(-2) + " '" + dateFormat + "'}}";
        }

        dateFormatInput = this.generateInput("dateFormat", dateFormat, false, false, false);
        input = this.generateInput(elementName, value, isReadable, isWritable, isRequired, "formattedDate");
        validatorMessageTag = isReadable && isWritable ? obj.standardErrorSpan + obj.standardErrorMessageTag : '';
        return fieldTagStartPart + label + input + validatorMessageTag + dateFormatInput + fieldTagEndPart;
    };

    obj.generateBooleanTypeField = function (elementName, elementDisplayName, value, isReadable, isWritable, isRequired) {
        var map = { 'true': $.t('common.form.true'), 'false': $.t('common.form.false'), '__null': ' ' };
        return obj.generateEnumTypeField(elementName, elementDisplayName, map, value, isReadable, isWritable, isRequired);
    };

    obj.generateEnumTypeField = function (elementName, elementDisplayName, variableMap, value, isReadable, isWritable, isRequired) {
        var fieldTagStartPart = '<div class="field">',
            fieldTagEndPart = '</div>',
            label = '',
            select,
            additionalParams = '',
            selectedKey,
            validatorMessageTag;

        additionalParams = isRequired ? additionalParams + ' data-validator="required" ' : '';
        additionalParams = !isWritable ? additionalParams + ' disabled="disabled" ' : additionalParams;
        additionalParams = !isReadable ? additionalParams + ' style="display: none" ' : additionalParams;

        selectedKey = value ? value : '__null';
        if (selectedKey.match(new RegExp("^\\{\\{variables\\."))) {
            selectedKey = selectedKey.substring(2).slice(-2);
        } else {
            selectedKey = "'" + selectedKey + "'";
        }
        variableMap.__null = ' ';
        if (isReadable) {
            label = this.generateLabel(elementDisplayName);
        }
        select = "{{select '" + JSON.stringify(variableMap) + "' '" + elementName + "' " + selectedKey + " '' '" + additionalParams + "' }}";
        validatorMessageTag = isRequired && isWritable ? obj.standardErrorSpan + obj.standardErrorMessageTag : '';
        return fieldTagStartPart + label + select + validatorMessageTag + fieldTagEndPart;
    };

    obj.generateStringTypeField = function (elementName, elementDisplayName, handlebarsValueExpression, isReadable, isWritable, isRequired) {
        var fieldTagStartPart = '<div class="field">',
            fieldTagEndPart = '</div>',
            label = "",
            input,
            validatorMessageTag;
        if (isReadable) {
            label = this.generateLabel(elementDisplayName);
        }
        input = this.generateInput(elementName, handlebarsValueExpression, isReadable, isWritable, isRequired);
        validatorMessageTag = isRequired && isWritable ? obj.standardErrorSpan + obj.standardErrorMessageTag : '';
        return fieldTagStartPart + label + input + validatorMessageTag + fieldTagEndPart;
    };

    obj.generateLongTypeField = function (elementName, elementDisplayName, handlebarsValueExpression, isReadable, isWritable, isRequired) {
        var fieldTagStartPart = '<div class="field">',
            fieldTagEndPart = '</div>',
            label = "",
            input,
            validatorMessageTag;
        if (isReadable) {
            label = this.generateLabel(elementDisplayName);
        }
        input = this.generateInput(elementName, handlebarsValueExpression, isReadable, isWritable, isRequired, "long");
        validatorMessageTag = isReadable && isWritable ? obj.standardErrorSpan + obj.standardErrorMessageTag : '';
        return fieldTagStartPart + label + input + validatorMessageTag + fieldTagEndPart;
    };

    obj.generateInput = function (elementName, value, isReadable, isWritable, isRequired, validatorType) {
        var isDisabledPart = isWritable ? '' : 'disabled="disabled"',
            isHiddenPart = isReadable ? '' : 'style="display: none"',
            isRequiredPart,
            validatorName = 'required';

        if (validatorType) {
            if (isRequired) {
                validatorName = validatorName + "_" + validatorType;
            } else {
                validatorName = validatorType;
            }
        }
        isRequiredPart = isRequired || validatorType ? 'data-validator="' + validatorName + '"' : '';
        if (!value) {
            value = "";
        }
        return '<input type="text" name="' + elementName + '" value="' + value + '" ' + isDisabledPart + ' ' + isHiddenPart + ' ' + isRequiredPart + ' />';
    };

    obj.generateLabel = function (labelValue) {
        return '<label class="light">' + labelValue + '</label>';
    };

    obj.buildPropertyTypeMap = function (formProperties) {
        var typeName,
            datePattern,
            formFieldType,
            formFieldDescription,
            result = {},
            i,
            propName;
        for (i = 0; i < formProperties.length; i++) {
            formFieldDescription = formProperties[i];
            if (formFieldDescription._id !== '_formGenerationTemplate') {
                formFieldType = formFieldDescription.type;
                if (!formFieldType || !formFieldType.name || formFieldType.name === '') {
                    typeName = 'string';
                } else {
                    typeName = formFieldType.name;
                    if (typeName === 'date') {
                        datePattern = formFieldType.datePattern;
                    }
                }
                propName = formFieldDescription.variableName ? formFieldDescription.variableName : formFieldDescription._id;
                result[propName] = { type: typeName, datePattern: datePattern };
            }
        }
        return result;
    };

    obj.changeParamsToMeetTheirTypes = function (params, propertyTypeMapping) {
        var param, typeName, paramValue, dateFormat, date;
        for (param in params) {
            typeName = propertyTypeMapping[param].type;
            paramValue = params[param];
            if ("date" === typeName) {
                if (paramValue === '') {
                    params[param] = null;
                } else {
                    dateFormat = propertyTypeMapping[param].datePattern;
                    date = dateUtil.parseDateString(paramValue, dateFormat);
                    params[param] = date;
                }
            } else if ("long" === typeName) {
                if (paramValue === '') {
                    params[param] = null;
                } else {
                    params[param] = parseInt(paramValue, 10);
                }
            } else if ("boolean" === typeName) {
                if (paramValue === '') {
                    params[param] = null;
                } else {
                    params[param] = "true" === paramValue ? true : false;
                }
            }
        }
    };

    return obj;
});
