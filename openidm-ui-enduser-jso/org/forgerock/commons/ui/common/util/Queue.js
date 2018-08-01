"use strict";

/*
 * Copyright 2016-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

define(["lodash"], function (_) {
  /**
   * Provides a generic, sharable queue (FIFO) mechanism.
   * @exports org/forgerock/commons/ui/common/util/Queue
   */

  /**
   * Constructor. Takes an optional array for initializing the queue with values
   *
   * @param {array} initialValues - optional array of values to start queuing.
   */
  var obj = function obj(initialValues) {
    this._values = _.isArray(initialValues) ? initialValues : [];
    return this;
  };

  /**
   * Put a new item in the queue
   *
   * @param {Object} value - any arbitrary value to insert into the queue
   */
  obj.prototype.add = function (value) {
    this._values.push(value);
  };

  /**
   * Remove and return the head of the queue
   *
   * @returns {Object} whatever is on the head of the queue, or undefined if nothing is available
   */
  obj.prototype.remove = function () {
    return this._values.shift(1);
  };

  /**
   * Return the head of the queue without removing it
   *
   * @param {string} queueName - name of queue to remove from
   * @returns {Object} whatever is on the head of the queue, or undefined if nothing is available
   */
  obj.prototype.peek = function () {
    return this._values[0];
  };

  return obj;
});
