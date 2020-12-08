import { signalRUtility } from "../../utils/signalRUtility";
import * as jsonwebtoken from "jsonwebtoken";
import axios from "axios";
import { hubName } from "../../constants/signalRConstants";
jest.mock("axios");

beforeEach(() => {
  process.env.AzureSignalRConnectionString =
    "Endpoint=https://test.service.signalr.net;AccessKey=HwYgbvXgrvfBQqvN7M5zEFGi23Iz4HhP+dKzWc95ya0=;Version=1.0;";
});

test("SignalR add to group API should not contain trailing slash and query parameters", () => {
  // SignalR accesstoken expects rest api as `aud` claim without trailing slash and query parameters.
  // https://github.com/Azure/azure-signalr/blob/dev/docs/rest-api.md#claims
  const testSignalRUtility = <any>signalRUtility;
  const signalRAddToGroupRestApi: string =
    testSignalRUtility._signalRAddToGroupRestApi;
  expect(signalRAddToGroupRestApi).toBeDefined();
  expect(signalRAddToGroupRestApi).toBe(
    "end_point/api/v1/hubs/hub_name/groups/group_name/connections/connection_id"
  );
  expect(
    signalRAddToGroupRestApi.charAt(signalRAddToGroupRestApi.length - 1)
  ).not.toBe("/");
  expect(signalRAddToGroupRestApi).not.toContain("?");
});

test("SignalR endPoint/accessKey parsed correctly", () => {
  const testSignalRUtility = <any>signalRUtility;
  const signalRAccessKey: string = testSignalRUtility._accessKey;
  expect(signalRAccessKey).toBeDefined();
  expect(signalRAccessKey).toBe("test=AccessKey=");

  const signalRendPoint: string = testSignalRUtility._endPoint;
  expect(signalRendPoint).toBeDefined();
  expect(signalRendPoint).toBe("https://test.service.signalr.net");
});

test("SignalR accessToken", () => {
  const testSignalRUtility = <any>signalRUtility;
  const testRestApi =
    "https://test.service.signalr.net//api/v1/hubs/hub_name/groups/group_name/connections/connection_id";
  const signalRAccessToken: string = testSignalRUtility._getSignalRAccessToken(
    testRestApi
  );
  expect(signalRAccessToken).toBeDefined();
  const decoded = jsonwebtoken.decode(signalRAccessToken);
  expect(decoded["aud"]).toBe(testRestApi);
  expect(typeof decoded["exp"]).toBe("number");
});

test("AddConnectionToGroup functionality", () => {
  axios.put = jest.fn();
  (<any>axios).put.mockImplementationOnce(() => {
    return true;
  });

  const testSignalRUtility = <any>signalRUtility;
  testSignalRUtility._getSignalRAccessToken = jest.fn();

  const testConnectionId = "testConnectionId";
  const testGroupName = "testGroupName";
  const testApi = `https://test.service.signalr.net/api/v1/hubs/${hubName}/groups/${testGroupName}/connections/${testConnectionId}`;
  testSignalRUtility.addConnectionToGroup(testConnectionId, testGroupName);
  expect(axios.put).toBeCalledTimes(1);
  expect(axios.put).toBeCalledWith(
    testApi,
    null,
    expect.objectContaining({
      headers: expect.objectContaining({
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: expect.stringContaining("Bearer "),
      }),
    })
  );
  expect(testSignalRUtility._getSignalRAccessToken).toBeCalledTimes(1);
  expect(testSignalRUtility._getSignalRAccessToken).toBeCalledWith(testApi);
});
