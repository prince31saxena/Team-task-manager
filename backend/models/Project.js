import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.createdBy) {
        ret.creator = ret.createdBy;
      }
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Virtual for creator used by the frontend
projectSchema.virtual('creator').get(function() {
  return this.createdBy;
});

export default mongoose.model('Project', projectSchema);
