from datetime import datetime
import os
import sqlite3
from flask import Flask, jsonify, request, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))
DATABASE = os.getenv('TODO_DATABASE', os.path.join(os.path.dirname(__file__), 'todos.sqlite3'))


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db():
    get_db().execute('''CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        day TEXT NOT NULL,
        period INTEGER NOT NULL,
        dueDate TEXT,
        priority TEXT NOT NULL DEFAULT 'normal',
        notes TEXT NOT NULL DEFAULT '',
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL
    )''')
    get_db().commit()


def serialize(row):
    item = dict(row)
    item['completed'] = bool(item['completed'])
    return item


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.get('/api/todos')
def list_todos():
    rows = get_db().execute('SELECT * FROM todos ORDER BY completed ASC, createdAt ASC').fetchall()
    return jsonify([serialize(row) for row in rows])


@app.post('/api/todos')
def create_todo():
    data = request.get_json(silent=True) or {}
    if not data.get('title') or not data.get('day') or not data.get('period'):
        return jsonify({'error': 'title, day and period are required'}), 400
    cursor = get_db().execute('''INSERT INTO todos (title, day, period, dueDate, priority, notes, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)''', (data['title'].strip(), data['day'], int(data['period']), data.get('dueDate', ''), data.get('priority', 'normal'), data.get('notes', '').strip(), datetime.utcnow().isoformat()))
    get_db().commit()
    return jsonify(serialize(get_db().execute('SELECT * FROM todos WHERE id = ?', (cursor.lastrowid,)).fetchone())), 201


@app.patch('/api/todos/<int:todo_id>')
def update_todo(todo_id):
    data = request.get_json(silent=True) or {}
    allowed = {'title', 'day', 'period', 'dueDate', 'priority', 'notes', 'completed'}
    updates = {key: value for key, value in data.items() if key in allowed}
    if 'completed' in updates:
        updates['completed'] = int(bool(updates['completed']))
    if not updates:
        return jsonify({'error': 'no valid fields'}), 400
    assignments = ', '.join(f'{key} = ?' for key in updates)
    cursor = get_db().execute(f'UPDATE todos SET {assignments} WHERE id = ?', [*updates.values(), todo_id])
    get_db().commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'todo not found'}), 404
    return jsonify(serialize(get_db().execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone()))


@app.delete('/api/todos/<int:todo_id>')
def delete_todo(todo_id):
    cursor = get_db().execute('DELETE FROM todos WHERE id = ?', (todo_id,))
    get_db().commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'todo not found'}), 404
    return '', 204


with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)
