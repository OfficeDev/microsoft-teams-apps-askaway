/* eslint-disable @typescript-eslint/tslint/config */
import { IAdaptiveCard } from "adaptivecards";
import { ISubmitAction } from "adaptivecards/lib/schema";
import { mainCardStrings } from "../localization/locale";

/**
 * Adaptive Card template for view leaderboard submit action (i.e, the `View Leaderboard` button).
 */
export const viewLeaderboardButton = () =>
  <ISubmitAction>{
    id: "viewLeaderboard",
    type: "Action.Submit",
    title: "${leaderboardTitle}",
    data: {
      msteams: {
        type: "task/fetch",
      },
      id: "viewLeaderboard",
      qnaSessionId: "${qnaId}",
      aadObjectId: "${userId}",
    },
  };

/**
 * Data injected into the MainCard
 */
export type MainCardData = {
  title: string;
  description: string;
  userName: string;
  qnaSessionId: string;
  userId: string;
  ended: boolean;
};

/**
 * Master Adaptive Card for the AskAway Bot
 */
export const mainCard = () =>
  <IAdaptiveCard>{
    $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.2",
    body: [
      {
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: "${sessionDetails}",
            wrap: true,
          },
        ],
      },
      {
        type: "Container",
        bleed: true,
        items: [
          {
            type: "TextBlock",
            text: "${title}",
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
        text: "${description}",
        wrap: true,
        spacing: "small",
        size: "medium",
      },
      {
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
            $when: "${count($root.topQuestions) < 1}",
          },
          questionsList("${$root.topQuestions}"),
        ],
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "${recentlyAsked}",
        wrap: true,
        size: "small",
        separator: true,
        spacing: "large",
      },
      {
        type: "ActionSet",
        actions: actions(),
        spacing: "large",
      },
    ],
    msTeams: {
      entities: [
        {
          data: "${data}",
        },
      ],
    },
  };

const questionsList = (dataKey: string) => ({
  type: "Container",
  separator: true,
  items: [
    {
      type: "ColumnSet",
      columns: [
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
              text: "${userId.userName}",
              weight: "Bolder",
              size: "Small",
            },
            {
              type: "TextBlock",
              text: "${content}",
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
              text: "${string(upvotes)}",
            },
          ],
          verticalContentAlignment: "Center",
        },
      ],
    },
  ],
  $data: dataKey,
});

const actions = () => [
  {
    id: "askQuestion",
    type: "Action.Submit",
    title: mainCardStrings("askQuestion"),
    data: {
      msteams: {
        type: "task/fetch",
      },
      id: "askQuestion",
      qnaSessionId: "${qnaId}",
    },
  },
  viewLeaderboardButton(),
];

/**
 * Extracts injected data from the master card
 * @param card - the master card
 */
export const extractMainCardData = (card: IAdaptiveCard): MainCardData => {
  if (!card.body) throw new Error("Non-existent card body");
  return card.msTeams.entities[0].data;
};
