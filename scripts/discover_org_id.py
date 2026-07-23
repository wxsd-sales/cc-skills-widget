#!/usr/bin/env python3
"""Try common endpoints to discover org id and token capabilities."""

import json

from _common import TEST_TOKEN, main_wrapper, pretty_print, request


def try_url(label, url):
    print(f"\n{'=' * 60}\n{label}\n{url}")
    import urllib.request
    import urllib.error

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {TEST_TOKEN}",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            payload = json.loads(raw) if raw else None
            pretty_print(resp.status, payload)
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw
        pretty_print(exc.code, payload)
        return exc.code, payload


def try_path(label, path):
    print(f"\n{'=' * 60}\n{label}\n{path}")
    status, payload = request("GET", path)
    pretty_print(status, payload)
    return status, payload


def main():
    print(f"Token prefix: {TEST_TOKEN[:20]}...")

    # Webex people/me may reveal org context
    try_url("Webex People API (me)", "https://webexapis.com/v1/people/me")

    # Agent session endpoint (uses agent token pattern from reference widgets)
    candidates = [
        ("WxCC agents session", "/v1/agents/session"),
    ]
    for label, path in candidates:
        try_path(label, path)

    print("\n\nIf org id is unknown, check Control Hub URL or ask for WXCC_ORG_ID.")


if __name__ == "__main__":
    main_wrapper(main)
