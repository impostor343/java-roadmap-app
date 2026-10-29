# Project Status

## Architecture
Plain HTML, CSS and vanilla JavaScript. No build step, no framework, no server.
Roadmap data will be converted from the workbook into a JSON file in `data/`.
Progress will be saved in the browser (IndexedDB) and kept separate from the data.

## Folder structure (Stage 1)
```
java-roadmap-app/
  index.html              page shell, 6 screens, bottom tab bar
  manifest.webmanifest    install information (name, icons, colours)
  css/styles.css          design tokens (light and dark) and base styles
  js/app.js               switches screens using the URL hash
  icons/                  icon-192.png, icon-512.png, icon-maskable-512.png
  data-check.html         temporary page to check the data (removed later)
  js/data.js              loads the data once and shares helpers
  js/calendar.js          month calendar with project colours, legend and preview
  js/today.js             Today card, Previous/Next and the Info sheet
  data/display-titles.json  display titles for the 23 cut-off workbook titles
  js/data-check.js        loads the data files for that page
  data/roadmap.json       246 daily entries (from the repaired workbook)
  data/title-overrides.json  31 shortened display titles (edit this file to change them)
  data/questions.json     56 Question Bank entries
  data/projects.json      7 project records with their versions
  data/resources.json     free resources list
  DESIGN_SPEC.md          approved design
  HANDOFF.md              full handoff for another AI or a new session
  PROJECT_STATUS.md       this file
```

## Stages
- Stage 1 Foundation: BUILT. Not yet tested on the phone.
- Stage 2 Roadmap data: BUILT. Waiting for the user to check data-check.html.
- Stage 3 Daily card and Info sheet: BUILT and checked on the phone by the user.
- Stage 4 Calendar: BUILT. Not yet tested on the phone. Done/skipped markers arrive in Stage 5.
- Stage 5 Done, Skipped, catch-up, progress: not started.
- Stage 6 Question Bank and Projects: not started.
- Stage 7 Storage and backup: not started.
- Stage 8 Offline and install (service worker): not started.
- Stage 9 Final testing and user guide: not started.

## Checks done so far
- app.js passes a JavaScript syntax check.
- manifest.webmanifest is valid JSON.
- index.html tags are balanced.
- NOT done: opening in a real browser, phone layout, install.

## Known issues and open items
- 23 workbook display titles were cut off with "...". Decided with the user: short titles; project days use the project name plus a running number. 31 edits in data/title-overrides.json (the original workbook titles stay in data/roadmap.json). Semester Planner days 206-211 were renumbered 03-08 so days 204-211 run 01-08; the user can ask to revert this.
- Days 218 and 221 mention projects in the project text but have no project colour key in the workbook; left as is.
- Frontend extension has no colour of its own in the workbook; it is not coloured.
- Codex platform name/URL still needed (8 slots stay pending).
- Today screen shows a labelled sample card; it is replaced in Stage 3.
- No service worker yet, so no offline use and no full install until Stage 8.

## Next step
User tests Stage 1 on the phone. Then Stage 2: convert the workbook
data into data/roadmap.json and review it with the user.
