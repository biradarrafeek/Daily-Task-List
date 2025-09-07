const STORAGE_KEY = 'dailyLearning.tasks.v1';

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const el = {
  list: document.getElementById('list'),
  addBtn: document.getElementById('addBtn'),
  title: document.getElementById('title'),
  subject: document.getElementById('subject'),
  date: document.getElementById('date'),
  priority: document.getElementById('priority'),
  filter: document.getElementById('filter'),
  sort: document.getElementById('sort'),
  taskCount: document.getElementById('taskCount'),
  clearCompleted: document.getElementById('clearCompleted'),
  exportBtn: document.getElementById('export'),
  importBtn: document.getElementById('import'),
  storageMsg: document.getElementById('storageMsg'),
  dateNow: document.getElementById('dateNow'),
  timeNow: document.getElementById('timeNow')
};

// helper: save
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  el.storageMsg.textContent = `${tasks.length} task${tasks.length!==1?'s':''}`;
}

// helper: format date
function formatDate(d){
  if(!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString();
}
function isToday(d){
  if(!d) return false;
  const now = new Date();
  const dt = new Date(d + 'T00:00:00');
  return dt.toDateString() === now.toDateString();
}
function isOverdue(d){
  if(!d) return false;
  const now = new Date(); now.setHours(0,0,0,0);
  const dt = new Date(d + 'T00:00:00');
  return dt < now;
}

// render
function render(){
  const filter = el.filter.value;
  const sort = el.sort.value;
  let list = [...tasks];

  if(filter === 'today') list = list.filter(t => !t.completed && isToday(t.due));
  if(filter === 'overdue') list = list.filter(t => !t.completed && isOverdue(t.due));
  if(filter === 'completed') list = list.filter(t => t.completed);

  // sort
  if(sort === 'new') list.sort((a,b)=> b.created - a.created);
  else if(sort==='old') list.sort((a,b)=> a.created - b.created);
  else if(sort==='priority'){
    const order = { high:0, med:1, low:2 };
    list.sort((a,b)=> order[a.priority] - order[b.priority]);
  }

  el.list.innerHTML = '';
  if(list.length === 0){
    el.list.innerHTML = '<div class="empty">No tasks to show — add your first learning task above ✨</div>';
    el.taskCount.textContent = '';
    return;
  }

  el.taskCount.textContent = `Showing ${list.length}`;

  for(const task of list){
    const row = document.createElement('div');
    row.className = 'task';
    row.dataset.id = task.id;

    // left
    const left = document.createElement('div'); left.className='left';
    const cb = document.createElement('div'); cb.className='checkbox'; cb.tabIndex=0;
    if(task.completed) cb.classList.add('checked');
    cb.addEventListener('click', () => toggleComplete(task.id));
    cb.addEventListener('keypress', e => { if(e.key==='Enter') toggleComplete(task.id); });

    const meta = document.createElement('div'); meta.className='meta';
    const title = document.createElement('div'); title.className='task-title';
    title.textContent = task.title;
    if(task.completed) { title.style.textDecoration='line-through'; title.style.opacity=.7; }

    const sub = document.createElement('div'); sub.className='task-sub';
    const subjectPart = task.subject ? `${task.subject} • ` : '';
    const duePart = task.due ? `Due: ${formatDate(task.due)}` : 'No due date';
    sub.textContent = subjectPart + duePart;

    meta.appendChild(title); meta.appendChild(sub);
    left.appendChild(cb); left.appendChild(meta);

    // right
    const right = document.createElement('div'); right.className='right';
    const pchip = document.createElement('div'); pchip.className='chip ' + (task.priority==='high'?'high':task.priority==='med'?'med':'low');
    pchip.textContent = task.priority==='high'?'HIGH':task.priority==='med'?'MED':'LOW';

    const dueLabel = document.createElement('div'); dueLabel.className='due'; dueLabel.textContent = task.time? `${task.time} ` : '';
    if(task.due) dueLabel.textContent += formatDate(task.due);

    const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.title='Edit';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', ()=> editTask(task.id));

    const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.title='Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', ()=> deleteTask(task.id));

    right.appendChild(pchip);
    right.appendChild(dueLabel);
    right.appendChild(editBtn);
    right.appendChild(delBtn);

    row.appendChild(left); row.appendChild(right);
    el.list.appendChild(row);
  }
}

// add task
function addTask(){
  const title = el.title.value.trim();
  if(!title) { alert('Please enter a task title'); el.title.focus(); return; }
  const subject = el.subject.value.trim();
  const due = el.date.value || null;
  const priority = el.priority.value || 'med';
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    title, subject, due, priority,
    created: Date.now(),
    completed: false
  };
  tasks.push(task);
  saveTasks(); render();
  el.title.value=''; el.subject.value=''; el.date.value=''; el.priority.value='med'; el.title.focus();
}

// toggle complete
function toggleComplete(id){
  tasks = tasks.map(t => t.id===id ? {...t, completed: !t.completed} : t);
  saveTasks(); render();
}

// delete
function deleteTask(id){
  if(!confirm('Delete this task?')) return;
  tasks = tasks.filter(t=>t.id!==id);
  saveTasks(); render();
}

// edit (simple inline prompt)
function editTask(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  const newTitle = prompt('Edit task title', t.title);
  if(newTitle===null) return;
  t.title = newTitle.trim() || t.title;
  const newSubject = prompt('Edit subject (optional)', t.subject || '');
  if(newSubject!==null) t.subject = newSubject.trim();
  const newDue = prompt('Edit due date (YYYY-MM-DD) or empty to clear', t.due || '');
  if(newDue!==null) t.due = newDue.trim() || null;
  const newPriority = prompt('Priority: high / med / low', t.priority) || t.priority;
  if(['high','med','low'].includes(newPriority)) t.priority = newPriority;
  saveTasks(); render();
}

// clear completed
function clearCompleted(){
  if(!confirm('Remove all completed tasks?')) return;
  tasks = tasks.filter(t=>!t.completed);
  saveTasks(); render();
}

// export
function exportTasks(){
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tasks.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// import (simple)
function importTasks(){
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
  inp.addEventListener('change', e=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      try{
        const imported = JSON.parse(ev.target.result);
        if(Array.isArray(imported)){
          // simple merge avoiding id conflicts
          const existingIds = new Set(tasks.map(t=>t.id));
          imported.forEach(it=>{
            if(!it.id || existingIds.has(it.id)) it.id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
            tasks.push(it);
          });
          saveTasks(); render();
          alert('Import successful');
        } else alert('Invalid file');
      }catch(err){ alert('Invalid JSON'); }
    };
    reader.readAsText(f);
  });
  inp.click();
}

// small clock
function updateClock(){
  const now = new Date();
  el.dateNow.textContent = now.toLocaleDateString();
  el.timeNow.textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
}
setInterval(updateClock, 1000);
updateClock();

// events
el.addBtn.addEventListener('click', addTask);
el.title.addEventListener('keypress', e=> { if(e.key === 'Enter') addTask(); });
el.filter.addEventListener('change', render);
el.sort.addEventListener('change', render);
el.clearCompleted.addEventListener('click', clearCompleted);
el.exportBtn.addEventListener('click', exportTasks);
el.importBtn.addEventListener('click', importTasks);

// initial render
render();
saveTasks();

