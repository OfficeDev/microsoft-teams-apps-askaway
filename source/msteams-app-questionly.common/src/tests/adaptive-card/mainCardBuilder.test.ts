import { getMainCard } from "src/adaptive-card/mainCardBuilder";
import { initLocalization, mainCardStrings } from "src/localization/locale";
import { IQuestionPopulatedUser, IUser } from "msteams-app-questionly.data";
import { extractMainCardData } from "src/adaptive-card/mainCard";

describe("main card", () => {
  beforeAll(async () => {
    await initLocalization();
  });

  const sampleTitle = "title";
  const sampleDescription = "desc";
  const sampleUserName = "username";
  const sampleUserName2 = "username2";
  const sampleSessionId = "sessionid";
  const sampleUserAADObjId = "useraadobjid";
  const sampleHostUserId = "sampleHostUserId";
  const sampleEndedById = "sampleEndedById";
  const sampleEndedByName = "sampleEndedByName";
  const sampleEndedByUserId = "sampleEndedByUserId";

  test("get title and description", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId
    );
    const expected = [
      {
        type: "Container",
        bleed: true,
        items: [
          {
            type: "TextBlock",
            text: sampleTitle,
            wrap: true,
            weight: "bolder",
            size: "large",
            horizontalAlignment: "left",
          },
        ],
        wrap: true,
      },
      {
        type: "TextBlock",
        text: sampleDescription,
        wrap: true,
        spacing: "small",
        size: "medium",
      },
    ];

    const _result = [result.body[1], result.body[2]];
    expect(_result).toEqual(expected);
    return;
  });

  test("get top question container empty", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId
    );
    const expected = {
      type: "Container",
      spacing: "Large",
      items: [
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "stretch",
              items: [
                {
                  type: "TextBlock",
                  text: mainCardStrings("topQuestions"),
                  wrap: true,
                  size: "Medium",
                  weight: "Bolder",
                },
              ],
            },
            {
              type: "Column",
              width: "auto",
              items: [
                {
                  type: "TextBlock",
                  text: mainCardStrings("upvotes"),
                  wrap: true,
                  weight: "Lighter",
                },
              ],
            },
          ],
        },
        {
          type: "TextBlock",
          text: mainCardStrings("noQuestions"),
          color: "accent",
        },
      ],
      wrap: true,
    };

    const _result = result.body[3];
    expect(_result).toEqual(expected);
    return;
  });

  test("get top question container poulated", async () => {
    const sampleContent = "randomQuestion";
    const topQuestionsData: IQuestionPopulatedUser[] = [
      <IQuestionPopulatedUser>{
        qnaSessionId: "sessionId",
        userId: <IUser>{ _id: "userId", userName: sampleUserName },
        voters: ["userId1", "userId2"],
        content: sampleContent,
        dateTimeCreated: new Date(),
      },
    ];

    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      undefined,
      topQuestionsData
    );

    const resultMainCardEnded: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      true,
      topQuestionsData
    );

    const expected = [
      {
        type: "Column",
        width: "auto",
        items: [
          {
            type: "Image",
            style: "Person",
            size: "Small",
            url: "${userId.picture}",
          },
        ],
      },
      {
        type: "Column",
        width: "stretch",
        items: [
          {
            type: "TextBlock",
            text: sampleUserName,
            weight: "Bolder",
            size: "Small",
          },
          {
            type: "TextBlock",
            text: sampleContent,
            spacing: "None",
            wrap: true,
            maxLines: 3,
          },
        ],
      },
      {
        type: "Column",
        width: "30px",
        spacing: "extraLarge",
        items: [
          {
            type: "TextBlock",
            text: "2",
          },
        ],
        verticalContentAlignment: "Center",
      },
    ];

    const _result = result.body[3].items[1].items[0].columns;
    expect(_result[1].items).toEqual(expected[1].items);
    expect(_result[2].items).toEqual(expected[2].items);
    expect(_result[0].items[0].url).toBeTruthy();

    const _resultMainCardEnded =
      resultMainCardEnded.body[3].items[1].items[0].columns;
    expect(_resultMainCardEnded[1].items).toEqual(expected[1].items);
    expect(_resultMainCardEnded[2].items).toEqual(expected[2].items);
    expect(_resultMainCardEnded[0].items[0].url).toBeTruthy();
    return;
  }, 20000);

  test("initiated by user", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId
    );
    const expected = {
      type: "Container",
      items: [
        {
          type: "TextBlock",
          text: mainCardStrings("initiatedBy", {
            user: `**<at>${sampleUserName}</at>**`,
          }),
          wrap: true,
        },
      ],
    };

    const _result = result.body[0];
    expect(_result).toEqual(expected);
    return;
  });

  test("ended by user", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    );
    const expected = {
      type: "Container",
      items: [
        {
          type: "TextBlock",
          text: mainCardStrings("sessionEndedNoMoreQuestions", {
            user: `**<at>${sampleEndedByName}</at>**`,
          }),
          wrap: true,
        },
      ],
    };

    const _result = result.body[0];
    expect(_result).toEqual(expected);
    return;
  });

  test("data store", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      true
    );
    const expected = {
      data: {
        title: sampleTitle,
        description: sampleDescription,
        userName: sampleUserName,
        qnaSessionId: sampleSessionId,
        aadObjectId: sampleUserAADObjId,
        ended: true,
      },
    };

    const _result = result.msTeams.entities[0];
    expect(_result).toEqual(expected);
    return;
  });

  test("action set", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId
    );
    const expected = [
      {
        id: "askQuestion",
        type: "Action.Submit",
        title: mainCardStrings("askQuestion"),
        data: {
          msteams: {
            type: "task/fetch",
          },
          id: "askQuestion",
          qnaSessionId: sampleSessionId,
        },
      },
      {
        id: "viewLeaderboard",
        type: "Action.Submit",
        title: mainCardStrings("upvoteQuestions"),
        data: {
          msteams: {
            type: "task/fetch",
          },
          id: "viewLeaderboard",
          qnaSessionId: sampleSessionId,
          aadObjectId: sampleUserAADObjId,
        },
      },
    ];

    const _result = result.body[result.body.length - 1].actions;
    expect(_result).toEqual(expected);
    return;
  });

  test("ended action set", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      sampleEndedById,
      sampleEndedByName,
      sampleEndedByUserId
    );
    const expected = [
      {
        id: "viewLeaderboard",
        type: "Action.Submit",
        title: mainCardStrings("viewQuestions"),
        data: {
          msteams: {
            type: "task/fetch",
          },
          id: "viewLeaderboard",
          qnaSessionId: sampleSessionId,
          aadObjectId: sampleEndedById,
        },
      },
    ];

    const _result = result.body[result.body.length - 1].actions;
    expect(_result).toEqual(expected);
    return;
  });

  test("extract maincard data", async () => {
    const result: any = await getMainCard(
      sampleTitle,
      sampleDescription,
      sampleUserName,
      sampleSessionId,
      sampleUserAADObjId,
      sampleHostUserId,
      undefined,
      true
    );
    const mainCardData = extractMainCardData(result);

    expect(mainCardData).toBeDefined();
    expect(mainCardData).toEqual(result.msTeams.entities[0].data);
  });

  describe("recently asked questions string", () => {
    test("no questions asked", async () => {
      const result: any = await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleSessionId,
        sampleUserAADObjId,
        sampleHostUserId,
        undefined,
        undefined,
        undefined
      );

      const expected = {
        type: "TextBlock",
        text: "",
        wrap: true,
        size: "small",
        separator: true,
        spacing: "large",
      };

      const _result = result.body[result.body.length - 2];
      expect(_result).toEqual(expected);
    });

    test("less than 4 questions asked", async () => {
      const sampleContent = "randomQuestion";
      const recentQuestionsData: IQuestionPopulatedUser[] = [
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
      ];

      const result: any = await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleSessionId,
        sampleUserAADObjId,
        sampleHostUserId,
        undefined,
        undefined,
        undefined,
        recentQuestionsData,
        1
      );

      const expected = {
        type: "TextBlock",
        text: "",
        wrap: true,
        size: "small",
        separator: true,
        spacing: "large",
      };

      const _result = result.body[result.body.length - 2];
      expect(_result).toEqual(expected);
    });

    test("multiple questions asked same user", async () => {
      const sampleContent = "randomQuestion";
      const recentQuestionsData: IQuestionPopulatedUser[] = [
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
      ];

      const result: any = await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleSessionId,
        sampleUserAADObjId,
        sampleHostUserId,
        undefined,
        undefined,
        undefined,
        recentQuestionsData,
        4
      );

      const expected = {
        type: "TextBlock",
        text: `${sampleUserName} recently asked a question (4 questions total)`,
        wrap: true,
        size: "small",
        separator: true,
        spacing: "large",
      };

      const _result = result.body[result.body.length - 2];
      expect(_result).toEqual(expected);
    });

    test("multiple questions asked different user", async () => {
      const sampleContent = "randomQuestion";
      const recentQuestionsData: IQuestionPopulatedUser[] = [
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName2 },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName2 },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
      ];

      const result: any = await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleSessionId,
        sampleUserAADObjId,
        sampleHostUserId,
        undefined,
        undefined,
        undefined,
        recentQuestionsData,
        4
      );

      const expected = {
        type: "TextBlock",
        text: `${sampleUserName2}, and ${sampleUserName} recently asked questions (4 questions total)`,
        wrap: true,
        size: "small",
        separator: true,
        spacing: "large",
      };

      const _result = result.body[result.body.length - 2];
      expect(_result).toEqual(expected);
    });

    test("total questions", async () => {
      const sampleContent = "randomQuestion";
      const recentQuestionsData: IQuestionPopulatedUser[] = [
        <IQuestionPopulatedUser>{
          qnaSessionId: "sessionId",
          userId: <IUser>{ _id: "userId", userName: sampleUserName },
          voters: ["userId1", "userId2"],
          content: sampleContent,
          dateTimeCreated: new Date(),
        },
      ];

      const result: any = await getMainCard(
        sampleTitle,
        sampleDescription,
        sampleUserName,
        sampleSessionId,
        sampleUserAADObjId,
        sampleHostUserId,
        undefined,
        undefined,
        undefined,
        recentQuestionsData,
        200
      );

      const _result = result.body[result.body.length - 2];
      expect(_result.text.includes("(200 questions total)")).toBe(true);
    });
  });
});
