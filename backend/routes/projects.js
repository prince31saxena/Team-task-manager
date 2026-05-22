import express from 'express';
import { Project, User, Task } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

// List all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('createdBy', 'id name email')
        .populate('members', 'id name email');
    } else {
      projects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id }
        ]
      })
        .populate('createdBy', 'id name email')
        .populate('members', 'id name email');
    }
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
});

// Get Project Details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'id name email')
      .populate('members', 'id name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user.role !== 'admin') {
      const isMember = project.members.some(m => m._id.toString() === req.user.id);
      const isCreator = project.createdBy.toString() === req.user.id;
      if (!isMember && !isCreator) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
      }
    }

    const tasks = await Task.find({ project: project._id }).populate('assignedTo', 'id name email');
    
    const projectJSON = project.toJSON();
    projectJSON.tasks = tasks;

    return res.json(projectJSON);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving project', error: error.message });
  }
});

// Create Project (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const members = [req.user._id];
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach(id => {
        if (id !== req.user.id && !members.includes(id)) {
          members.push(id);
        }
      });
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members
    });

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'id name email')
      .populate('members', 'id name email');

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Update Project (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'id name email')
      .populate('members', 'id name email');

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// Delete Project (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.deleteOne();
    await Task.deleteMany({ project: req.params.id });

    return res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

// Add Member to Project (Admin only)
router.post('/:id/members', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    const populated = await Project.findById(projectId).populate('members', 'id name email');
    return res.json({ message: 'Member added successfully', members: populated.members });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// Remove Member from Project (Admin only)
router.delete('/:id/members/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const index = project.members.indexOf(userId);
    if (index === -1) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    project.members.splice(index, 1);
    await project.save();

    const populated = await Project.findById(projectId).populate('members', 'id name email');
    return res.json({ message: 'Member removed successfully', members: populated.members });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

export default router;
