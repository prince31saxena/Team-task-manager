import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Could not load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'var(--danger)', textAlign: 'center', marginTop: '3rem' }}>{error}</div>;
  if (!stats) return <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>No data available.</div>;

  const { projectCount, taskStats, projectBreakdown, recentTasks } = stats;
  const pendingTasks = taskStats.todo + taskStats.inProgress;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong>. Here is your team's overview.</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Projects</span>
            <span className="stat-value">{projectCount}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
            📁
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{taskStats.total}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}>
            📋
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending Tasks</span>
            <span className="stat-value">{pendingTasks}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
            ⚡
          </div>
        </div>

        <div className="card stat-card" style={taskStats.overdue > 0 ? { borderColor: 'rgba(207, 34, 46, 0.2)', backgroundColor: 'var(--danger-bg)' } : {}}>
          <div className="stat-info">
            <span className="stat-label" style={taskStats.overdue > 0 ? { color: 'var(--danger)' } : {}}>Overdue Tasks</span>
            <span className="stat-value" style={taskStats.overdue > 0 ? { color: 'var(--danger)' } : {}}>{taskStats.overdue}</span>
          </div>
          <div className="stat-icon" style={taskStats.overdue > 0 ? { backgroundColor: 'var(--danger)', color: 'white' } : { backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-muted)' }}>
            ⚠️
          </div>
        </div>
      </div>

      {/* Main Layout Sections */}
      <div className="dashboard-content-layout">
        {/* Left Side: Projects Progress */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.5rem' }}>Project Completion Tracker</h2>
          {projectBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No projects available. {user?.role === 'admin' && 'Create one from the Projects page!'}</p>
          ) : (
            <div className="progress-list">
              {projectBreakdown.map((project) => {
                const completionPercentage = project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;
                
                // Color determining based on completion or overdue status
                let barColor = 'var(--primary)';
                if (project.overdue > 0) {
                  barColor = 'var(--danger)';
                } else if (completionPercentage === 100) {
                  barColor = 'var(--success)';
                }

                return (
                  <div className="progress-item" key={project.id}>
                    <div className="progress-labels">
                      <Link to={`/projects/${project.id}`} style={{ color: 'var(--text-title)', textDecoration: 'none', fontWeight: 600 }}>
                        {project.name}
                      </Link>
                      <span style={{ color: barColor, fontWeight: 700 }}>{completionPercentage}% ({project.done}/{project.total})</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${completionPercentage}%`, 
                          backgroundColor: barColor 
                        }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      <span>To Do: {project.todo}</span>
                      <span>In Progress: {project.inProgress}</span>
                      <span>Done: {project.done}</span>
                      {project.overdue > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Overdue: {project.overdue} ⚠️</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Recent Activity */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-title)', marginBottom: '1.5rem' }}>Recent Work Activity</h2>
          {recentTasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No recent task updates found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentTasks.map((task) => {
                const statusColor = task.status === 'done' ? 'var(--done-color)' : task.status === 'in-progress' ? 'var(--inprogress-color)' : 'var(--todo-color)';
                return (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.9rem' }}>{task.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {task.dueDate}</span>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        color: statusColor, 
                        fontWeight: 600, 
                        textTransform: 'capitalize',
                        alignSelf: 'center'
                      }}
                    >
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
