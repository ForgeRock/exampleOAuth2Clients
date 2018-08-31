"use strict";

/*
 * Copyright 2016-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/user/anonymousProcess/KBAQuestionView"], function ($, _, AbstractView, KBAQuestionView) {
    var KBAView = AbstractView.extend({
        element: "#kbaQuestions",
        template: "templates/user/process/KBATemplate.html",
        noBaseTemplate: true,
        MIN_NUMBER_OF_QUESTIONS: 1,
        events: {
            "click [data-add-question]": "addQuestion"
        },
        model: {},

        /**
         * TODO Implement mechanism of passing existing KBA questions to this view, as this is to be used on the profile
         * page as well.
         *
         * The format of existing KBA questions is the following:
         *  "kbaInfo":[
         *      {
         *          "customQuestion": "question2",
         *          "answer":{"$crypto":{"value":{"algorithm":"SHA-256","data":"....."},"type":"salted-hash"}}
         *      },
         *      {
         *          "questionId": "2",
         *          "answer":{"$crypto":{"value":{"algorithm":"SHA-256","data":"....."},"type":"salted-hash"}}
         *      }
         * ]
         */
        render: function render(kbaConfig) {
            var existingKbaLength;

            if (_.has(kbaConfig, "requirements.existingKba")) {
                this.model.existingKba = kbaConfig.requirements.existingKba;
                this.data.updatingExisitingKBA = true;
                kbaConfig = _.cloneDeep(kbaConfig.requirements.properties.kba);
            }

            this.allQuestions = kbaConfig.questions;
            this.minNumberOfQuestions = kbaConfig.minItems || this.MIN_NUMBER_OF_QUESTIONS;
            this.selectedQuestions = [];
            this.questionsCounter = 0;

            this.parentRender(function () {
                this.setDescription();

                this.itemsContainer = this.$el.find("#kbaItems");

                if (this.model.existingKba) {
                    existingKbaLength = this.model.existingKba.length || 0;

                    _.each(this.model.existingKba, _.bind(function (existingQuestion) {
                        this.addQuestion(false, existingQuestion);
                    }, this));

                    if (existingKbaLength <= this.minNumberOfQuestions) {
                        _.times(this.minNumberOfQuestions - existingKbaLength, _.bind(function () {
                            this.addQuestion();
                        }, this));
                    }
                } else {
                    _.times(this.minNumberOfQuestions, _.bind(function () {
                        this.addQuestion();
                    }, this));
                }
            });
        },

        setDescription: function setDescription() {
            this.$el.find("#kbaDescription").text($.t("common.user.kba.description", {
                numberOfQuestions: this.minNumberOfQuestions
            }));
        },

        getUnSelectedQuestions: function getUnSelectedQuestions() {
            var selectedQuestions = _(this.selectedQuestions).map(function (questionView) {
                return questionView.getSelectedQuestionId();
            }).compact().value();

            return _.filter(this.allQuestions, function (question) {
                return selectedQuestions.indexOf(question.id) === -1;
            });
        },

        addQuestion: function addQuestion(e, existingQuestion) {
            var viewData = {
                possibleQuestions: this.getUnSelectedQuestions(),
                numberOfQuestionsSufficient: this.isNumberOfQuestionsSufficient()
            },
                atMinimumThresholdBeforeAdding = this.isAtMinimumThreshold(),
                question;

            if (e) {
                e.preventDefault();
            }

            if (existingQuestion) {
                viewData = _.extend(viewData, existingQuestion);
            }

            question = new KBAQuestionView({ id: this.questionsCounter++ });

            this.selectedQuestions.push(question);

            question.render(viewData, this.itemsContainer);

            if (atMinimumThresholdBeforeAdding) {
                this.reRenderAllQuestions();
            }
        },

        reRenderAllQuestions: function reRenderAllQuestions() {
            var unSelectedQuestions = this.getUnSelectedQuestions();

            _.each(this.selectedQuestions, _.bind(function (questionView) {
                var currentViewQuestion = _.findWhere(this.allQuestions, { id: questionView.getSelectedQuestionId() }),
                    possibleQuestions = _.clone(unSelectedQuestions);

                if (currentViewQuestion) {
                    possibleQuestions.push(currentViewQuestion);
                    possibleQuestions.sort(function (q1, q2) {
                        return q1.id - q2.id;
                    });
                }

                questionView.updateQuestionWithNewData({
                    possibleQuestions: possibleQuestions,
                    numberOfQuestionsSufficient: this.isNumberOfQuestionsSufficient()
                });
            }, this));
        },

        isNumberOfQuestionsSufficient: function isNumberOfQuestionsSufficient() {
            return this.minNumberOfQuestions < this.selectedQuestions.length;
        },

        deleteQuestion: function deleteQuestion(viewId) {
            var questionView = _.findWhere(this.selectedQuestions, { id: viewId });

            questionView.remove();
            this.selectedQuestions = _.without(this.selectedQuestions, questionView);

            if (questionView.getSelectedQuestionId() || this.isAtMinimumThreshold()) {
                this.reRenderAllQuestions();
            }
        },

        changeQuestion: function changeQuestion() {
            this.reRenderAllQuestions();
        },

        isAtMinimumThreshold: function isAtMinimumThreshold() {
            return this.minNumberOfQuestions === this.selectedQuestions.length;
        },

        getQuestions: function getQuestions() {
            return _.map(this.selectedQuestions, function (questionView) {
                return questionView.getPair();
            });
        }
    });

    return new KBAView();
});
