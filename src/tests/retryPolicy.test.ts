import { MongoError } from 'mongodb';
import {
    retryWrapper,
    DefaultRetryPolicy,
    ExponentialBackOff,
} from 'src/util/RetryPolicies';

test('default retry policy should retry 2 times', async () => {
    let triesRemaining = 2;
    const func = () =>
        new Promise((resolve) => {
            if (triesRemaining > 0) {
                triesRemaining -= 1;
                throw new MongoError({ code: 16500 });
            }
            resolve(true);
        });

    expect(await retryWrapper(func)).toBe(true);
});

test('default retry policy should exceed max retry count', async () => {
    let triesRemaining = 10;
    const func = () =>
        new Promise((resolve) => {
            if (triesRemaining > 0) {
                triesRemaining -= 1;
                throw new MongoError({ code: 16500 });
            }
            resolve(true);
        });

    try {
        await retryWrapper(func);
        fail();
    } catch (error) {
        expect(error.code).toBe(16500);
    }
});

test('default retry policy should exceed max wait time', async () => {
    let triesRemaining = 2;
    const _sleep = (ms) =>
        new Promise((resolve) => setTimeout(() => resolve(), ms));
    const func = async () => {
        await _sleep(1000);
        return new Promise((resolve) => {
            if (triesRemaining > 0) {
                triesRemaining -= 1;
                throw new MongoError({ code: 16500 });
            }
            resolve(true);
        });
    };

    try {
        await retryWrapper(func, new DefaultRetryPolicy(1000));
        fail();
    } catch (error) {
        expect(error.code).toBe(16500);
    }
});

test('exponential retry policy retryAfterMs should increase exponentially', async () => {
    let triesRemaining = 4;
    let timePrevFuncExecuted: any = null;
    let timeDiffBetweenFuncCalls: any = null;
    const func = async () => {
        if (timePrevFuncExecuted) {
            if (timeDiffBetweenFuncCalls !== null)
                expect(
                    Date.now() - timePrevFuncExecuted >
                        timeDiffBetweenFuncCalls * 2
                );
            timeDiffBetweenFuncCalls = Date.now() - timePrevFuncExecuted;
        }
        timePrevFuncExecuted = Date.now();
        return new Promise((resolve) => {
            if (triesRemaining > 0) {
                triesRemaining -= 1;
                throw new MongoError({ code: 16500 });
            }
            resolve(true);
        });
    };

    await retryWrapper(func, new ExponentialBackOff());
});
