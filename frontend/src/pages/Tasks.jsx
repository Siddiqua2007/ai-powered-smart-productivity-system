import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getUserTasks, updateTask, deleteTask } from '../services/taskService';
import { getAIInsights, getTodaysPlan } from '../services/aiService';
import { AuthContext } from '../context/AuthContext';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { logout } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('deadline');

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'Medium', category: 'Personal', deadline: '' });

  const [aiInsights, setAiInsights] = useState('');
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const fetchTasksData = async () => {
      try {
        const data = await getUserTasks();
        setTasks(data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
        } else {
          setError('Failed to fetch tasks from the server');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTasksData();
  }, [logout]);

  const startEdit = (task) => {
    setEditingTaskId(task._id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      deadline: task.deadline ? task.deadline.substring(0, 10) : ''
    });
  };

  const cancelEdit = () => setEditingTaskId(null);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateTask(editingTaskId, editForm);
      setTasks(tasks.map(t => t._id === editingTaskId ? updated : t));
      setEditingTaskId(null);
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const toggleComplete = async (task) => {
    try {
      const targetStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      const updated = await updateTask(task._id, { status: targetStatus });
      setTasks(tasks.map(t => t._id === task._id ? updated : t));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const handleGetInsights = async () => {
    setAiInsightsLoading(true);
    setAiError('');
    try {
      const data = await getAIInsights();
      setAiInsights(data.insights);
    } catch (err) {
      setAiError('Could not load AI insights right now. Try again in a moment.');
    } finally {
      setAiInsightsLoading(false);
    }
  };

  const handleGetPlan = async () => {
    setAiPlanLoading(true);
    setAiError('');
    try {
      const data = await getTodaysPlan();
      setAiPlan(data.plan);
    } catch (err) {
      setAiError("Could not load today's plan right now. Try again in a moment.");
    } finally {
      setAiPlanLoading(false);
    }
  };

  const priorityRank = { High: 0, Medium: 1, Low: 2 };

  const visibleTasks = useMemo(() => {
    let result = [...tasks];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
      );
    }

    if (filterCategory !== 'All') result = result.filter(t => t.category === filterCategory);
    if (filterPriority !== 'All') result = result.filter(t => t.priority === filterPriority);
    if (filterStatus !== 'All') result = result.filter(t => t.status === filterStatus);

    if (sortBy === 'deadline') {
      result.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sortBy === 'priority') {
      result.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [tasks, searchTerm, filterCategory, filterPriority, filterStatus, sortBy]);

  const availableCategories = useMemo(() => {
    const unique = new Set(tasks.map(t => t.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [tasks]);

  const insights = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const overdue = tasks.filter(t =>
      t.status === 'Pending' && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    const byCategory = tasks.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    return { total, completed, completionRate, overdue, topCategory };
  }, [tasks]);

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-ink-muted)' }}>Loading your tasks...</h2>;

  return (
    <div>
      {error && <div className="card" style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Completion Rate</div>
          <div className="stat-value">{insights.completionRate}%</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{insights.overdue}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--color-success)' }}>
          <div className="stat-label">Top Category</div>
          <div className="stat-value" style={{ fontSize: '20px' }}>{insights.topCategory ? insights.topCategory[0] : '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        <div className="ai-card">
          <div className="ai-card-header">
            <div className="ai-card-label">AI Insights</div>
            <button onClick={handleGetInsights} disabled={aiInsightsLoading} className="btn btn-primary btn-sm">
              {aiInsightsLoading ? 'Thinking...' : 'Get Insights'}
            </button>
          </div>
          {aiInsights && <p className="ai-card-body">{aiInsights}</p>}
        </div>

        <div className="ai-card warm">
          <div className="ai-card-header">
            <div className="ai-card-label">Today's Plan</div>
            <button onClick={handleGetPlan} disabled={aiPlanLoading} className="btn btn-amber btn-sm">
              {aiPlanLoading ? 'Thinking...' : 'Plan My Day'}
            </button>
          </div>
          {aiPlan && <p className="ai-card-body">{aiPlan}</p>}
        </div>

      </div>

      {aiError && <div className="card" style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', marginBottom: '20px', fontSize: '14px' }}>{aiError}</div>}

      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <input
          className="input"
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '2 1 200px' }}
        />
        <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ flex: '1 1 120px' }}>
          <option value="All">All Categories</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select className="input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ flex: '1 1 120px' }}>
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ flex: '1 1 120px' }}>
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: '1 1 150px' }}>
          <option value="deadline">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {editingTaskId && (
        <form onSubmit={saveEdit} className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Edit Task</h3>
          <input className="input" type="text" name="title" value={editForm.title} onChange={handleEditChange} required />
          <textarea className="input" name="description" value={editForm.description} onChange={handleEditChange} style={{ height: '60px', resize: 'none' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <select className="input" name="priority" value={editForm.priority} onChange={handleEditChange} style={{ flex: 1 }}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input
              className="input"
              type="text"
              name="category"
              list="category-suggestions"
              placeholder="Category"
              value={editForm.category}
              onChange={handleEditChange}
              style={{ flex: 1 }}
            />
            <datalist id="category-suggestions">
              <option value="Personal" />
              <option value="Work" />
              <option value="Health" />
              <option value="Finance" />
              <option value="Learning" />
            </datalist>
          </div>
          <input className="input" type="date" name="deadline" value={editForm.deadline} onChange={handleEditChange} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-amber" style={{ flex: 2 }}>Save Changes</button>
            <button type="button" onClick={cancelEdit} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '18px' }}>
          {visibleTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </h3>
        {visibleTasks.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)' }}>No tasks match your search/filters.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {visibleTasks.map((task) => (
              <div key={task._id} className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}>
                <div>
                  <h4 className="task-title" style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.title}</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-ink-muted)' }}>{task.description}</p>
                  <div className="task-meta">
                    <span>Priority: {task.priority}</span>
                    <span>Category: {task.category}</span>
                    {task.deadline && <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => toggleComplete(task)} className="btn btn-primary btn-sm">
                    {task.status === 'Completed' ? 'Undo' : 'Done'}
                  </button>
                  <button onClick={() => startEdit(task)} className="btn btn-amber btn-sm">Edit</button>
                  <button onClick={() => handleDelete(task._id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}