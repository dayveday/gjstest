// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jacobsa@google.com (Aaron Jacobs)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Describe the supplied set of arguments to a mock function as a list of lines
 * to be displayed.
 *
 * @param {!Arguments} args
 *
 * @param {!function(*):!string} stringify
 *     A function that turns arbitrary objects into a convenient human-readable
 *     form.
 *
 * @return {!Array.<string>}
 *
 * @private
 */
gjstest.internal.describeArgs_ = function(args, stringify) {
  if (args.length == 0) return ['    (No arguments.)'];

  var result = [];
  for (var i = 0; i < args.length; ++i) {
    result.push('    Arg ' + i + ': ' + stringify(args[i]));
  }

  return result;
};

/**
 * Find the next active action for an expectation and return its function,
 * returning the empty function if none is available. If a one-time action is
 * chosen, mark it as expired.
 *
 * @param {!gjstest.internal.CallExpectation} expectation
 * @return {!Function}
 *
 * @private
 */
gjstest.internal.consumeAction_ = function(expectation) {
  // Is there an unexpired one-time action?
  for (var i = 0; i < expectation.oneTimeActions.length; ++i) {
    var action = expectation.oneTimeActions[i];
    if (!action.expired) {
      action.expired = true;
      return action.actionFunction;
    }
  }

  // Is there a fallback action?
  if (!!expectation.fallbackAction) {
    return expectation.fallbackAction.actionFunction;
  }

  // Fall back to the empty function.
  return function() {};
};

/**
 * Describe the matchers composing a call expectation as a list of lines to be
 * displayed.
 *
 * @param {!gjstest.internal.CallExpectation} expectation
 * @return {!Array.<string>}
 */
gjstest.internal.describeExpectation = function(expectation) {
  var result = [];
  var matchers = expectation.argMatchers;

  for (var i = 0; i < matchers.length; ++i) {
    var description = matchers[i].description;
    result.push('    Arg ' + i + ': ' + description);
  }

  return result;
};

/**
 * Create a mock function that verifies against a list of expectation and takes
 * the appropriate action when called.
 *
 * @param {function(*):!string} stringify
 *     A function that turns arbitrary objects into a convenient human-readable
 *     form.
 *
 * @param {function(!Arguments, !gjstest.internal.CallExpectation):string?}
 *     checkArgs
 *     A function that knows how to check function call arguments against a call
 *     expectation, returning null if it matches and an error message otherwise.
 *
 * @param {function(string)} reportFailure
 *     A function that will be called with a descriptive error message in the
 *     event of failure.
 *
 * @param {string} opt_name
 *     A name for this mock function, used in unexpected call output.
 *
 * @return {!Function}
 */
gjstest.internal.createMockFunction =
    function(stringify, checkArgs, reportFailure, opt_name) {
  // Initialize a list of call expectations for this function.
  var callExpectations =
      /** @type !Array.<gjstest.internal.CallExpectation> */([]);

  // Create a function that checks its arguments against the expectations that
  // have been registered.
  var result = function() {
    // Build a failure message iteratively, assuming we won't match.
    var failureLines = ['Call matches no expectation.'];

    if (opt_name) {
      failureLines = ['Call to ' + opt_name + ' matches no expectation.'];
    }

    // Describe the arguments we were called with.
    failureLines = failureLines.concat(
        gjstest.internal.describeArgs_(arguments, stringify));

    // Check the arguments against each expectation. Iterate in reverse order to
    // match most recent expectations first.
    for (var i = callExpectations.length - 1; i >= 0; --i) {
      var expectation = callExpectations[i];

      // Does this expectation match?
      var expectationFailureMessage = checkArgs(arguments, expectation);
      if (expectationFailureMessage === null) {
        failureLines = [];
        ++expectation.numMatches;
        break;
      }

      // Describe the failure.
      var stackFrame = expectation.stackFrame;

      failureLines.push('');
      failureLines.push(
          'Tried expectation at ' +
              stackFrame.fileName + ':' + stackFrame.lineNumber +
              ', but ' + expectationFailureMessage + ':');

      failureLines = failureLines.concat(
          gjstest.internal.describeExpectation(expectation));
    }

    // If there was a failure, report it and return.
    if (failureLines.length > 0) {
      reportFailure(failureLines.join('\n'));
      return;
    }

    // Take the appropriate action.
    var actionFunc = gjstest.internal.consumeAction_(expectation);
    return actionFunc.apply(this, arguments);
  };

  // Add a reference to the list of expectations.
  result.__gjstest_expectations = callExpectations;

  return result;
};
