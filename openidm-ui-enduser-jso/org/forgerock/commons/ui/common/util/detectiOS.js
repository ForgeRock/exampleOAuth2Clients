"use strict";

/*
 * Copyright 2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

/**
 * @module org/forgerock/commons/ui/common/util/detectiOS
 */
define([], function () {
  /**
   * If the operating system is iOS, returns the floating point version number of the OS.
   * @returns {Number|Boolean} The iOS version or false if not iOS
   * @example
   * detectiOS(); => false # not an iOS operating system
   * detectiOS(); => 9 # iOS 9.0
   * detectiOS(); => 9.3 # iOS 9.3
   * detectiOS(); => 10.11 # iOS 10.1.1
   */
  var exports = function exports() {
    var detectiOS = parseFloat(("" + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ""])[1]).replace("undefined", "3_2").replace("_", ".").replace("_", "")) || false;

    return detectiOS;
  };

  return exports;
});
