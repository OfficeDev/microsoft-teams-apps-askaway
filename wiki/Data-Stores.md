This section describes the data stores used by the Ask Away app.

All these resources are created in your Azure subscription. None are hosted directly by Microsoft.

- Azure Cosmos DB with Mongo DB API
  - [Document] Stores details of all active and inactive Q & A sessions.
  - [Document] Stores details of users involved in a Q & A session.
  - [Document] Stores details of questions asked in a Q & A session.
  - [Document] Stores information about conversation (channel/group chat) in which the app is installed.

### Documents

1. **Session**

The document has the following fields:
|Attribute |Comment|
|---|---|
|title |Q & A event title|
|description| Q & A event description|
|isActive| Indicates status of Q & A event. Boolean value. True = Active / False = Inactive|
|hostId |AAD Object Id of the user who created the Q & A session|
|hostUserId |Unique user id assigned by the bot to the user who created the Q & A session. It is used for at-mentions|
|activityId| Teams Activity Id for the main card|
|conversationId |Teams Conversation Id of the Q & A event|
|tenantId |Id of the tenant hosting the Q & A session|
|scopeId |Teams group chat or channel Id of the Q & A event|
|isChannel |Indicates if the Q & A event is in a channel or group chat. Boolean value. True = Channel / False = Group chat|
|dateTimeCreated |Indicates when the Q & A session was started|
|dateTimeEnded |Indicates when the Q & A session was ended|
|endedById |AAD Object Id of the user who ended the Q & A session|
|endedByUserId |Unique user id assigned by the bot to the user who ended the Q & A session. It is used for at-mentions|
|dateTimeCardLastUpdated | Date time when main adaptive card for the Q & A session was last updated. More on this at `Adaptive card debounce` section in Solution Overview|
|dateTimeNextCardUpdateScheduled | Date time when next adaptive card for the Q & A session update is scheduled. More on this at `Adaptive card debounce` section in Solution Overview|
|dateTimeEndOperationLockAcquired| Time stamp when end Q & A session operation is locked. More on this at `DB Rollback for update operations` section in Solution Overview|
| ttl | Time to live in seconds for Q & A session. More on this at `Handling orphaned Q & A sessions` section in Solution Overview|

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
|isAnswered |Indicates if the question is answered. Boolean value. True = answered / False = unanswered|
|dateTimeMarkAsAnsweredOperationLockAcquired |Time stamp when mark as answered operation is locked. More on this at `DB Rollback for update operations` section in Solution Overview |

4. **Conversation**

The document has the following fields:
|Attribute |Comment|
|---|---|
|\_id | conversation id |
|serviceUrl | service URL to post/update message, send out in-meeting dialog notification, fetch participant's meeting role|
|tenantId | Id of the tenant corresponding to the conversation |
|meetingId | meeting id|
