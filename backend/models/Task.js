import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dueDate: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.project) {
        ret.projectId = ret.project._id ? ret.project._id.toString() : ret.project.toString();
      }
      if (ret.assignedTo) {
        ret.assignee = ret.assignedTo;
      }
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Virtuals for virtual attributes used by the frontend
taskSchema.virtual('projectId').get(function() {
  if (!this.project) return null;
  return this.project._id ? this.project._id.toString() : this.project.toString();
});

taskSchema.virtual('assignee').get(function() {
  return this.assignedTo;
});

export default mongoose.model('Task', taskSchema);
