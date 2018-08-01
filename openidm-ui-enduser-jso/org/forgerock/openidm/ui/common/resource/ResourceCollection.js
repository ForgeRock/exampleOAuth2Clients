"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash", "org/forgerock/commons/ui/common/main/AbstractModel", "org/forgerock/openidm/ui/common/util/BackgridUtils", "org/forgerock/commons/ui/common/main/AbstractCollection"], function (_, AbstractModel, BackgridUtils, AbstractCollection) {
    var ResourceCollection = AbstractCollection.extend({
        initialize: function initialize(models, options) {
            this.url = options.url;
            this.model = AbstractModel.extend({ "url": options.url });
            this.state = _.extend({}, this.state, options.state);
            this.queryParams = _.extend({}, this.queryParams, BackgridUtils.getQueryParams({
                _queryFilter: options._queryFilter
            }, options.isSystemResource));
        }
    });
    return ResourceCollection;
});
