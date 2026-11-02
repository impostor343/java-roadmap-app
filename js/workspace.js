// Independent learning workspace: module tracker + free topic browser.
// Uses the existing Curriculum and IndexedDB-backed State; no parallel progress store.
(function () {
  'use strict';
  var C = window.Curriculum, A = window.State, I = window.Icons, h = U.h, root = document.getElementById('modules-root'), manualRoot = document.getElementById('manual-root');
  var moduleQuery = '', topicQuery = '';
  function card(title) { return h('section', { class: 'card' }, h('h3', { text: title }), [].slice.call(arguments, 1)); }
  function statusSelect(current, onChange, label) {
    var s = h('select', { class: 'sel', 'aria-label': label });
    [['not-started','Not Started'],['in-progress','Started'],['completed','Completed'],['needs-revision','Needs Revision']].forEach(function (x) { var o=h('option',{value:x[0],text:x[1]}); o.selected=x[0]===current; s.appendChild(o); });
    s.addEventListener('change', function () { onChange(s.value); }); return s;
  }
  function stats(m) { return A.topicStats(m); }
  function currentIn(m) {
    for (var d=m.startDay; d<=m.endDay; d++) { if (A.status(d)!=='completed' && A.status(d)!=='skipped') return d; }
    return m.endDay;
  }
  function moduleCard(m) {
    var st=stats(m), status=A.topicStatus(m), day=currentIn(m), session=C.session(day), details=h('details',{class:'card workspace-module'});
    details.open = status === 'in-progress';
    var summary=h('summary',{class:'workspace-summary'});
    var icon=h('span',{class:'module-icon','aria-hidden':'true'}); icon.appendChild(I.make(C.moduleIcon(m.id)));
    summary.appendChild(icon);
    summary.appendChild(h('span',{class:'workspace-main'},h('strong',{text:m.name}),h('span',{class:'muted small',text:U.STATUS[status]+' · '+st.done+' / '+st.total+' sessions · '+st.percent+'%'}),U.bar(st.percent)));
    summary.appendChild(h('span',{class:'project-item-arrow',text:'⌄','aria-hidden':'true'})); details.appendChild(summary);
    var tools=h('div',{class:'workspace-tools'});
    tools.appendChild(statusSelect(status,function(v){ A.saveTopic(m.id,{status:v}).then(refresh); },m.name+' status'));
    if(status==='not-started') tools.appendChild(h('button',{class:'btn primary',type:'button',text:'Start module',onclick:function(ev){ev.preventDefault();A.saveTopic(m.id,{status:'in-progress'}).then(refresh);}}));
    details.appendChild(tools);
    details.appendChild(h('p',{class:'muted small',text:'Module day '+(day-m.startDay+1)+' / '+st.total+' · Overall roadmap Day '+day}));
    if(session){
      details.appendChild(h('div',{class:'workspace-session'},
        h('span',{class:'eyebrow',text:session.topic||session.module}),
        h('strong',{text:session.title}),
        h('span',{class:'workspace-session-count',text:'Day '+(day-m.startDay+1)+' of '+st.total}),
        h('span',{class:'muted small',text:(session.module||m.name)+' · '+(session.time||'Time not specified')}),
        h('span',{class:'workspace-session-status',text:U.STATUS[A.status(day)]})));
      var nav=h('div',{class:'workspace-actions'});
      var prev=h('a',{class:'btn ghost',href:day>m.startDay?'#today/'+(day-1):'#',text:'← Previous'}); if(day<=m.startDay){prev.setAttribute('aria-disabled','true');prev.addEventListener('click',function(e){e.preventDefault();});}
      nav.appendChild(prev);
      nav.appendChild(h('button',{class:'btn primary',type:'button',text:A.isDone(day)?'Completed':'✓ Done',disabled:A.isDone(day),onclick:function(){A.markDone(day).then(function(){if(A.topicStatus(m)!=='completed'){A.saveTopic(m.id,{status:'in-progress'});}refresh();window.dispatchEvent(new Event('cur-changed'));});}}));
      var next=h('a',{class:'btn ghost',href:day<m.endDay?'#today/'+(day+1):'#',text:'Next →'}); if(day>=m.endDay){next.setAttribute('aria-disabled','true');next.addEventListener('click',function(e){e.preventDefault();});} nav.appendChild(next); details.appendChild(nav);
      details.appendChild(h('a',{class:'small',href:'#today/'+day,text:'Open full session details →'}));
    }
    var topicList=h('div',{class:'workspace-topic-list'});
    C.topicsOf(m.id).forEach(function(tp){var ts=A.conceptStats(tp), row=h('a',{class:'item',href:'#progress/topic/'+tp.id},h('strong',{text:tp.name}),h('span',{class:'muted small',text:U.STATUS[A.conceptStatus(tp)]+' · '+ts.done+'/'+ts.total+' sessions'}));topicList.appendChild(row);});
    details.appendChild(card('Topics in this module',topicList)); return details;
  }
  function modules() {
    var w=h('div'), search=h('input',{class:'sel',type:'search',placeholder:'Search modules…','aria-label':'Search modules'}); search.value=moduleQuery;
    search.addEventListener('input',function(){moduleQuery=search.value;renderModules();}); w.appendChild(search);
    var started=C.modules.filter(function(m){return A.topicStatus(m)!=='not-started';});
    var available=C.modules.filter(function(m){return A.topicStatus(m)==='not-started';});
    w.appendChild(h('p',{class:'muted small',text:started.length+' started · '+available.length+' not started · '+C.modules.length+' total'}));
    var q=moduleQuery.trim().toLowerCase();
    var active=started.filter(function(m){return !q||m.name.toLowerCase().indexOf(q)>=0;});
    var idle=available.filter(function(m){return !q||m.name.toLowerCase().indexOf(q)>=0;});
    w.appendChild(h('h3',{class:'ph',text:'My modules'}));
    if(active.length) active.forEach(function(m){w.appendChild(moduleCard(m));}); else w.appendChild(h('p',{class:'muted',text:'No modules started yet. Start one from All Modules or begin a scheduled session.'}));
    w.appendChild(h('h3',{class:'ph',text:'All modules'})); idle.forEach(function(m){w.appendChild(moduleCard(m));});
    root.replaceChildren(w);
  }
  function renderModules(){modules();}
  function manual() {
    var w=h('div'), search=h('input',{class:'sel',type:'search',placeholder:'Find any topic…','aria-label':'Search topics'}); search.value=topicQuery;
    var list=h('div'); function fill(){list.textContent='';var q=topicQuery.trim().toLowerCase(), matches=C.topics.filter(function(t){var m=C.module(t.moduleId);return !q||t.name.toLowerCase().includes(q)||(m&&m.name.toLowerCase().includes(q));});
      matches.forEach(function(tp){var m=C.module(tp.moduleId), st=A.conceptStats(tp), status=A.conceptStatus(tp), row=h('div',{class:'item workspace-topic'},h('span',{class:'workspace-main'},h('strong',{text:tp.name}),h('span',{class:'muted small',text:(m?m.name+' · ':'')+U.STATUS[status]+' · '+st.done+'/'+st.total+' sessions'})),h('span',{class:'workspace-topic-actions'}));
        if(status==='not-started') row.lastChild.appendChild(h('button',{class:'btn primary',type:'button',text:'Start',onclick:function(){A.saveTopic(tp.id,{status:'in-progress'}).then(function(){fill();window.dispatchEvent(new Event('cur-changed'));});}}));
        row.lastChild.appendChild(h('a',{class:'btn ghost',href:'#progress/topic/'+tp.id,text:'Open'})); list.appendChild(row);});
      if(!matches.length) list.appendChild(h('p',{class:'muted',text:'No matching topics.'}));
    }
    search.addEventListener('input',function(){topicQuery=search.value;fill();}); w.appendChild(search);
    w.appendChild(h('p',{class:'muted small',text:'Choose any topic and study it independently. Starting a topic does not force you to follow its module order or roadmap dates.'}));
    w.appendChild(list); fill(); manualRoot.replaceChildren(w);
  }
  function refresh(){ if(U.route('modules')!==null || U.route('manual')!==null) { renderModules(); manual(); } }
  Promise.all([C.ready,A.ready]).then(function(){renderModules();manual();window.addEventListener('hashchange',refresh);window.addEventListener('cur-changed',refresh);}).catch(function(e){root.textContent='Could not load: '+e.message;manualRoot.textContent='Could not load: '+e.message;});
})();
