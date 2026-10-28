# Design Specification: Java Roadmap (personal PWA)

Approved by the user. Source data: GTU_Java_Internship_Roadmap_REPAIRED.xlsx
(replaces the earlier workbook). Changes need the user's agreement.

## Look and feel
- Clean and minimal. White base with green as the main accent; blue, purple
  and pink as supporting colours. (Changed from cream by the user after seeing
  Stage 1.)
- Light and dark both supported; follows the phone setting.
- Soft rounded buttons, generous spacing, large readable text.
- Only gentle fade/slide animation; none when "reduce motion" is on.
- App icons: simple line icons with a text label under each.
  Topic symbols stay as the workbook's emoji.

## Navigation
- Bottom bar, 5 tabs: Today, Calendar, Questions, Projects, Progress.
- Settings is an icon in the top corner.

## Today card
- Order: date (small), topic group as a large heading, symbol, title with
  topic-day number (e.g. "Methods 01"), overall day ("Day 1 of 246"),
  suggested time, status marker (symbol plus word).
- Controls: Info, Previous, Next, Done, Skipped.
- Previous/Next follow the original roadmap order.
- Done saves instantly; an "Add remark" link then appears.

## Info (bottom sheet)
- Plain lines with a bold label, e.g. **Time:** 60-90 min.
- Empty labels and sections are left out. No fake links or estimates.

## Calendar
- Classic month grid, previous/next month arrows.
- Each cell: date number, emoji, topic name in very small text (2 lines).
- Project days filled with the project's pastel colour; legend below.
- Today and the selected date look different.
- Tapping a date shows a preview and list, with a button to open the card.

## Status markers
- Corner symbols: done = check, skipped = arrow, catch-up done = loop.
- Done days are dimmed slightly. Pending days have no marker.

## Question Bank
- Grouped by topic, collapsible groups, search box.
- "Assigned (suggested)" stays separate from "Catalogue only".
- Codex slots stay pending until the user gives the platform name/URL.

## Projects (from the workbook)
Guessing Game (blue), Banking (green), Smart Library (purple),
Inventory (orange), Task Management REST API (teal, was pale green),
Semester Planner Android App in Java (pink, was pale red).
Frontend work is an extension of Library/Inventory.
Concurrency is an optional Banking extension.

## Progress
- Key numbers (completed, skipped, pending, catch-up queue), one progress
  bar, problems solved, per-project milestone progress.
- Scheduled and catch-up completions are counted separately.
- No streaks, no guilt warnings.

## Catch-up
- Separate screen reached from Progress, with a "Do it today" button per item.
- Original date never changes.

## Settings
- Export backup, Restore backup (validated, with confirmation), a note that
  data lives only on this phone, appearance (text size, project colours).

## Rules that never change
- The workbook is the roadmap. Progress is stored separately and never
  rewrites the schedule.
- Never invent problems, links, resources or roadmap entries.
- Semester 3 finals and all Semester 4 dates are provisional, not official.
