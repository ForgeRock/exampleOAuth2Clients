"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["jquery", "lodash"], function ($, _) {
    /**
     * @exports org/forgerock/commons/ui/common/util/AutoScroll
     */
    var obj = {},
        scrollBuffer = 20,
        scrollDirection = null;

    function scroll() {
        if (!_.isNull(scrollDirection)) {
            window.scrollBy(0, scrollBuffer * scrollDirection);

            var scrollPosition = window.pageYOffset,
                maxScrollPosition = $(document).height() - $(window).height();

            // If the scroll bar is not at the top nor bottom continue scrolling
            if (scrollDirection === -1 && scrollPosition > 0 || scrollDirection === 1 && scrollPosition < maxScrollPosition) {
                _.delay(function () {
                    scroll();
                }, 50);
            }
        }
    }

    /**
     * Call startDrag on Dragula.on("drag", function() {});
     */
    obj.startDrag = function () {
        $("body").on("mousemove", _.throttle(function (e) {
            scrollDirection = null;
            var mousePosition = e.pageY,
                windowHeight = $(window).height(),
                scrollTop = $(document).scrollTop();

            // SCROLL DOWN
            if (mousePosition >= windowHeight + scrollTop - scrollBuffer) {
                scrollDirection = 1;

                // SCROLL UP
            } else if (mousePosition - scrollTop <= scrollBuffer) {
                scrollDirection = -1;
            }

            scroll();
        }, 50));
    };

    /**
     * Call endDrag on Dragula.on("drop", function() {});
     */
    obj.endDrag = function () {
        $("body").off("mousemove");
        scrollDirection = null;
    };

    return obj;
});
