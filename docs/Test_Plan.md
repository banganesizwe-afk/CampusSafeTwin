# CampusSafe Twin — Final Verification / UAT Plan

Run these checks against a freshly reset practice dataset before recording the video and again before final assessment.

## Authentication and roles
- [ ] Seeded Student signs in and lands on Student map.
- [ ] Seeded CPS user signs in and lands on CPS dashboard.
- [ ] Wrong password returns a generic sign-in error.
- [ ] Signed-out user cannot open Report, Route, CPS or Analytics routes.
- [ ] Student token receives HTTP 403 from CPS-only APIs.

## Reporting
- [ ] Report form contains closed type list, map location, description and optional photo.
- [ ] Missing type/description/pin blocks submit.
- [ ] Outside-boundary point is rejected and no row is created.
- [ ] Valid report without photo returns success in about three seconds and reference number.
- [ ] New row has status New, signed-in reporter and server timestamp.
- [ ] JPEG/PNG under 5 MB is stored privately.
- [ ] Wrong photo type or >5 MB is rejected while text report can still save.
- [ ] Other student cannot open reporter’s detailed incident or photo.

## CPS operations
- [ ] New report appears on open CPS dashboard within about ten seconds with no page reload.
- [ ] Type/status/date filter updates list and map together.
- [ ] Incoming live event does not reset operator filters, selection or map position.
- [ ] Disconnecting live channel activates polling fallback.
- [ ] Stale indicator appears when neither live events nor successful refreshes are current.
- [ ] New → Acknowledged succeeds.
- [ ] New → Resolved is rejected.
- [ ] Acknowledged → In Progress succeeds.
- [ ] In Progress → Resolved succeeds.
- [ ] Invalid/Duplicate classification is terminal.
- [ ] Status update and history entry are both present after a successful transition.
- [ ] CPS can open private attached photo.

## Analytics
- [ ] Type counts match a manual count of valid seed incidents.
- [ ] Invalid and Duplicate are excluded.
- [ ] Daily trend renders with practice data.
- [ ] Clustered practice data produces visible hotspot intensity.
- [ ] Student token cannot call analytics.

## Routing
- [ ] Main Gate → Engineering Walk returns a line on the prepared graph within about two seconds and demonstrates the seeded weighting scenario.
- [ ] Off-boundary point is refused.
- [ ] Point too far from graph is refused.
- [ ] Distance-only route is returned.
- [ ] Risk-weighted result can prefer an alternative when recent valid reports are near the shorter path.
- [ ] Invalid/Duplicate incidents do not contribute to edge risk.
- [ ] Result is called a safer-route recommendation, never a safe route.
- [ ] Non-guarantee warning is visible with every result.

## Reset and recovery
- [ ] `npm run db:reset` succeeds.
- [ ] Running reset twice yields identical headline incident counts.
- [ ] Seed contains both roles, visible hotspot data and route-affecting incidents.
- [ ] Tagged known-good build exists before submission.
- [ ] `.env` files and secrets are not committed.
