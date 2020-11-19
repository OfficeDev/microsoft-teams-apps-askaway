import { Conversation, IConversation } from "./../schemas/conversation";
import { retryWrapper } from "./../utils/retryPolicies";

export interface IConversationDataService {
  createConversationData: (
    conversationId: string,
    serviceUrl: string,
    tenantId: string,
    meetingId?: string
  ) => Promise<void>;
  getConversationData: (conversationId: string) => Promise<IConversation>;
  deleteConversationData: (conversationId: string) => Promise<void>;
}

export class ConversationDataService implements IConversationDataService {
  /**
   * Creates new conversation data document.
   * @param conversationId - conversation id
   * @param serviceUrl - service url
   * @param tenantId - tenant id
   * @throws Error thrown when database fails to create the specified document.
   */
  public async createConversationData(
    conversationId: string,
    serviceUrl: string,
    tenantId: string,
    meetingId?: string
  ): Promise<void> {
    let conversation;

    if (meetingId !== undefined) {
      conversation = new Conversation({
        _id: conversationId,
        serviceUrl: serviceUrl,
        tenantId: tenantId,
        meetingId: meetingId,
      });
    } else {
      conversation = new Conversation({
        _id: conversationId,
        serviceUrl: serviceUrl,
        tenantId: tenantId,
      });
    }

    await retryWrapper(() => conversation.save());
  }

  /**
   * Fetches conversation data document.
   * @param conversationId - conversation id
   * @returns conversation data document.
   * @throws Error thrown when database fails to find the specified document.
   */
  public async getConversationData(
    conversationId: string
  ): Promise<IConversation> {
    const conversation: IConversation = await retryWrapper<IConversation>(() =>
      Conversation.findById(conversationId)
    );

    if (conversation === null) {
      throw new Error("Conversation document not found");
    }

    return conversation;
  }

  /**
   * Delete conversation data document.
   * @param conversationId - conversation id
   * @throws Error thrown when database fails to delete the specified document.
   */
  public async deleteConversationData(conversationId: string): Promise<void> {
    await retryWrapper<IConversation>(() =>
      Conversation.findByIdAndDelete(conversationId)
    );
  }
}
