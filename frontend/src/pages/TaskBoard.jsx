import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Edit task form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await api.get(`/projects/${projectId}`);
      setProject(projRes.data);

      const tasksRes = await api.get(`/tasks/projects/${projectId}`);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Error loading task board:', err);
      setError('Failed to load tasks for this project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle || !newDueDate) {
      setFormError('Title and Due Date are required');
      return;
    }
    setFormError('');
    setFormLoading(true);

    try {
      const response = await api.post(`/tasks/projects/${projectId}`, {
        title: newTitle,
        description: newDesc,
        assignedTo: newAssignee ? Number(newAssignee) : null,
        dueDate: newDueDate
      });

      setTasks(prev => [...prev, response.data]);
      setIsCreateOpen(false);

      // Reset fields
      setNewTitle('');
      setNewDesc('');
      setNewAssignee('');
      setNewDueDate('');
    } catch (err) {
      console.error('Error creating task:', err);
      setFormError(err.response?.data?.message || 'Error creating task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDetail = (task) => {
    setActiveTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditAssignee(task.assignedTo ? String(task.assignedTo) : '');
    setEditDueDate(task.dueDate);
    setEditStatus(task.status);
    setEditError('');
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await api.patch(`/tasks/${activeTask.id}/status`, { status: newStatus });
      
      // Update task in local state list
      setTasks(prev => prev.map(t => t.id === activeTask.id ? response.data : t));
      
      // Update details modal
      setActiveTask(response.data);
      setEditStatus(newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Could not update status');
    }
  };

  const handleUpdateTaskDetails = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    try {
      const response = await api.put(`/tasks/${activeTask.id}`, {
        title: editTitle,
        description: editDesc,
        assignedTo: editAssignee ? Number(editAssignee) : null,
        dueDate: editDueDate,
        status: editStatus
      });

      setTasks(prev => prev.map(t => t.id === activeTask.id ? response.data : t));
      setIsDetailOpen(false);
      setActiveTask(null);
    } catch (err) {
      console.error('Error updating task details:', err);
      setEditError(err.response?.data?.message || 'Failed to update task details');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await api.delete(`/tasks/${activeTask.id}`);
      setTasks(prev => prev.filter(t => t.id !== activeTask.id));
      setIsDetailOpen(false);
      setActiveTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Loading board...</div>;
  if (error) return <div style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '3rem' }}>{error}</div>;
  if (!project) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Project not found.</div>;

  // Filter tasks into columns
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Board Header */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Link to={`/projects/${projectId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              ← Back to Project Details
            </Link>
          </span>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{project.name} Board</h1>
          <p className="page-subtitle">Visual workflow board for tasks management</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            + Add Task
          </button>
        )}
      </div>

      {/* Kanban Board Grid */}
      <div className="board-columns">
        {/* TO DO Column */}
        <div className="board-column">
          <div className="column-header">
            <div className="column-title-container">
              <span className="column-dot" style={{ backgroundColor: 'var(--todo-color)' }} />
              <span className="column-title">To Do</span>
            </div>
            <span className="column-count">{todoTasks.length}</span>
          </div>
          <div className="task-list">
            {todoTasks.map(task => {
              const isOverdue = task.dueDate < todayStr;
              return (
                <div className="task-card" key={task.id} onClick={() => handleOpenDetail(task)}>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description || 'No description.'}</p>
                  <div className="task-meta">
                    <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                      📅 {task.dueDate} {isOverdue && '⚠️'}
                    </span>
                    <span className={`task-assignee ${!task.assignee ? 'unassigned' : ''}`}>
                      {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="board-column">
          <div className="column-header">
            <div className="column-title-container">
              <span className="column-dot" style={{ backgroundColor: 'var(--inprogress-color)' }} />
              <span className="column-title">In Progress</span>
            </div>
            <span className="column-count">{inProgressTasks.length}</span>
          </div>
          <div className="task-list">
            {inProgressTasks.map(task => {
              const isOverdue = task.dueDate < todayStr;
              return (
                <div className="task-card" key={task.id} onClick={() => handleOpenDetail(task)}>
                  <h4 className="task-title">{task.title}</h4>
                  <p className="task-desc">{task.description || 'No description.'}</p>
                  <div className="task-meta">
                    <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                      📅 {task.dueDate} {isOverdue && '⚠️'}
                    </span>
                    <span className={`task-assignee ${!task.assignee ? 'unassigned' : ''}`}>
                      {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="board-column">
          <div className="column-header">
            <div className="column-title-container">
              <span className="column-dot" style={{ backgroundColor: 'var(--done-color)' }} />
              <span className="column-title">Completed</span>
            </div>
            <span className="column-count">{doneTasks.length}</span>
          </div>
          <div className="task-list">
            {doneTasks.map(task => (
              <div className="task-card" key={task.id} onClick={() => handleOpenDetail(task)}>
                <h4 className="task-title">{task.title}</h4>
                <p className="task-desc">{task.description || 'No description.'}</p>
                <div className="task-meta">
                  <span className="task-due">📅 {task.dueDate}</span>
                  <span className={`task-assignee ${!task.assignee ? 'unassigned' : ''}`}>
                    {task.assignee ? task.assignee.name.split(' ')[0] : 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 700 }}>Add New Task</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)} style={{ fontSize: '1.25rem' }}>×</button>
            </div>

            {formError && <div className="auth-alert auth-alert-error">{formError}</div>}

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Task details..."
                  rows="3"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  className="form-control"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                >
                  <option value="">Unassigned</option>
                  {project.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Status Management Modal */}
      {isDetailOpen && activeTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 700 }}>Task Details</h2>
              <button className="modal-close" onClick={() => { setIsDetailOpen(false); setActiveTask(null); }} style={{ fontSize: '1.25rem' }}>×</button>
            </div>

            {/* If Admin: display Edit Form. If Member: display read-only details + status buttons */}
            {isAdmin ? (
              <form onSubmit={handleUpdateTaskDetails}>
                {editError && <div className="auth-alert auth-alert-error">{editError}</div>}

                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-control"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteTask}>
                    🗑️ Delete Task
                  </button>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setIsDetailOpen(false); setActiveTask(null); }}>
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={editLoading}>
                      {editLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Member view: show task info and big actions to change status if assigned */
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ color: 'var(--text-title)', fontSize: '1.15rem', marginBottom: '0.5rem' }}>{activeTask.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {activeTask.description || 'No description available.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Due Date</span>
                    <strong style={activeTask.dueDate < todayStr && activeTask.status !== 'done' ? { color: 'var(--danger)' } : { color: 'var(--text-title)' }}>
                      {activeTask.dueDate} {activeTask.dueDate < todayStr && activeTask.status !== 'done' && '⚠️'}
                    </strong>
                  </div>
                  <div className="card" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Assignee</span>
                    <strong style={{ color: 'var(--text-title)' }}>
                      {activeTask.assignee ? activeTask.assignee.name : 'Unassigned'}
                    </strong>
                  </div>
                </div>

                {/* Status action toggles */}
                {activeTask.assignedTo === user.id ? (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>Update Task Status:</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn" 
                        style={editStatus === 'todo' ? { backgroundColor: 'var(--todo-color)', color: '#ffffff', flex: 1 } : { backgroundColor: 'rgba(0,0,0,0.05)', flex: 1 }}
                        onClick={() => handleStatusChange('todo')}
                      >
                        To Do
                      </button>
                      <button 
                        className="btn" 
                        style={editStatus === 'in-progress' ? { backgroundColor: 'var(--inprogress-color)', color: '#ffffff', flex: 1 } : { backgroundColor: 'rgba(0,0,0,0.05)', flex: 1 }}
                        onClick={() => handleStatusChange('in-progress')}
                      >
                        In Progress
                      </button>
                      <button 
                        className="btn" 
                        style={editStatus === 'done' ? { backgroundColor: 'var(--done-color)', color: '#ffffff', flex: 1 } : { backgroundColor: 'rgba(0,0,0,0.05)', flex: 1 }}
                        onClick={() => handleStatusChange('done')}
                      >
                        Completed
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                    Only the assigned member ({activeTask.assignee?.name || 'Unassigned'}) or an Admin can change this task's status.
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsDetailOpen(false); setActiveTask(null); }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
