#!/usr/bin/env python3
"""Deep probe: all plausible per-agent skill assignment mechanisms."""

import copy
import json
import os
import sys

from _common import pretty_print, request

ORG = os.environ.get("WXCC_ORG_ID", "1ebf1b9c-4648-4d25-af89-b8daf52458bd")
TOKEN = os.environ.get("WXCC_ACCESS_TOKEN", "")
EMAIL = "rtaylorhanson+coe@gmail.com"


def find_user(users):
    for u in users:
        if (u.get("email") or "").lower() == EMAIL.lower():
            return u
    return None


def dump_skill_related(obj, label):
    print(f"\n--- {label}: skill-related keys ---")
    if isinstance(obj, dict):
        for k, v in sorted(obj.items()):
            if "skill" in k.lower() or "dynamic" in k.lower():
                print(f"  {k}: {json.dumps(v)[:500]}")
    elif isinstance(obj, list):
        for item in obj:
            dump_skill_related(item, label)


def try_put(label, path, body, dry_run=True):
    print(f"\n=== {label} ===")
    if dry_run:
        print("DRY RUN - would PUT", path)
        print(json.dumps({k: body[k] for k in list(body)[:8]}, indent=2)[:800])
        return None, None
    return request("PUT", path, body)


def main():
    if not TOKEN:
        print("Set WXCC_ACCESS_TOKEN", file=sys.stderr)
        sys.exit(2)

    print("Token user probe for", EMAIL)

    # 1) Resolve WxCC user
    s, users = request("GET", f"/organization/{ORG}/user")
    user = find_user(users if isinstance(users, list) else [])
    if not user:
        print("User not found in list")
        sys.exit(1)
    user_id = user["id"]
    print(f"WxCC user id: {user_id}")
    dump_skill_related(user, "list user")

    s, user_detail = request("GET", f"/organization/{ORG}/user/{user_id}")
    dump_skill_related(user_detail, "GET user by id")
    original = copy.deepcopy(user_detail)

    # 2) Agent session / desktop APIs
    for path in [
        "/v1/agents/session",
        f"/v1/agents/{user_id}",
        f"/v1/agents/{user_detail.get('ciUserId')}/skills",
    ]:
        print(f"\n=== GET {path} ===")
        pretty_print(*request("GET", path))

    # 3) Search OpenAPI-ish paths for dynamic skills on user
    candidate_paths = [
        f"/organization/{ORG}/user/{user_id}/dynamic-skills",
        f"/organization/{ORG}/user/{user_id}/skills",
        f"/organization/{ORG}/user/{user_id}/skill-profile",
        f"/organization/{ORG}/v2/user/{user_id}",
        f"/organization/{ORG}/users/{user_id}/partial-update",
        f"/organization/{ORG}/user/partial-update",
    ]
    for path in candidate_paths:
        s, r = request("GET", path)
        if s != 404:
            print(f"\n=== GET {path} => {s} ===")
            print(json.dumps(r, indent=2)[:1200])

    # 4) PATCH bulk partial update users (changelog mention)
    patch_bodies = [
        {"id": user_id, "skillProfileId": user_detail.get("skillProfileId")},
        {"id": user_id, "dynamicSkills": []},
    ]
    for body in patch_bodies:
        for path_suffix in ["user/partial-update", "v2/user/partial-update", "user/bulk-partial-update"]:
            path = f"/organization/{ORG}/{path_suffix}"
            print(f"\n=== PATCH probe {path} keys={list(body.keys())} ===")
            s, r = request("PATCH", path, body)
            print(f"HTTP {s}: {str(r)[:400]}")

    # 5) Try PUT user with dynamicSkills field (dry run first, then live if field exists in schema)
    if "dynamicSkills" in user_detail:
        print("\nuser already has dynamicSkills field!")
    else:
        print("\nuser GET response has NO dynamicSkills field")

    # Live test: switch skill profile away and back if user has one, or to known profile
    s, profiles = request("GET", f"/organization/{ORG}/v2/skill-profile")
    profile_list = profiles.get("data", []) if isinstance(profiles, dict) else profiles
    if not profile_list:
        print("No skill profiles to test")
        return

    current_profile = user_detail.get("skillProfileId")
    alt = next((p for p in profile_list if p["id"] != current_profile), profile_list[0])
    alt_id = alt["id"]

    print(f"\nCurrent skillProfileId: {current_profile}")
    print(f"Alt profile for test: {alt.get('name')} ({alt_id})")

    if current_profile == alt_id:
        print("Only one effective profile; skipping swap test")
        return

    payload = copy.deepcopy(user_detail)
    for k in ("_links", "links"):
        payload.pop(k, None)
    payload["skillProfileId"] = alt_id

    print("\n=== LIVE TEST: PUT user skillProfileId (will revert) ===")
    s, r = request("PUT", f"/organization/{ORG}/user/{user_id}", payload)
    print(f"PUT swap => HTTP {s}")
    if s != 200:
        print(json.dumps(r, indent=2))
        return

    # revert
    revert = copy.deepcopy(original)
    for k in ("_links", "links"):
        revert.pop(k, None)
    if current_profile:
        revert["skillProfileId"] = current_profile
    else:
        revert.pop("skillProfileId", None)

    s2, r2 = request("PUT", f"/organization/{ORG}/user/{user_id}", revert)
    print(f"PUT revert => HTTP {s2}")
    if s2 != 200:
        print("REVERT FAILED - manual fix may be needed:", json.dumps(r2, indent=2))
    else:
        print("Reverted skillProfileId successfully")


if __name__ == "__main__":
    main()
