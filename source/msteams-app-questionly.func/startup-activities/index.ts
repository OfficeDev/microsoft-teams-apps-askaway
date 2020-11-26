/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 */

import { AzureFunction, Context } from "@azure/functions";
import { IConversation } from "msteams-app-questionly.data";
import { getConversationData } from "../src/utils/dbUtility";

const activityFunction: AzureFunction = async function (
  context: Context
): Promise<IConversation> {
  const conversationId = context.bindings.name;
  return await getConversationData(conversationId);
};

export default activityFunction;
