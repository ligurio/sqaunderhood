import log from './helpers/log';
import { outputFile, outputJSON } from 'fs-extra';
import { isEmpty, concat, reverse, last, dissoc, map, head } from 'ramda';
import moment from 'moment';
import dec from 'bignum-dec';

import authors from './authors';

import tokens from 'twitter-tokens';
import getTweets from 'get-tweets';
import getInfo from 'get-twitter-info';
import saveMedia from './helpers/save-media';
import getFollowers from 'get-twitter-followers';
import twitterMentions from 'twitter-mentions';

import ensureFilesForFirstUpdate from './helpers/ensure-author-files';
import getAuthorArea from './helpers/get-author-area';
import saveAuthorArea from './helpers/get-author-area';

const author = head(authors);
const { first, username } = author;

const spaces = 2;

ensureFilesForFirstUpdate(username);

const authorTweets = getAuthorArea(author, 'tweets').tweets || [];
const tweetsSinceId = isEmpty(authorTweets) ? dec(first) : last(authorTweets).id_str;
getTweets(tokens, 'jsunderhood', tweetsSinceId, (err, tweetsRaw) => {
  if (err) throw err;
  const tweets = concat(authorTweets, reverse(tweetsRaw));
  saveAuthorArea(username, 'tweets', { tweets });
});

getInfo(tokens, 'jsunderhood', (err, info) => {
  if (err) throw err;
  saveAuthorArea(username, 'info', info);
});

saveMedia(tokens, 'jsunderhood', username, (err, media) => {
  if (err) throw err;
  saveAuthorArea(username, 'media', media);
});

getFollowers(tokens, 'jsunderhood', (err, followersWithStatuses) => {
  if (err) throw err;
  const followers = map(dissoc('status'), followersWithStatuses);
  outputJSON(`./dump/${username}-followers.json`, { followers }, { spaces }, saveErr => {
    log(`${saveErr ? '✗' : '✓'} ${username}’s followers`);
  });
});

const firstTweet = last(currentAuthor.tweets);
const lastMention = last(currentAuthor.mentions);
const sinceId = (lastMention || firstTweet).id_str;
twitterMentions(tokens, sinceId, (err, mentionsRaw) => {
  if (err) throw err;
  const mentions = concat(currentAuthor.mentions, reverse(mentionsRaw));
  outputJSON(`./dump/${username}-mentions.json`, { mentions }, { spaces }, saveErr => {
    log(`${saveErr ? '✗' : '✓'} ${username}’s mentions`);
  });
});

outputFile('./dump/.timestamp', moment().unix(), err => {
  log(`${err ? '✗' : '✓'} timestamp`);
});
