import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/paths';
describe('Pages paths', () => {
 it('keeps localhost routes', () => expect(withBase('/company/modo', '/')).toBe('/company/modo'));
 it('prefixes routes and images', () => {
  expect(withBase('/company/modo#works', '/AIGamehistory/')).toBe('/AIGamehistory/company/modo#works');
  expect(withBase('/images/hero.png', '/AIGamehistory')).toBe('/AIGamehistory/images/hero.png');
 });
 it('preserves external links and anchors', () => {
  for (const p of ['https://example.com', '//example.com/image.jpg', '#y2020']) expect(withBase(p, '/AIGamehistory/')).toBe(p);
 });
});
