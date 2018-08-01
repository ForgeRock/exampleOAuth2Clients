"use strict";

/*
 * Copyright 2016-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/common/main/ValidatorsManager", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/util/UIUtils"], function ($, _, AbstractView, EventManager, ValidatorsManager, Constants, UIUtils) {
    return AbstractView.extend({
        template: "templates/user/process/KBAQuestionTemplate.html",
        noBaseTemplate: true,
        CUSTOM_QUESTION: "customQuestion",
        events: {
            "click  [data-delete-question]": "deleteQuestion",
            "change [data-select-question]": "changeQuestion",
            "blur   [data-custom-question]": "setCustomQuestion",
            "blur   [data-answer]": "setAnswer"
        },

        /**
         * @param {Object}  data
         * @param {array}   data.possibleQuestions           - all possible variants of questions
         * @param {boolean} data.numberOfQuestionsSufficient - whether the selected number of questions is greater than
         *                                                     the required minimum number of questions
         * @param {Object}  parent                           - parent jQuery element
         */
        render: function render(data, parent) {
            _.extend(this.data, data);

            this.data.index = this.id;

            this.createAndSetEmptyDOMElement(parent);
            this.parentRender(this.bindValidators);
        },

        createAndSetEmptyDOMElement: function createAndSetEmptyDOMElement(parent) {
            var li = $("<li data-question-" + this.id + ">");
            parent.append(li);

            this.element = li;
        },

        deleteQuestion: function deleteQuestion(e) {
            e.preventDefault();
            EventManager.sendEvent(Constants.EVENT_DELETE_KBA_QUESTION, { viewId: this.id });
        },

        changeQuestion: function changeQuestion(e) {
            var newQuestionId = $(e.target).val();

            if (newQuestionId !== this.data.questionId) {
                this.data.questionId = newQuestionId;
                delete this.data.answer;
                delete this.data.customQuestion;

                EventManager.sendEvent(Constants.EVENT_SELECT_KBA_QUESTION);
            }
        },

        setCustomQuestion: function setCustomQuestion(e) {
            this.data.customQuestion = $(e.target).val();
        },

        setAnswer: function setAnswer(e) {
            this.data.answer = $(e.target).val();
            //the following event will refire all the sibling question views and mask
            //each of their answers upon blur of the answer currently being edited
            EventManager.sendEvent(Constants.EVENT_SELECT_KBA_QUESTION);
        },

        getSelectedQuestionId: function getSelectedQuestionId() {
            return this.data.questionId;
        },

        getPair: function getPair() {
            var pair = { answer: this.data.answer };

            if (this.data.questionId === this.CUSTOM_QUESTION || this.data.customQuestion) {
                pair.customQuestion = this.data.customQuestion;
            } else {
                pair.questionId = this.data.questionId;
            }

            return pair;
        },

        /**
         * @param {Object}  data
         * @param {array}   data.possibleQuestions           - all possible variants of questions
         * @param {boolean} data.numberOfQuestionsSufficient - whether the selected number of questions is greater than
         *                                                     the required minimum number of questions
         */
        updateQuestionWithNewData: function updateQuestionWithNewData(data) {
            _.extend(this.data, data);

            UIUtils.fillTemplateWithData(this.template, this.data).then(_.bind(function (template) {
                this.$el.html(template);
                this.bindValidators();
            }, this));
        },

        bindValidators: function bindValidators() {
            ValidatorsManager.bindValidators(this.$el, this.baseEntity, _.bind(function () {
                ValidatorsManager.validateAllFields(this.$el);
            }, this));
        }
    });
});
