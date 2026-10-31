# Converts the CSE workbook into data/curriculum.json. Run: python3 tools/build_data.py <xlsx>
import sys, json, re, openpyxl
src = sys.argv[1]
wb = openpyxl.load_workbook(src, read_only=True, data_only=False)
def rows(name):
    it = wb[name].iter_rows(values_only=True); hdr = [str(h).strip() for h in next(it)]
    out = []
    for r in it:
        if r[0] is None: continue
        out.append({h: (None if v is None or str(v).strip() == '' else (v if isinstance(v, (int, float)) else str(v).strip())) for h, v in zip(hdr, r)})
    return out
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def links(s): return [u.strip() for u in s.split('|')] if s else []

mm = rows('Module Map')
modules = []
for i, m in enumerate(mm, 1):
    modules.append({'id': 'M%02d' % i, 'name': m['Module'], 'phase': m['Phase'], 'semester': m['Semester target'], 'domain': m['Domain'],
        'days': int(m['Learning days']), 'startDay': int(m['Start day']), 'endDay': int(m['End day']), 'outcome': m['Expected outcome'],
        'resource': m['Free resource'], 'resourceLinks': links(m['Resource URL']), 'extensionRule': m['Extension rule']})
modByName = {m['name']: m for m in modules}

cat = rows('Project Catalogue'); ms = {r['Project']: r for r in rows('Project Milestones')}; tl = rows('Project Version Timeline')
projects = []
for i, c in enumerate(cat, 1):
    n = c['Project']; m = ms[n]; pid = 'PR%02d' % i
    vs = []
    for t in [t for t in tl if t['Project'] == n]:
        tgt = t['Target learning day / track']
        vs.append({'id': '%s-%s' % (pid, t['Version']), 'name': t['Version'], 'targetDay': tgt if isinstance(tgt, (int, float)) else None,
            'targetText': None if isinstance(tgt, (int, float)) else tgt, 'unlocksAfter': t['Unlocks after'], 'changes': t['What changes in this version'],
            'acceptance': t['Acceptance checks'], 'folder': t['Canonical folder'], 'workbookStatus': t['Status']})
    projects.append({'id': pid, 'name': n, 'category': c['Category'], 'coreSkills': c['Core skills'], 'priority': c['Portfolio priority'],
        'workbookStatus': c['Status'], 'notes': c['Notes'], 'catalogueVersions': [c['Version 1'], c['Version 2'], c['Version 3'], c['Version 4 / extension']],
        'prerequisite': m['Prerequisite / introduction'], 'firstMilestoneDay': m['First planned milestone day'], 'versionRoadmap': m['Version roadmap'],
        'folder': m['Canonical folder'], 'publishableDefinition': m['Definition of a publishable milestone'], 'continuityRule': m['Continuity rule'], 'versions': vs})
pbyname = {p['name']: p for p in projects}

sessions = []
for r in rows('Daily Roadmap'):
    d = int(r['Roadmap Day']); mod = modByName[r['Module']]
    cp = r['Project / codebase checkpoint'] or ''; pr = None
    mt = re.match(r'^(.+?): checkpoint', cp)
    if mt and mt.group(1) in pbyname: pr = pbyname[mt.group(1)]['id']
    sessions.append({'id': 'D%04d' % d, 'day': d, 'phase': r['Phase'], 'semester': r['Semester target'], 'domain': r['Domain'], 'moduleId': mod['id'], 'module': r['Module'],
        'moduleDay': int(r['Module Day']), 'moduleTotal': int(r['Module Total Days']), 'title': r['Lesson / Focus'], 'outcome': r['Learning outcome'], 'task': r['Detailed task for this session'],
        'practice': r['Practice task (attempt yourself)'], 'practiceType': r['Practice type'], 'platform': r['Platform guidance'], 'resource': r['Free resource'],
        'resourceLinks': links(r['Resource link']), 'checkpoint': r['Project / codebase checkpoint'], 'projectAction': r['Project action'], 'folder': r['Folder / file guidance'],
        'github': r['GitHub action'], 'time': r['Suggested time'], 'revision': r['Revision instruction'], 'mastery': r['Mastery evidence / exit check'],
        'workbookStatus': r['Status'], 'workbookRemarks': r['Personal remarks / blockers'], 'projectId': pr})
for p in projects:   # planning references only: sessions whose day equals a version target
    p['relatedDays'] = sorted({v['targetDay'] for v in p['versions'] if v['targetDay']} | ({int(p['firstMilestoneDay'])} if isinstance(p['firstMilestoneDay'], (int, float)) else set()))
assert [s['day'] for s in sessions] == list(range(1, len(sessions) + 1))

practice = [{'id': p['ID'], 'topicId': p['Topic ID'], 'topic': p['Topic'], 'title': p['Problem / exercise'], 'platform': p['Platform'], 'difficulty': p['Difficulty'],
    'prerequisites': p['Prerequisites'], 'url': p['Direct URL'], 'how': p['How to practise'], 'workbookStatus': p['Status'], 'workbookNotes': p['Mistake / insight notes']} for p in rows('Practice Bank')]
extras = {}
for key, sheet in [('resources', 'Free Resources'), ('github', 'GitHub Publishing'), ('android', 'Android Side Track'), ('languages', 'Language Strategy'),
                   ('interview', 'Interview Preparation'), ('pause', 'Academic Pause Planner'), ('qa', 'Workbook QA')]:
    extras[key] = rows(sheet)
start = [[c for c in r if c is not None] for r in wb['Start Here'].iter_rows(values_only=True)]
extras['startHere'] = [x for x in start if x]
out = {'meta': {'source': src.split('/')[-1], 'total': len(sessions), 'groupSize': 30, 'revisionOffsets': [3, 7, 21, 45],
    'note': 'Revision offsets count curriculum sessions, not calendar days.'}, 'modules': modules, 'sessions': sessions, 'projects': projects, 'practice': practice, 'extras': extras}
json.dump(out, open('data/curriculum.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(sessions), len(modules), len(projects), sum(len(p['versions']) for p in projects), len(practice))
