import mongoose from 'mongoose';

/**
 * Contact Schema
 * Represents a saved phone contact belonging to a specific user.
 * Supports both registered app users and unregistered phone contacts with invite capability.
 */
const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    contactUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate phone entries for the same owner
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });

// Fast search by name and phone
contactSchema.index({ userId: 1, name: 'text', phone: 'text' });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

