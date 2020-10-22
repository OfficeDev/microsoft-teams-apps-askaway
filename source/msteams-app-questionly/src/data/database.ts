import * as mongoose from 'mongoose';

import { getMongoURI } from 'src/util/keyvault';

/**
 * Initiates the connection to the CosmosDB database.
 */
export const initiateConnection = async () => {
    const mongoURI: string = await getMongoURI();

    await mongoose.connect(mongoURI, {
        useFindAndModify: false,
        useNewUrlParser: true,
    });
};

/**
 * Disconnects the connection to the CosmosDB database.
 */
export const disconnect = async (): Promise<void> => {
    await mongoose.disconnect();
};
