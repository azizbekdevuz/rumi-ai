import { afterEach, describe, expect, it } from 'vitest';
import { clientIpHeaders } from './server-backend';

function request(headers: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
  };
}

describe('clientIpHeaders', () => {
  afterEach(() => {
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
  });

  it('forwards nothing when no trusted ingress header is configured', () => {
    const headers = clientIpHeaders(
      request({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '203.0.113.7' }),
    );
    expect(headers).toEqual({});
  });

  it('forwards the ingress-set X-Real-IP', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';
    expect(clientIpHeaders(request({ 'x-real-ip': '203.0.113.7' }))).toEqual({
      'X-Forwarded-For': '203.0.113.7',
    });
  });

  it('ignores client-supplied X-Forwarded-For even when X-Real-IP is trusted', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';
    expect(clientIpHeaders(request({ 'x-forwarded-for': '198.51.100.1' }))).toEqual({});
  });

  it('reads only CF-Connecting-IP in tunnel mode', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'cf-connecting-ip';
    const headers = clientIpHeaders(
      request({ 'x-real-ip': '198.51.100.1', 'cf-connecting-ip': '2001:db8::1' }),
    );
    expect(headers).toEqual({ 'X-Forwarded-For': '2001:db8::1' });
  });

  it('rejects lists and non-IP values', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-real-ip';
    expect(clientIpHeaders(request({ 'x-real-ip': '203.0.113.7, 10.0.0.1' }))).toEqual({});
    expect(clientIpHeaders(request({ 'x-real-ip': 'evil' }))).toEqual({});
    expect(clientIpHeaders(request({ 'x-real-ip': '999.1.1.1' }))).toEqual({});
  });

  it('refuses X-Forwarded-For as the trusted header', () => {
    process.env.TRUSTED_CLIENT_IP_HEADER = 'x-forwarded-for';
    expect(clientIpHeaders(request({ 'x-forwarded-for': '203.0.113.7' }))).toEqual({});
  });
});
