"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * Filters links on the logged-in users role, returning the first matching link.
 *
 * If a link has no role, it will be considered matching.
 *
 * @module org/forgerock/commons/ui/common/components/navigation/filters/RoleFilter
 */
define(["lodash", "org/forgerock/commons/ui/common/main/Configuration"], function (_, Configuration) {
    return {
        filter: function filter(links) {
            var link, linkName, linkHasNoRole, userHasNecessaryRole;

            for (linkName in links) {
                link = links[linkName];

                linkHasNoRole = !link.role;
                userHasNecessaryRole = link.role && Configuration.loggedUser && _.contains(Configuration.loggedUser.uiroles, link.role);

                if (linkHasNoRole || userHasNecessaryRole) {
                    return links[linkName];
                }
            }
        }
    };
});
