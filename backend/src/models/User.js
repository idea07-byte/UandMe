import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
      select: false, // Prevents password from being returned in general database queries
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

/**
 * Pre-Save Middleware: Automatically hash plain-text password using bcrypt
 * Only re-hashes the password if it has been newly created or modified.
 */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance Method: Compare a candidate plain-text password with the stored hash
 * @param {string} candidatePassword - Plain text password from login form
 * @returns {Promise<boolean>} True if match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Transform to JSON: Guarantees password hash and internal __v are never leaked in API responses
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
