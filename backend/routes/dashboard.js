import express from 'express';
import { Project, Task } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let projects;

    if (req.user.role === 'admin') {
      // Admins see all projects
      projects = await Project.find();
    } else {
      // Members see projects they are members of or created
      projects = await Project.find({
        $or: [
          { createdBy: req.user._id },
          { members: req.user._id }
        ]
      });
    }

    const projectCount = projects.length;
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });

    // Group tasks by project ID
    const tasksByProject = {};
    projectIds.forEach(id => {
      tasksByProject[id.toString()] = [];
    });
    tasks.forEach(task => {
      const pId = task.project.toString();
      if (tasksByProject[pId]) {
        tasksByProject[pId].push(task);
      }
    });

    let totalTasks = 0;
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    let overdueCount = 0;
    
    const projectBreakdown = [];
    const allTasks = [];

    projects.forEach(project => {
      const pTasks = tasksByProject[project._id.toString()] || [];
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
