/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an HTTP starter function.
 *
 * Before running this sample, please:
 * - create a Durable activity function (default name is "Hello")
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your
 *    function app in Kudu
 */

import * as df from "durable-functions";

const orchestrator = df.orchestrator(function* (context) {
  const outputs = [];

  outputs.push(
    yield context.df.callActivity("broadcast-message", "broadcast message")
  );
  outputs.push(
    yield context.df.callActivity(
      "send-notification-bubble",
      context.bindingData.input
    )
  );
  outputs.push(
    yield context.df.callActivity(
      "update-adaptive-card",
      "update adaptive card"
    )
  );

  // returns ["Activity - broadcast message!", "Activity - send notification bubble!", "Activity - update adaptive card!"]
  return outputs;
});

export default orchestrator;
