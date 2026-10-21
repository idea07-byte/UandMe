import mongoose from 'mongoose';

/**
 * User Schema
 * Represents campus students, faculty, and administrators using PulseChat.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
        'Please enter a valid RFC-compliant email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents password from being leaked in general database queries
    },
    avatar: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      trim: true,
      maxlength: [120, 'About quote cannot exceed 120 characters'],
      default: 'Available on PulseChat',
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'faculty', 'researcher', 'admin'],
        message: '{VALUE} is not a valid academic role',
      },
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      default: 'General Campus',
    },
    status: {
      type: String,
      enum: {
        values: ['online', 'offline', 'away', 'busy'],
        message: '{VALUE} is not a valid presence status',
      },
      default: 'offline',
      index: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
  }
);

// Compound text index to support rapid live directory search by name, email, or department
userSchema.index({ name: 'text', email: 'text', department: 'text' });

const User = mongoose.model('User', userSchema);

export default User;
