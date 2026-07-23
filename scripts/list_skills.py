#!/usr/bin/env python3
"""List WxCC skills (v1). Requires org id — pass as first arg or WXCC_ORG_ID env."""

import os
import sys

from _common import main_wrapper, pretty_print, request


def main():
    org_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WXCC_ORG_ID")
    if not org_id:
        print("Usage: python list_skills.py <org_id>")
        print("  or set WXCC_ORG_ID")
        sys.exit(2)

    status, payload = request("GET", f"/organization/{org_id}/skill")
    pretty_print(status, payload)

    if status == 200 and isinstance(payload, list):
        print(f"\nFound {len(payload)} skill(s)")
        for skill in payload[:10]:
            print(f"  - {skill.get('name')} ({skill.get('id')}) type={skill.get('skillType')}")
        if len(payload) > 10:
            print(f"  ... and {len(payload) - 10} more")


if __name__ == "__main__":
    main_wrapper(main)
