import { createQuestion, getUserOrCreate } from '../Data/Database';
import * as mongoose from 'mongoose';

const sampleUserAADObjId = 'be36140g-9729-3024-8yg1-147bbi67g2c9';
const sampleUserName = 'Sample Name';
const sampleQuestionContent = 'Sample Question?';
const sampleAmaTeamsSessionId = '5ee25f76c7e152311cf94d99';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

test('create new user', async () => {
    return await getUserOrCreate(sampleUserAADObjId, sampleUserName).then(
        (data) => {
            expect(data).toBe(true);
        }
    );
});

test('update existing user', async () => {
    const randomString = Math.random().toString(36);
    return await getUserOrCreate(sampleUserAADObjId, randomString).then(
        (data) => {
            expect(data).toBe(true);
        }
    );
});

test('new question with existing user', async () => {
    return await createQuestion(
        sampleAmaTeamsSessionId,
        sampleUserAADObjId,
        sampleUserName,
        sampleQuestionContent
    ).then((data) => {
        expect(data).toEqual(true);
    });
});

test('new question with new user', async () => {
    const randomString = Math.random().toString(36);
    return await createQuestion(
        sampleAmaTeamsSessionId,
        randomString,
        'Earnest Cream', //using same name and question because only checks AADObjId
        sampleQuestionContent
    ).then((data) => {
        expect(data).toEqual(true);
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});
