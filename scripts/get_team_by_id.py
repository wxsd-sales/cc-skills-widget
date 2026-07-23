#!/usr/bin/env python3
"""Get a specific WxCC team — teams may include skillProfileId and dynamicSkills."""

import os
import sys

from _common import main_wrapper, pretty_print, request


def main():
    if len(sys.argv) < 3:
        print("Usage: python get_team_by_id.py <org_id> <team_id>")
        sys.exit(2)

    org_id, team_id = sys.argv[1], sys.argv[2]
    status, payload = request("GET", f"/organization/{org_id}/team/{team_id}")
    pretty_print(status, payload)


if __name__ == "__main__":
    main_wrapper(main)
