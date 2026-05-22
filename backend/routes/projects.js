import express from 'express';
import { Project, User, ProjectMember, Task } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

// List all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      // Admins see all projects
      projects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
        ]
      });
    } else {
      // Members see projects they are members of
      projects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { 
            model: User, 
            as: 'members', 
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] },
            where: { id: req.user.id }
          }
        ]
      });

      // Fetch projects they created (just in case)
      const createdProjects = await Project.findAll({
        where: { createdBy: req.user.id },
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
        ]
      });

      // Merge and deduplicate
      const projectIds = new Set(projects.map(p => p.id));
      createdProjects.forEach(p => {
        if (!projectIds.has(p.id)) {
          projects.push(p);
        }
      });
    }

    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving projects', error: error.message });
  }
});

// Get Project Details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] },
        { model: Task, as: 'tasks' }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access control: members must be in the project members list or be the creator
    if (req.user.role !== 'admin') {
      const isMember = project.members.some(m => m.id === req.user.id);
      const isCreator = project.createdBy === req.user.id;
      if (!isMember && !isCreator) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
      }
    }

    return res.json(project);
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

    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id
    });

    // Auto-add creator as member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id
    });

    // Add other members if provided
    if (memberIds && Array.isArray(memberIds)) {
      const uniqueMemberIds = [...new Set(memberIds)].filter(id => Number(id) !== req.user.id);
      
      const memberLinks = uniqueMemberIds.map(userId => ({
        projectId: project.id,
        userId: Number(userId)
      }));

      if (memberLinks.length > 0) {
        await ProjectMember.bulkCreate(memberLinks);
      }
    }

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.status(201).json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Update Project (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.update({ name, description });

    const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// Delete Project (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.destroy();
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

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingMember = await ProjectMember.findOne({ where: { projectId, userId } });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    await ProjectMember.create({ projectId, userId });

    const updatedProject = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json({ message: 'Member added successfully', members: updatedProject.members });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

// Remove Member from Project (Admin only)
router.delete('/:id/members/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const membership = await ProjectMember.findOne({ where: { projectId, userId } });
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    await membership.destroy();

    const updatedProject = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'members', attributes: ['id', 'name', 'email'] }
      ]
    });

    return res.json({ message: 'Member removed successfully', members: updatedProject.members });
  } catch (error) {
    return res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

export default router;
