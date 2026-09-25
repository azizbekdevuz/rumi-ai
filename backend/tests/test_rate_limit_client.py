"""Rate-limit identity follows the visitor only through the trusted BFF."""
from starlette.requests import Request

from app.middleware.rate_limit import resolve_rate_limit_ip


def _request(headers=None, client=("172.18.0.8", 1234)):
    raw_headers = []
    for key, value in headers or []:
        raw_headers.append((key.lower().encode(), value.encode()))
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/api/chat",
        "raw_path": b"/api/chat",
        "query_string": b"",
        "headers": raw_headers,
        "client": client,
        "server": ("api", 8000),
    }
    return Request(scope)


def test_trust_disabled_ignores_forwarded_header():
    request = _request([("x-forwarded-for", "203.0.113.10")])
    assert resolve_rate_limit_ip(request, trust_proxy=False) == "172.18.0.8"


def test_trusted_bff_single_address_is_used():
    request = _request([("x-forwarded-for", "203.0.113.10")])
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "203.0.113.10"


def test_ipv6_address_is_normalized():
    request = _request([("x-forwarded-for", "2001:DB8:0::1")])
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "2001:db8::1"


def test_list_value_is_rejected():
    request = _request([("x-forwarded-for", "198.51.100.1, 203.0.113.10")])
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "172.18.0.8"


def test_repeated_header_is_rejected():
    request = _request(
        [("x-forwarded-for", "198.51.100.1"), ("x-forwarded-for", "203.0.113.10")]
    )
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "172.18.0.8"


def test_invalid_values_are_rejected():
    for value in ("not a client", "999.1.1.1", "203.0.113.10:443", ""):
        request = _request([("x-forwarded-for", value)])
        assert resolve_rate_limit_ip(request, trust_proxy=True) == "172.18.0.8"


def test_public_peer_cannot_spoof_even_with_trust_enabled():
    # Documentation ranges count as private in ipaddress; use a routable peer.
    request = _request(
        [("x-forwarded-for", "203.0.113.10")], client=("93.184.216.34", 5555)
    )
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "93.184.216.34"


def test_direct_request_without_header_uses_peer():
    request = _request([], client=("127.0.0.1", 5555))
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "127.0.0.1"


def test_missing_client_is_unknown():
    request = _request([], client=None)
    assert resolve_rate_limit_ip(request, trust_proxy=True) == "unknown"
