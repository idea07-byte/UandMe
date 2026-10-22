import mongoose from 'mongoose';

/**
 * Conversation Schema
 * Represents direct (1-on-1) and group chat rooms in PulseChat.
 */
const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [60, 'Group title cannot exceed 60 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      validate: [
        (arr) => arr && arr.length >= 2,
        'A conversation must have at least 2 participants',
      ],
      index: true,
    },
    lastMessage: {
      text: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'read'],
        default: 'sent',
      },
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to quickly fetch user's active conversations sorted by latest activity
conversationSchema.index({ participants: 1, 'lastMessage.timestamp': -1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });

// Frontend compatibility virtual getters
conversationSchema.virtual('isGroupChat').get(function () {
  return this.isGroup;
});

conversationSchema.virtual('chatName').get(function () {
  return this.name;
});

conversationSchema.virtual('latestMessage').get(function () {
  if (!this.lastMessage || (!this.lastMessage.text && !this.lastMessage.sender)) {
    return null;
  }
  return {
    content: this.lastMessage.text,
    text: this.lastMessage.text,
    sender: this.lastMessage.sender,
    createdAt: this.lastMessage.timestamp,
    timestamp: this.lastMessage.timestamp,
    status: this.lastMessage.status,
  };
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

