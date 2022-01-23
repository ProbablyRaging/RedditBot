# RedditBot
An simple submission reply bot for NodeJS and the Reddit API using [snoowrap](https://github.com/not-an-aardvark/snoowrap)

# Config
Rename `.env.example` to `.env` and input your own credentials. Create an app and find your credentials [here](https://www.reddit.com/prefs/apps):
```
C_ID=""
C_SECRET=""
USER_AGENT=""
USER_NAME=""
PASSWORD=""
```
Change which subreddit the bot should start on when first being ran:
```
# The index of the subreddit's name in the subreddits array that the bot should start on:
START_ON="0"
```
Change the duration for certain functions to your liking:
```
# Time to wait between replying to submissions - in seconds
REPLY_WAIT="5"

# Time to wait before switching to another subreddit - in minutes
RATELIMIT_WAIT="120"

# Time to wait before switching to another subreddit if no submissions were found - in seconds
NEXT_WAIT="3"

# Amount of submissions to get from each subreddit
GET_SUBMISSIONS="200"
```
Create a `.txt` file named `replied_to.txt` in the same directory for where the bot will log the submissions we have already replied to:
```
# A file to log the submissions that we have replied to already
REPLIED_LOG="./replied_to.txt"
```
Rename `subreddits.js.example` to `subreddits.js` and include the names of any subreddits you want the bot to check for new submissions in:
```
module.exports = {
    name: [
        'gifs',
        'news',
        'pcmasterrace',
    ]
}
```
Rename `replies.js.example` to `replies.js` and include some custom replies that the bot will randomly choose from when commenting on a submission:
```
module.exports = {
    comment: [
        `Wow, such great content, congrats!`,
        `Cool thread, I gave you an upvote!`,
    ]
}
```
