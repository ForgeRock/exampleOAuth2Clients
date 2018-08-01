'use strict';

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["owl"], function () {

    var obj = {};

    /**
     *
     * @param options - Object containing parameters used to generate the session in window
     *      path - URL to be used for the new window
     *      windowName - Name of the new window
     *      windowOptions - height and width of the window
     *
     *      Generates a new window
     */
    obj.oauthPopup = function (options) {
        var width = screen.width * (2 / 3),
            height = screen.height * (2 / 3);

        options.windowName = options.windowName || 'ConnectWithOAuth';
        options.windowOptions = options.windowOptions || 'location=0,status=0,width=' + width + ',height=' + height;
        options.callback = options.callback || function () {
            window.location.reload();
        };

        window.open(options.path, options.windowName, options.windowOptions);
    };

    obj.initSocialCarousel = function (el, providerCount) {
        var responsive,
            responsiveOptions = {
            "fourItems": {
                500: {
                    items: 4,
                    slideBy: 3
                },
                768: {
                    items: 3,
                    slideBy: 2
                },
                992: {
                    items: 4,
                    slideBy: 3
                }
            },
            "fiveItems": {
                500: {
                    items: 5,
                    slideBy: 4
                },
                768: {
                    items: 3,
                    slideBy: 2
                },
                992: {
                    items: 5,
                    slideBy: 4
                }
            },
            "full": {
                500: {
                    items: 5,
                    slideBy: 4
                },
                768: {
                    items: 3,
                    slideBy: 2
                },
                992: {
                    items: 5,
                    slideBy: 4
                },
                1200: {
                    items: 6,
                    slideBy: 5
                }
            }
        };

        if (providerCount <= 3) {
            return;
        } else if (providerCount === 4) {
            responsive = responsiveOptions.fourItems;
        } else if (providerCount === 5) {
            responsive = responsiveOptions.fiveItems;
        } else {
            responsive = responsiveOptions.full;
        }

        el.owlCarousel({
            nav: true,
            loop: false,
            navSpeed: 150,
            navText: ["<i class='fa fa-angle-left'></i>", "<i class='fa fa-angle-right'></i>"],
            responsive: responsive
        });
    };

    return obj;
});
