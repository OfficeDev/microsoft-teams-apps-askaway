import { Context, HttpRequest } from "@azure/functions";
import { verifyAzureToken } from "azure-ad-jwt-lite";
import { VerifyOptions } from "jsonwebtoken";
import { errorStrings } from "../constants/errorStrings";
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
    throw new Error(errorStrings.TenantIdMissingError);
  }

  return process.env.TenantId.toString().trim();
};

/**
 * Fetches Azure AD valid issuers from app settings.
 * @returns - Azure AD valid issuers list.
 */
export const getValidIssuers = (): string[] => {
  if (process.env.AzureAd_ValidIssuers === undefined) {
    throw new Error(errorStrings.AzureAdValidIssuersMissingError);
  }

  let validIssuers: string[] = [];

  const validIssuerFromSettings: string[] = process.env.AzureAd_ValidIssuers?.toString().split(
    ","
  );

  const tenantId = getTenantId();

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
    throw new Error(errorStrings.AzureAdApplicationIdUriMissingError);
  }

  if (process.env.AzureAd_ClientId === undefined) {
    throw new Error(errorStrings.AzureAdClientIdMissingError);
  }

  const options: VerifyOptions = {
    issuer: getValidIssuers(),
    audience: [
      process.env.AzureAd_ApplicationIdUri.toString().trim(),
      process.env.AzureAd_ClientId.toString().trim(),
    ],
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
  let token = req.headers[authorizationHeaderConstant];

  if (!token) {
    return false;
  }

  token = token.replace("Bearer", "").trim();
  const options = getVerifyOptions();

  try {
    const decoded = await verifyAzureToken(token, options);
    req[userIdParameterConstant] = decoded[aadObjectIdParameterConstant];
  } catch (error) {
    context.log.error(error);

    return false;
  }

  return true;
};
