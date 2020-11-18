import { authenticateRequest } from "../../services/authService";
import { triggerMockContext } from "./../mocks/testContext";
import { HttpRequest } from "@azure/functions";
import {
  authorizationHeaderConstant,
  aadObjectIdParameterConstant,
  userIdParameterConstant,
} from "../../constants/requestConstants";
import { verifyAzureToken } from "azure-ad-jwt-lite";
jest.mock("azure-ad-jwt-lite");

const mockRequest: HttpRequest = {
  headers: { authorizationHeaderConstant: "testToken" },
  url: null,
  query: null,
  params: null,
  method: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AzureAd_ApplicationIdUri =
    "api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  process.env.AzureAd_ValidIssuers =
    "https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/";
  process.env.TenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  mockRequest.headers[authorizationHeaderConstant] = "test";
});

test("tests authenticateRequest", async () => {
  const testUserId: string = "testUserId";
  (<any>verifyAzureToken).mockImplementationOnce(() => {
    var decoded = {};
    decoded[aadObjectIdParameterConstant] = testUserId;
    return decoded;
  });

  var result = await authenticateRequest(triggerMockContext, mockRequest);
  expect(result).toBe(true);
  expect(mockRequest[userIdParameterConstant]).toBe(testUserId);
});

test("tests authenticateRequest to throw error/ invalid token", async () => {
  const testError: Error = new Error("testError");
  (<any>verifyAzureToken).mockImplementationOnce(() => {
    throw testError;
  });

  var result = await authenticateRequest(triggerMockContext, mockRequest);
  expect(result).toBe(false);
  expect(triggerMockContext.log.error).toBeCalledTimes(1);
  expect(triggerMockContext.log.error).toBeCalledWith(testError);
});

test("tests authenticateRequest for missing bearer token", async () => {
  mockRequest.headers = {};
  var result = await authenticateRequest(triggerMockContext, mockRequest);
  expect(result).toBe(false);
});

test("tests authenticateRequest for missing tenant id", async () => {
  delete process.env.TenantId;
  await expect(
    authenticateRequest(triggerMockContext, mockRequest)
  ).rejects.toThrow("Tenant id is missing in the settings.");
});

test("tests authenticateRequest for missing AzureAd valid issuers", async () => {
  delete process.env.AzureAd_ValidIssuers;
  await expect(
    authenticateRequest(triggerMockContext, mockRequest)
  ).rejects.toThrow("AzureAd ValidIssuers is missing in the settings.");
});

test("tests authenticateRequest for missing AzureAd applicationIdUri", async () => {
  delete process.env.AzureAd_ApplicationIdUri;
  await expect(
    authenticateRequest(triggerMockContext, mockRequest)
  ).rejects.toThrow("AzureAd ApplicationIdUri is missing in the settings.");
});
