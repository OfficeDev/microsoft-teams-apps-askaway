import httpTrigger from "../../../negotiate/index";
import { mockContext } from "./../mocks/testContext";
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

  await httpTrigger(mockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(mockContext.res.status).toBe(200);
  expect(mockContext.res.json).toBeCalledTimes(1);
  expect(mockContext.res.json).toBeCalledWith(connectionInfo);
});

test("tests negotiate function for authorization error", async () => {
  (<any>authenticateRequest).mockImplementationOnce(() => {
    return false;
  });

  await httpTrigger(mockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(mockContext.res.status).toBe(401);
  expect(mockContext.res.body).toBe("Unauthorized");
});

test("tests negotiate function for internal server error", async () => {
  const testError: Error = new Error("test error");
  (<any>authenticateRequest).mockImplementationOnce(() => {
    throw testError;
  });

  await httpTrigger(mockContext, request, connectionInfo);

  expect(authenticateRequest).toBeCalledTimes(1);
  expect(mockContext.res.status).toBe(500);
  expect(mockContext.res.body).toBe(null);
  expect(mockContext.log.error).toBeCalledTimes(1);
  expect(mockContext.log.error).toBeCalledWith(testError);
});
