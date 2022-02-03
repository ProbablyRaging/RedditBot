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

let nowTime = moment().format('LTS');
let searchNotification = true;
let runOnce = false;
let replyCount = 0;

// start our function
startSubreddit();

async function startSubreddit(subredditName) {
    let submissions = [];

    if (!runOnce) {
        runOnce = true;

        nowTime = moment().format('LTS');
        console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m CHECKING \x1b[36m${subreddits.name.length}\x1b[0m SUBREDDITS FOR UNREPLIED SUBMISSIONS..\n`);

        await wait(1000);
    }

    for (let i = 0; i < subreddits.name.length; i++) {
        await reddit.getSubreddit(subreddits.name[i]).getNew({ limit: 10 }).then(threads => {
            fs.readFile(process.env.REPLIED_LOG, async function (err, logFile) {
                threads.forEach(sub => {
                    if (err) console.error(err);

                    //only push the submission if we haven't replied to the author before
                    if (!logFile.includes(sub?.author.name)) {
                        submissions.push({ id: sub?.id, title: sub?.title, author: sub?.author.name, subreddit: subreddits.name[i] });
                    }
                });
            });
        });
    }

    // if there are no unreplied submissions, we can wait before starting again
    if (submissions?.length === 0) {
        if (searchNotification) {
            nowTime = moment().format('LTS');
            console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m FOUND \x1b[36m${submissions?.length}\x1b[0m UNREPLIED SUBMISSIONS`);
            console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m SEARCHING WILL CONTINUE UNTIL A SUBMISSION IS FOUND..\n`);
        }

        searchNotification = false;

        await wait(10000);

        startSubreddit();
        return;
    }

    searchNotification = true;

    // console log how many unreplied submissions we found
    nowTime = moment().format('LTS');
    console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m FOUND \x1b[36m${submissions?.length}\x1b[0m UNREPLIED SUBMISSIONS..\n`);
    await wait(1000);

    let subCounter = 1;
    let unrepliable = false;
    let rateLimit = false;

    for (let i = 0; i < submissions?.length; i++) {
        // reset unrepliable to false
        unrepliable = false;

        // console log the submission counter + submission title
        let subTitle = submissions[i]?.title.length > 120 ? submissions[i]?.title.slice(0, 120) + '..' : submissions[i]?.title;
        console.log(`\x1b[36m#${subCounter}\x1b[0m - ${subTitle}`);

        // get a random comment from our list of replies
        const randNum = Math.floor(Math.random() * replies.comment.length);

        // reply to the submissions we found
        await reddit.getSubmission(submissions[i]?.id).reply(replies.comment[randNum])
            .catch(err => {
                // what error message did we get, console log it so we know
                console.log(`\x1b[31m>>>\x1b[0m ${err.message.split(',')[0]}\n`)

                if (err.message.split(',')[0] === 'COMMENT_UNREPLIABLE') unrepliable = true;
                if (err.message.split(',')[0] === 'RATELIMIT') rateLimit = true;
            });

        // if the reply was successful, console log it so we know
        if (!unrepliable && !rateLimit) {
            console.log('\x1b[32m>>>\x1b[0m REPLIED TO SUBMISSION\n');
            replyCount++
        }

        // if we weren't rate limited, log the author's name so that we don't reply to their submissions again
        // we log unrepliable submissions because that usually means we've been blocked by the author
        if (!rateLimit) {
            var logId = fs.createWriteStream(process.env.REPLIED_LOG, {
                flags: 'a' // append
            });

            logId.write(`\n${submissions[i]?.author}`);
        }

        if (rateLimit) {
            nowTime = moment().format('LTS');
            console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m FINISHED - SUCCSSFULLY REPLIED TO \x1b[36m${replyCount} of ${submissions?.length}\x1b[0m SUBMISSIONS..\n`);

            await wait(1800 * 1000);

            startSubreddit();
            return;
        }

        // increment the submission counter
        subCounter++;

        // when we get to the end of our submissions array or if we hit a rate limit, wait before starting the next function
        if (i === submissions?.length - 1) {
            nowTime = moment().format('LTS');
            console.log(`\x1b[1m\x1b[33m${nowTime} ###\x1b[0m FINISHED - SUCCSSFULLY REPLIED TO \x1b[36m${replyCount} of ${submissions?.length}\x1b[0m SUBMISSIONS..\n`);

            replyCount = 0;

            await wait(3000);

            startSubreddit();
            return;
        }

        // wait before replying to another submissions
        let replyWait = unrepliable ? 100 : parseInt(process.env.REPLY_WAIT) * 1000;
        await wait(replyWait);
    }
}