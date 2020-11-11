import * as mongoose from "mongoose";

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - mongo db connection string.
 */
export const initiateConnection = async (mongoURI: string) => {
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
