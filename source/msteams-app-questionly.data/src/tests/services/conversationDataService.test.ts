import mongoose from "mongoose";
import { Conversation } from "src/schemas/conversation";

import {
  ConversationDataService,
  IConversationDataService,
} from "src/services/conversationDataService";

const sampleConversationId = "testConversationId";
const sampleServiceUrl = "testServiceUrl";
const sampleTenantId = "testTenantId";
const sampleMeetingId = "testMeetingId";
let conversationDataService: IConversationDataService;

beforeAll(async () => {
  conversationDataService = new ConversationDataService();
  await mongoose.connect(<string>process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

test("Create conversation document without meeting id", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();
  expect(doc._id).toEqual(sampleConversationId);
  expect(doc.toObject().serviceUrl).toEqual(sampleServiceUrl);
  expect(doc.toObject().tenantId).toEqual(sampleTenantId);

  await Conversation.deleteOne({ _id: sampleConversationId });
});

test("Create conversation document with meeting id", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId,
    sampleMeetingId
  );

  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();
  expect(doc._id).toEqual(sampleConversationId);
  expect(doc.toObject().serviceUrl).toEqual(sampleServiceUrl);
  expect(doc.toObject().tenantId).toEqual(sampleTenantId);
  expect(doc.toObject().meetingId).toEqual(sampleMeetingId);

  await Conversation.deleteOne({ _id: sampleConversationId });
});

test("Create duplicate conversation document", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();

  await expect(
    conversationDataService.createConversationData(
      sampleConversationId,
      sampleServiceUrl,
      sampleTenantId
    )
  ).rejects.toThrow();

  await Conversation.deleteOne({ _id: sampleConversationId });
});

test("Delete conversation document", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  let doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();

  await conversationDataService.deleteConversationData(sampleConversationId);

  doc = await Conversation.findById(sampleConversationId);
  expect(doc).toBeNull();
});

test("Get conversation document without meeting id", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();

  const conversation = await conversationDataService.getConversationData(
    sampleConversationId
  );

  expect(conversation).toBeDefined();
  expect(conversation._id).toEqual(sampleConversationId);
  expect(conversation.serviceUrl).toEqual(sampleServiceUrl);
  expect(conversation.tenantId).toEqual(sampleTenantId);

  await Conversation.deleteOne({ _id: sampleConversationId });
});

test("Get conversation document with meeting id", async () => {
  await conversationDataService.createConversationData(
    sampleConversationId,
    sampleServiceUrl,
    sampleTenantId,
    sampleMeetingId
  );

  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).not.toBeNull();

  const conversation = await conversationDataService.getConversationData(
    sampleConversationId
  );

  expect(conversation).toBeDefined();
  expect(conversation._id).toEqual(sampleConversationId);
  expect(conversation.serviceUrl).toEqual(sampleServiceUrl);
  expect(conversation.tenantId).toEqual(sampleTenantId);
  expect(conversation.meetingId).toEqual(sampleMeetingId);

  await Conversation.deleteOne({ _id: sampleConversationId });
});

test("Get conversation document when it does not exist", async () => {
  const doc: any = await Conversation.findById(sampleConversationId);
  expect(doc).toBeNull();

  await expect(
    conversationDataService.getConversationData(sampleConversationId)
  ).rejects.toThrow("Conversation document not found");
});
