This section describes the data stores used by the Ask Away app.

All these resources are created in your Azure subscription. None are hosted directly by Microsoft.

- Azure Cosmos DB with Mongo DB API
  - [Document] Stores details of all active and inactive Q & A sessions.
  - [Document] Stores details of users involved in a Q & A session.
  - [Document] Stores details of questions asked in a Q & A session.

### Documents

1. **Session**

The document has the following fields:
|Attribute |Comment|
|---|---|
|title |Q & A event title|
|description| Q & A event description|
|isActive| Indicates status of Q & A event. Boolean value. True = Active / False = Inactive|
|hostId |AAD Object Id of the user who created the Q & A session|
|hostUserId |Unique user id assigned to the bot of the user who created the Q & A session. It is used for at-mentions|
|activityId| Teams Activity Id for the main card|
|conversationId |Teams Conversation Id of the Q & A event|
|tenantId |Id of the tenant hosting the Q & A session|
|scopeId |Teams group chat or channel Id of the Q & A event|
|isChannel |Indicates if the Q & A event is in a channel or group chat. Boolean value. True = Channel / False = Group chat|
|dateTimeCreated |Indicates when the Q & A session was started|
|dateTimeEnded |Indicates when the Q & A session was ended|

2. **User**

The document has the following fields:
|Attribute |Comment|
|---|---|
|\_id |AAD Object Id of the user (acts as Database Id)|
|userName |Full name of the user|

3. **Question**

The document has the following fields:
|Attribute |Comment|
|---|---|
|qnaSessionId |Mongoose Object Id of the Q & A session this question belongs to|
|userId |AAD Object Id of the user asking the question|
|content |Question data submitted [Max characters: 250]|
|voters |List of AAD Object Ids representing users who upvoted this question|
|dateTimeCreated |Indicates when the question was submitted|
