"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * Copyright 2017-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/commons/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/EventManager", "org/forgerock/commons/ui/user/delegates/KBADelegate", "org/forgerock/openidm/ui/user/profile/signInAndSecurity/KBAQuestionView", "org/forgerock/commons/ui/common/main/ValidatorsManager"], function ($, _, AbstractView, Configuration, Constants, EventManager, KBADelegate, KBAQuestionView, ValidatorsManager) {
    var KBAView = AbstractView.extend({
        template: "templates/profile/signInAndSecurity/KBAView.html",
        events: {
            "click .btn-cancel": "cancel",
            "click .btn-save": "save",
            "click .delete-KBA-question": "deleteQuestionHandler",
            "click #provideAnother": "addQuestionHandler",
            "keyup  input": "toggleSaveButton",
            "customValidate": "toggleSaveButton"
        },

        render: function render(data, callback) {
            var _this = this;

            KBADelegate.getInfo().then(function (kbaConfig) {
                var user = Configuration.loggedUser,
                    kbaInfo = user.get(kbaConfig.kbaPropertyName) || [];

                _this.model = { kbaConfig: kbaConfig, kbaInfo: kbaInfo, user: user };
                _this.data = {
                    questions: kbaInfo.map(function (kbaItem) {
                        return _this.createQuestion(_this.kbaItemToQuestionData(kbaConfig.questions, kbaItem));
                    }),
                    predefinedQuestions: _.keys(kbaConfig.questions).map(function (questionId) {
                        return { questionId: questionId, text: kbaConfig.questions[questionId].en };
                    }),
                    insufficientNumberOfQuestionsWarning: $.t("common.user.kba.insufficientNumberOfQuestionsWarning", {
                        minimumAnswersToDefine: kbaConfig.minimumAnswersToDefine })
                };

                _this.parentRender(function () {
                    var isDeletable = _this.data.questions.length > _this.model.kbaConfig.minimumAnswersToDefine;

                    _this.data.questions.forEach(function (question) {
                        question.view.render(function () {
                            ValidatorsManager.bindValidators(_this.$el.find("form"));
                            question.view.toggleDeleteButton(isDeletable);
                        });

                        _this.$el.find("#kbaQuestions").append(question.element);
                    });

                    ValidatorsManager.bindValidators(_this.$el.find("form"));
                    _this.toggleMinQuestionsWarning();

                    if (callback) {
                        callback();
                    }
                });
            });
        },

        save: function save(event) {
            var _this2 = this;

            event.preventDefault();

            var updatedKbaItems = this.data.questions.map(this.questionDataToKbaItem),
                kbaPropertyName = this.model.kbaConfig.kbaPropertyName;

            KBADelegate.saveInfo(_defineProperty({}, kbaPropertyName, updatedKbaItems)).then(function () {
                EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "profileUpdateSuccessful");
                _this2.render();
            }, function (response) {
                if (response.status === 400) {
                    EventManager.sendEvent(Constants.EVENT_DISPLAY_MESSAGE_REQUEST, "noDuplicateKbaQuestions");
                }
            });
        },

        cancel: function cancel(event) {
            event.preventDefault();
            this.render();
        },

        createQuestion: function createQuestion(questionData) {
            questionData = questionData || { answer: "", quesitonId: "", type: "", text: "" };

            var element = $("<div/>", { "class": "kba-question" }),
                questionView = new KBAQuestionView({
                element: element,
                questionData: questionData,
                selectPredefinedCallback: _.bind(this.updateQuestionLists, this),
                questionsList: this.getAvailableQuestions()
            }),
                question = { cid: questionView.cid, view: questionView, element: element };

            return question;
        },

        addQuestionHandler: function addQuestionHandler(event) {
            var _this3 = this;

            event.preventDefault();

            var question = this.createQuestion();

            this.data.questions.push(question);
            question.view.render();

            this.setQuestionsDeletable(function () {
                _this3.$el.find("#kbaQuestions").append(question.element);
                ValidatorsManager.bindValidators(_this3.$el.find("form"));
            });
        },

        deleteQuestionHandler: function deleteQuestionHandler(event) {
            event.preventDefault();

            var cid = $(event.currentTarget).attr("data-cid"),
                question = _.find(this.data.questions, { cid: cid });

            question.view.remove();
            this.data.questions = _.reject(this.data.questions, function (question) {
                return question.cid === cid;
            });
            this.updateQuestionLists();
            this.setQuestionsDeletable();
        },

        getQuestionIds: function getQuestionIds() {
            return this.data.questions.map(function (question) {
                return question.view.getQuestionData().questionId;
            });
        },

        kbaItemToQuestionData: function kbaItemToQuestionData(predefinedQuestions, kbaItem) {
            var questionId = kbaItem.questionId,
                answer = kbaItem.answer,
                customQuestion = kbaItem.customQuestion;


            return _.isUndefined(customQuestion) ? { answer: answer, questionId: questionId, text: predefinedQuestions[questionId].en } : { answer: answer, questionId: "custom", text: customQuestion };
        },

        questionDataToKbaItem: function questionDataToKbaItem(question) {
            var _question$view$getQue = question.view.getQuestionData(),
                answer = _question$view$getQue.answer,
                questionId = _question$view$getQue.questionId,
                text = _question$view$getQue.text;

            return questionId === "custom" ? { answer: answer, customQuestion: text } : { answer: answer, questionId: questionId };
        },

        setQuestionsDeletable: function setQuestionsDeletable(callback) {
            var isDeletable = this.data.questions.length > this.model.kbaConfig.minimumAnswersToDefine;

            this.toggleMinQuestionsWarning();
            this.data.questions.forEach(function (question) {
                question.view.toggleDeleteButton(isDeletable);
            });

            ValidatorsManager.validateAllFields(this.$el.find("form"));

            if (callback) {
                callback();
            }
        },

        getAvailableQuestions: function getAvailableQuestions() {
            var _this4 = this;

            return _.reject(this.data.predefinedQuestions, function (predefindedQuestion) {
                return _.includes(_this4.getQuestionIds(), predefindedQuestion.questionId);
            });
        },

        toggleSaveButton: function toggleSaveButton() {
            var updatedKbaItems = this.data.questions.map(this.questionDataToKbaItem),
                formIsValid = ValidatorsManager.formValidated(this.$el.find("form")),
                itemsChanged = !_.isEqual(updatedKbaItems, this.model.kbaInfo),
                noEmptyItems = _.isEmpty(updatedKbaItems.filter(function (kbaItem) {
                return _.isEmpty(kbaItem.answer);
            }));

            this.$el.find(".btn-save").prop("disabled", !(formIsValid && itemsChanged && noEmptyItems));
        },

        toggleMinQuestionsWarning: function toggleMinQuestionsWarning() {
            if (this.data.questions.length < this.model.kbaConfig.minimumAnswersToDefine) {
                this.$el.find("#minimumAnswersToDefineWarning").toggleClass("hidden", false);
            } else {
                this.$el.find("#minimumAnswersToDefineWarning").toggleClass("hidden", true);
            }
        },

        updateQuestionLists: function updateQuestionLists() {
            var _this5 = this;

            this.data.questions.forEach(function (question) {
                question.view.updateQuestionsList(_this5.getAvailableQuestions());
            });
        }
    });

    return new KBAView();
});
