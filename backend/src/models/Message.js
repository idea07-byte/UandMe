import mongoose from 'mongoose';

/**
 * Attachment Subschema
 */
const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['image', 'file', 'audio', 'video'],
      default: 'file',
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

/**
 * Message Schema
 * Represents chat messages with rich media, timestamps, status ticks, and optimistic reconciliation.
 */
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Message must belong to a conversation'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender'],
      index: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    clientMessageId: {
      type: String,
      trim: true,
      index: true, // Speeds up optimistic UI message acknowledgement & deduplication
    },
    status: {
      type: String,
      enum: {
        values: ['sending', 'sent', 'delivered', 'read', 'failed'],
        message: '{VALUE} is not a valid message status',
      },
      default: 'sent',
      index: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// High-performance compound indexes for paginated chronological and reverse-cursor queries
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Frontend compatibility virtual getters
messageSchema.virtual('chat').get(function () {
  return this.conversationId;
});

messageSchema.virtual('content').get(function () {
  return this.text;
});

// Custom validator ensuring an active message contains at least text or one attachment
messageSchema.pre('validate', function () {
  if (this.isDeleted) return; // Deleted tombstone messages can have empty/cleared attachments
  const hasText = this.text && this.text.trim().length > 0;
  const hasAttachment = this.attachments && this.attachments.length > 0;
  if (!hasText && !hasAttachment) {
    this.invalidate('text', 'Message cannot be empty: provide text or at least one attachment');
  }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;

