import mongoose from "mongoose";
import {
  IUserDataService,
  UserDataService,
} from "src/services/userDataService";
import crypto from "crypto";
import { User } from "src/schemas/user";

describe("tests UserDataService", () => {
  let userDataService: IUserDataService;
  const sampleUserAADObjId1 = "be36140g-9729-3024-8yg1-147bbi67g2c9";
  const sampleUserName1 = "Shayan Khalili";

  beforeAll(async () => {
    await mongoose.connect(<string>process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    userDataService = new UserDataService();
  });

  afterEach(async () => {
    await User.deleteOne({ _id: sampleUserAADObjId1 });
  });

  it("create new user", async () => {
    const data = await userDataService.getUserOrCreate(
      sampleUserAADObjId1,
      sampleUserName1
    );
    expect(data).toBeDefined();
    expect(data.userName).toEqual(sampleUserName1);
    expect(data.id).toEqual(sampleUserAADObjId1);
  });

  it("update existing user", async () => {
    await userDataService.getUserOrCreate(sampleUserAADObjId1, sampleUserName1);

    const randomString = crypto.randomBytes(36).toString("hex");
    const data = await userDataService.getUserOrCreate(
      sampleUserAADObjId1,
      randomString
    );
    expect(data).toBeDefined();
    expect(data.userName).toEqual(randomString);
    expect(data.id).toEqual(sampleUserAADObjId1);
  });
});
