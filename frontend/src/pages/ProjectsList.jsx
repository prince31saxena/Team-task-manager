import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const projRes = await api.get('/projects');
      setProjects(projRes.data);

      if (isAdmin) {
        const usersRes = await api.get('/users');
        // Filter out current admin from candidates (we add them automatically)
        setUsers(usersRes.data.filter(u => u.id !== user.id));
      }
    } catch (err) {
      console.error('Error fetching projects page data:', err);
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, user]);

  const handleCheckboxChange = (userId) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      setModalError('Project Name is required');
      return;
    }
    setModalError('');
    setModalLoading(true);
 
    try {
      const response = await api.post('/projects', {
        name,
        description,
        memberIds: selectedMemberIds
      });
      
      // Reset form and close modal
      setName('');
      setDescription('');
      setSelectedMemberIds([]);
      setIsModalOpen(false);
      
      // Refresh list
      setProjects(prev => [...prev, response.data]);
    } catch (err) {
      console.error('Error creating project:', err);
      setModalError(err.response?.data?.message || 'Error creating project');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Loading projects...</div>;
  if (error) return <div style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '3rem' }}>{error}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track your active project workspace directories</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Create Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <h3>No Projects Yet</h3>
          <p style={{ marginTop: '0.5rem' }}>
            {isAdmin ? 'Click "+ Create Project" to kick off a new workspace!' : 'Ask an Administrator to assign you to a project.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {projects.map((project) => (
            <div className="card" key={project.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '220px' }}>
              <div>
                <h3 style={{ color: 'var(--text-title)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{project.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  👥 {project.members?.length || 0} members
                </span>
                <Link to={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  Open Project →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ color: 'var(--text-title)', fontSize: '1.25rem', fontWeight: 700 }}>New Project Workspace</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.25rem' }}>×</button>
            </div>

            {modalError && <div className="auth-alert auth-alert-error">{modalError}</div>}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="What is this project about?"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              {users.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Assign Team Members</label>
                  <div className="checkbox-list">
                    {users.map(u => (
                      <label className="checkbox-item" key={u.id}>
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(u.id)}
                          onChange={() => handleCheckboxChange(u.id)}
                        />
                        <span>{u.name} ({u.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
