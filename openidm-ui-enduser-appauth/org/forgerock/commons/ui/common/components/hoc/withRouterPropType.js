"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * @module org/forgerock/commons/ui/common/components/hoc/withRouterPropType
 */
define(["react", "prop-types"], function (React, PropTypes) {
  /**
   * Prop type for {@link module:org/forgerock/commons/ui/common/components/hoc/withRouter|withRouter}.
   * @example
   * import withRouterPropType from "org/forgerock/commons/ui/common/components/hoc/withRouterPropType"
   *
   * MyReactComponent.propTypes = {
   *     router: withRouterPropType
   * };
   */
  var exports = PropTypes.shape({
    params: PropTypes.array.isRequired
  });

  return exports;
});
