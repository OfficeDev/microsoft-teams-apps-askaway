import {
  initiateConnection,
  ConversationDataService,
  IConversation,
  IConversationDataService,
} from "msteams-app-questionly.data";

let dbInstance = null;
let conversationDataService: IConversationDataService = new ConversationDataService();

/**
 * Initiates the connection to the CosmosDB database if its not done already.
 */
export const initiateDBConnection = async () => {
  if (dbInstance === null) {
    dbInstance = await initiateConnection(
      process.env.MongoDbUri?.toString()?.trim()
    );
  }
};

/**
 * Fetches conversation document from DB.
 * @param conversationId - conversation id.
 * @returns - conversation document.
 * @throws - throws exeption if doc is not found.
 */
export const getConversationData = async (
  conversationId: string
): Promise<IConversation> => {
  return await conversationDataService.getConversationData(conversationId);
};
