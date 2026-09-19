const DAYS = [
  { id: 'mon', label: 'Пон', full: 'Понеделник' }, { id: 'tue', label: 'Вт', full: 'Вторник' },
  { id: 'wed', label: 'Ср', full: 'Сряда' }, { id: 'thu', label: 'Чт', full: 'Четвъртък' }, { id: 'fri', label: 'Пт', full: 'Петък' }
];
const PERIODS = [
  { id: 1, time: '8:20 – 9:40' }, { id: 2, time: '10:00 – 11:20' }, { id: 3, time: '11:40 – 13:00' },
  { id: 4, time: '13:20 – 14:40' }, { id: 5, time: '15:00 – 16:20' }, { id: 6, time: '16:40 – 18:00' }, { id: 7, time: '18:10 – 19:30' }
];
const LESSONS = {
  mon: { 4: ['Физика и астрономия', 'Тодорова', 'mint'], 5: ['Английски език', 'Сунгурова', 'coral'], 6: ['География и икономика', 'Иванов', 'butter'], 7: ['Философия', 'Данчева', 'lavender'] },
  tue: { 4: ['Математика', 'Стайкова', 'sky'], 5: ['Химия и опазване на околната среда', 'Я. Иванов', 'sky'], 6: ['Физическо възпитание и спорт', 'Райчов', 'sky'] },
  wed: { 4: ['Биология и здравно образование', 'Игнатова', 'mint'], 5: ['Испански език', 'Януцева', 'lavender'], 6: ['Английски език', 'Сунгурова', 'coral'], 7: ['Български език и литература', 'Средкова', 'butter'] },
  thu: { 4: ['Английски език', 'Сунгурова', 'coral'], 5: ['История и цивилизации', 'Андонова', 'butter'], 6: ['Физическо възпитание и спорт / Музика', 'Райчов · Й. Георгиева', 'sky'], 7: ['Час на класа', 'Стайкова', 'sky'] },
  fri: { 5: ['Български език и литература', 'Средкова', 'butter'], 6: ['Испански език', 'Януцева', 'lavender'], 7: ['История и цивилизации', 'Андонова', 'butter'] }
};

const API_BASE = (window.SCHEDULE_API_BASE || '').replace(/\/$/, '');
const STORAGE_KEY = 'school-planner-todos';
let todos = [];
let activeFilter = 'all';
const today = new Date().toISOString().slice(0, 10);

const $ = (selector) => document.querySelector(selector);
const lessonAt = (day, period) => LESSONS[day]?.[period];
const getContext = (day, period) => `${DAYS.find(item => item.id === day)?.full} · ${lessonAt(day, period)?.[0] || `Час ${period}`}`;

async function loadTodos() {
  if (!API_BASE) return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  try { const response = await fetch(`${API_BASE}/api/todos`); if (!response.ok) throw new Error(); return await response.json(); }
  catch { $('#storageStatus').textContent = 'Локално запазване · API недостъпен'; return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
}
async function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
async function addTodo(todo) {
  if (API_BASE) { try { const response = await fetch(`${API_BASE}/api/todos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo) }); if (response.ok) { todos = await loadTodos(); render(); return; } } catch {} }
  todos.unshift({ ...todo, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() }); await saveTodos(); render();
}
async function updateTodo(id, changes) {
  todos = todos.map(todo => todo.id === id ? { ...todo, ...changes } : todo); await saveTodos();
  if (API_BASE) fetch(`${API_BASE}/api/todos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }).catch(() => {});
  render();
}
async function removeTodo(id) {
  todos = todos.filter(todo => todo.id !== id); await saveTodos();
  if (API_BASE) fetch(`${API_BASE}/api/todos/${id}`, { method: 'DELETE' }).catch(() => {});
  render();
}

function renderSchedule() {
  const schedule = $('#schedule');
  schedule.innerHTML = `<div class="schedule-cell schedule-header"><span>час</span></div>${PERIODS.map(period => `<div class="schedule-cell schedule-header"><strong>${period.id}</strong><small>${period.time}</small></div>`).join('')}`;
  DAYS.forEach(day => {
    schedule.insertAdjacentHTML('beforeend', `<div class="schedule-cell day-label">${day.label}</div>`);
    PERIODS.forEach(period => {
      const lesson = lessonAt(day.id, period.id); const slotTodos = todos.filter(todo => todo.day === day.id && Number(todo.period) === period.id && !todo.completed);
      schedule.insertAdjacentHTML('beforeend', lesson ? `<button class="schedule-cell lesson ${slotTodos.length ? 'has-todo' : ''}" data-day="${day.id}" data-period="${period.id}" data-color="${lesson[2]}" aria-label="Добави задача към ${lesson[0]}"><span class="lesson-title">${lesson[0]}</span><div class="lesson-meta">10.Б · 304</div><span class="lesson-teacher">${lesson[1]}</span></button>` : '<div class="schedule-cell lesson empty"></div>');
    });
  });
}
function renderTodos() {
  const list = $('#todoList');
  let visible = todos.filter(todo => activeFilter !== 'todos' || !todo.completed);
  if (activeFilter === 'today') visible = visible.filter(todo => todo.dueDate === today);
  visible.sort((a, b) => Number(a.completed) - Number(b.completed) || new Date(a.createdAt) - new Date(b.createdAt));
  list.innerHTML = visible.length ? visible.map(todo => `<article class="todo-item ${todo.completed ? 'done' : ''}"><input class="todo-check" type="checkbox" data-id="${todo.id}" ${todo.completed ? 'checked' : ''} aria-label="Отбележи ${todo.title}"><div><div class="todo-title">${escapeHtml(todo.title)}</div><div class="todo-context">${getContext(todo.day, todo.period)}${todo.dueDate ? ` · срок ${formatDate(todo.dueDate)}` : ''}${todo.notes ? ` · ${escapeHtml(todo.notes)}` : ''}</div></div><div class="todo-actions"><span class="priority">${todo.priority === 'high' ? 'Висок приоритет' : ''}</span><button class="delete-button" data-delete="${todo.id}" aria-label="Изтрий задача">×</button></div></article>`).join('') : '<div class="todo-empty">Няма задачи в този изглед. Кликни върху цветен час или добави нова задача.</div>';
  $('#todoCount').textContent = todos.filter(todo => !todo.completed).length; $('#todayCount').textContent = todos.filter(todo => !todo.completed && todo.dueDate === today).length;
}
function render() { renderSchedule(); renderTodos(); }
function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function formatDate(value) { return new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`)); }
function openDialog(day = 'mon', period = 4) { $('#daySelect').value = day; $('#periodSelect').value = period; $('#todoDialog').showModal(); }

$('#daySelect').innerHTML = DAYS.map(day => `<option value="${day.id}">${day.full}</option>`).join('');
$('#periodSelect').innerHTML = PERIODS.map(period => `<option value="${period.id}">${period.id} · ${period.time}</option>`).join('');
$('#openTodo').addEventListener('click', () => openDialog());
$('#schedule').addEventListener('click', event => { const button = event.target.closest('.lesson:not(.empty)'); if (button) openDialog(button.dataset.day, button.dataset.period); });
$('#todoForm').addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); await addTodo({ ...data, period: Number(data.period) }); event.currentTarget.reset(); $('#todoDialog').close(); });
$('#todoList').addEventListener('change', event => { if (event.target.matches('.todo-check')) updateTodo(event.target.dataset.id, { completed: event.target.checked }); });
$('#todoList').addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (button) removeTodo(button.dataset.delete); });
document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('.filter-button').forEach(item => item.classList.toggle('active', item === button)); renderTodos(); }));

loadTodos().then(loaded => { todos = loaded; render(); });
