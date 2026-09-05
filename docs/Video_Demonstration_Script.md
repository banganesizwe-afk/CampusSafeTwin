# CampusSafe Twin — 5–8 Minute Final Video Demonstration Script

## 0:00–0:55 — Overview / Background / Rationale / Purpose
“CampusSafe Twin is our campus safety digital twin prototype for the NWU Potchefstroom Campus working area. The project addresses three main gaps: incidents can be reported late or not at all, Campus Protection Services may not have one consolidated spatial view of reported incidents, and students do not have incident-informed route guidance.

Our solution connects these problems through one incident model and one interactive map. Students can report incidents and request a safer-route recommendation. Campus Protection Services receives the reports, manages their status and views hotspot and trend analytics. This is an academic prototype, not an emergency-dispatch system, and route recommendations are not guarantees of safety.”

## 0:55–2:15 — Student sign-in and incident reporting
“First I will sign in with a Student practice account. The server checks the account and role and opens the Student view.

This is the shared campus map. Coverage is limited to the defined prototype boundary, and students only see limited information for valid incidents.

I’ll now open Report. The incident type is selected from a closed list. I click the map to choose the location, enter a short description, and I can optionally attach a JPEG or PNG photograph. The reporter identity and official time are not typed by the student; they come from the authenticated session and the server.

When I submit, the server verifies the role, required fields and campus boundary, stores the incident as New and returns a reference number. Here is the confirmation and reference.”

## 2:15–3:45 — CPS live dashboard and lifecycle
“Now I’ll switch to the Campus Protection Services account. The dashboard combines the incident feed, map and status counts.

The student’s new report appears without a full-page refresh through the live channel. If that channel disconnects, the dashboard automatically falls back to polling, and the connection indicator shows the operator whether the data is live, using fallback polling, or may be stale.

The same filters control both the feed and the map. I can filter by type, status and date without losing the current map position.

I’ll open the new incident. CPS can see the full description and private attachment when one exists. The allowed operational flow is New, Acknowledged, In Progress and then Resolved. Skipping a step is rejected. I can also classify a report as Invalid or Duplicate. Every accepted status change records the actor, time and optional note in the status history.”

## 3:45–4:40 — Analytics
“Next is the CPS-only analytics view. It shows valid incident counts by category, a simple time trend and hotspot intensity on the map. Invalid and Duplicate reports remain in the database for audit purposes but are excluded from the analytics. This keeps false or repeated records from distorting the hotspot picture.”

## 4:40–5:55 — Safer-route recommendation
“Back in the Student view, I’ll open Safer Route. For this seeded demonstration I’ll choose Main Gate and Engineering Walk. The student can select a start and end point on or near our prepared walking network.

The service first calculates the shortest route by distance. Then it looks at recent valid incident reports near each path edge and adds extra cost to those edges. It calculates the route again using the weighted costs.

The dashed line is the distance-only path and the blue line is the safer-route recommendation. If the incident weighting changes the best option, the system can prefer a slightly longer path that is farther from recent reported incidents.

The warning is always shown: this is only a safer-route recommendation based on reported incidents in the configured time window. It is not a guarantee of safety and it does not include unreported incidents, lighting, foot traffic or live security presence.”

## 5:55–6:35 — My Reports, privacy and reset
“The Student can open My Reports to see only their own submissions. Another student cannot open the detailed report or private photograph by changing the URL because the server checks ownership and role.

For a repeatable assessment demonstration, the project includes a known seeded practice dataset. We can reset it before the presentation so the hotspot counts and routing scenario do not depend on random testing activity.”

## 6:35–6:55 — Conclusion
“In summary, CampusSafe Twin demonstrates the complete path from authenticated student reporting, through near-real-time CPS operations and lifecycle management, to valid-incident analytics and safer-route guidance. The prototype stays within one campus area, two roles and simulated data where live NWU systems are unavailable.”
