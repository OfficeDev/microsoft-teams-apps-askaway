import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import * as microsoftTeams from '@microsoft/teams-js';
// tslint:disable-next-line:no-relative-imports
import { getBaseUrl } from './ConfigVariables';
import {
    ApplicationInsights,
    SeverityLevel,
} from '@microsoft/applicationinsights-web';
export class HttpService {
    private appInsights: ApplicationInsights;

    /**
     * Constructor that initializes app insights.
     * @param appInsights - instance of application insights
     */
    constructor(appInsights: ApplicationInsights) {
        this.appInsights = appInsights;
    }

    /**
     * Get Method
     * @param url - `url` is the server URL that will be used for the request
     * @param handleError - handles the failure case
     * @param needAuthorizationHeader - to set the token in the header if it is required
     * @param config - `config` is the config that was provided to `axios` for the request
     */
    public async get<T = any, R = AxiosResponse<T>>(
        url: string,
        handleError = true,
        needAuthorizationHeader = true,
        config?: AxiosRequestConfig
    ): Promise<R> {
        try {
            if (needAuthorizationHeader) {
                config = await this.setupAuthorizationHeader(config);
            }
            return await axios.get(getBaseUrl() + url, config);
        } catch (error) {
            if (handleError) {
                this.handleError(error);
                throw error;
            } else {
                throw error;
            }
        }
    }

    /**
     * Delete Method
     * @param url - `url` is the server URL that will be used for the request
     * @param handleError - handles the failure case
     * @param config -`config` is the config that was provided to `axios` for the request
     */
    public async delete<T = any, R = AxiosResponse<T>>(
        url: string,
        handleError = true,
        config?: AxiosRequestConfig
    ): Promise<R> {
        try {
            config = await this.setupAuthorizationHeader(config);
            return await axios.delete(getBaseUrl() + url, config);
        } catch (error) {
            if (handleError) {
                this.handleError(error);
                throw error;
            } else {
                throw error;
            }
        }
    }

    /**
     * Post Method
     * @param url - `url` is the server URL that will be used for the request
     * @param data -`data` is the data to be sent as the request body. Only applicable for request methods 'PUT', 'POST', and 'PATCH'
     * @param handleError - handles the failure case
     * @param config - `config` is the config that was provided to `axios` for the request
     */
    public async post<T = any, R = AxiosResponse<T>>(
        url: string,
        data?: any,
        handleError = true,
        config?: AxiosRequestConfig
    ): Promise<R> {
        try {
            config = await this.setupAuthorizationHeader(config);
            return await axios.post(getBaseUrl() + url, data, config);
        } catch (error) {
            if (handleError) {
                this.handleError(error);
                throw error;
            } else {
                throw error;
            }
        }
    }

    /**
     * Put Method
     * @param url - `url` is the server URL that will be used for the request
     * @param data - `data` is the data to be sent as the request body. Only applicable for request methods 'PUT', 'POST', and 'PATCH'
     * @param handleError - handles the failure case
     * @param config - `config` is the config that was provided to `axios` for the request
     */
    public async put<T = any, R = AxiosResponse<T>>(
        url: string,
        data?: any,
        handleError = true,
        config?: AxiosRequestConfig
    ): Promise<R> {
        try {
            config = await this.setupAuthorizationHeader(config);
            return await axios.put(getBaseUrl() + url, data, config);
        } catch (error) {
            if (handleError) {
                this.handleError(error);
                throw error;
            } else {
                throw error;
            }
        }
    }

    /**
     * Patch Method
     * @param url - `url` is the server URL that will be used for the request
     * @param data - `data` is the data to be sent as the request body. Only applicable for request methods 'PUT', 'POST', and 'PATCH'
     * @param handleError - handles the failure case
     * @param config - `config` is the config that was provided to `axios` for the request
     */
    public async patch<T = any, R = AxiosResponse<T>>(
        url: string,
        data?: any,
        handleError = true,
        config?: AxiosRequestConfig
    ): Promise<R> {
        try {
            config = await this.setupAuthorizationHeader(config);
            return await axios.patch(getBaseUrl() + url, data, config);
        } catch (error) {
            if (handleError) {
                this.handleError(error);
                throw error;
            } else {
                throw error;
            }
        }
    }

    /**
     * Returns auth token.
     */
    public async getAuthToken(): Promise<string> {
        microsoftTeams.initialize();

        return new Promise<string>((resolve, reject) => {
            const authTokenRequest = {
                successCallback: (token: string) => {
                    resolve(token);
                },
                failureCallback: (error: string) => {
                    // When the getAuthToken function returns a "resourceRequiresConsent" error,
                    // it means Azure AD needs the user's consent before issuing a token to the app.
                    // The following code redirects the user to the "Sign in" page where the user can grant the consent.
                    // Right now, the app redirects to the consent page for any error.
                    console.error('Error from getAuthToken: ', error);
                    // window.location.href = `/signin?locale=${i18n.language}`;
                    reject(error);
                },
                resources: [],
            };
            microsoftTeams.authentication.getAuthToken(authTokenRequest);
        });
    }

    /**
     * Handle Error case
     * @param error
     */
    public handleError(error: any): void {
        this.appInsights.trackException({
            exception: error,
            severityLevel: SeverityLevel.Error,
        });
        if (error.hasOwnProperty('response')) {
            /* if (errorStatus === 403) {
                window.location.href = `/errorpage/403?locale=${i18n.language}`;
            } else if (errorStatus === 401) {
                window.location.href = `/errorpage/401?locale=${i18n.language}`;
            } else {
                window.location.href = `/errorpage?locale=${i18n.language}`;
            } */
        } else {
            // window.location.href = `/errorpage?locale=${i18n.language}`;
        }
    }

    /**
     * Set token in the header
     * @param config
     */
    private async setupAuthorizationHeader(
        config?: AxiosRequestConfig
    ): Promise<AxiosRequestConfig> {
        const authToken = await this.getAuthToken();
        if (!config) {
            config = axios.defaults;
        }

        config.headers['Authorization'] = `Bearer ${authToken}`;
        return config;
    }
}
