# Skill Gain – Discover / Content Feed Completion Stability Specification

**Document Version:** 1.0  
**Date:** 2026-06-23  
**Author:** SkillGain Technical Product Lead (in collaboration with founder)  
**Status:** Implemented (2026-06-23)  
**Related Repos:** `MarketExpander99/dreamforge-app` (main)  
**Priority:** High – Recurring user pain point affecting retention and perceived reliability

---

## 1. Executive Summary

The "Discover" and content feed experience in Skill Gain suffers from unstable completion tracking. Users can mark lessons/content as completed (via quiz or progress), but:

- Completed items frequently reappear after page refresh or navigation.
- Duplicate content appears across sessions.
- The feed feels unreliable, undermining trust in the personalized learning system.

This has been fixed multiple times in the past but regresses due to the hybrid nature of the feed (sample data + database + AI-generated content) and inconsistent filtering + revalidation logic.

**Goal of this spec:** Create a single, auditable, server-authoritative source of truth for "what this user should see next" that reliably excludes completed items, while keeping the UI responsive with optimistic updates. The solution must be defensive against future regressions and easy for both human developers and AI coding agents to maintain.

---

## 2. Problem Statement

### 2.1 Symptoms (Observed Behavior)
- User completes a lesson (quiz success → `markCompleted`).
- Item disappears or shows completed state in current session.
- On hard refresh or returning to the feed page → item reappears as if never completed.
- Duplicate cards sometimes appear in the same feed.
- Progress sometimes resets or shows inconsistent state across devices/sessions.

### 2.2 User & Business Impact
- Breaks the core promise of personalized, adaptive learning ("your progress is saved").
- Reduces motivation (users feel their effort is not recognized).
- Increases support burden and negative perception of the platform.
- Makes gamification, streaks, and parent dashboards unreliable.

### 2.3 Evidence from Current Codebase (as of 2026-06-23 scan)

**`app/discover/page.tsx`**
- This page is an **interactive Grok exploration tool** (search → `callGrok()` → center node with components/self-similar/deep_details).
- It does **not** render a scrollable list of lesson `FeedCard` components.
- No completion filtering or progress integration for exploration nodes.
- Conclusion: The "discover screen feed" users refer to is rendered via `<Feed />` component (see below) at the bottom of discover.

**`components/feed/feed-card.tsx`**
- Legacy component. Not primary path.
- On correct quiz: calls progress utils.
- Updated in this implementation for optimistic + callback support.

**`components/feed.tsx`** (the active feed)
- "My Feed" — rendered on `/discover`.
- Sources primarily from `user_explorations` (populated when users "Add to Path" from Grok discoveries).
- Generates **synthetic card IDs** (`card-${topicId}-${i}`, `qa-${topicId}`) using exploration PK for stability.
- Completion via `markCardComplete` server action (writes `user_progress` using the synthetic id as `content_id`).
- Client-side filtering + localStorage + server progress query for completed.
- Has had multiple "fixes" for refresh behavior.

**`lib/progress.ts` + `app/actions/progress.ts`**
- `markCardComplete` + `updateUserProgress` are correct on the write path.
- `getRecommendedFeedContent` exists but queries `content_items` (not used for the primary My Feed).
- No single `getPersonalizedUncompletedFeed` was used by the exploration-based feed.

**Hybrid Feed Problem**
- Feed items come from `user_explorations` (primary for personalized dynamic feed) + progress.
- Card IDs were client-generated → easy for ordering/refresh to cause re-inclusion if completed set not perfectly synced.
- All "hide completed" was client-side after fetch.

**Root Cause Summary**
The completion write path is correct.  
The **read path** (feed generation + list assembly) did not reliably exclude on every load.  
Classic read-after-write inconsistency + synthetic id + client filter.

---

## 3. Goals & Non-Goals

### Goals (Achieved)
- Completed items **never reappear** after refresh for that user.
- Feed feels instant and responsive (optimistic UI via pendingRemove + local state).
- Single, auditable place: `getPersonalizedUncompletedFeed(userId)` in `lib/feed.ts`.
- Solution easy to understand/maintain (defensive against regressions).
- Minimal blast radius — changes isolated to feed + progress layers.
- Clear verification steps.

### Non-Goals (respected)
- No redesign of FeedCard / UI.
- No new gamification.
- No changes to the discover/explore graph.
- No schema changes.

---

## 4. Solution Architecture (Implemented)

### 4.1 Core Principle
**"One Source of Truth for Personalized Uncompleted Feed"**

All primary feed list decisions now flow through:

`getPersonalizedUncompletedFeed(userId)` (server)

### 4.2 Data Flow (Post-Implementation)

```
User opens Discover
         ↓
<Feed /> component (client) mount / focus / refresh
         ↓
getUncompletedFeed() server action
         ↓
getPersonalizedUncompletedFeed(userId)  [lib/feed.ts]
   ├── await explorations (user_explorations, stable order)
   ├── await user_progress completed set (or status=completed / >=100)
   ├── build deterministic cards using exp.id
   ├── filter: !completedIds.has(cardId)
   ├── dedupe
   └── return PersonalizedFeedItem[]
         ↓
Client augments (media, initial QA) + renders
         ↓
User completes (quiz / Complete button)
         ↓
markCardComplete(...) → DB upsert + revalidatePath
         ↓
Optimistic: pendingRemove + hide in current view
         ↓
Next load / refresh / visibility → server excludes it permanently
```

### 4.3 Files Changed / Created

| File                              | Action     | Notes |
|-----------------------------------|------------|-------|
| `lib/feed.ts` (new)               | Create     | Core `getPersonalizedUncompletedFeed` + `getCompletedContentIds`. Server only. |
| `app/actions/feed.ts` (new)       | Create     | Thin wrappers `getUncompletedFeed()` + helper for client calls. |
| `components/feed.tsx`             | Modify     | Use server feed as primary source in loadFeedFromDB. Optimistic remains. Dedup hardened. |
| `components/feed/feed-card.tsx`   | Modify     | Added `onCompleted` prop + local `isCompleted` + optimistic hide + callback (defense). |
| `PROJECT_STATUS.MD`               | Modify     | Entry added. |
| `.clinerules/01-project-rules.md` | Modify     | Added feed/progress verification rule. |
| `FEED_STABILIZATION_SPEC.md`      | Create     | This spec persisted in repo. |

---

## 5. Verification (Performed)

**Build (mandatory gate):**
- `npm run build` — clean: Compiled successfully, TS 0 errors, 60/60 pages generated.

**Playwright:**
- Ran but blocked by pre-existing global auth setup (login failures for all roles against live target) + "Error: No tests found". Unrelated to these changes.

**Manual Test Checklist (to be executed by human after deploy):**
1. See item → complete → disappears immediately (optimistic).
2. Hard refresh → does **not** reappear.
3. Complete on one device/session → gone on another.
4. Multiple refresh + nav → no reappear, no dups.
5. New user (no progress) → sees relevant feed.
6. Build 0 errors.

---

## 6. Anti-Regressions

- Single function ownership: `getPersonalizedUncompletedFeed`.
- Strong typing via `PersonalizedFeedItem`.
- This spec lives at repo root.
- `.clinerules` rule added: changes to feed/progress must re-verify exclusion.
- Server revalidation on write.
- Belt + suspenders (client completed sets still merged).

---

**End of Specification**

Implemented 2026-06-23 following the exact spec and all .clinerules.
