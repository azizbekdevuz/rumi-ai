import { afterEach, describe, expect, it } from 'vitest';
import { assertProductionWebEnv } from './production';

const KEYS = [
  'APP_ENV',
  'BACKEND_URL',
  'APP_BASE_URL',
  'GOOGLE_REDIRECT_URI',
  'KAKAO_REDIRECT_URI',
  'TRUSTED_CLIENT_IP_HEADER',
] as const;

const previous: Record<string, string | undefined> = {};

function remember() {
  for (const key of KEYS) previous[key] = process.env[key];
}

function restore() {
  for (const key of KEYS) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}

describe('assertProductionWebEnv', () => {
  afterEach(() => {
    restore();
  });

  it('allows local development without public URLs', () => {
    remember();
    delete process.env.APP_ENV;
    delete process.env.BACKEND_URL;
    delete process.env.APP_BASE_URL;
    expect(() => assertProductionWebEnv()).not.toThrow();
  });

  it('rejects production without the public https origin', () => {
    remember();
    process.env.APP_ENV = 'production';
    process.env.BACKEND_URL = 'http://api:8000';
    delete process.env.APP_BASE_URL;
    expect(() => assertProductionWebEnv()).toThrow(/APP_BASE_URL/);
  });

  it('rejects an OAuth redirect that is not under APP_BASE_URL', () => {
    remember();
    process.env.APP_ENV = 'production';
    process.env.BACKEND_URL = 'http://api:8000';
    process.env.APP_BASE_URL = 'https://rumi.example';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3003/api/auth/google/callback';
    expect(() => assertProductionWebEnv()).toThrow(/GOOGLE_REDIRECT_URI/);
  });

  it('rejects a client-IP header outside the ingress contract', () => {
    remember();
    process.env.APP_ENV = 'production';
    process.env.BACKEND_URL = 'http://api:8000';
    process.env.APP_BASE_URL = 'https://rumi.example';
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.KAKAO_REDIRECT_URI;
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-forwarded-for';
    expect(() => assertProductionWebEnv()).toThrow(/TRUSTED_CLIENT_IP_HEADER/);
  });

  it('accepts a consistent production configuration', () => {
    remember();
    process.env.APP_ENV = 'production';
    process.env.BACKEND_URL = 'http://api:8000';
    process.env.APP_BASE_URL = 'https://rumi.example';
    process.env.GOOGLE_REDIRECT_URI =
      'https://rumi.example/api/auth/google/callback';
    delete process.env.KAKAO_REDIRECT_URI;
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';
    expect(() => assertProductionWebEnv()).not.toThrow();
  });
});
