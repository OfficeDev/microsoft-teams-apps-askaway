import httpTrigger from "../../../add-to-group/index";
import { triggerMockContext } from "./../mocks/testContext";
import { authenticateRequest } from "../../services/authService";
import { userIdParameterConstant } from "../../constants/requestConstants";
import { signalRUtility } from "../../utils/signalRUtility";
import { verifyUserFromConversationId } from "msteams-app-questionly.common";
import {
  initiateDBConnection,
  getConversationData,
} from "../../utils/dbUtility";
import { StatusCodes } from "http-status-codes";

jest.mock("../../services/authService");
jest.mock("../../utils/signalRUtility");
jest.mock("msteams-app-questionly.common");
let request: any;
const testError: Error = new Error("test error");
let testConversation: any;

beforeAll(() => {
  process.env.MicrosoftAppId = "random";
  process.env.MicrosoftAppPassword = "random";
});

beforeEach(() => {
  jest.clearAllMocks();
  (<any>getConversationData) = jest.fn();
  (<any>initiateDBConnection) = jest.fn();

  testConversation = {
    _id: "testConversationId",
    serviceUrl: "testServiceUrl",
    tenantId: "testtenantId",
  };

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
  await httpTrigger(triggerMockContext, request);
  expect(triggerMockContext.res.status).toBe(StatusCodes.BAD_REQUEST);
  expect(triggerMockContext.res.body).toBe(
    "Parameter connectionId is missing."
  );
});

test("tests add to group function for bad request: conversationId missing", async () => {
  delete request.body.conversationId;
  await httpTrigger(triggerMockContext, request);
  expect(triggerMockContext.res.status).toBe(StatusCodes.BAD_REQUEST);
  expect(triggerMockContext.res.body).toBe(
    "Parameter conversationId is missing."
  );
});

test("tests add to group function for authorization error", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(triggerMockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(triggerMockContext.res.status).toBe(StatusCodes.UNAUTHORIZED);
  expect(triggerMockContext.res.body).toBe("Unauthorized");
});

test("tests add to group function for exception from from auth function", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(triggerMockContext, request);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(triggerMockContext.res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  expect(triggerMockContext.res.body).toBe(null);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: conversation document is not present", async () => {
  const testUserId = "testUserId";

  (<any>getConversationData).mockImplementationOnce(() => {
    throw testError;
  });

  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  await httpTrigger(triggerMockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(initiateDBConnection).toBeCalledTimes(1);

  expect(triggerMockContext.res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  expect(triggerMockContext.res.body).toBe(null);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: user not part of conversation", async () => {
  const testUserId = "testUserId";

  (<any>getConversationData).mockImplementationOnce(() => {
    return testConversation;
  });

  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(triggerMockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(initiateDBConnection).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    process.env.MicrosoftAppId,
    process.env.MicrosoftAppPassword,
    request.body.conversationId,
    testConversation.serviceUrl,
    testConversation.tenantId,
    testUserId
  );
  expect(triggerMockContext.res.status).toBe(StatusCodes.UNAUTHORIZED);
  expect(triggerMockContext.res.body).toBe("Unauthorized");
});

test("tests add to group function: exception from verifyUserFromConversationId", async () => {
  const testUserId = "testUserId";

  (<any>getConversationData).mockImplementationOnce(() => {
    return testConversation;
  });

  (<any>authenticateRequest).mockImplementationOnce(() => {
    request[userIdParameterConstant] = testUserId;
    return true;
  });

  (<any>verifyUserFromConversationId).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(triggerMockContext, request);
  expect(initiateDBConnection).toBeCalledTimes(1);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    process.env.MicrosoftAppId,
    process.env.MicrosoftAppPassword,
    request.body.conversationId,
    testConversation.serviceUrl,
    testConversation.tenantId,
    testUserId
  );
  expect(triggerMockContext.res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  expect(triggerMockContext.res.body).toBe(null);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: exception from addConnectionToGroup", async () => {
  const testUserId = "testUserId";
  (<any>getConversationData).mockImplementationOnce(() => {
    return testConversation;
  });

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

  await httpTrigger(triggerMockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(initiateDBConnection).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    process.env.MicrosoftAppId,
    process.env.MicrosoftAppPassword,
    request.body.conversationId,
    testConversation.serviceUrl,
    testConversation.tenantId,
    testUserId
  );
  expect(triggerMockContext.res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  expect(triggerMockContext.res.body).toBe(null);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});

test("tests add to group function: positive test case", async () => {
  const testUserId = "testUserId";

  (<any>getConversationData).mockImplementationOnce(() => {
    return testConversation;
  });

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

  await httpTrigger(triggerMockContext, request);
  expect(authenticateRequest).toBeCalledTimes(1);
  expect(initiateDBConnection).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledTimes(1);
  expect(verifyUserFromConversationId).toBeCalledWith(
    process.env.MicrosoftAppId,
    process.env.MicrosoftAppPassword,
    request.body.conversationId,
    testConversation.serviceUrl,
    testConversation.tenantId,
    testUserId
  );
  expect(triggerMockContext.res.status).toBe(StatusCodes.OK);
  expect(triggerMockContext.log.error).not.toBeCalled();
});
