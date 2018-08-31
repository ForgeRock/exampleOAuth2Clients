"use strict";

/*
 * Copyright 2016-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "backbone", "react-dom", "react", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/UIUtils"], function (_, Backbone, ReactDOM, React, Configuration, EventManager, Constants, UIUtils) {
    var BASE_TEMPLATE = "templates/common/DefaultBaseTemplate.html";

    function throwOnNoInitializationOptions(options) {
        if (!options) {
            throw new Error("[ReactAdapterView] No initialization options found.");
        }
    }

    function throwOnNoReactView(options) {
        if (!options.reactView) {
            throw new Error("[ReactAdapterView] No \"reactView\" option found on initialization options.");
        }
    }

    return Backbone.View.extend({
        initialize: function initialize(options) {
            throwOnNoInitializationOptions(options);
            throwOnNoReactView(options);

            this.options = options;

            _.defaults(this.options, {
                reactProps: {},
                needsBaseTemplate: true
            });
        },

        setBaseTemplate: function setBaseTemplate() {
            Configuration.setProperty("baseTemplate", BASE_TEMPLATE);
            EventManager.sendEvent(Constants.EVENT_CHANGE_BASE_VIEW);
        },

        renderReactComponent: function renderReactComponent() {
            ReactDOM.render(React.createElement(this.options.reactView, this.options.reactProps), this.el);
        },

        unmountReactComponent: function unmountReactComponent() {
            var container = document.getElementById("content");
            if (container) {
                ReactDOM.unmountComponentAtNode(container);
            }
        },

        render: function render() {
            var view = this;

            if (this.options.needsBaseTemplate) {
                this.setBaseTemplate();

                UIUtils.compileTemplate(BASE_TEMPLATE).then(function (template) {
                    document.getElementById("wrapper").innerHTML = template;
                    view.setElement("#content");
                    view.renderReactComponent();
                });
            } else {
                view.renderReactComponent();
            }
        }
    });
});
