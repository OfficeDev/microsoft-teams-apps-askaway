import mongoose, { Mongoose } from "mongoose";

/**
 * Initiates the connection to the CosmosDB database.
 * @param mongoURI - mongo db connection string.
 * @returns - pseudo-promise wrapper around `mongoose`.
 */
export const initiateConnection = async (
  mongoURI: string
): Promise<Mongoose> => {
  return await mongoose.connect(mongoURI, {
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
