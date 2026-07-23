# API exploration scripts

Python scripts for probing WxCC APIs before wiring the widget. Set `WXCC_ACCESS_TOKEN` in your environment (do not commit tokens to source control).

## Setup

```bash
cd scripts
export WXCC_ACCESS_TOKEN="your-bearer-token"
export WXCC_ORG_ID=your-org-id
```

## Org id for test tenant

```
WXCC_ORG_ID=1ebf1b9c-4648-4d25-af89-b8daf52458bd
```

Derived from `python3 discover_org_id.py` (Webex People `/me` orgId).

## Scripts

| Script | Purpose |
|--------|---------|
| `discover_org_id.py` | Token sanity check; Webex `/people/me`; WxCC session probe |
| `list_skills.py` | `GET /organization/{orgId}/skill` |
| `list_skill_profiles.py` | `GET /organization/{orgId}/v2/skill-profile` + sample detail |
| `list_users.py` | `GET /organization/{orgId}/user` |
| `get_user_by_id.py` | `GET /organization/{orgId}/user/{id}` |
| `get_team_by_id.py` | `GET /organization/{orgId}/team/{id}` |
| `update_user_skill_profile.py` | Dry-run (default) or `--apply` PUT user skillProfileId |

## Example

```bash
export WXCC_ORG_ID=1ebf1b9c-4648-4d25-af89-b8daf52458bd
python3 list_skills.py
python3 list_skill_profiles.py
python3 get_user_by_id.py $WXCC_ORG_ID 02815760-4c11-494c-b5d7-547553d422f8
```

## Findings (2026-07-23)

- Test token has admin-level access to config APIs in the sandbox org.
- Skill profiles v2 list returns paginated `{ data, meta }`; use v1 GET by id for full `activeSkills`.
- `skillProfileId` on **users** is an individual assignment; changing it only affects that agent.
- PUT `/skill-profile/{id}` modifies the **shared** profile definition and would affect all agents on that profile — **not used by this widget**.
- Agent Desktop `$STORE.auth.accessToken` is read-only (`cjp:config_read`); writes use a Service App backend proxy.
