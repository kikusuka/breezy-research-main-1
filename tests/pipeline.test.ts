import { describe, it, expect } from 'vitest';

describe('Evidence & Pipeline Truthfulness', () => {
  it('calculates primarySourcesCount correctly from current authoritative-domain indicators', () => {
    const primaryDomainsRegex = /(\.gov|\.edu|arxiv\.org|ietf\.org|w3\.org)/i;
    const sources = [
      { url: 'https://arxiv.org/abs/2301.00001' },
      { url: 'https://github.com/facebook/react' },
      { url: 'https://random-tech-blog.com/post' },
      { url: 'https://docs.python.org/3/' },
      { url: 'https://example.gov/research' }
    ];

    const count = sources.filter((s) => primaryDomainsRegex.test(s.url)).length;
    expect(count).toBe(2); // arxiv.org and example.gov
  });
});
