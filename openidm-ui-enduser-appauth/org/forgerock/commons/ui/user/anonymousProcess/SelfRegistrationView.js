"use strict";

/*
 * Copyright 2015-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "form2js", "org/forgerock/commons/ui/user/anonymousProcess/AnonymousProcessView", "org/forgerock/commons/ui/user/anonymousProcess/KBAView"], function ($, form2js, AnonymousProcessView, KBAView) {

    var SelfRegistrationView = AnonymousProcessView.extend({
        processType: "registration",
        i18nBase: "common.user.selfRegistration",
        getFormContent: function getFormContent() {
            var form = $(this.element).find("form")[0];

            if (form.hasAttribute("data-kba-questions")) {
                return { "kba": KBAView.getQuestions() };
            } else {
                return form2js(form);
            }
        },
        renderProcessState: function renderProcessState(response) {
            AnonymousProcessView.prototype.renderProcessState.call(this, response).then(function () {
                if (response.type === "kbaSecurityAnswerDefinitionStage" && response.tag === "initial") {
                    KBAView.render(response.requirements.properties.kba);
                }
            });
        }
    });

    return new SelfRegistrationView();
});
