import bcrypt from 'bcryptjs';
import sequelize from './config/db.js';
import { User, Project, ProjectMember, Task } from './models/index.js';

const seedDatabase = async () => {
  try {
    console.log('Synchronizing database (dropping old tables)...');
    await sequelize.sync({ force: true });
    console.log('Database synchronized.');

    console.log('Seeding users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedMemberPassword = await bcrypt.hash('member123', 10);

    const admin1 = await User.create({
      name: 'Sarah Connor',
      email: 'admin@taskmanager.com',
      password: hashedAdminPassword,
      role: 'admin'
    });

    const admin2 = await User.create({
      name: 'John Connor',
      email: 'owner@taskmanager.com',
      password: hashedAdminPassword,
      role: 'admin'
    });

    const member1 = await User.create({
      name: 'Marcus Wright',
      email: 'member1@taskmanager.com',
      password: hashedMemberPassword,
      role: 'member'
    });

    const member2 = await User.create({
      name: 'Kyle Reese',
      email: 'member2@taskmanager.com',
      password: hashedMemberPassword,
      role: 'member'
    });

    const member3 = await User.create({
      name: 'Kate Connor',
      email: 'member3@taskmanager.com',
      password: hashedMemberPassword,
      role: 'member'
    });

    console.log('Seeding projects...');
    const project1 = await Project.create({
      name: 'Acme Website Redesign',
      description: 'Revamping the landing page, product catalog, and backend CMS for Acme Corp with glassmorphic visuals.',
      createdBy: admin1.id
    });

    const project2 = await Project.create({
      name: 'Android Mobile Application',
      description: 'Developing the initial version of the Kotlin-based Android App including authentication and push notifications.',
      createdBy: admin1.id
    });

    console.log('Linking project members...');
    await ProjectMember.bulkCreate([
      { projectId: project1.id, userId: admin1.id },
      { projectId: project1.id, userId: member1.id },
      { projectId: project1.id, userId: member2.id }
    ]);

    await ProjectMember.bulkCreate([
      { projectId: project2.id, userId: admin1.id },
      { projectId: project2.id, userId: member1.id },
      { projectId: project2.id, userId: member3.id }
    ]);

    console.log('Seeding tasks...');
    
    const getDateDaysFromNow = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    // Project 1 tasks
    await Task.create({
      title: 'Design UI/UX Mockups',
      description: 'Create high-fidelity Figma mockups showing dashboard states and visual styling assets.',
      projectId: project1.id,
      assignedTo: member1.id,
      dueDate: getDateDaysFromNow(-5),
      status: 'done'
    });

    await Task.create({
      title: 'Setup Express API Boilerplate',
      description: 'Initialize Git, configure database models, and write auth endpoints with token authorization.',
      projectId: project1.id,
      assignedTo: member1.id,
      dueDate: getDateDaysFromNow(-2),
      status: 'in-progress'
    });

    await Task.create({
      title: 'Write CSS Variables & Styling Tokens',
      description: 'Construct the global styles sheet, setup modern font face imports, and write glassmorphic layouts.',
      projectId: project1.id,
      assignedTo: member2.id,
      dueDate: getDateDaysFromNow(-3),
      status: 'todo'
    });

    await Task.create({
      title: 'Integrate React Router & Auth Routing',
      description: 'Design the AuthContext, establish login/signup route flows, and implement protected page widgets.',
      projectId: project1.id,
      assignedTo: member2.id,
      dueDate: getDateDaysFromNow(4),
      status: 'todo'
    });

    // Project 2 tasks
    await Task.create({
      title: 'Setup Kotlin App Project',
      description: 'Configure Gradle settings, Android SDK support libraries, and create initial empty activities.',
      projectId: project2.id,
      assignedTo: member3.id,
      dueDate: getDateDaysFromNow(2),
      status: 'in-progress'
    });

    await Task.create({
      title: 'Design Logo and Identity',
      description: 'Generate high-res vector graphics for launcher icons and splash branding screens.',
      projectId: project2.id,
      assignedTo: member1.id,
      dueDate: getDateDaysFromNow(-1),
      status: 'todo'
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
