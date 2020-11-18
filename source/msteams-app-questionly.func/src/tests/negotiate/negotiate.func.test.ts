import httpTrigger from "../../../negotiate/index";
import { triggerMockContext } from "./../mocks/testContext";
import { authenticateRequest } from "../../services/authService";
jest.mock("../../services/authService");

const request = {
  body: null,
  headers: null,
};
const connectionInfo = { url: "test url", accessToken: "test access token" };

beforeEach(() => {
  jest.clearAllMocks();
});

test("tests negotiate function", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    return true;
  });

  await httpTrigger(triggerMockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(triggerMockContext.res.status).toBe(200);
  expect(triggerMockContext.res.json).toBeCalledTimes(1);
  expect(triggerMockContext.res.json).toBeCalledWith(connectionInfo);
});

test("tests negotiate function for authorization error", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(triggerMockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(triggerMockContext.res.status).toBe(401);
  expect(triggerMockContext.res.body).toBe("Unauthorized");
});

test("tests negotiate function for internal server error", async () => {
  const testError: Error = new Error("test error");
  (<any>authenticateRequest).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(triggerMockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(triggerMockContext.res.status).toBe(500);
  expect(triggerMockContext.res.body).toBe(null);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});
