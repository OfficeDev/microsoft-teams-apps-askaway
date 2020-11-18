import { Context, HttpRequest } from "@azure/functions";
import { verifyAzureToken } from "azure-ad-jwt-lite";
import { VerifyOptions } from "jsonwebtoken";
import {
  aadObjectIdParameterConstant,
  authorizationHeaderConstant,
  userIdParameterConstant,
} from "../constants/requestConstants";

/**
 * Fetches tenant id from app settings.
 * @returns - AzureAd tenant id.
 */
const getTenantId = (): string => {
  if (process.env.TenantId === undefined) {
    throw new Error("Tenant id is missing in the settings.");
  }

  return process.env.TenantId.toString().trim();
};

/**
 * Fetches Azure AD valid issuers from app settings.
 * @returns - Azure AD valid issuers list.
 */
export const getValidIssuers = (): string[] => {
  if (process.env.AzureAd_ValidIssuers === undefined) {
    throw new Error("AzureAd ValidIssuers is missing in the settings.");
  }

  let validIssuers: string[] = [];

  const validIssuerFromSettings: string[] = process.env.AzureAd_ValidIssuers?.toString().split(
    ","
  );

  const tenantId: string = getTenantId();

  validIssuers = validIssuerFromSettings.map((issuer) => {
    return issuer.replace("TENANT_ID", tenantId).trim();
  });

  return validIssuers;
};

/**
 * Constructs verify options for Azure ad token.
 */
const getVerifyOptions = (): VerifyOptions => {
  if (process.env.AzureAd_ApplicationIdUri === undefined) {
    throw new Error("AzureAd ApplicationIdUri is missing in the settings.");
  }

  const options: VerifyOptions = {
    issuer: getValidIssuers(),
    audience: process.env.AzureAd_ApplicationIdUri.toString().trim(),
  };

  return options;
};

/**
 * Verifies azure ad token from http request and append userId to the request.
 * @param context: azure function context.
 * @param req: http request.
 * @returns - boolean value, true if token is valid.
 * @throws - error while forming verify options.
 */
export const authenticateRequest = async (
  context: Context,
  req: HttpRequest
): Promise<Boolean> => {
  const token: string = req.headers[authorizationHeaderConstant];

  if (token === null || token === undefined) {
    return false;
  }

  const options: VerifyOptions = getVerifyOptions();

  try {
    const decoded = await verifyAzureToken(token, options);
    req[userIdParameterConstant] = decoded[aadObjectIdParameterConstant];
  } catch (error) {
    context.log.error(error);

    return false;
  }

  return true;
};
