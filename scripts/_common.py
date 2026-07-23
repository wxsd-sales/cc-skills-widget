"""Shared helpers for WxCC API exploration scripts."""

import json
import os
import sys
import urllib.error
import urllib.request

# Set WXCC_ACCESS_TOKEN to a valid WxCC API bearer token before running scripts.
TEST_TOKEN = os.environ.get("WXCC_ACCESS_TOKEN", "")

API_BASE = os.environ.get("WXCC_API_BASE", "https://api.wxcc-us1.cisco.com")


def request(method, path, body=None, token=None):
    token = token or TEST_TOKEN
    url = f"{API_BASE}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = raw
        return exc.code, payload


def pretty_print(status, payload):
    print(f"HTTP {status}")
    print(json.dumps(payload, indent=2, sort_keys=True))


def main_wrapper(fn):
    try:
        fn()
    except Exception as exc:  # noqa: BLE001 - dev script
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
