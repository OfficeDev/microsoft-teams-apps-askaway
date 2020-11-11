import moment = require("moment");
import * as jsonwebtoken from "jsonwebtoken";
import axios, { AxiosRequestConfig } from "axios";
import { hubName } from "../constants/signalRConstants";

/**
 * SignalR utility class
 */
class SignalRUtility {
  private _accessKey: string;
  private _endPoint: string;
  private _connectionStringPropertySeparator: string = ";";
  private _connectionStringKeyValueSeparator: string = "=";
  private _endpointProperty: string = "endpoint";
  private _accessKeyProperty: string = "accesskey";
  private _signalRAddToGroupRestApi: string =
    "end_point/api/v1/hubs/hub_name/groups/group_name/connections/connection_id";

  /**
   * The constructor
   * @param signalRConnectionString - only required for UTs, signalR connectionstring
   */
  constructor(signalRConnectionString?: string) {
    this._parseConnectionString(signalRConnectionString);
  }

  /**
   * Adds signalR connection to the group.
   * @param connectionId: signalR connection id.
   * @param groupName: group name.
   * @throws - error thrown by signalR rest Api.
   */
  public addConnectionToGroup = async (
    connectionId: string,
    groupName: string
  ): Promise<void> => {
    const restApi: string = this._signalRAddToGroupRestApi
      .replace("end_point", this._endPoint)
      .replace("hub_name", hubName)
      .replace("group_name", groupName)
      .replace("connection_id", connectionId);

    const config: AxiosRequestConfig = axios.defaults;
    config.headers["Accept"] = "application/json";
    config.headers["Content-Type"] = "application/json";
    const accessToken: string = this._getSignalRAccessToken(restApi);
    config.headers["Authorization"] = `Bearer ${accessToken}`;

    await axios.put(restApi, null, config);
  };

  /**
   * Returns signalR access token.
   * @param restApi: signalR rest api.
   * @returns - SignalR access token.
   */
  private _getSignalRAccessToken = (restApi: string): string => {
    const exp: number = moment(new Date()).add(5, "minute").valueOf() / 1000;

    var payload: object = {
      aud: restApi,
      exp: exp,
    };

    var option: jsonwebtoken.SignOptions = {
      algorithm: "HS256",
    };

    return jsonwebtoken.sign(payload, this._accessKey, option);
  };

  /**
   * Parses signalR connection string to extract access token and endpoint.
   * @param signalRConnectionString - only required for UTs, signalR connectionstring
   */
  private _parseConnectionString = (signalRConnectionString?: string): void => {
    signalRConnectionString =
      signalRConnectionString ??
      process.env.AzureSignalRConnectionString.toString();
    const signalRConnectionStringProperties: string[] = signalRConnectionString.split(
      this._connectionStringPropertySeparator
    );

    signalRConnectionStringProperties.forEach((property) => {
      const keyValuePair: string[] = property.split(
        this._connectionStringKeyValueSeparator
      );
      const key: string = keyValuePair[0];

      if (key.toLowerCase() === this._endpointProperty.toLowerCase()) {
        // Value may contain "=", we don't want to split value further.
        this._endPoint = keyValuePair
          .slice(1)
          .join(this._connectionStringKeyValueSeparator);
      } else if (key.toLowerCase() === this._accessKeyProperty.toLowerCase()) {
        this._accessKey = keyValuePair
          .slice(1)
          .join(this._connectionStringKeyValueSeparator);
      }
    });
  };
}

// This function sets test signalR connection string for UTs.
const getSignalRUtilityInstance = () => {
  if (process.env.debugMode === "true") {
    return new SignalRUtility(
      "Endpoint=https://test.service.signalr.net;AccessKey=test=AccessKey=;Version=1.0;"
    );
  }

  return new SignalRUtility();
};

export const signalRUtility = getSignalRUtilityInstance();