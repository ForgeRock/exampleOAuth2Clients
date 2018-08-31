"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash", "org/forgerock/openidm/ui/common/util/Constants", "org/forgerock/commons/ui/common/main/Configuration", "org/forgerock/openidm/ui/common/delegates/ConfigDelegate"], function ($, _, constants, conf, configDelegate) {

    var obj = {},
        themePromise;

    obj.loadThemeCSS = function (theme) {
        $('head').find('link[href*=favicon]').remove();

        $("<link/>", {
            rel: "icon",
            type: "image/x-icon",
            href: require.toUrl(theme.path + theme.icon)
        }).appendTo("head");

        $("<link/>", {
            rel: "shortcut icon",
            type: "image/x-icon",
            href: require.toUrl(theme.path + theme.icon)
        }).appendTo("head");

        _.forEach(theme.stylesheets, function (stylesheet) {
            $("<link/>", {
                rel: "stylesheet",
                type: "text/css",
                href: require.toUrl(stylesheet)
            }).appendTo("head");
        });
    };

    obj.loadThemeConfig = function () {
        var prom = $.Deferred();
        //check to see if the config file has been loaded already
        //if so use what is already there if not load it
        if (conf.globalData.themeConfig) {
            prom.resolve(conf.globalData.themeConfig);
            return prom;
        } else {
            return configDelegate.readEntity("ui/themeconfig");
        }
    };

    obj.getTheme = function () {
        if (themePromise === undefined) {
            themePromise = obj.loadThemeConfig().then(function (themeConfig) {
                conf.globalData.theme = themeConfig;
                obj.loadThemeCSS(themeConfig);
                return themeConfig;
            });
        }
        return themePromise;
    };

    return obj;
});
