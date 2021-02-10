import {
  initiateConnection,
  ConversationDataService,
  IConversation,
  QuestionDataService,
  UserDataService,
  QnASessionDataService,
} from "msteams-app-questionly.data";

let dbInstance = null;
const conversationDataService = new ConversationDataService();
const userDataService = new UserDataService();
export const qnaSessionDataService = new QnASessionDataService(userDataService);
export const questionDataService = new QuestionDataService(
  userDataService,
  qnaSessionDataService
);

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
