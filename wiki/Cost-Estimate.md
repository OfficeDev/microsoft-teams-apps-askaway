### Assumptions:

- 300 Q&A sessions per month
- 100 questions per Q&A session
- 500 leaderboard views per Q&A session
- 1000 upvotes per Q&A session

### SKU Recommendations:

App Service: Standard (S1)

### Estimated Usage:

CosmosDB Operations:

- Read Operations:
  - View Leaderboard (2 reads) _ 500 views _ 300 sessions = 300,000 reads
  - Updating Master Card (100 questions + 500 views) \* 300 sessions = 180000 reads
- Write:
  - Upvoting (1 write) _ 1000 upvotes _ 300 sessions = 300,000 writes
  - Asking a question (1 write) _ 100 questions _ 300 sessions = 30,000 writes
  - Start/Stop AMA (negligible)

CosmosDB Storage:

- Estimated Usage < 1 GB
- 300 AMA sessions _ 100 questions per AMA session = 30,000 questions _ 5 kB = 150 MB

### Estimated Cost:

| Resource                  | Tier | Load          | Monthly Price           |
| ------------------------- | ---- | ------------- | ----------------------- |
| CosmosDB                  | -    | 1GB, 400 RU/s | $23.36 + $0.25 = $23.61 |
| Bot Channels Registration | F0   | N/A           | Free                    |
| App Service Plan          | S1   | 744 Hours     | $74.40                  |
| Application Insights      | -    | < 5GB data    | Free up to 5GB          |
| Total                     |      |               | $98.01                  |
