import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createTask, getUserTasks, updateTask, deleteTask } from '../services/taskService';
import { getAIRecommendation } from '../services/aiService';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'Medium', category: 'Personal', deadline: ''
  });

  const [editingTaskId, setEditingTaskId] = useState(null);
  const { logout } = useContext(AuthContext);

  const [aiRecommendation, setAiRecommendation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
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

  const handleInputChange = (e) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return alert('Task title is required!');

    try {
      if (editingTaskId) {
        const updated = await updateTask(editingTaskId, taskForm);
        setTasks(tasks.map(t => t._id === editingTaskId ? updated : t));
        setEditingTaskId(null);
      } else {
        const created = await createTask(taskForm);
        setTasks([created, ...tasks]);
      }
      setTaskForm({ title: '', description: '', priority: 'Medium', category: 'Personal', deadline: '' });
    } catch (err) {
      console.error(err.response?.data || err);
      alert(err.response?.data?.message || 'Operation failed — check the console for details');
    }
  };

  const startEdit = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      deadline: task.deadline ? task.deadline.substring(0, 10) : ''
    });
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

  const handleAskAI = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const data = await getAIRecommendation();
      setAiRecommendation(data.recommendation);
    } catch (err) {
      setAiError('Could not get an AI recommendation right now. Try again in a moment.');
    } finally {
      setAiLoading(false);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

  const recommendedTask = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'Pending');
    if (pending.length === 0) return null;

    const priorityRank = { High: 0, Medium: 1, Low: 2 };

    return [...pending].sort((a, b) => {
      const aHasDeadline = Boolean(a.deadline);
      const bHasDeadline = Boolean(b.deadline);

      if (aHasDeadline && bHasDeadline) {
        const diff = new Date(a.deadline) - new Date(b.deadline);
        if (diff !== 0) return diff;
      } else if (aHasDeadline !== bHasDeadline) {
        return aHasDeadline ? -1 : 1;
      }

      return priorityRank[a.priority] - priorityRank[b.priority];
    })[0];
  }, [tasks]);

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-ink-muted)' }}>Loading your tasks...</h2>;

  return (
    <div>
      {error && <div className="card" style={{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{totalTasks}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pendingTasks}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--color-success)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-value">{completedTasks}</div>
        </div>
      </div>

      {recommendedTask && (
        <div className="ai-card warm" style={{ marginBottom: '20px' }}>
          <div className="ai-card-header">
            <div>
              <div className="ai-card-label">Recommended Next</div>
              <div style={{ fontSize: '17px', fontWeight: 600, marginTop: '6px' }}>{recommendedTask.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                {recommendedTask.priority} priority{recommendedTask.deadline ? ` · Due ${new Date(recommendedTask.deadline).toLocaleDateString()}` : ''}
              </div>
            </div>
            <button onClick={() => toggleComplete(recommendedTask)} className="btn btn-amber btn-sm">Mark Done</button>
          </div>
        </div>
      )}

      <div className="ai-card" style={{ marginBottom: '30px' }}>
        <div className="ai-card-header">
          <div className="ai-card-label">AI Assistant</div>
          <button onClick={handleAskAI} disabled={aiLoading} className="btn btn-primary btn-sm">
            {aiLoading ? 'Thinking...' : 'Ask AI what to do next'}
          </button>
        </div>
        {aiError && <p style={{ color: 'var(--color-danger)', margin: '12px 0 0 0', fontSize: '14px' }}>{aiError}</p>}
        {aiRecommendation && <p className="ai-card-body">{aiRecommendation}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        <section className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '18px' }}>{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input className="input" type="text" name="title" placeholder="Task Title" value={taskForm.title} onChange={handleInputChange} required />
            <textarea className="input" name="description" placeholder="Short Description..." value={taskForm.description} onChange={handleInputChange} style={{ height: '70px', resize: 'none' }} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="input" name="priority" value={taskForm.priority} onChange={handleInputChange} style={{ flex: 1 }}>
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
                value={taskForm.category}
                onChange={handleInputChange}
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

            <input className="input" type="date" name="deadline" value={taskForm.deadline} onChange={handleInputChange} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className={`btn ${editingTaskId ? 'btn-amber' : 'btn-primary'}`} style={{ flex: 2 }}>
                {editingTaskId ? 'Update Task' : 'Add Task'}
              </button>
              {editingTaskId && (
                <button type="button" onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', description: '', priority: 'Medium', category: 'Personal', deadline: '' }); }} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <h3 style={{ marginBottom: '18px' }}>Your Tasks</h3>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--color-ink-muted)' }}>No tasks yet. Use the form to add your first one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {tasks.map((task) => (
                <div key={task._id} className={`task-item ${task.status === 'Completed' ? 'completed' : ''}`}>
                  <div>
                    <h4 className="task-title" style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.title}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-ink-muted)' }}>{task.description}</p>
                    <div className="task-meta">
                      <span>Priority: {task.priority}</span>
                      <span>Category: {task.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => toggleComplete(task)} className="btn btn-primary btn-sm">Done</button>
                    <button onClick={() => startEdit(task)} className="btn btn-amber btn-sm">Edit</button>
                    <button onClick={() => handleDelete(task._id)} className="btn btn-danger btn-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}