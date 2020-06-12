import * as mongoose from 'mongoose';

export const initiateConnection = () => {
    const mongoURI =
        'mongodb://localhost:C2y6yDjf5%2FR%2Bob0N8A7Cgv30VRDJIWEHLM%2B4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw%2FJw%3D%3D@localhost:10255/admin?ssl=true';
    mongoose
        .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connection to CosmosDB successful'))
        .catch((error) => console.error(error));
};
