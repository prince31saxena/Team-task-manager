import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin membership controls
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);

      if (user?.role === 'admin') {
        const usersRes = await api.get('/users');
        setAllUsers(usersRes.data);
      }
    } catch (err) {
      console.error('Error fetching project detail:', err);
      setError(err.response?.data?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, user]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setMemberLoading(true);
    setMemberError('');

    try {
      const res = await api.post(`/projects/${id}/members`, { userId: Number(selectedUserId) });
      setProject(prev => ({
        ...prev,
        members: res.data.members
      }));
      setSelectedUserId('');
    } catch (err) {
      console.error('Error adding member:', err);
      setMemberError(err.response?.data?.message || 'Error adding member');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (userId === project.createdBy) {
      alert('Cannot remove the project creator!');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(prev => ({
        ...prev,
        members: res.data.members
      }));
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.response?.data?.message || 'Error removing member');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('WARNING: Deleting this project will remove all associated tasks. Proceed?')) return;

    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Error deleting project');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Loading project details...</div>;
  if (error) return <div style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '3rem' }}>{error}</div>;
  if (!project) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Project not found.</div>;

  // Calculate task statistics
  const tasks = project.tasks || [];
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  // Filter list of users who are not currently members of the project
  const currentMemberIds = new Set(project.members?.map(m => m.id) || []);
  const nonMembers = allUsers.filter(u => !currentMemberIds.has(u.id));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Project Workspace</span>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">Created by {project.creator?.name} on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/projects/${id}/board`} className="btn btn-primary">
            📋 Go to Task Board
          </Link>
          {isAdmin && (
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              🗑️ Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Description Panel */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-title)', marginBottom: '0.75rem' }}>Description</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {project.description || 'No description available for this project.'}
        </p>
      </div>

      {/* Grid: Tasks Stats & Team Members */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Card: Tasks Overview */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-title)', marginBottom: '1.25rem' }}>Tasks Overview</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '1.5rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--todo-color)' }}>{todoCount}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>To Do</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--inprogress-color)' }}>{inProgressCount}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>In Progress</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--done-color)' }}>{doneCount}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Completed</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to={`/projects/${id}/board`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
              View tasks on Kanban Board →
            </Link>
          </div>
        </div>

        {/* Right Card: Project Team Members */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-title)' }}>Project Team</h2>

          {/* Admin Member Association */}
          {isAdmin && nonMembers.length > 0 && (
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <select
                className="form-control"
                style={{ flex: 1 }}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Select User to Add...</option>
                {nonMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={memberLoading}>
                {memberLoading ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          )}

          {memberError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{memberError}</div>}

          {/* Members List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
            {project.members?.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>{m.name}</span>
                  {m.id === project.createdBy && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 600 }}>Creator</span>
                  )}
                </div>
                {isAdmin && m.id !== project.createdBy && (
                  <button 
                    onClick={() => handleRemoveMember(m.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
