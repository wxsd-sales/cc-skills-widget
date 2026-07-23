#!/usr/bin/env python3
"""
Dry-run: inspect what a user PUT would require for skillProfileId.
Does NOT send PUT unless --apply is passed (and even then only updates skillProfileId).

Usage:
  python update_user_skill_profile.py <org_id> <user_id> <skill_profile_id>
  python update_user_skill_profile.py <org_id> <user_id> <skill_profile_id> --apply
"""

import copy
import sys

from _common import main_wrapper, pretty_print, request


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)

    apply = "--apply" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--apply"]
    org_id, user_id, skill_profile_id = args[0], args[1], args[2]

    status, user = request("GET", f"/organization/{org_id}/user/{user_id}")
    if status != 200:
        pretty_print(status, user)
        sys.exit(1)

    print("Current user skill-related fields:")
    for key in sorted(user.keys()):
        if "skill" in key.lower() or key in ("teamIds", "agentProfileId"):
            print(f"  {key}: {user[key]}")

    payload = copy.deepcopy(user)
    payload["skillProfileId"] = skill_profile_id

    print("\nProposed PUT body keys:", sorted(payload.keys()))
    print(f"  skillProfileId -> {skill_profile_id}")

    if not apply:
        print("\nDry run only. Re-run with --apply to send PUT.")
        return

    status, resp = request("PUT", f"/organization/{org_id}/user/{user_id}", body=payload)
    pretty_print(status, resp)


if __name__ == "__main__":
    main_wrapper(main)
