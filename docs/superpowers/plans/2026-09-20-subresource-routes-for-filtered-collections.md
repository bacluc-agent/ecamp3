# Subresource Routes for Filtered Collections — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add parent-scoped subresource GET collection routes for entities that currently rely only on query-param filters (`?camp=`, `?materialList=`, etc.), while keeping backward compatibility, adding deprecation notes, and ensuring Varnish/API cache can cache the new routes.

**Architecture:** Reuse existing API Platform subresource patterns (`uriTemplate`, `uriVariables` with `Link`, `security`, `extraProperties`). No new controllers or providers needed for most entities; MaterialItemCollectionProvider needs a filter guard update. Minimal annotation-only changes.

**Tech Stack:** Symfony 7 / API Platform 4 (PHP 8.3), Doctrine ORM, existing `SearchFilter`, custom filters (`MaterialItemPeriodFilter`, `ProfileSearchFilter`, `CampCollaboratorFilter`).

**Spec:** Based on refiner analysis of ecamp/ecamp3 branch `issue-223-subresources` at `/tmp/ecamp3`. Read: AGENTS.md (`/tmp/ecamp3/AGENTS.md`), CLAUDE.md (`/tmp/ecamp3/CLAUDE.md` → `AGENTS.md`).

---

## Global Constraints

- No new dependencies (`composer.json` untouched).
- Minimal diff: reuse existing `ApiResource` operation patterns (`GetCollection` with `uriTemplate`).
- Backward compatibility: existing query-param filters (`?camp=`, `?materialList=`, etc.) must remain functional but deprecated.
- Deprecation notes: add `openapi` description on the deprecated collection operation (or on the filter property docs) stating the query-param filter is deprecated in favor of the subresource route.
- Cache: new subresource GETs must use same `Cache-Control` behavior as existing collections (rely on `CacheControlListener` and `CanGenerateTagsInterface` where applicable; no custom cache headers needed).
- Security: subresource routes must use `Link` with `security` expression referencing the parent entity (same pattern as `Activity::CAMP_SUBRESOURCE_URI_TEMPLATE`).
- `ponytail:` comments required for any simplification (e.g., not adding subresources for entities that don't need them, not creating custom controllers).

---

## Problem Summary (from refiner)

Entities with filters but missing parent-scoped subresource routes:

| Entity | Existing Filter(s) | Missing Subresource Route(s) |
|---|---|---|
| `MaterialList` | `?camp=` | `/camps/{campId}/material_lists` |
| `MaterialItem` | `?camp=`, `?materialList=`, `?materialNode=` | `/camps/{campId}/material_items`, `/material_lists/{materialListId}/material_items`, `/content_node/material_nodes/{materialNodeId}/material_items` |
| `ActivityResponsible` | `?activity=`, `?activity.camp=` | `/activities/{activityId}/activity_responsibles` |
| `Profile` | `?user.collaborations.camp=` | `/camps/{campId}/profiles` (or `/users/{userId}/profiles` — see decision below) |
| `Period` | `?camp=` | `/camps/{campId}/periods` (check if exists — it does NOT) |

Some entities already have subresources (`Activity`, `Checklist`, `ChecklistItem`, `Day`, `DayResponsible`, `ScheduleEntry`, `Category`, `ActivityProgressLabel`, `CampCollaboration`, `Comment`).

`MaterialItemCollectionProvider` throws `BadRequestHttpException` if no filter (`camp`, `period`, `materialList`, `materialNode`) is present. Subresource routes provide the filter implicitly via `uriVariables`, so the provider must recognize subresource context.

Custom filters: `MaterialItemPeriodFilter`, `ProfileSearchFilter`, `CampCollaboratorFilter`.

---

## Approach Selection

**Approach A (chosen): Annotation-only subresource routes**
- Add `GetCollection` operations with `uriTemplate` and `uriVariables` to each entity's `#[ApiResource]`.
- Update `MaterialItemCollectionProvider` to allow subresource requests (detect `uriVariables` or query params).
- Add deprecation notes via `openapi` descriptions on the base `GetCollection` or filter docs.
- Reuse existing security patterns (`Link` with `security` expression).

**Approach B (rejected): Custom controllers for each subresource**
- Would require new controller classes, more files, more maintenance. Not needed because API Platform's `GetCollection` with `uriVariables` handles filtering automatically via Doctrine ORM relations.

**Approach C (rejected): Modify `MaterialItemCollectionProvider` extensively**
- Only minimal change needed: allow requests that come from subresource routes (where `uriVariables` provide the parent). Don't rewrite the provider.

---

## Detailed Implementation Guidance

### 1. MaterialList (`/api/src/Entity/MaterialList.php`)

**New subresource:** `/camps/{campId}/material_lists{._format}`

**Changes:**
- Add `GetCollection` operation with `uriTemplate` pointing to `self::CAMP_SUBRESOURCE_URI_TEMPLATE` (define constant).
- `uriVariables`: `campId` → `Link(toProperty: 'camp', fromClass: Camp::class, security: 'is_granted("CAMP_COLLABORATOR", camp) or is_granted("CAMP_IS_PUBLIC", camp)')`.
- `security`: `is_fully_authenticated()` (same as base collection).
- `extraProperties`: `['filter_by_current_user' => false]` (same pattern as `Activity`).
- `normalizationContext`: reuse `['groups' => ['read']]`.

**Backward compatibility:**
- Existing `GetCollection` (base `/material_lists`) stays unchanged.
- Existing `#[ApiFilter(filterClass: SearchFilter::class, properties: ['camp'])]` stays.
- Add deprecation note: on the base `GetCollection` operation, add `openapi: new OpenApiOperation(description: 'Deprecated: use /camps/{campId}/material_lists instead.')`.

**Cache:** No extra work; `CacheControlListener` handles it.

**Ponytail simplification:** `# ponytail: no custom controller needed; API Platform subresource handles filtering via Doctrine relation.`

---

### 2. MaterialItem (`/api/src/Entity/MaterialItem.php`)

**New subresources:**
- `/camps/{campId}/material_items{._format}`
- `/material_lists/{materialListId}/material_items{._format}`
- `/content_node/material_nodes/{materialNodeId}/material_items{._format}`

**Changes:**
- Define constants for URI templates (same naming convention as `Activity::CAMP_SUBRESOURCE_URI_TEMPLATE`).
- Add three `GetCollection` operations:
  1. `uriTemplate: '/camps/{campId}/material_items{._format}'`, `uriVariables`: `campId` → `Link(toProperty: 'camp', fromClass: Camp::class, security: ...)`.
  2. `uriTemplate: '/material_lists/{materialListId}/material_items{._format}'`, `uriVariables`: `materialListId` → `Link(toProperty: 'materialList', fromClass: MaterialList::class, security: ...)`.
  3. `uriTemplate: '/content_node/material_nodes/{materialNodeId}/material_items{._format}'`, `uriVariables`: `materialNodeId` → `Link(toProperty: 'materialNode', fromClass: MaterialNode::class, security: ...)`.
- Each subresource `GetCollection` uses `security: 'is_fully_authenticated()'` (same as base) and `provider: MaterialItemCollectionProvider::class` (same provider).
- `extraProperties`: `['filter_by_current_user' => false]`.

**MaterialItemCollectionProvider update (`/api/src/State/MaterialItemCollectionProvider.php`):**
- Current guard: `if (!$hasFilter) throw new BadRequestHttpException(...)`.
- Modify to also allow requests where `uriVariables` contain the parent (e.g., `campId`, `materialListId`, `materialNodeId`). If `uriVariables` is non-empty and contains a recognized parent key, skip the `BadRequestHttpException`.
- `# ponytail: minimal guard change — check $uriVariables instead of only $request->query.`

**Backward compatibility:**
- Base `GetCollection` (`/material_items`) stays with `provider: MaterialItemCollectionProvider::class`.
- Existing filters (`SearchFilter` for `camp`, `materialList`, `materialNode`; `MaterialItemPeriodFilter`) stay.
- Add deprecation note on base `GetCollection`: `openapi: new OpenApiOperation(description: 'Deprecated: use subresource routes (/camps/{campId}/material_items, /material_lists/{materialListId}/material_items, etc.) instead.')`.

**Cache:** Subresource GETs will be cached by `CacheControlListener` automatically; no custom tags needed unless `CanGenerateTagsInterface` is implemented (MaterialItem does not implement it, so no extra tags).

---

### 3. ActivityResponsible (`/api/src/Entity/ActivityResponsible.php`)

**New subresource:** `/activities/{activityId}/activity_responsibles{._format}`

**Changes:**
- Define `ACTIVITY_SUBRESOURCE_URI_TEMPLATE` constant.
- Add `GetCollection` with `uriTemplate`, `uriVariables`: `activityId` → `Link(toProperty: 'activity', fromClass: Activity::class, security: 'is_granted("CAMP_COLLABORATOR", activity) or is_granted("CAMP_IS_PUBLIC", activity)')`.
- `security`: `is_fully_authenticated()`.
- `extraProperties`: `['filter_by_current_user' => false]`.
- `normalizationContext`: `['groups' => ['read']]`.

**Backward compatibility:**
- Existing `GetCollection` (`/activity_responsibles`) stays.
- Existing `#[ApiFilter(filterClass: SearchFilter::class, properties: ['activity', 'activity.camp'])]` stays.
- Add deprecation note on base `GetCollection`.

---

### 4. Profile (`/api/src/Entity/Profile.php`)

**New subresource:** `/camps/{campId}/profiles{._format}` (or `/users/{userId}/profiles` — see decision)

**Decision:** The filter is `?user.collaborations.camp=`. The parent is `Camp` (via `user.collaborations.camp`). The subresource should be `/camps/{campId}/profiles` because the filter is camp-scoped. This aligns with other camp-scoped subresources.

**Changes:**
- Define `CAMP_SUBRESOURCE_URI_TEMPLATE` constant (`/camps/{campId}/profiles{._format}`).
- Add `GetCollection` with `uriVariables`: `campId` → `Link(toProperty: 'user.collaborations.camp', ...)` — but `Profile` does not have a direct `camp` property. It has `user` (OneToOne) and the filter uses `user.collaborations.camp`.

**Simplification / Ponytail:** `# ponytail: Profile does not implement BelongsToCampInterface directly; using a subresource based on `user.collaborations.camp` requires a custom filter or a different approach. For minimal diff, skip Profile subresource or use `/users/{userId}/profiles` instead.`

**Revised approach for Profile:**
- Since `Profile` has `user` (OneToOne), a simpler subresource is `/users/{userId}/profiles{._format}`.
- `uriVariables`: `userId` → `Link(toProperty: 'user', fromClass: User::class, security: 'is_granted("CAMP_COLLABORATOR", user) ...')` — but `Profile` security is `is_authenticated()`.
- Actually, the filter `?user.collaborations.camp=` is complex. To keep minimal diff and avoid custom controllers, **skip Profile subresource** or add only `/users/{userId}/profiles`.

**Plan decision:** Add `/users/{userId}/profiles` subresource for Profile. This is simpler and avoids the complex `user.collaborations.camp` link. The existing `?user.collaborations.camp=` filter remains deprecated.

**Changes:**
- Define `USER_SUBRESOURCE_URI_TEMPLATE` (`/users/{userId}/profiles{._format}`).
- `uriVariables`: `userId` → `Link(toProperty: 'user', fromClass: User::class, security: 'is_authenticated()')`.
- `security`: `is_authenticated()`.
- `extraProperties`: `['filter_by_current_user' => false]`.

**Backward compatibility:**
- Existing `GetCollection` (`/profiles`) stays with `ProfileSearchFilter` and `SearchFilter`.
- Add deprecation note.

---

### 5. Period (`/api/src/Entity/Period.php`)

**Check:** Does `/camps/{campId}/periods` exist? No — `Period` has no `CAMP_SUBRESOURCE_URI_TEMPLATE`.

**New subresource:** `/camps/{campId}/periods{._format}`

**Changes:**
- Define `CAMP_SUBRESOURCE_URI_TEMPLATE` (`/camps/{campId}/periods{._format}`).
- Add `GetCollection` with `uriVariables`: `campId` → `Link(toProperty: 'camp', fromClass: Camp::class, security: 'is_granted("CAMP_COLLABORATOR", camp) or is_granted("CAMP_IS_PUBLIC", camp)')`.
- `security`: `is_fully_authenticated()`.
- `extraProperties`: `['filter_by_current_user' => false]`.
- `normalizationContext`: reuse `self::COLLECTION_NORMALIZATION_CONTEXT` (or base `['groups' => ['read']]`).

**Backward compatibility:**
- Existing `GetCollection` (`/periods`) stays with `SearchFilter(properties: ['camp'])` and `CampCollaboratorFilter`.
- Add deprecation note on base `GetCollection`.

---

### 6. OpenAPI / Deprecation Notes

**How to add deprecation notes:**
- API Platform supports `openapi` parameter on operations (`new OpenApiOperation(description: '...')`).
- For filter-level deprecation, add `description` to the filter's `getDescription()` method (e.g., `ProfileSearchFilter`, `MaterialItemPeriodFilter`).
- Example: in `MaterialItemPeriodFilter::getDescription()`, add `'description' => 'Deprecated: use subresource routes instead.'` to the `period` entry.
- Example: in `ProfileSearchFilter::getDescription()`, add `'description' => 'Deprecated: use /users/{userId}/profiles instead.'` to the `search` entry.

**Files to modify for deprecation docs:**
- `/api/src/Doctrine/Filter/MaterialItemPeriodFilter.php`
- `/api/src/Doctrine/Filter/ProfileSearchFilter.php`
- `/api/src/Doctrine/Filter/CampCollaboratorFilter.php` (optional — not strictly required unless we add a subresource that replaces it)

---

### 7. Security / Normalization Context

**Security patterns (reuse existing):**
- Subresource `GetCollection` uses `security: 'is_fully_authenticated()'` (same as base collections for `MaterialItem`, `Period`, `Profile`, `ActivityResponsible`).
- `Link` security expressions reference the parent entity (`camp`, `activity`, `materialList`, `materialNode`, `user`) using the same voter patterns (`CAMP_COLLABORATOR`, `CAMP_IS_PUBLIC`).
- No new voters needed.

**Normalization context:**
- Reuse the entity's existing `normalizationContext` (e.g., `MaterialItem` uses `['groups' => ['read']]`).
- For entities with custom collection contexts (e.g., `Period` has `COLLECTION_NORMALIZATION_CONTEXT`), reuse that for the subresource `GetCollection`.

---

### 8. Cache / Varnish

**Requirements:** Ensure Varnish/API cache can cache new subresource GETs (same `Cache-Control`).

**Implementation:**
- No code changes needed for basic caching; `CacheControlListener` applies `Cache-Control` based on `API_CACHE_ENABLED` and header size.
- For entities implementing `CanGenerateTagsInterface` (`Day`, `ScheduleEntry`), subresource responses will include tags automatically via `TagCollector`.
- `MaterialItem`, `MaterialList`, `ActivityResponsible`, `Profile`, `Period` do not implement `CanGenerateTagsInterface`, so no extra tag logic needed.
- `# ponytail: no custom cache tags needed for entities without CanGenerateTagsInterface.`

---

## Testing Approach

**Unit / Integration tests:**
- Run targeted PHP tests for affected entities: `docker compose exec api composer test api/tests/Functional/MaterialItemTest.php` (or similar path).
- Check existing test patterns in `/api/tests/` for subresource tests (e.g., `ActivityTest.php` likely tests `/camps/{campId}/activities`).
- Add minimal curl verification (see Verification Steps) rather than writing new PHPUnit tests, unless the project requires it. `# ponytail: rely on curl verification and existing functional tests; no new PHPUnit files unless required.`

**Test commands:**
```bash
# From /tmp/ecamp3/api directory (inside docker)
docker compose exec api composer test tests/Functional/MaterialItemTest.php
docker compose exec api composer test tests/Functional/PeriodTest.php
docker compose exec api composer test tests/Functional/ProfileTest.php
```

---

## Verification Steps (curl / test commands)

**Assumptions:** Dev environment running (`docker compose up -d`), API accessible at `http://localhost:8000` (or via nginx proxy). Use a valid JWT token or session cookie.

**1. MaterialList subresource:**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/camps/<campId>/material_lists" | head -c 500
```
Expected: JSON array of `MaterialList` objects (same format as `/material_lists?camp=<campId>`).

**2. MaterialItem subresource (camp):**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/camps/<campId>/material_items" | head -c 500
```
Expected: JSON array; no `BadRequestHttpException`.

**3. MaterialItem subresource (materialList):**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/material_lists/<materialListId>/material_items" | head -c 500
```

**4. MaterialItem subresource (materialNode):**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/content_node/material_nodes/<materialNodeId>/material_items" | head -c 500
```

**5. ActivityResponsible subresource:**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/activities/<activityId>/activity_responsibles" | head -c 500
```

**6. Profile subresource:**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/users/<userId>/profiles" | head -c 500
```

**7. Period subresource:**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/camps/<campId>/periods" | head -c 500
```

**8. Backward compatibility (deprecated filters still work):**
```bash
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/material_items?camp=<campId>" | head -c 500
curl -s -H "Authorization: Bearer <token>" \
  "http://localhost:8000/periods?camp=<campId>" | head -c 500
```
Expected: Same results as subresource routes.

**9. Cache headers:**
```bash
curl -s -o /dev/null -w "%{http_code} %{content_type} %{cache_control}\n" \
  -H "Authorization: Bearer <token>" \
  "http://localhost:8000/camps/<campId>/periods"
```
Expected: `200 application/ld+json` with `Cache-Control: max-age=...` (if `API_CACHE_ENABLED=true`).

---

## File Modification List

| File | Action | Lines / Notes |
|---|---|---|
| `/api/src/Entity/MaterialList.php` | Modify | Add `CAMP_SUBRESOURCE_URI_TEMPLATE`, new `GetCollection` operation, deprecation `openapi` on base `GetCollection`. |
| `/api/src/Entity/MaterialItem.php` | Modify | Add 3 URI template constants, 3 new `GetCollection` operations, deprecation `openapi` on base `GetCollection`. |
| `/api/src/State/MaterialItemCollectionProvider.php` | Modify | Update guard to allow `uriVariables` (subresource context). |
| `/api/src/Entity/ActivityResponsible.php` | Modify | Add `ACTIVITY_SUBRESOURCE_URI_TEMPLATE`, new `GetCollection`, deprecation `openapi`. |
| `/api/src/Entity/Profile.php` | Modify | Add `USER_SUBRESOURCE_URI_TEMPLATE`, new `GetCollection`, deprecation `openapi`. |
| `/api/src/Entity/Period.php` | Modify | Add `CAMP_SUBRESOURCE_URI_TEMPLATE`, new `GetCollection`, deprecation `openapi`. |
| `/api/src/Doctrine/Filter/MaterialItemPeriodFilter.php` | Modify | Add deprecation description to `getDescription()`. |
| `/api/src/Doctrine/Filter/ProfileSearchFilter.php` | Modify | Add deprecation description to `getDescription()`. |

---

## Implementation Tasks (Bite-Sized)

### Task 1: MaterialList Subresource
- [ ] Read `MaterialList.php`.
- [ ] Add `CAMP_SUBRESOURCE_URI_TEMPLATE` constant.
- [ ] Add `GetCollection` operation with `uriTemplate`, `uriVariables`, `security`, `extraProperties`.
- [ ] Add `openapi` deprecation note to existing base `GetCollection`.
- [ ] Verify with curl (`/camps/{campId}/material_lists`).

### Task 2: MaterialItem Subresources + Provider Update
- [ ] Read `MaterialItem.php`.
- [ ] Add 3 URI template constants (`CAMP_SUBRESOURCE_URI_TEMPLATE`, `MATERIALLIST_SUBRESOURCE_URI_TEMPLATE`, `MATERIALNODE_SUBRESOURCE_URI_TEMPLATE`).
- [ ] Add 3 `GetCollection` operations.
- [ ] Add deprecation `openapi` to base `GetCollection`.
- [ ] Read `MaterialItemCollectionProvider.php`.
- [ ] Modify guard: allow `uriVariables` with recognized parent keys.
- [ ] Verify with curl for all 3 subresources.

### Task 3: ActivityResponsible Subresource
- [ ] Read `ActivityResponsible.php`.
- [ ] Add `ACTIVITY_SUBRESOURCE_URI_TEMPLATE` and `GetCollection`.
- [ ] Add deprecation `openapi`.
- [ ] Verify with curl.

### Task 4: Profile Subresource
- [ ] Read `Profile.php`.
- [ ] Add `USER_SUBRESOURCE_URI_TEMPLATE` and `GetCollection`.
- [ ] Add deprecation `openapi`.
- [ ] Verify with curl.

### Task 5: Period Subresource
- [ ] Read `Period.php`.
- [ ] Add `CAMP_SUBRESOURCE_URI_TEMPLATE` and `GetCollection`.
- [ ] Add deprecation `openapi`.
- [ ] Verify with curl.

### Task 6: Filter Deprecation Notes
- [ ] Modify `MaterialItemPeriodFilter.php` (`getDescription`).
- [ ] Modify `ProfileSearchFilter.php` (`getDescription`).
- [ ] Verify OpenAPI docs (`/api/docs` or Swagger UI) show deprecation descriptions.

### Task 7: Cache Verification
- [ ] Run curl with `-w` to check `Cache-Control` on new subresource routes.
- [ ] Confirm no `BadRequestHttpException` for subresource requests.
- [ ] Confirm backward compatibility (`?camp=` filters still return results).

---

## Assumptions & Open Questions (for planner, not implementation)

- **Profile subresource:** Chose `/users/{userId}/profiles` over `/camps/{campId}/profiles` because `Profile` has no direct `camp` relation; the filter uses `user.collaborations.camp`. If the requirement specifically demands `/camps/{campId}/profiles`, a custom filter or provider would be needed — that exceeds minimal diff. `# ponytail: assume /users/{userId}/profiles is acceptable; if not, escalate.`
- **Period subresource:** Confirmed missing (`Period` has no `CAMP_SUBRESOURCE_URI_TEMPLATE`). Adding it aligns with other camp-scoped entities.
- **MaterialItem subresource for `materialNode`:** `MaterialNode` is in `App\Entity\ContentNode\MaterialNode`. The `Link` must reference the correct class. Verify import in `MaterialItem.php` (`use App\Entity\ContentNode\MaterialNode;` already present).
- **No new dependencies:** Confirmed; only `ApiPlatform\Metadata\*` classes used (already in `composer.json`).
- **Testing:** No new PHPUnit files planned; rely on curl verification and existing functional tests. `# ponytail: minimal test overhead.`

---

## References

- Read: `/tmp/ecamp3/AGENTS.md` (line 1-137) — dev environment, testing instructions (`docker compose exec api composer test ...`), code formatting (`composer cs-fix`).
- Read: `/tmp/ecamp3/CLAUDE.md` → `/tmp/ecamp3/AGENTS.md` (same file).
- Read: `/tmp/ecamp3/api/src/Entity/Activity.php` (subresource pattern: `CAMP_SUBRESOURCE_URI_TEMPLATE`, `GetCollection` with `uriVariables`).
- Read: `/tmp/ecamp3/api/src/Entity/Day.php` (subresource pattern: `PERIOD_SUBRESOURCE_URI_TEMPLATE`).
- Read: `/tmp/ecamp3/api/src/State/MaterialItemCollectionProvider.php` (filter guard logic).
- Read: `/tmp/ecamp3/api/src/HttpCache/CacheControlListener.php` (cache behavior).
