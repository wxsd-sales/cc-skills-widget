#!/usr/bin/env python3
"""Create one or more dynamic skill definitions in WxCC.

Usage:
  export WXCC_ACCESS_TOKEN=...
  export WXCC_ORG_ID=1ebf1b9c-4648-4d25-af89-b8daf52458bd

  # Create a single skill
  python3 create_dynamic_skill.py "Primary Language" TEXT

  # Seed contact-center demo skills (skips names that already exist)
  python3 create_dynamic_skill.py --seed

  # Deactivate superseded / confusing demo skills from earlier seeds
  python3 create_dynamic_skill.py --retire-legacy
"""

import argparse
import os
import sys

from _common import main_wrapper, pretty_print, request

ORG = os.environ.get("WXCC_ORG_ID", "1ebf1b9c-4648-4d25-af89-b8daf52458bd")

# Contact-center skills for Nationwide Children's Hospital-style demo.
# PROFICIENCY = 0–10 expertise scale for routing (not yes/no).
# TEXT = free-form label (language name, unit name, etc.).
# BOOLEAN = capability gate (has certification or not).
SEED_SKILLS = [
    {
        "name": "Primary Language",
        "skillType": "TEXT",
        "description": "Language you handle on contacts (e.g. English, Spanish).",
    },
    {
        "name": "Clinical Unit",
        "skillType": "TEXT",
        "description": "Unit or program you support (e.g. Emergency, Scheduling, NICU).",
    },
    {
        "name": "Complex Case Handling",
        "skillType": "PROFICIENCY",
        "description": "Expertise with complex pediatric cases (0=novice, 10=expert). WxCC routing uses 0–10.",
    },
    {
        "name": "Certified Medical Interpreter",
        "skillType": "BOOLEAN",
        "description": "Certified to provide live medical interpretation on patient contacts.",
    },
]

# Earlier sandbox seeds that overlap or confuse agents — retire with --retire-legacy.
RETIRE_SKILL_NAMES = [
    "Language Proficiency",
    "Department",
    "Bilingual Certified",
    "AgentLanguageLevel",
]


def list_skills():
    status, body = request("GET", f"/organization/{ORG}/skill")
    if status != 200 or not isinstance(body, list):
        raise RuntimeError(f"Failed to list skills: HTTP {status} {body}")
    return body


def create_skill(name, skill_type, description=""):
    body = {
        "name": name,
        "description": description,
        "skillType": skill_type,
        "dynamicSkill": True,
        "active": True,
        "serviceLevelThreshold": 0,
    }
    status, resp = request("POST", f"/organization/{ORG}/skill", body)
    return status, resp


def retire_skill(skill):
    payload = {k: v for k, v in skill.items() if k not in ("links", "_links")}
    payload["active"] = False
    status, resp = request("PUT", f"/organization/{ORG}/skill/{skill['id']}", payload)
    return status, resp


def seed_skills():
    existing = {s.get("name", "").lower(): s for s in list_skills()}
    created = []
    skipped = []

    for spec in SEED_SKILLS:
        key = spec["name"].lower()
        if key in existing:
            skipped.append(existing[key])
            print(f"SKIP (exists): {spec['name']} id={existing[key].get('id')}")
            continue
        status, resp = create_skill(spec["name"], spec["skillType"], spec.get("description", ""))
        if status in (200, 201):
            created.append(resp)
            print(f"CREATED: {resp.get('name')} id={resp.get('id')} type={resp.get('skillType')}")
        else:
            print(f"FAILED: {spec['name']} HTTP {status}")
            pretty_print(status, resp)

    print(f"\nSummary: {len(created)} created, {len(skipped)} skipped")
    return created, skipped


def retire_legacy_skills():
    by_name = {s.get("name", "").lower(): s for s in list_skills()}
    retired = []
    missing = []

    for name in RETIRE_SKILL_NAMES:
        skill = by_name.get(name.lower())
        if not skill:
            missing.append(name)
            print(f"SKIP (not found): {name}")
            continue
        if not skill.get("active", True):
            print(f"SKIP (already inactive): {name}")
            continue
        status, resp = retire_skill(skill)
        if status == 200:
            retired.append(name)
            print(f"RETIRED: {name} id={skill.get('id')}")
        else:
            print(f"FAILED to retire {name}: HTTP {status}")
            pretty_print(status, resp)

    print(f"\nSummary: {len(retired)} retired, {len(missing)} not found")
    return retired


def main():
    parser = argparse.ArgumentParser(description="Create WxCC dynamic skill definition(s)")
    parser.add_argument("--seed", action="store_true", help="Create contact-center demo skills")
    parser.add_argument(
        "--retire-legacy",
        action="store_true",
        help="Deactivate superseded demo skills from earlier seeds",
    )
    parser.add_argument("name", nargs="?", help="Skill name")
    parser.add_argument(
        "skill_type",
        nargs="?",
        choices=["PROFICIENCY", "TEXT", "BOOLEAN", "ENUM"],
        help="Skill type",
    )
    parser.add_argument("--description", default="", help="Optional description")
    args = parser.parse_args()

    if not os.environ.get("WXCC_ACCESS_TOKEN"):
        print("Set WXCC_ACCESS_TOKEN before running.", file=sys.stderr)
        sys.exit(2)

    if args.seed:
        seed_skills()
        return

    if args.retire_legacy:
        retire_legacy_skills()
        return

    if not args.name or not args.skill_type:
        parser.print_help()
        sys.exit(2)

    status, resp = create_skill(args.name, args.skill_type, args.description)
    pretty_print(status, resp)
    if status not in (200, 201):
        sys.exit(1)


if __name__ == "__main__":
    main_wrapper(main)
