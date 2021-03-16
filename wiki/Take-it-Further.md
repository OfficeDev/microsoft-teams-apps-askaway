### Scenario 1:

Hosts can mark questions as answered in the leaderboard.
Currently, attendees have no clear way of knowing which questions have been answered. With this ability, attendees can easily see which questions have yet to be addressed..

**Code Changes:**
Add a “Answered” button on the leaderboard for the host for every question on the leaderboard. Once clicked, the question text will change color to indicate to attendees the question has been answered.

### Scenario 2:

Hosts can answer a question directly on the leaderboard.
With this functionality, hosts will be able to execute asynchronous Q & A events.

**Code Changes:**
Add a “Answer question” button on the leaderboard for the host for every question on the leaderboard. Once clicked, an input box will appear underneath that question, allowing the host to type in their answer. Once submitted, the answer will appear underneath the question and the question text will change color to indicate to attendees the question has been answered.

### Scenario 3:

Attendees can ask a question inside the leaderboard.
Attendees will be able to easily ask a question from the leaderboard.

**Code Changes:**
Add a “Ask a question” button on the leaderboard which will prompt the same task module that is launched when the button is clicked from the main card.

### Scenario 4:

Attendees can comment on an existing question in the leaderboard, allowing a conversation on a topic to stay in context.
Currently, when a user submits a question, there is no opportunity for other attendees to comment. With this scenario, other users will be able to expand on a question in context.

**Code Changes:**
Add a “Add comment” button on the leaderboard which will prompt an input box, allowing a user to submit a comment to the question. Once submitted, the comment will appear beneath the question.

### Scenario 5:

Attendees can tag questions with a predefined category/topic.
Users will be able to tag questions with host defined categories. Examples of tags include: #COVID-19, #hackathon, #scrum, etc.

**Code Changes:**
Upon creation of the Q & A session, hosts will be asked to submit various custom tags. When a user submits a new question, a dropdown will be available, allowing them to choose which tags are relevant. These tags can be used to filter on the leaderboard.

### Scenario 6:

Hosts can mark comments as answers in the leaderboard.
Alternative expansion of Scenarios 2 and 4, hosts will be able to comment and mark their comments as answers.

**Code Changes:**
Add “Mark as Answered” button on every comment created by the host. Once clicked, the text will change color, indicating to the attendee that the question has been answered.

### Scenario 7:

Attendees can edit a question once submitted.
Currently, once a question has been submitted, users can no longer edit their question. This functionality will enable this feature, allowing users to change or expand on their question.

**Code Changes:**
Add an “Edit question’ button on every personally asked question in the leaderboard. Once clicked, a task module will appear with their question pre-loaded in an input box identical to the one presented when asking a new question. The user will be able to re-submit their question and the leaderboard and main card will update.

### Scenario 8:

Use an enriched I-frame leaderboard.
This feature would allow many opportunities for expansion and customization.

### Scenario 9:

Hosts and attendees can export the questions data.
This feature would allow all users to export all the questions as a CSV file for later use. This would be great in brainstorming settings.
