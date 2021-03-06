/* eslint-env mocha */

import assert from 'assert';
import { readFileSync } from 'fs-extra';
import cheerio from 'cheerio';
import typeNumbers from 'typographic-numbers';
import authors from './dump';
import authorId from './helpers/author-id';

import underhood from './.underhoodrc.json';
import getAuthorArea from './helpers/get-author-area';
const underhoodInfo = getAuthorArea(underhood.underhood, 'info') || {};

const numbers = input => typeNumbers(input, { locale: 'ru' });
const make$ = file => cheerio.load(readFileSync(file, { encoding: 'utf8' }));

describe('html', () => {
  describe('index page', () => {
    it('short authors info', () => {
      const $ = make$('dist/index.html');
      const pageAuthors = $('article .list__item-desc');
      const realAuthors = authors.filter(a => a.post !== false);
      assert(pageAuthors.length === realAuthors.length);
    });
    it('don’t have subheading', () => {
      const $ = make$('dist/index.html');
      assert($('.page-header h1 small').length === 0);
    });
    it('followers count exists', () => {
      const $ = make$('dist/index.html');
      const followers = numbers(String(underhoodInfo.followers_count));
      assert($('.page-header p i').text().indexOf(followers) > 0);
    });
  });

  describe('about page', () => {
    it('text', () => {
      const $ = make$('dist/about/index.html');
      assert($('article').text().length > 0);
    });
  });

  describe('authorId', () => {
    const input = [
      { username: 'first' },
      { username: 'yolo' },
      { username: 'first' },
      { username: 'yolo' },
      { username: 'first' }
    ];

    it('should work', () => {
      const actual = authorId(input);
      const expected = [
        { username: 'first', authorId: 'first-3' },
        { username: 'yolo', authorId: 'yolo-2' },
        { username: 'first', authorId: 'first-2' },
        { username: 'yolo', authorId: 'yolo' },
        { username: 'first', authorId: 'first' }
      ];
      assert.deepEqual(actual, expected);
    });
  });
});
