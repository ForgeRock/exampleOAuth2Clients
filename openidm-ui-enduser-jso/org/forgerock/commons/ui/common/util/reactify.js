"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "react", "react-dom"], function (_, React, ReactDOM) {
  /**
   * Given a component, render it into the given DOM element.
   * @exports org/forgerock/commons/ui/common/util/reactify
   * @param  {ReactElement} component The React element to render
   * @param  {jQuery} el A jQuery object containing a collection of DOM elements
   * @return {ReactComponent} Rendered component
   * @example reactify(<Title>My Text</Title>, this.$el.find("[data-title]"));
   */
  var exports = function exports(component, el) {
    return ReactDOM.render(component, el[0]);
  };

  return exports;
});
