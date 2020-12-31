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
  private _connectionStringPropertySeparator = ";";
  private _connectionStringKeyValueSeparator = "=";
  private _endpointProperty = "endpoint";
  private _accessKeyProperty = "accesskey";
  private _signalRAddToGroupRestApi =
    "end_point/api/v1/hubs/hub_name/groups/group_name/connections/connection_id";

  /**
   * The constructor
   */
  constructor() {
    this._parseConnectionString();
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
    const restApi = this._signalRAddToGroupRestApi
      .replace("end_point", this._endPoint)
      .replace("hub_name", hubName)
      .replace("group_name", groupName)
      .replace("connection_id", connectionId);

    const config: AxiosRequestConfig = axios.defaults;
    config.headers["Accept"] = "application/json";
    config.headers["Content-Type"] = "application/json";
    const accessToken = this._getSignalRAccessToken(restApi);
    config.headers["Authorization"] = `Bearer ${accessToken}`;

    await axios.put(restApi, null, config);
  };

  /**
   * Returns signalR access token.
   * @param restApi: signalR rest api.
   * @returns - SignalR access token.
   */
  private _getSignalRAccessToken = (restApi: string): string => {
    const exp = moment(new Date()).add(5, "minute").valueOf() / 1000;

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
    const signalRConnectionStringProperties = signalRConnectionString.split(
      this._connectionStringPropertySeparator
    );

    signalRConnectionStringProperties.forEach((property) => {
      const keyValuePair = property.split(
        this._connectionStringKeyValueSeparator
      );
      const key = keyValuePair[0];

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

export const signalRUtility = new SignalRUtility();
