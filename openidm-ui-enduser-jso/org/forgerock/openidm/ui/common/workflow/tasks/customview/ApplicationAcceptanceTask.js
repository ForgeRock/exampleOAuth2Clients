"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["js2form", "org/forgerock/openidm/ui/common/workflow/tasks/AbstractTaskForm", "org/forgerock/commons/ui/common/util/DateUtil", "org/forgerock/commons/ui/common/main/Configuration"], function (js2form, AbstractTaskForm, DateUtil, conf) {
    var ApplicationAcceptanceTask = AbstractTaskForm.extend({
        template: "templates/workflow/tasks/customview/ApplicationAcceptanceTemplate.html",

        reloadData: function reloadData() {
            var self = this;
            js2form(this.$el[0], this.task);
            this.$el.find("input[name=taskName]").val(this.task.name);
            this.$el.find("input[name=createTime]").val(DateUtil.formatDate(this.task.createTime));

            if (this.$el.find("input[name=assignee]").val() === "null") {
                this.$el.find("input[name=assignee]").val("");
            }

            this.$el.find("input[name=userData]").val(this.task.variables.user.givenName + " " + this.task.variables.user.familyName);
            this.$el.find("input[name=requestedApplicationName]").val(this.task.variables.application.name);
        }
    });

    return new ApplicationAcceptanceTask();
});
