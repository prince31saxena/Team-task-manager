import express from 'express';
import { Project, Task, User } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let projects;

    if (req.user.role === 'admin') {
      // Admins see all projects
      projects = await Project.findAll({
        include: [{ model: Task, as: 'tasks' }]
      });
    } else {
      // Members see projects they are members of
      projects = await Project.findAll({
        include: [
          { 
            model: User, 
            as: 'members', 
            where: { id: req.user.id },
            attributes: [],
            through: { attributes: [] }
          },
          { model: Task, as: 'tasks' }
        ]
      });

      const createdProjects = await Project.findAll({
        where: { createdBy: req.user.id },
        include: [{ model: Task, as: 'tasks' }]
      });

      const projectIds = new Set(projects.map(p => p.id));
      createdProjects.forEach(p => {
        if (!projectIds.has(p.id)) {
          projects.push(p);
        }
      });
    }

    const projectCount = projects.length;
    let totalTasks = 0;
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    let overdueCount = 0;
    
    const projectBreakdown = [];
    const allTasks = [];

    projects.forEach(project => {
      const pTasks = project.tasks || [];
      totalTasks += pTasks.length;

      let pTodo = 0;
      let pInProgress = 0;
      let pDone = 0;
      let pOverdue = 0;

      pTasks.forEach(task => {
        allTasks.push(task);
        if (task.status === 'todo') {
          todoCount++;
          pTodo++;
        } else if (task.status === 'in-progress') {
          inProgressCount++;
          pInProgress++;
        } else if (task.status === 'done') {
          doneCount++;
          pDone++;
        }

        if (task.status !== 'done' && task.dueDate < today) {
          overdueCount++;
          pOverdue++;
        }
      });

      projectBreakdown.push({
        id: project.id,
        name: project.name,
        todo: pTodo,
        inProgress: pInProgress,
        done: pDone,
        overdue: pOverdue,
        total: pTasks.length
      });
    });

    const recentTasks = allTasks
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        projectId: t.projectId
      }));

    return res.json({
      projectCount,
      taskStats: {
        total: totalTasks,
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        overdue: overdueCount
      },
      projectBreakdown,
      recentTasks
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving dashboard stats', error: error.message });
  }
});

export default router;
