"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["org/forgerock/openidm/ui/common/util/Constants"], function (Constants) {

    var obj = {
        "dashboard": {
            view: "org/forgerock/openidm/ui/dashboard/Dashboard",
            role: "ui-user",
            url: "dashboard/",
            forceUpdate: true
        },
        "socialProviders": {
            view: "org/forgerock/openidm/ui/user/profile/signInAndSecurity/SocialIdentitiesView",
            role: "ui-user",
            url: /^signinandsecurity\/social\/(.*)$/,
            pattern: "signinandsecurity/social/?"
        },
        "editPassword": {
            view: "org/forgerock/openidm/ui/user/profile/signInAndSecurity/EditPasswordPageView",
            role: "ui-user",
            url: "signinandsecurity/password/"
        },
        "requests": {
            view: "org/forgerock/openidm/ui/user/profile/uma/RequestsView",
            role: "ui-user",
            url: "uma/requests/"
        },
        "resourceDetails": {
            view: "org/forgerock/openidm/ui/user/profile/uma/ResourceDetailView",
            role: "ui-user",
            url: /^uma\/resourceDetails\/(.*)$/,
            pattern: "uma/resourceDetails/?"
        },
        "deleteAccount": {
            view: "org/forgerock/openidm/ui/user/profile/accountControls/DeleteAccountView",
            role: "ui-user",
            url: "accountcontrols/delete/"
        },
        "handleOAuth": {
            event: Constants.EVENT_OAUTH_REGISTER,
            url: /^handleOAuth\/&(.+)$/,
            pattern: "handleOAuth/&?"
        },
        "kba": {
            view: "org/forgerock/openidm/ui/user/profile/signInAndSecurity/KBAView",
            role: "ui-user",
            url: "signinandsecurity/KBA/",
            forceUpdate: true
        },
        "progressiveProfile": {
            view: "org/forgerock/openidm/ui/user/progressiveProfile/ProgressiveProfileView",
            url: /^profileCompletion\/(.*)$/,
            pattern: "profileCompletion/?"
        },
        "socialUserClaim": {
            view: "org/forgerock/openidm/ui/user/anonymousProcess/SocialUserClaimView",
            url: "socialUserClaim"
        },
        "continueSocialUserClaim": {
            view: "org/forgerock/openidm/ui/user/anonymousProcess/SocialUserClaimView",
            url: /^continueSocialUserClaim\/(.*)$/,
            pattern: "continueSocialUserClaim/?"
        }
    };

    obj.landingPage = obj.dashboard;

    return obj;
});
