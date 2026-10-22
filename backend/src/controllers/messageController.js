import messageService from '../services/messageService.js';
import { isValidObjectId } from '../utils/validators.js';

/**
 * Retrieve messages for a conversation.
 * Supports:
 * - GET /api/conversations/:conversationId/messages (Phase 6 structured response)
 * - GET /api/messages/:chatId (Phase 5 / Frontend array response)
 * - GET /api/chats/:id/messages (Phase 5 nested alias)
 */
export const getMessages = async (req, res, next) => {
  try {
    const conversationId =
      req.params.conversationId || req.params.chatId || req.params.id;
    const { limit, before, format } = req.query;

    const result = await messageService.getMessages({
      conversationId,
      userId: req.user._id,
      limit,
      before,
    });

    // Check if caller is hitting Phase 6 route /api/conversations or requested structured format
    const isConversationRoute =
      req.baseUrl?.includes('conversations') || format === 'structured';

    if (isConversationRoute) {
      return res.status(200).json({
        status: 'success',
        results: result.messages.length,
        pagination: result.pagination,
        data: {
          messages: result.messages,
        },
      });
    }

    // Default array format for frontend chatService.js & test_phase5
    res.setHeader('X-Next-Cursor', result.pagination.nextCursor || '');
    res.setHeader('X-Has-More', String(result.pagination.hasMore));
    return res.status(200).json(result.messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a new message to a conversation.
 * Supports:
 * - POST /api/conversations/:conversationId/messages (Phase 6 structured response)
 * - POST /api/messages (Phase 5 / Frontend direct object response)
 * - POST /api/chats/:id/messages (Phase 5 nested alias)
 */
export const sendMessage = async (req, res, next) => {
  try {
    const conversationId =
      req.params.conversationId ||
      req.body.conversationId ||
      req.params.id ||
      req.body.chatId;

    const text = req.body.text !== undefined ? req.body.text : req.body.content;
    const { attachments, clientMessageId } = req.body;

    const message = await messageService.sendMessage({
      conversationId,
      senderId: req.user._id,
      text,
      attachments,
      clientMessageId,
    });

    const isConversationRoute =
      req.baseUrl?.includes('conversations') || req.query.format === 'structured';

    if (isConversationRoute) {
      return res.status(201).json({
        status: 'success',
        message: 'Message sent successfully',
        data: {
          message,
        },
      });
    }

    return res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

/**
 * Edit an existing message (author only).
 * Route: PATCH /api/messages/:messageId
 */
export const editMessage = async (req, res, next) => {
  try {
    const messageId = req.params.messageId || req.params.id;
    const text = req.body.text !== undefined ? req.body.text : req.body.content;

    const updated = await messageService.editMessage({
      messageId,
      userId: req.user._id,
      text,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Message updated successfully',
      data: {
        message: updated,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a message according to message deletion policy.
 * Route: DELETE /api/messages/:messageId
 */
export const deleteMessage = async (req, res, next) => {
  try {
    const messageId = req.params.messageId || req.params.id;
    const mode = req.query?.mode || req.body?.mode || 'soft';

    const result = await messageService.deleteMessage({
      messageId,
      userId: req.user._id,
      mode,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark messages in a conversation as read.
 * Route: PATCH /api/messages/:chatId/read OR POST /api/messages/read
 */
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const conversationId =
      req.params.chatId ||
      req.params.conversationId ||
      req.params.id ||
      req.body.chatId ||
      req.body.conversationId;

    const modifiedCount = await messageService.markMessagesAsRead({
      conversationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Messages marked as read successfully',
      updatedCount: modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};
