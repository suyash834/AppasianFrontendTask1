import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, Filter, Sparkles } from 'lucide-react';
import { api, type Task } from './api';

type Filter = 'All' | 'Active' | 'Completed';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getTasks();
        setTasks(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addTask = async () => {
    const text = newTask.trim();
    if (!text) return;
    try {
      setAddingTask(true);
      setError(null);
      const created = await api.createTask(text);
      setTasks((t) => [...t, created]);
      setNewTask('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add task.');
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (id: string) => {
    if (busyIds.has(id)) return;
    const prev = tasks;
    try {
      setBusyIds(prevSet => new Set(prevSet).add(id));
      setError(null);

      // optimistic
      setTasks((t) => t.map((x) => (x.id === id ? { ...x, isCompleted: !x.isCompleted } : x)));
      await api.toggleTask(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not toggle task.');
      setTasks(prev); // revert
    } finally {
      setBusyIds(prevSet => {
        const next = new Set(prevSet);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteTask = async (id: string) => {
    if (busyIds.has(id)) return;
    const prev = tasks;
    try {
      setBusyIds(prevSet => new Set(prevSet).add(id));
      setError(null);

      // optimistic
      setTasks(t => t.filter(x => x.id !== id));
      await api.deleteTask(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete task.');
      setTasks(prev); // revert
    } finally {
      setBusyIds(prevSet => {
        const next = new Set(prevSet);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) =>
      filter === 'All' ? true : filter === 'Active' ? !t.isCompleted : t.isCompleted
    );
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const active = total - completed;
    return { total, completed, active };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white">Task Manager Pro</span>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
            Organize Your Day
          </h1>
          <p className="text-gray-600">Stay productive and track your progress</p>
        </header>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs font-medium text-gray-500">Total Tasks</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm ring-1 ring-indigo-200 transition-all hover:shadow-md">
            <div className="text-2xl font-bold text-indigo-700">{stats.active}</div>
            <div className="text-xs font-medium text-indigo-600">Active</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200 transition-all hover:shadow-md">
            <div className="text-2xl font-bold text-emerald-700">{stats.completed}</div>
            <div className="text-xs font-medium text-emerald-600">Completed</div>
          </div>
        </div>

        {/* Add new task */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-200">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            <label htmlFor="task" className="text-sm font-semibold text-gray-900">
              Add New Task
            </label>
          </div>
          <div className="flex gap-3">
            <input
              id="task"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !addingTask && addTask()}
              placeholder="What needs to be done?"
              disabled={addingTask}
              className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:bg-gray-50"
            />
            <button
              onClick={addTask}
              disabled={addingTask || !newTask.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingTask ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex gap-2">
            {(['All', 'Active', 'Completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}

        {/* List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
              <div className="text-sm text-gray-500">Loading your tasks...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-900">No tasks here</div>
              <div className="text-xs text-gray-500">
                {filter === 'All' ? 'Add your first task above!' : `No ${filter.toLowerCase()} tasks`}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredTasks.map((task, idx) => {
                const isBusy = busyIds.has(task.id);
                return (
                  <li
                    key={task.id}
                    className="group transition-colors hover:bg-gray-50"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 px-6 py-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        disabled={isBusy}
                        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-300 group-hover:text-gray-400" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm transition-all ${
                          task.isCompleted ? 'text-gray-400 line-through' : 'font-medium text-gray-900'
                        }`}
                      >
                        {task.description}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        disabled={isBusy}
                        aria-label={`Delete task: ${task.description}`}
                        className="flex-shrink-0 rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-500">
            {stats.completed > 0 && stats.completed === stats.total ? (
              <span className="font-medium text-emerald-600">🎉 All tasks completed! Great job!</span>
            ) : (
              <span>Keep going! You've got this 💪</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
