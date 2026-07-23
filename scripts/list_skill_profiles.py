#!/usr/bin/env python3
"""List WxCC skill profiles (v2 list + optional v1 detail)."""

import os
import sys

from _common import main_wrapper, pretty_print, request


def main():
    org_id = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("WXCC_ORG_ID")
    if not org_id:
        print("Usage: python list_skill_profiles.py <org_id>")
        print("  or set WXCC_ORG_ID")
        sys.exit(2)

    print("=== Skill Profiles v2 (list) ===")
    status, payload = request("GET", f"/organization/{org_id}/v2/skill-profile")
    pretty_print(status, payload)

    profiles = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(profiles, list):
        profiles = []
    if profiles:
        first_id = profiles[0].get("id")
        print(f"\n=== Skill Profile detail (v1 GET by id: {first_id}) ===")
        status2, detail = request("GET", f"/organization/{org_id}/skill-profile/{first_id}")
        pretty_print(status2, detail)


if __name__ == "__main__":
    main_wrapper(main)
