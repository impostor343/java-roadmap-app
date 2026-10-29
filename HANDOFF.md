# HANDOFF: Java Roadmap app (read this first)

This file lets any AI assistant continue the project without the earlier chat.
Last updated after Stage 4 was rebuilt with notes and a date strip (awaiting the user's phone test).

## 1. What this is
A personal, installable, offline-first Progressive Web App (PWA) that lets one
GTU CSE student follow a 246-day Java internship learning roadmap on an Android
phone. Source of truth: an Excel workbook, GTU_Java_Internship_Roadmap_REPAIRED.xlsx.
The app has no Excel reader; the workbook was converted once into JSON files.

## 2. The user and how to work with them
- Beginner programmer. Explain in plain English. Give exact file paths.
- Works almost entirely on an Android phone (Chrome, Files app, GitHub website).
- Zero budget: free tools only. No accounts, ads, analytics, API keys or backend.
- Wants small steps: ONE stage per response, state the goal, list the exact
  files, give complete replacement files, then a short test checklist.
- Never claim something is tested unless it really was. Say what was and was
  not checked. Wait for the user's test result before the next stage.
- During design, ask ONE question per message with simple options.
- Never invent roadmap entries, problems, links, resources or project steps.
  If data is unclear, ask the user.
- Do not change architecture (no React, TypeScript, build tools, frameworks).

## 3. Tech and hosting
- Plain HTML, CSS, vanilla JavaScript. Manifest now; service worker in Stage 8.
- Progress storage (later): IndexedDB. Export/restore backup as a downloadable file.
- Hosting: GitHub Pages (free). Account: impostor343. Repo: java-roadmap-app (public).
- Live address: https://impostor343.github.io/java-roadmap-app/
- Temporary data page: .../data-check.html (to be removed before the final version).
- It is a PWA, not an APK. Install via Chrome menu, Install app / Add to Home Screen.
  Full offline support and proper install are Stage 8.

### How the user updates files (works on a phone)
Each stage is delivered as a small zip of changed files. The user extracts it
in the Files app, then uploads each file with GitHub's upload pages, which
create folders automatically and replace same-named files:
- Root files: https://github.com/impostor343/java-roadmap-app/upload/main
- css/: .../upload/main/css    js/: .../upload/main/js
- data/: .../upload/main/data  icons/: .../upload/main/icons
Then tap Commit changes, wait about a minute, reopen the app address.
Note: when scripting zips, create folders with separate mkdir commands
(brace expansion like {css,js} failed in the shell used earlier).

## 4. Folder structure (current)
```
java-roadmap-app/
  index.html               shell: header, 6 screens, bottom tab bar, Info dialog
  manifest.webmanifest     install info (white background/theme colours)
  css/styles.css           design tokens (light + dark) and all styles
  js/app.js                screen switching by URL hash
  js/data.js               loads data once; window.RoadmapData shared helpers
  js/today.js              Today card, Previous/Next, Info sheet; window.TodayView.showDay(day)
  js/store.js              IndexedDB wrapper: window.RoadmapStore (getNote, saveNote, deleteNote, allNotes); db 'java-roadmap', store 'dayNotes', key = roadmap day number
  js/notes.js              My notes section: window.DayNotes.mount(parent, entry, idPrefix, onChange) and flush()
  js/calendar.js           Google-Calendar-style month grid, chips, legend, preview, notes
  js/data-check.js         temporary data check page script
  data-check.html          temporary data check page
  data/roadmap.json        246 entries from the workbook
  data/questions.json      56 Question Bank entries
  data/projects.json       7 project records with 24 versions
  data/resources.json      free resources list
  data/display-titles.json display titles for 23 cut-off workbook titles
  icons/                   icon-192.png, icon-512.png, icon-maskable-512.png
  DESIGN_SPEC.md           approved design
  PROJECT_STATUS.md        short status
  HANDOFF.md               this file
```
Script order in index.html: app.js, data.js, store.js, notes.js, today.js, calendar.js.
Note record: {day, date, did, review, remarks, updatedAt}. Empty notes are deleted, not stored.
`window.RoadmapData` has: entries, titles, ready (Promise), two(), toDate(),
formatDate(iso), titleOf(entry), plainTitle(entry), todayIso(), projectNames.

## 5. The workbook (inspect again if you can; ask the user to attach it)
Sheets: Daily Roadmap, Calendar View, App Display & Design, Question Bank, Free
Resources, Project Milestones, Project Version Map, Weekly Review, Read Me First,
plus Claude Guide and Workbook QA in the repaired file.
- 246 consecutive days, 28 Oct 2026 to 30 Jun 2027 (Day 1 = Wed 28 Oct 2026).
- roadmap.json entry fields: day, date (ISO), phase, topics, task, resource
  {text, name, url}, practice, project, publish, folder, time, group, symbol,
  topicDay, title, projectKey (null on plain days), projectNotes.
- Overall roadmap day (day) is different from topicDay (resets per topic sequence).
  Card shows both: "Methods 01" (topic day) and "Day 1 of 246".
- 152 entries have resource links; others have plain text (no fake links).
- questions.json: 56 entries: id, platform, title, url, difficulty, prerequisites,
  recommendedDate, recommendedDay, assignmentRule, purpose, status, notes.
  14 are "Assigned (suggested)" to a real day; the rest are catalogue or pending,
  including 8 Codex slots with no titles/URLs yet. All assigned dates match the roadmap dates.
- Projects (six, with colours): Guessing Game (blue), Banking (green), Smart Library
  (purple), Inventory (orange), Task Management REST API (teal), Semester Planner
  Android App in Java (pink). Also a "frontend extension" record with no colour,
  and an optional concurrency extension of Banking. Semester 3 finals and all
  Semester 4 dates are provisional, not official.

## 6. Design decisions made by the user (interview answers)
1. Style: clean and minimal, lots of space, calm.
2. Palette: first cream + soft green; LATER CHANGED to white base with green as
   the main accent, plus blue, purple and pink as supporting colours.
3. Theme: follows the phone (light and dark both supported).
4. Daily card: single centred card. Revised order: date, topic group as a LARGE
   heading (e.g. Java basics), big emoji symbol, title with topic-day number,
   then "Day N of 246", suggested time, status marker.
5. Extras on card: date, overall day, suggested time, status marker (symbol + word).
6. Info screen: bottom sheet sliding up over the card.
7. Info content: plain lines "**Bold label:** info" (own idea). Empty ones are hidden.
8. Navigation: bottom bar of 5 tabs (Today, Calendar, Questions, Projects,
   Progress); Settings is an icon in the top corner.
9. Calendar: first a card-style grid; REVISED by the user to a Google Calendar
   style grid (rows/columns, thin lines, one coloured chip per day with emoji + topic name).
   Tapping a date shows a preview and list, plus a My notes section.
10. Cell text: emoji plus topic name in very small text, wrapping to 2 lines;
    full name appears in the preview.
11. Project colours: workbook colours softened to pastel; teal and pink replace
    pale green and pale red so they stay distinguishable.
12. Status markers: small corner symbols (check = done, arrow = skipped, loop =
    catch-up done), done days dimmed slightly, pending has none. Never rely on colour alone.
13. App icons: simple line icons with a text label under each. Topic symbols stay as workbook emoji.
14. Buttons: soft rounded, generous spacing, large text, only subtle fade/slide
    animation (none if reduced motion).
15. Question Bank: grouped by topic in collapsible groups, with a search box.
16. Progress: key numbers (completed, skipped, pending, catch-up queue), one
    progress bar, problems solved, per-project milestone progress. No streaks or guilt.
17. Settings: Export backup, Restore backup (validated + confirmation), note that
    data lives only on this phone, appearance (text size, project colours).
18. Done: saves instantly, then a gentle "Add remark" link appears.
19. Catch-up: a separate Catch-up screen reached from Progress, with a "Do it
    today" button on each item.

### Later user requests (after the interview)
- Add a notes section for any date (calendar) with: what I did today, review, remarks.
  Also shown on Today. Saved automatically on the phone (IndexedDB).
- Today tab: Yesterday / Today / Tomorrow buttons and a Jump to date picker.
- These notes must be included in the Stage 7 backup export/restore.

## 7. Behaviour rules (must be implemented exactly)
- Done: save status, timestamp, checklist state, notes locally; show in calendar
  and progress; never rewrite the original roadmap entry.
- Skipped: keep the original date, mark the entry skipped, add the work to a
  separate catch-up queue, never shift later dates, avoid duplicate catch-up entries.
- Catch-up completion is recorded separately; it does not pretend the original day was done on time.
- Next/Previous follow the ORIGINAL roadmap order, even if an entry is skipped.
- Progress statistics come only from real saved data. Scheduled and catch-up
  completions are counted separately.
- Backup: export to a file, import with validation, confirm before replacing,
  clear success/error messages, handle old/invalid files.
- Be honest that local data can be lost if browser data is cleared; external
  links need internet.

## 8. Data decisions made with the user
- 23 workbook titles were cut off with "..." . Display overrides live in
  data/display-titles.json: project days show the project title only with no
  number (e.g. "Banking project", "Guessing Game V3", "Concurrency lab"); other
  days show the full topic text plus the number. Original workbook titles are untouched.
- Days 218 and 221 mention projects but have no colour in the workbook: left as plain days (user agreed).
- Codex = a platform for coding examples and practice. Its name/URL is still
  unknown; its 8 slots stay pending. Do not invent them.
- The workbook has no "Why am I doing this?" text. Do not invent it. Ask the user where it should come from.
- Calendar only colours days that really have a project key in the workbook.
  Task API, Inventory and Semester Planner colour appear only if such days exist.

## 9. Stages
1. Foundation (shell, manifest, icons, styling): DONE, tested by user.
2. Roadmap data (JSON from workbook, data-check page): DONE, tested by user.
3. Daily card + Previous/Next + Info sheet: DONE, tested by user ("all fine").
4. Calendar (Google-style grid, project colours, legend, preview, Open card, notes marker),
   My notes section, and Today date strip: BUILT and checked in headless Chromium at phone
   size (grid, notes saving and surviving a reload, jump to date). NOT yet tested by the user on the phone.
5. Done, Skipped, remarks, notes, checklist, catch-up screen, Progress screen
   (needs saved data; add a small storage layer first or together).
6. Question Bank (topic groups, search, filters, assigned vs unassigned, status,
   notes) and Projects tab (project list, versions/milestones from projects.json).
7. Persistence and backup: IndexedDB, export, validated restore, Settings screen.
8. Offline and install: service worker, caching, update notice, test offline launch.
9. Final testing, remove data-check page, user guide, troubleshooting, known limits.

## 10. Known issues and open items
- Codex name/URL missing. 8 Codex slots pending.
- Info sheet has no "Why am I doing this?" (no workbook data).
- No saved progress yet; status on the card is always "Pending".
- No service worker yet: no offline use and no full install until Stage 8.
- The calendar cell text is very small by design; long names are clamped to 2 lines.
- The user must still check the rebuilt Stage 4 on the phone.
- Notes are in IndexedDB only: backup/restore (Stage 7) must cover them.
- Calendar chip text is tiny and long words may break mid-word in narrow cells.

## 11. Message to paste into a new AI chat
"I am continuing a project. Read HANDOFF.md (attached) and DESIGN_SPEC.md and
PROJECT_STATUS.md. Follow section 2 and section 7 exactly. Ask me to attach
GTU_Java_Internship_Roadmap_REPAIRED.xlsx and any repo files you need. Current
step: Stage 4 is built and awaiting my phone test; after I confirm it, start Stage 5.
Give one small stage at a time, complete replacement files, and a test checklist."
(Repo files can also be read at https://github.com/impostor343/java-roadmap-app)
