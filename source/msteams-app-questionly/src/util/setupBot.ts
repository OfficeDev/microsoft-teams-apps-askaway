import * as jimp from 'jimp';
import * as jwt from 'jsonwebtoken';
import { ActivityHandler, BotFrameworkAdapter } from 'botbuilder';
import { ConnectorClient } from 'botframework-connector';
import { join } from 'path';
import { Express as ExpressType } from 'express-serve-static-core';

import { AskAway } from 'src/askAway';
import { exceptionLogger } from 'src/util/exceptionTracking';
import { generateInitialsImage } from 'src/controller';
import { getAvatarKey, getMicrosoftAppPassword } from 'src/util/keyvault';
import { requestPolicyHelper } from 'src/util/requestPolicyHelper';
import { USER_AGENT } from 'botbuilder/lib/botFrameworkAdapter';
import { ifNumber } from 'src/util/typeUtility';
import { IConversationDataService } from 'msteams-app-questionly.data';

interface AvatarRequest {
    initials: string;
    index: number;
}

const setupBotAdapterAndRouting = async (app: ExpressType, conversationDataService: IConversationDataService) => {
    const bot: ActivityHandler = new AskAway(conversationDataService);
    const adapter = new BotFrameworkAdapter({
        appId: process.env.MicrosoftAppId,
        appPassword: await getMicrosoftAppPassword(),
    });

    adapter.onTurnError = async (context, error) => {
        exceptionLogger(error);
    };

    app.post('/api/messages', (req: any, res: any) => {
        adapter.processActivity(
            req,
            res,
            async (turnContext): Promise<any> => {
                try {
                    await bot.run(turnContext);
                } catch (err) {
                    adapter.onTurnError(turnContext, err);
                }
            }
        );
    });
};

const setupConnectorClient = () => {
    // Override ConnecterClient to update ExponentialRetryPolicy configuration
    (<any>BotFrameworkAdapter.prototype).createConnectorClientInternal = (serviceUrl, credentials) => {
        const retryAfterMs = ifNumber(process.env.ExponentialRetryAfterMs, 500);
        const factories = requestPolicyHelper(credentials, {
            retryCount: ifNumber(process.env.DefaultMaxRetryCount, 5),
            retryInterval: retryAfterMs,
            minRetryInterval: retryAfterMs * 0.5,
            maxRetryInterval: retryAfterMs * 10,
        });
        return new ConnectorClient(credentials, {
            baseUri: serviceUrl,
            userAgent: USER_AGENT,
            requestPolicyFactories: <any>factories,
        });
    };
};

const setupAvtarKeyEndpoint = (app: ExpressType) => {
    app.get('/avatar/:token', async (req, res) => {
        const token = req.params.token;
        // if (token == null) return res.sendStatus(401);

        const avatarKey = await getAvatarKey();

        if (!avatarKey) return res.sendFile(join(__dirname, 'public/images/anon_avatar.png'));
        jwt.verify(token, Buffer.from(avatarKey, 'utf8').toString('hex'), (err, data: AvatarRequest) => {
            if (err) return res.sendFile(join(__dirname, 'public/images/anon_avatar.png'));
            generateInitialsImage(data.initials, data.index).then((image) => {
                image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
                    res.set('Content-Type', jimp.MIME_PNG);
                    return res.send(buffer);
                });
            });
        });
    });
};

export const setupBot = async (app: ExpressType, conversationDataService: IConversationDataService) => {
    setupConnectorClient();
    await setupBotAdapterAndRouting(app, conversationDataService);
    setupAvtarKeyEndpoint(app);
};
