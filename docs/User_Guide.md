# CampusSafe Twin — System Walkthrough / User Guide

## 1. Purpose
CampusSafe Twin is an academic campus-safety digital twin prototype for the defined NWU Potchefstroom working area. It joins incident reporting, a CPS operations dashboard, valid-incident analytics and safer-route recommendations on one map-centred incident model.

The system is **not** an emergency-dispatch service and it does **not** guarantee that a recommended route is safe.

## 2. Practice accounts
- Student: `student@nwu.ac.za` / `CampusSafe123!`
- Second student: `student2@nwu.ac.za` / `CampusSafe123!`
- Campus Protection Services: `security@nwu.ac.za` / `CampusSafe123!`

## 3. Student walkthrough

### 3.1 Sign in
1. Open the system link.
2. Enter the student email/username and password.
3. Select **Sign in**.
4. A Student account opens the student campus map. A CPS account is routed to the CPS dashboard instead.

### 3.2 View the campus map
The student map shows valid incident markers in the defined prototype area. Other students’ names, email addresses, descriptions, security notes and photographs are not exposed on this shared map.

### 3.3 Submit an incident
1. Open **Report**.
2. Choose one category: theft, medical, suspicious activity, vandalism, harassment, or other.
3. Click a point inside the campus boundary.
4. Enter a short description.
5. Optionally select a JPEG/PNG image no larger than 5 MB.
6. Select **Submit report**.
7. A valid report is stored with server time, signed-in reporter, status **New**, and a generated reference number.

If the photograph is invalid, the photograph is rejected while the text report can still be submitted. If the location is outside the boundary or a required field is missing, no incident row is created.

### 3.4 View own reports
Open **My Reports** to see only reports submitted by the signed-in student. Opening a report shows its full description and, when present, the student’s own private attachment. A student cannot open another student’s detailed report by changing the URL.

### 3.5 Request a safer route
1. Open **Safer Route**.
2. Select or click a start and end point near the prepared walking graph.
3. Select **Calculate route**.
4. The dashed route is the distance-only path.
5. The blue route is the safer-route recommendation after recent valid incidents add extra cost to nearby path edges.
6. Read the warning shown with every result.

The output is always a recommendation based only on reported incidents in the configured time window. It does not account for unreported incidents, lighting, pedestrian traffic or live guard presence.

## 4. CPS walkthrough

### 4.1 Open the dashboard
Sign in with the CPS practice account. The dashboard loads:
- incident feed;
- campus map;
- current status counts;
- category/status/date filters;
- selected-incident detail panel.

### 4.2 Live updates and fallback
The dashboard opens an authenticated Socket.IO connection. New reports and status changes update the affected incident without a full-page refresh. The user’s filter settings, selected incident and map position are preserved.

If the live connection drops, polling refreshes the incident list approximately every eight seconds. The dashboard shows whether the live channel, polling fallback or stale state is active.

### 4.3 Work an incident
1. Select an incident from the list or map.
2. Read the full record and private photograph if one exists.
3. Choose the next allowed status.
4. Optionally add a CPS note.
5. Save the change.

Operational progression is:
**New → Acknowledged → In Progress → Resolved**.

A report can also be classified **Invalid** or **Duplicate**. Those classifications are terminal. Every accepted change writes the incident update and history entry in one database transaction.

### 4.4 Filters
The type, status and date filters apply to the feed and map together so the operator does not see two different views of the same data.

### 4.5 Analytics
Open **Analytics** to view:
- valid incident count by category;
- daily time trend;
- map-based hotspot intensity.

Invalid and Duplicate records remain stored for audit purposes but do not contribute to analytics or route risk weighting.

## 5. Demonstration reset
Before formal assessment, restore the known practice set from the server folder:

```bash
npm run db:reset
```

Run it from `server/`. The reset recreates the same headline incident counts and known clustered pattern.

## 6. Important limitations
- Academic prototype only.
- One defined Potchefstroom working area.
- Two roles only: Student and CPS.
- No live NWU SSO, CCTV, access control, student-card, SMS, police or ambulance integration.
- No car or off-campus routing.
- No safety guarantee from route guidance.
