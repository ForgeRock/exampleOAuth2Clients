"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * @module org/forgerock/commons/ui/common/components/hoc/withRouter
 */
define(["lodash", "react", "org/forgerock/commons/ui/common/main/Router"], function (_, React, Router) {
    function getDisplayName(WrappedComponent) {
        return WrappedComponent.displayName || WrappedComponent.name || "Component";
    }

    /**
     * A HoC (higher-order component) that wraps another component to provide `this.props.router`.
     * Pass in your component and it will return the wrapped component.
     * <p/>
     * Accompanying prop type can be found within the
     * {@link module:org/forgerock/commons/ui/common/components/hoc/withRouterPropType|withRouterPropType} module.
     * @param  {ReactComponent} WrappedComponent Component to wrap
     * @returns {ReactComponent} Wrapped component
     * @example
     * import withRouter from "org/forgerock/commons/ui/common/components/hoc/withRouter"
     *
     * class MyReactComponent extends Component { ... }
     *
     * export default withRouter(MyReactComponent)
     */
    var exports = function exports(WrappedComponent) {
        var WithRouter = function WithRouter(props) {
            var route = Router.currentRoute,
                params = Router.extractParameters(route, Router.getURIFragment()),
                paramsWithDefaults = Router.applyDefaultParameters(route, params),
                router = {
                /**
                 * TODO: params should be a key/value pair provided by the router, however the router provides
                 * an array and we must address params in thier position. A router change is required to provide
                 * named parameters making the views less fragile. http://tiny.cc/8wgk8x
                 */
                params: _.map(paramsWithDefaults, function (param) {
                    if (!param) {
                        return "";
                    }

                    return decodeURIComponent(param);
                })
            };

            return React.createElement(WrappedComponent, _.extend({}, props, { router: router }));
        };

        WithRouter.displayName = "withRouter(" + getDisplayName(WrappedComponent) + ")";
        WithRouter.WrappedComponent = WrappedComponent;

        return WithRouter;
    };

    return exports;
});
