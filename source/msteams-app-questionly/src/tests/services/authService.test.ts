import {
    getBearerStrategy,
    getIdentityMetadata,
    getValidIssuers,
    getValidAudiance,
} from '../../services/authService';

describe('authentication options tests', () => {
    beforeEach(() => {
        process.env.AzureAd_ClientId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        process.env.AzureAd_ApplicationIdUri =
            'api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        process.env.AzureAd_Metadata_Endpoint =
            'https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration';
        process.env.AzureAd_ValidIssuers =
            'https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/';
        process.env.TenantId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    });

    test('validate authentication options', () => {
        const strategy = getBearerStrategy();
        expect(strategy).toBeDefined();
        expect(strategy.name).toEqual('oauth-bearer');
    });

    test('validate authentication options, azure ad client id is not set', () => {
        delete process.env.AzureAd_ClientId;
        expect(() => {
            getBearerStrategy();
        }).toThrow();
    });

    test('validate authentication options, azure ad application id url is not set', () => {
        delete process.env.AzureAd_ApplicationIdUri;
        expect(() => {
            getBearerStrategy();
        }).toThrow();
    });

    test('validate authentication options, azure ad metadata endpoint is not set', () => {
        delete process.env.AzureAd_Metadata_Endpoint;
        expect(() => {
            getBearerStrategy();
        }).toThrow();
    });

    test('validate authentication options, tenant id is not set', () => {
        delete process.env.TenantId;
        expect(() => {
            getBearerStrategy();
        }).toThrow();
    });
});

describe('identity metadata url tests', () => {
    test('get identity metadata url', () => {
        process.env.TenantId = 'testTenant';
        process.env.AzureAd_Metadata_Endpoint =
            'https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration';

        // Make sure tenant id is replaced in url properly.
        expect(getIdentityMetadata()).toEqual(
            'https://login.microsoftonline.com/testTenant/v2.0/.well-known/openid-configuration'
        );
    });

    test('get identity metadata url, spaces trimmed', () => {
        process.env.TenantId = ' testTenant ';
        process.env.AzureAd_Metadata_Endpoint =
            '  https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration  ';

        // Make sure tenant id is replaced in url properly.
        expect(getIdentityMetadata()).toEqual(
            'https://login.microsoftonline.com/testTenant/v2.0/.well-known/openid-configuration'
        );
    });

    test('get identity metadata url, tenant id is missing', () => {
        delete process.env.TenantId;
        process.env.AzureAd_Metadata_Endpoint =
            'https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration';

        expect(() => {
            getIdentityMetadata();
        }).toThrow();
    });

    test('get identity metadata url, meta data endpoint is missing', () => {
        process.env.TenantId = 'testTenant';
        delete process.env.AzureAd_Metadata_Endpoint;

        expect(() => {
            getIdentityMetadata();
        }).toThrow();
    });
});

describe('valid issuers tests', () => {
    test('get valid issuers', () => {
        process.env.TenantId = 'testTenant';
        process.env.AzureAd_ValidIssuers =
            'https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/';

        const validIssuers: string[] = getValidIssuers();
        expect(validIssuers.length).toEqual(2);
        expect(validIssuers).toContain(
            'https://login.microsoftonline.com/testTenant/v2.0'
        );
        expect(validIssuers).toContain('https://sts.windows.net/testTenant/');
    });

    test('get valid issuers, spaces trimmed', () => {
        process.env.TenantId = ' testTenant  ';
        process.env.AzureAd_ValidIssuers =
            'https://login.microsoftonline.com/TENANT_ID/v2.0 ,  https://sts.windows.net/TENANT_ID/';

        const validIssuers: string[] = getValidIssuers();
        expect(validIssuers.length).toEqual(2);
        expect(validIssuers).toContain(
            'https://login.microsoftonline.com/testTenant/v2.0'
        );
        expect(validIssuers).toContain('https://sts.windows.net/testTenant/');
    });

    test('get valid issuers, valid issuer is missing', () => {
        process.env.TenantId = 'testTenant';
        delete process.env.AzureAd_ValidIssuers;

        expect(() => {
            getIdentityMetadata();
        }).toThrow();
    });

    test('get valid issuers, tenant id is missing', () => {
        delete process.env.TenantId;
        process.env.AzureAd_ValidIssuers =
            'https://login.microsoftonline.com/TENANT_ID/v2.0,https://sts.windows.net/TENANT_ID/';

        expect(() => {
            getIdentityMetadata();
        }).toThrow();
    });
});

describe('azure ad valid audiance tests', () => {
    test('get azure ad valid audiance', () => {
        process.env.AzureAd_ClientId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        process.env.AzureAd_ApplicationIdUri =
            'api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

        const validAudiance: string[] = getValidAudiance();
        expect(validAudiance.length).toEqual(2);
        expect(validAudiance).toContain(process.env.AzureAd_ClientId);
        expect(validAudiance).toContain(process.env.AzureAd_ApplicationIdUri);
    });

    test('get azure ad valid audiance, spaces trimmed', () => {
        process.env.AzureAd_ClientId =
            ' aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ';
        process.env.AzureAd_ApplicationIdUri =
            '  api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ';

        const validAudiance: string[] = getValidAudiance();
        expect(validAudiance.length).toEqual(2);
        expect(validAudiance).toContain('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
        expect(validAudiance).toContain(
            'api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        );
    });

    test('get azure ad valid audiance, azure ad client id is missing', () => {
        delete process.env.AzureAd_ClientId;
        process.env.AzureAd_ApplicationIdUri =
            'api://example.com/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

        expect(() => {
            getValidAudiance();
        }).toThrow();
    });

    test('get azure ad valid audiance, application id url is missing', () => {
        process.env.AzureAd_ClientId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        delete process.env.AzureAd_ApplicationIdUri;

        expect(() => {
            getIdentityMetadata();
        }).toThrow();
    });
});
