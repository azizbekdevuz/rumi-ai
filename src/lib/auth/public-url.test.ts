import { afterEach, describe, expect, it } from 'vitest';
import { publicOrigin, publicUrl } from './public-url';

describe('publicOrigin', () => {
  afterEach(() => {
    delete process.env.APP_BASE_URL;
  });

  it('uses APP_BASE_URL when it is set', () => {
    process.env.APP_BASE_URL = 'https://rumi.example/';
    const origin = publicOrigin({ url: 'http://127.0.0.1:3003/api/auth/google/callback' });
    expect(origin).toBe('https://rumi.example');
  });

  it('falls back to the request URL for local development', () => {
    const url = publicUrl({ url: 'http://localhost:3003/api/auth/google/callback' }, '/chat');
    expect(url.toString()).toBe('http://localhost:3003/chat');
  });

  it('keeps redirects on the configured origin for absolute-looking paths', () => {
    process.env.APP_BASE_URL = 'https://rumi.example';
    const url = publicUrl({ url: 'http://127.0.0.1:3003/' }, '/login?error=oauth_failed');
    expect(url.origin).toBe('https://rumi.example');
  });
});
