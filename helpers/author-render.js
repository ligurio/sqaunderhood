import moment from 'moment';
import {
  pipe, filter, groupBy, prop, converge, inc, dec, length,
  findIndex, propEq, path, map, head, split, nth, replace, toUpper, tail,
  concat
} from 'ramda';
import numd from 'numd';
import renderTweet from 'tweet.md';
import getLinks from './get-links';
import { html } from 'commonmark-helpers';
import ungroupInto from './ungroup-into';
import unidecode from 'unidecode';
import trimTag from 'trim-html-tag';
import { parse } from 'url';
import authors from '../dump';
import { underhood } from '../.underhoodrc.json';

const getQuotedUser = pipe(
  path(['entities', 'urls']),
  map(prop('expanded_url')),
  map(replace('/mobile.twitter.com/', '/twitter.com/')),
  filter(url => parse(url).host === 'twitter.com'),
  head,
  pipe(parse, prop('path'), split('/'), nth(1)));

moment.locale('ru');

const weekday = date => moment(new Date(date)).format('dddd');
const tweetLink = (tweet) => `https://twitter.com/${underhood}/status/${tweet.id_str}`;
const tweetTime = (tweet) => moment(new Date(tweet.created_at)).format('H:mm');

const authorsToPost = filter(author => author.post !== false, authors);

const authorIndex = author => findIndex(propEq('authorId', author.authorId))(authorsToPost);
const isFirstAuthor = author => authorIndex(author) === dec(length(authorsToPost));
const isLastAuthor = author => author.authorId === prop('authorId', head(authorsToPost));
const nextAuthor = author => {
  if (!isLastAuthor(author)) return nth(dec(authorIndex(author)), authorsToPost);
};
const prevAuthor = author => {
  if (!isFirstAuthor(author)) return nth(inc(authorIndex(author)), authorsToPost);
};

const d = input => moment(new Date(input)).format('D MMMM YYYY');
const tweetsUnit = numd('твит', 'твита', 'твитов');
const capitalize = converge(concat, [pipe(head, toUpper), tail]);

const filterTimeline = item => (item.text[0] !== '@') || (item.text.indexOf(`@${underhood}`) === 0);
const fullText = item => {
  item.text = item.full_text || item.text;

  if (item.quoted_status) {
    item.quoted_status.text = item.quoted_status.full_text || item.quoted_status.text;
  }

  if (item.retweeted_status) {
    item.retweeted_status.text = item.retweeted_status.full_text || item.retweeted_status.text;
  }

  return item;
};
const prepareTweets = tweets => {
  tweets = map(fullText, tweets);
  tweets = filter(filterTimeline, tweets);
  tweets = groupBy(pipe(prop('created_at'), weekday), tweets);

  return ungroupInto('weekday', 'tweets')(tweets);
};

export default {
  d,
  prepareTweets,
  capitalize,
  tweetsUnit,
  getQuotedUser,
  unidecode,
  prevAuthor, nextAuthor,
  render: pipe(renderTweet, html, trimTag),
  tweetTime, tweetLink,
  getLinks,
};
