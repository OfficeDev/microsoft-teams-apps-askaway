import httpTrigger from "../../../add-to-group/index";
import { mockContext } from "./../mocks/testContext";
import { authenticateRequest } from "../../services/authService";
import { userIdParameterConstant } from "../../constants/requestConstants";
import { signalRUtility } from "../../utils/signalRUtility";
import { verifyUserFromConversationId } from "../../utils/conversationUtility";
jest.mock("../../services/authService");
jest.mock("../../utils/signalRUtility");
jest.mock("../../utils/conversationUtility");
let request: any;
const testError: Error = new Error("test error");

beforeEach(() => {
  jest.clearAllMocks();
  request = {
    body: {
      conversationId: "testConversationId",
      connectionId: "testConnectionId",
    },
    headers: null,
  };
});

test("tests add to group function for bad request: connectionId missing", async () => {
  delete request.body.connectionId;
  await httpTrigger(mockContext, request);
  expect(mockContext.res.status).toBe(400);
  expect(mockContext.res.body).toBe("parameter connectionId is missing.");
});

test("tests add to group function for bad request: conversationId missing", async () => {
  delete request.body.conversationId;
  await httpTrigger(mockContext, request);
  expect(mockContext.res.status).toBe(400);
  expect(mockContext.res.body).toBe("parameter conversationId is missing.");
});

test("tests add to group function for authorization error", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(mockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(mockContext.res.status).toBe(401);
  expect(mockContext.res.body).toBe("Unauthorized");
});

test("tests add to group function for exception from from auth function", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(mockContext, request);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(mockContext.res.status).toBe(500);
  expect(mockContext.res.body).toBe(null);
  expect(mockContext.log.error).toBeCalledTimes(1);
  expect(mockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: user not part of conversation", async () => {
  const testUserId: string = "testUserId";
  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(mockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    request.body.conversationId,
    testUserId
  );
  expect(mockContext.res.status).toBe(401);
  expect(mockContext.res.body).toBe("Unauthorized");
});

test("tests add to group function: exception from verifyUserFromConversationId", async () => {
  const testUserId: string = "testUserId";
  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(mockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    request.body.conversationId,
    testUserId
  );
  expect(mockContext.res.status).toBe(500);
  expect(mockContext.res.body).toBe(null);
  expect(mockContext.log.error).toBeCalledTimes(1);
  expect(mockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: exception from addConnectionToGroup", async () => {
  const testUserId: string = "testUserId";
  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    return true;
  });

  signalRUtility.addConnectionToGroup = jest.fn();
  (<any>signalRUtility.addConnectionToGroup).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(mockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    request.body.conversationId,
    testUserId
  );
  expect(mockContext.res.status).toBe(500);
  expect(mockContext.res.body).toBe(null);
  expect(mockContext.log.error).toBeCalledTimes(1);
  expect(mockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: positive test case", async () => {
  const testUserId: string = "testUserId";
  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    return true;
  });

  signalRUtility.addConnectionToGroup = jest.fn();
  (<any>signalRUtility.addConnectionToGroup).mockImplementationOnce(() => {
    return;
  });

  await httpTrigger(mockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    request.body.conversationId,
    testUserId
  );
  expect(mockContext.res.status).toBe(200);
  expect(mockContext.log.error).not.toBeCalled();
});
