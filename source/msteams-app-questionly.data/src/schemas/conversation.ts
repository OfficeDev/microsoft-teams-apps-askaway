import * as mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  // The _id field which is the primary key of the document, will store the conversation id.
  _id: {
    type: String,
    required: true,
  },
  meetingId: {
    type: String,
    required: false,
  },
  serviceUrl: {
    type: String,
    required: true,
  },
  tenantId: {
    type: String,
    required: true,
  },
});

/**
 * Exports the IConversation interface for external use.
 */
export interface IConversation extends mongoose.Document {
  // The _id field which is the primary key of the document, will store the conversation id.
  _id: string;
  tenantId: string;
  serviceUrl: string;
  meetingId?: string;
}

/**
 * Exports the Conversation schema model for external use.
 */
export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
