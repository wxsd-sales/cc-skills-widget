#!/usr/bin/env python3
"""List WxCC users — useful for finding skillProfileId and dynamicSkills fields."""

import os
import sys

from _common import main_wrapper, pretty_print, request


def main():
    org_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WXCC_ORG_ID")
    if not org_id:
        print("Usage: python list_users.py <org_id>")
        print("  or set WXCC_ORG_ID")
        sys.exit(2)

    status, payload = request("GET", f"/organization/{org_id}/user")
    pretty_print(status, payload)

    if status == 200 and isinstance(payload, list):
        print(f"\nFound {len(payload)} user(s)")
        skill_fields = ("skillProfileId", "dynamicSkills", "agentProfileId", "teamIds")
        for user in payload[:5]:
            print(f"\n  User: {user.get('firstName')} {user.get('lastName')} ({user.get('email')})")
            print(f"    id: {user.get('id')}")
            for field in skill_fields:
                if field in user:
                    print(f"    {field}: {user.get(field)}")


if __name__ == "__main__":
    main_wrapper(main)
