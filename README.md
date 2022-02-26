# RedditBot
A simple submission reply bot for NodeJS and the Reddit API using [snoowrap](https://github.com/not-an-aardvark/snoowrap)

# Config
Rename `.env.example` to `.env` and input your own credentials. Create an app and find your credentials [here](https://www.reddit.com/prefs/apps):
```
C_ID=""
C_SECRET=""
USER_AGENT=""
USER_NAME=""
PASSWORD=""
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
