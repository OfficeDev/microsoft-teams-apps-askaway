import mongoose from "mongoose";
import { Conversation } from "src/schemas/conversation";
import {
  ConversationDataService,
  IConversationDataService,
} from "src/services/conversationDataService";

const sampleconversationId = "test";
const sampleServiceUrl = "test";
const sampleTenantId = "test";
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

test("Create conversation documment", async () => {
  await conversationDataService.createConversationData(
    sampleconversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleconversationId);
  expect(doc).not.toBeNull();
  expect(doc._id).toEqual(sampleconversationId);
  expect(doc.toObject().serviceUrl).toEqual(sampleServiceUrl);
  expect(doc.toObject().tenantId).toEqual(sampleTenantId);

  await Conversation.remove({ _id: sampleconversationId });
});

test("Create duplicate conversation documment", async () => {
  await conversationDataService.createConversationData(
    sampleconversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleconversationId);
  expect(doc).not.toBeNull();

  await expect(
    conversationDataService.createConversationData(
      sampleconversationId,
      sampleServiceUrl,
      sampleTenantId
    )
  ).rejects.toThrow();

  await Conversation.remove({ _id: sampleconversationId });
});

test("Delete conversation documment", async () => {
  await conversationDataService.createConversationData(
    sampleconversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  let doc: any = await Conversation.findById(sampleconversationId);
  expect(doc).not.toBeNull();

  await conversationDataService.deleteConversationData(sampleconversationId);

  doc = await Conversation.findById(sampleconversationId);
  expect(doc).toBeNull();
});

test("Get conversation documment", async () => {
  await conversationDataService.createConversationData(
    sampleconversationId,
    sampleServiceUrl,
    sampleTenantId
  );

  const doc: any = await Conversation.findById(sampleconversationId);
  expect(doc).not.toBeNull();

  const conversation = await conversationDataService.getConversationData(
    sampleconversationId
  );

  expect(conversation).toBeDefined();
  expect(conversation._id).toEqual(sampleconversationId);
  expect(conversation.serviceUrl).toEqual(sampleconversationId);
  expect(conversation.tenantId).toEqual(sampleTenantId);

  await Conversation.remove({ _id: sampleconversationId });
});

test("Get conversation documment when it does not exist", async () => {
  const doc: any = await Conversation.findById(sampleconversationId);
  expect(doc).toBeNull();

  await expect(
    conversationDataService.getConversationData(sampleconversationId)
  ).rejects.toThrow("Conversation document not found");
});
