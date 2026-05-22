import express from 'express';
import { Task, Project, User, ProjectMember } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

const checkProjectAccess = async (user, projectId) => {
  if (user.role === 'admin') return true;
  const membership = await ProjectMember.findOne({ where: { projectId, userId: user.id } });
  return !!membership;
};

// Get Tasks by Project ID
router.get('/projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const hasAccess = await checkProjectAccess(req.user, projectId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
});

// Create Task in Project (Admin only)
router.post('/projects/:projectId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and Due Date are required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (assignedTo) {
      const user = await User.findByPk(assignedTo);
      if (!user) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
      
      const isMember = await checkProjectAccess(user, projectId);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      dueDate,
      status: 'todo'
    });

    const createdTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.status(201).json(createdTask);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// Update Task Status (Admin or Assigned User)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (todo, in-progress, done) is required' });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const isAssigned = task.assignedTo === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'Access denied: You must be the assignee or an Admin to update status' });
    }

    await task.update({ status });

    const updatedTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
});

// Update Task Details (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, status } = req.body;
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (assignedTo) {
      const user = await User.findByPk(assignedTo);
      if (!user) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
      
      const isMember = await checkProjectAccess(user, task.projectId);
      if (!isMember) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
      }
    }

    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      assignedTo: assignedTo || null,
      dueDate: dueDate || task.dueDate,
      status: status || task.status
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }]
    });

    return res.json(updatedTask);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete Task (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();
    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

export default router;
