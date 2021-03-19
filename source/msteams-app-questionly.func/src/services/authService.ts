// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

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
 * Fetches tenant id of user tenant from app settings.
 * @returns - AzureAd user tenant id.
 */
const getUserTenantId = (): string => {
  if (process.env.TenantId === undefined) {
    throw new Error(errorStrings.TenantIdMissingError);
  }

  return process.env.TenantId.toString().trim();
};

/**
 * Fetches tenant id of subscription tenant from app settings.
 * @returns - AzureAd subscription tenant id.
 */
const getSubscriptionTenantId = (): string => {
  if (process.env.SubscriptionTenantId === undefined) {
    throw new Error(errorStrings.TenantIdMissingError);
  }

  return process.env.SubscriptionTenantId.toString().trim();
};

/**
 * Fetches Azure AD valid issuers from app settings.
 * @param forUserTenant - boolean stating if valid issuer is for user tenant. False meaning issuers for subscription tenant.
 * @returns - Azure AD valid issuers list.
 */
export const getValidIssuers = (forUserTenant: boolean): string[] => {
  if (process.env.AzureAd_ValidIssuers === undefined) {
    throw new Error(errorStrings.AzureAdValidIssuersMissingError);
  }

  let validIssuers: string[] = [];

  const validIssuerFromSettings: string[] = process.env.AzureAd_ValidIssuers?.toString().split(
    ","
  );

  const tenantId = forUserTenant
    ? getUserTenantId()
    : getSubscriptionTenantId();

  validIssuers = validIssuerFromSettings.map((issuer) => {
    return issuer.replace("TENANT_ID", tenantId).trim();
  });

  return validIssuers;
};

/**
 * Constructs verify options for Azure ad token.
 * @param forUserTenant - boolean stating if verify options are for user tenant. False meaning options for subscription tenant.
 */
const getVerifyOptions = (forUserTenant: boolean): VerifyOptions => {
  if (process.env.AzureAd_ApplicationIdUri === undefined) {
    throw new Error(errorStrings.AzureAdApplicationIdUriMissingError);
  }

  if (process.env.AzureAd_ClientId === undefined) {
    throw new Error(errorStrings.AzureAdClientIdMissingError);
  }

  const options: VerifyOptions = {
    issuer: getValidIssuers(forUserTenant),
    audience: [
      process.env.AzureAd_ApplicationIdUri.toString().trim(),
      process.env.AzureAd_ClientId.toString().trim(),
    ],
  };

  return options;
};

/**
 * Verifies azure ad token from http request and append userId to the request.
 * @param context - azure function context.
 * @param req - http request.
 * @param forUserTenant - boolean stating if request should be authenticated for user tenant. False meaning authentication for subscription tenant..
 * @returns - boolean value, true if token is valid.
 * @throws - error while forming verify options.
 */
export const authenticateRequest = async (
  context: Context,
  req: HttpRequest,
  forUserTenant: boolean
): Promise<Boolean> => {
  let token = req.headers[authorizationHeaderConstant];

  if (!token) {
    return false;
  }

  token = token.replace("Bearer", "").trim();
  const options = getVerifyOptions(forUserTenant);

  try {
    const decoded = await verifyAzureToken(token, options);
    req[userIdParameterConstant] = decoded[aadObjectIdParameterConstant];
  } catch (error) {
    context.log.error(error);

    return false;
  }

  return true;
};
