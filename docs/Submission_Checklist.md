# CampusSafe Twin — Final Submission Checklist

The eFundi final-submission screenshot requires the following items.

## Video Demonstration — User Guide (5–8 min)
- [x] Timed script prepared in `Video_Demonstration_Script.md`.
- [ ] Record the final working build using the script.
- [ ] Upload the video to the chosen service if eFundi file size is too large.
- [ ] Test the shared video link in a private/incognito browser.

## Documentation
- [x] System Walkthrough / User Guide prepared.
- [x] Developer Manual prepared.
- [x] Final verification/UAT plan prepared.
- [x] Requirement traceability prepared.
- [ ] Convert to the group’s preferred submission format if the lecturer requires PDF/DOCX rather than Markdown.

## Code ZIP / Repository Link
- [x] Complete source tree prepared.
- [x] Database schema/seed/reset scripts included.
- [x] `.env.example` included; real secrets excluded.
- [ ] Push the final tagged build to the group repository.
- [ ] Test repository access from an account that is not already logged in, if the link must be public/shared.

## System Link / Executable for Access
- [x] Local run configuration prepared.
- [x] Docker Compose file for PostGIS prepared.
- [ ] Deploy the React client, Node service and PostgreSQL/PostGIS database to the group’s chosen hosts.
- [ ] Configure HTTPS, `CLIENT_ORIGIN`, `VITE_API_URL`, `DATABASE_URL`, `JWT_SECRET` and `RESET_KEY`.
- [ ] Run `npm run db:init` on the hosted database.
- [ ] Complete the full UAT plan on the public URL.
- [ ] Test the public link in an incognito browser before submitting to eFundi.
