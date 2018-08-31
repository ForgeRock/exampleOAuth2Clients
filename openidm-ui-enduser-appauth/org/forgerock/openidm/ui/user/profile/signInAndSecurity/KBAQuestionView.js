"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/ValidatorsManager"], function ($, _, AbstractView, ValidatorsManager) {
    var KBAQuestionView = AbstractView.extend({
        template: "templates/profile/signInAndSecurity/KBAQuestion.html",
        events: {
            "change select[name='questionSelect']": "questionChangeHandler",
            "keyup input": "inputHandler"
        },

        initialize: function initialize(args, options) {
            AbstractView.prototype.initialize.call(this, args, options);
            var element = args.element,
                selectPredefinedCallback = args.selectPredefinedCallback,
                questionData = args.questionData,
                questionsList = args.questionsList;


            this.element = element;
            this.selectPredefinedCallback = selectPredefinedCallback;

            this.data = {
                cid: this.cid,
                isDeletable: false,
                questionData: _.cloneDeep(questionData),
                questionsList: questionsList
            };

            if (!_.isEmpty(questionData.questionId) && questionData.questionId !== "custom") {
                var questionId = questionData.questionId,
                    text = questionData.text;

                this.data.questionsList = [{ questionId: questionId, text: text }].concat(this.data.questionsList);
            }
            this.model = {
                questionData: _.cloneDeep(questionData)
            };

            return this;
        },

        render: function render(callback) {
            var _this = this;

            this.data.placeholder = _.isEmpty(this.data.questionData.answer) ? "" : $.t("common.form.passwordPlaceholder");

            this.parentRender(function () {
                ValidatorsManager.bindValidators(_this.$el.find(".security-question"));
                _this.toggleDeleteButton(_this.data.isDeletable);

                if (_.isEmpty(_this.data.questionData.questionId)) {
                    _this.$el.find("select").addClass("text-muted");
                } else {
                    _this.$el.find("option.placeholder").remove();
                }

                if (callback) {
                    callback();
                }
            });
        },

        getQuestionData: function getQuestionData() {
            return this.data.questionData;
        },

        questionChangeHandler: function questionChangeHandler(event) {
            var _this2 = this;

            var answer = "",
                nextInput = "answer",
                questionId = event.target.value,
                text = $(event.target).find("option[value='" + questionId + "']").text();

            this.data.questionData = { answer: answer, questionId: questionId, text: text };

            if (questionId === this.model.questionData.questionId) {
                this.data.questionData = _.cloneDeep(this.model.questionData);
                this.render();
            } else {

                if (questionId === "custom") {
                    nextInput = "customQuestion";
                    this.data.questionData.text = "";
                } else {
                    this.selectPredefinedCallback();
                }

                this.render(function () {
                    _this2.$el.find("input[name=\"" + nextInput + "\"]").select();
                });
            }
        },

        inputHandler: function inputHandler(event) {
            event.preventDefault();

            var originalAnswer = _.cloneDeep(this.model.questionData.answer);

            if (event.target.name === "answer") {

                if (_.isEmpty(event.target.value) && !_.isEmpty(originalAnswer)) {
                    this.data.questionData.answer = originalAnswer;
                } else {
                    this.data.questionData.answer = event.target.value;
                }
            } else {
                this.data.questionData.text = event.target.value;
            }
        },

        updateQuestionsList: function updateQuestionsList(updatedQuestionsList) {
            var questionData = this.data.questionData,
                questionId = questionData.questionId,
                text = questionData.text;


            this.data.questionsList = updatedQuestionsList;

            if (!_.isEmpty(questionId)) {
                this.data.questionsList = [{ questionId: questionId, text: text }].concat(this.data.questionsList);
            }

            this.render();
        },


        toggleDeleteButton: function toggleDeleteButton(isDeletable) {
            this.data.isDeletable = isDeletable || false;
            this.$el.find(".delete-KBA-question").toggleClass("hidden", !this.data.isDeletable);
        }
    });

    return KBAQuestionView;
});
