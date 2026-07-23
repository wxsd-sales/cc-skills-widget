#!/usr/bin/env python3
"""Get a specific WxCC user by id."""

import os
import sys

from _common import main_wrapper, pretty_print, request


def main():
    if len(sys.argv) < 3:
        org_id = os.environ.get("WXCC_ORG_ID")
        user_id = sys.argv[1] if len(sys.argv) == 2 else None
        if not org_id or not user_id:
            print("Usage: python get_user_by_id.py <org_id> <user_id>")
            sys.exit(2)
    else:
        org_id, user_id = sys.argv[1], sys.argv[2]

    status, payload = request("GET", f"/organization/{org_id}/user/{user_id}")
    pretty_print(status, payload)


if __name__ == "__main__":
    main_wrapper(main)
