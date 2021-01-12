import {
    deserializationPolicy,
    exponentialRetryPolicy,
    systemErrorRetryPolicy,
    throttlingRetryPolicy,
    signingPolicy,
    userAgentPolicy,
    RequestPolicyFactory,
    generateClientRequestIdPolicy,
    getDefaultProxySettings,
    proxyPolicy,
    redirectPolicy,
} from '@azure/ms-rest-js';

import { getDefaultUserAgentValue, getDefaultUserAgentHeaderName } from '@azure/ms-rest-js/es/lib/policies/userAgentPolicy';

import { rpRegistrationPolicy } from '@azure/ms-rest-js/es/lib/policies/rpRegistrationPolicy';

/**
 * Sets up Request Policy factories to override Bot SDK's connector client using this example: https://github.com/microsoft/botbuilder-js/issues/2054#issuecomment-622194749.
 * Note that all the default policy factories from ms-rest-js must be added. They can be found here: https://github.com/Azure/ms-rest-js/blob/1.x/lib/serviceClient.ts.
 * As of 2020-07-22, the Bot SDK consumes \@azure/ms-rest-js v1.8.15, and so this application must also consume the same version.
 */
export const requestPolicyHelper = (credentials, options): RequestPolicyFactory[] => {
    const factories: RequestPolicyFactory[] = [];
    if (options === undefined) {
        options = [];
    }

    if (options.generateClientRequestIdHeader) {
        factories.push(generateClientRequestIdPolicy(options.clientRequestIdHeaderName));
    }
    if (credentials) {
        factories.push(signingPolicy(credentials));
    }

    const userAgentHeaderName = getValueOrFunctionResult(options.userAgentHeaderName, getDefaultUserAgentHeaderName);
    const userAgentHeaderValue = getValueOrFunctionResult(options.userAgent, getDefaultUserAgentValue);
    if (userAgentHeaderName && userAgentHeaderValue) {
        factories.push(
            userAgentPolicy({
                key: userAgentHeaderName,
                value: userAgentHeaderValue,
            })
        );
    }

    factories.push(redirectPolicy());
    factories.push(rpRegistrationPolicy());

    //retryCount, retryInterval, minRetryInterval, maxRetryInterval
    factories.push(exponentialRetryPolicy(options.retryCount, options.retryInterval, options.minRetryInterval, options.maxRetryInterval));

    factories.push(systemErrorRetryPolicy());
    factories.push(throttlingRetryPolicy());

    factories.push(deserializationPolicy(options.deserializationContentTypes));

    const proxySettings = options.proxySettings || getDefaultProxySettings();
    if (proxySettings) {
        factories.push(proxyPolicy(proxySettings));
    }

    return factories;
};

// This function was pulled from: https://github.com/Azure/ms-rest-js/blob/29a4112e398bc0ed912213515fe4f9ecdc278a0d/lib/serviceClient.ts#L383
function getValueOrFunctionResult(value: undefined | string | ((defaultValue: string) => string), defaultValueCreator: () => string): string {
    let result: string;
    if (typeof value === 'string') {
        result = value;
    } else {
        result = defaultValueCreator();
        if (typeof value === 'function') {
            result = value(result);
        }
    }
    return result;
}
