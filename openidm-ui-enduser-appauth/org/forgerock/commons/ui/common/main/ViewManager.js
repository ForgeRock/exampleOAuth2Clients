"use strict";

/*
 * Copyright 2012-2018 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "underscore", "org/forgerock/commons/ui/common/components/Messages", "org/forgerock/commons/ui/common/main/AbstractView", "org/forgerock/commons/ui/common/util/ModuleLoader"], function ($, _, msg, AbstractView, ModuleLoader) {
    var obj = {},
        decodeArgs = function decodeArgs(args) {
        return _.map(args, function (a) {
            return a && decodeURIComponent(a) || "";
        });
    },
        isBackboneView = function isBackboneView(view) {
        return view && view.render && !_.isFunction(view);
    },
        isReactView = function isReactView(view) {
        return view && !view.render && _.isFunction(view);
    };

    obj.currentView = null;
    obj.currentDialog = null;
    obj.currentViewArgs = null;
    obj.currentDialogArgs = null;

    /**
     * Initializes view if it is not equal to current view.
     * Changes URL without triggering event.
     */
    obj.changeView = function (viewPath, args, callback, forceUpdate) {
        var decodedArgs = decodeArgs(args);

        if (obj.currentView !== viewPath || forceUpdate || !_.isEqual(obj.currentViewArgs, args)) {
            if (obj.currentDialog !== null) {
                ModuleLoader.load(obj.currentDialog).then(function (dialog) {
                    dialog.close();
                });
            }

            //close all existing dialogs
            if (typeof $.prototype.modal === "function") {
                $('.modal.in').modal('hide');
            }

            obj.currentDialog = null;

            msg.messages.hideMessages();

            $.when(ModuleLoader.load(obj.currentView), ModuleLoader.load(viewPath)).then(function (oldView, view) {
                // For ES6 modules, we require that the view is the default export
                if (oldView && oldView.__esModule) {
                    oldView = oldView.default;
                }

                // For ES6 modules, we require that the view is the default export.
                if (view.__esModule) {
                    view = view.default;
                }

                // TODO: Investigate whether this is required anymore
                if (view.init) {
                    view.init();
                }

                var renderView = function renderView() {
                    if (isBackboneView(view)) {
                        view.render(decodedArgs, callback);
                    } else if (isReactView(view)) {
                        // ReactAdapterView (and thus React and React-DOM)
                        // are only loaded when a React view is encountered
                        require(["org/forgerock/commons/ui/common/main/ReactAdapterView"], function (ReactAdapterView) {
                            new ReactAdapterView({ reactView: view }).render();
                        });
                    } else {
                        throw new Error("[ViewManager] Unable to determine view type (Backbone or React).");
                    }
                };

                if (isReactView(oldView)) {
                    // ReactAdapterView (and thus React and React-DOM)
                    // are only loaded when a React view is encountered
                    require(["org/forgerock/commons/ui/common/main/ReactAdapterView"], function (ReactAdapterView) {
                        new ReactAdapterView({ reactView: oldView }).unmountReactComponent();
                        renderView();
                    });
                } else {
                    renderView();
                }
            });
        } else {
            ModuleLoader.load(obj.currentView).then(function (view) {
                view.rebind();

                if (callback) {
                    callback();
                }
            });
        }

        obj.currentViewArgs = args;
        obj.currentView = viewPath;
    };

    obj.showDialog = function (dialogPath, args, callback) {
        var decodedArgs = decodeArgs(args);

        if (obj.currentDialog !== dialogPath || !_.isEqual(obj.currentDialogArgs, decodedArgs)) {
            msg.messages.hideMessages();
            ModuleLoader.load(dialogPath).then(function (dialog) {
                dialog.render(decodedArgs, callback);
            });
        }

        if (obj.currentDialog !== null) {
            ModuleLoader.load(obj.currentDialog).then(function (dialog) {
                dialog.close();
            });
        }

        obj.currentDialog = dialogPath;
        obj.currentDialogArgs = decodedArgs;
    };

    obj.refresh = function () {
        var cDialog = obj.currentDialog,
            cDialogArgs = obj.currentDialogArgs;

        obj.changeView(obj.currentView, obj.currentViewArgs, function () {}, true);
        if (cDialog && cDialog !== null) {
            obj.showDialog(cDialog, cDialogArgs);
        }
    };

    return obj;
});
