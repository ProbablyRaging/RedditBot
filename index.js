require('dotenv').config();
const snoowrap = require('snoowrap');
const fs = require('fs');
const wait = require("timers/promises").setTimeout;
const moment = require('moment');
const replies = require('./replies');
const subreddits = require('./subreddits');

// initiate our reddit instance
const reddit = new snoowrap({
    userAgent: process.env.USER_AGENT,
    clientId: process.env.C_ID,
    clientSecret: process.env.C_SECRET,
    username: process.env.USER_NAME,
    password: process.env.PASSWORD
});

/** 
 * sub.id =             Submission id
 * sub.author.name =    Submission author
 * sub.title =          Submission title
 */

// log the current time
let nowTime = moment().format('LTS');

// which subreddit the bot should start on
let currentSubreddit = parseInt(process.env.START_ON);

// start our first function
startSubreddit(subreddits.name[currentSubreddit]);

function startSubreddit(subredditName) {
    nowTime = moment().format('LTS');
    console.log(`\x1b[33m${nowTime} ###\x1b[0m STARTING ON SUBREDDIT: r/${subredditName}\n`);

    // get a batch of new submissions from the specified subreddit
    let subIdsArr = [];
    reddit.getSubreddit(subredditName).getNew({ limit: parseInt(process.env.GET_SUBMISSIONS) }).then(threads => {
        fs.readFile(process.env.REPLIED_LOG, async function (err, logFile) {
            threads.forEach(async sub => {
                if (err) console.error(err);

                // only push the submission if we haven't replied to the author before
                if (!logFile.includes(sub?.author.name)) {
                    subIdsArr.push({ id: sub?.id, title: sub?.title, author: sub?.author.name });
                }
            });

            // if there are no unreplied submission, we can move on to the next subreddit immediately
            if (subIdsArr?.length === 0) {
                // increment the current subreddit
                currentSubreddit++;

                // if we reach the end of our subreddits list, return to 0 and start again
                if (currentSubreddit === subreddits.name.length - 1) currentSubreddit = 0;
                noWaitBeforeNext();
            }

            let subCounter = 1;
            let unrepliable = false;
            let rateLimit = false;

            for (let i = 0; i < subIdsArr?.length; i++) {
                const timer = setTimeout(async function () {
                    // if we hit a rate limite, return
                    if (rateLimit) return;

                    // reset unrepliable to false
                    unrepliable = false;

                    // console log the submission counter + submission title
                    let subTitle = subIdsArr[i]?.title;
                    if (subTitle.length > 120) subTitle = subTitle.slice(0, 120) + '..';
                    console.log(`\x1b[36m#${subCounter}\x1b[0m - ${subTitle}`);

                    // get a random comment from our list of replies
                    const randNum = Math.floor(Math.random() * replies.comment.length);
                    const randReply = replies.comment[randNum];

                    await reddit.getSubmission(subIdsArr[i]?.id).reply(randReply)
                        .catch(err => {
                            // what error message did we get, console log it so we know
                            console.log(`\x1b[31m>>>\x1b[0m ${err.message.split(',')[0]}\n`)

                            if (err.message.split(',')[0] === 'COMMENT_UNREPLIABLE') unrepliable = true;
                            if (err.message.split(',')[0] === 'RATELIMIT') rateLimit = true;
                        });

                    // if the reply was successful, console log it so we know
                    if (!unrepliable && !rateLimit) {
                        console.log('\x1b[32m>>>\x1b[0m REPLIED TO SUBMISSION\n');

                        // log the author's name so that we don't reply to their submissions again
                        var logId = fs.createWriteStream(process.env.REPLIED_LOG, {
                            flags: 'a' // append
                        });

                        logId.write(`\n${subIdsArr[i]?.author}`);
                    }

                    // increment the submission counter
                    subCounter++;

                    // when we get to the end of our submissions array or if we hit a rate limit, wait before starting the next function
                    if (rateLimit || i === subIdsArr?.length - 1) {
                        clearTimeout(timer);

                        // increment the current subreddit
                        currentSubreddit++;

                        // if we reach the end of our subreddits list, return to 0 and start again
                        if (currentSubreddit === subreddits.name.length - 1) currentSubreddit = 0;

                        waitBeforeNext();
                    }
                }, i * parseInt(process.env.REPLY_WAIT) * 1000);
            }
        });
    });
}

// function for waiting before moving on to the next subreddit
async function waitBeforeNext() {
    nowTime = moment().format('LTS');
    console.log(`\x1b[33m${nowTime} ###\x1b[0m FINISHED REPLYING - Waiting ${msToTime(parseInt(process.env.RATELIMIT_WAIT) * 60000)} before continuing..\n`);

    // wait - in minutes
    await wait(parseInt(process.env.RATELIMIT_WAIT) * 60000);

    startSubreddit(subreddits.name[currentSubreddit]);
}

// function to start on the next subreddit immediately
async function noWaitBeforeNext() {
    nowTime = moment().format('LTS');
    console.log(`\x1b[33m${nowTime} ###\x1b[0m NO NEW SUBMISSIONS - Starting on the next subreddit in ${msToTime(parseInt(process.env.NEXT_WAIT) * 1000)}..\n`);

    // wait - in seconds
    await wait(parseInt(process.env.NEXT_WAIT) * 1000);

    startSubreddit(subreddits.name[currentSubreddit]);
}

// convert milliseconds to time
function msToTime(ms) {
    let hours = ms / (1000 * 60 * 60);
    let hoursFloor = Math.floor(hours);
    let minutes = (hours - hoursFloor) * 60;
    let minutesFloor = Math.floor(minutes);
    let seconds = (minutes - minutesFloor) * 60;
    let secondFloor = Math.floor(seconds);
    return hoursFloor + "hr(s) " + minutesFloor + "min(s) " + secondFloor + "sec(s)";
}