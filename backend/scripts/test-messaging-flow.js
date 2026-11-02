import { supabaseAdmin } from '../src/config/supabase.js';
import { supabaseService } from '../src/services/supabaseService.js';
import messageService from '../src/services/messageService.js';

async function runTests() {
  console.log('🧪 Starting Real-Time Messaging & Status Tests...');

  // 1. Create or get test users
  async function getOrCreateTestUser(name, phone, email) {
    let user = await supabaseService.findUserByPhone(phone);
    if (!user) {
      user = await supabaseService.findUserByEmail(email);
    }
    if (!user) {
      user = await supabaseService.createUser({
        name,
        phone,
        email,
        password: 'TestPassword123!',
      });
    }
    return user;
  }

  const user1 = await getOrCreateTestUser('Alice Sender', '+919876500001', 'alice.test@uandi.local');
  const user2 = await getOrCreateTestUser('Bob Receiver', '+919876500002', 'bob.test@uandi.local');

  console.log('✅ Users ready:', user1.id, user2.id);

  // 2. Create direct conversation
  const conv = await supabaseService.createOrGetDirectChat(user1.id, user2.id);
  console.log('✅ Conversation ready:', conv.id);

  // 3. Send message (state: 'sent' - 1 tick)
  const sentMsg = await messageService.sendMessage({
    conversationId: conv.id,
    senderId: user1.id,
    text: 'Hello Bob! This is an end-to-end test message.',
    clientMessageId: 'client_msg_' + Date.now(),
  });
  console.log('✅ 1. Message Sent (1 tick):', sentMsg.id, 'status:', sentMsg.status);
  if (sentMsg.status !== 'sent') throw new Error('Expected status sent');

  // 4. Update status to 'delivered' (2 ticks)
  await supabaseService.updateMessageStatus(sentMsg.id, 'delivered');
  const deliveredCheck = await supabaseService.getMessages(conv.id, { limit: 5 });
  const checkMsg1 = deliveredCheck.messages.find(m => m.id === sentMsg.id);
  console.log('✅ 2. Message Delivered (2 ticks):', checkMsg1?.status);
  if (checkMsg1?.status !== 'delivered') throw new Error('Expected status delivered');

  // 5. Mark messages as read by Bob (blue ticks)
  const readCount = await messageService.markMessagesAsRead({
    conversationId: conv.id,
    userId: user2.id,
  });
  console.log('✅ 3. Messages Read (blue ticks) count:', readCount);

  const readCheck = await supabaseService.getMessages(conv.id, { limit: 5 });
  const checkMsg2 = readCheck.messages.find(m => m.id === sentMsg.id);
  console.log('✅ 3b. Read Status Verification:', checkMsg2?.status);
  if (checkMsg2?.status !== 'read') throw new Error('Expected status read');

  // 6. Edit message
  const edited = await messageService.editMessage({
    messageId: sentMsg.id,
    userId: user1.id,
    text: 'Hello Bob! This message has been edited.',
  });
  console.log('✅ 4. Message Edited:', edited.text, 'isEdited:', edited.isEdited);
  if (edited.text !== 'Hello Bob! This message has been edited.') throw new Error('Edit failed');

  // 7. Delete message for everyone (soft delete)
  const deleted = await messageService.deleteMessage({
    messageId: sentMsg.id,
    userId: user1.id,
    mode: 'soft',
  });
  console.log('✅ 5. Message Deleted for everyone:', deleted.messageId);

  const deleteCheck = await supabaseService.getMessages(conv.id, { limit: 5 });
  const checkMsg3 = deleteCheck.messages.find(m => m.id === sentMsg.id);
  console.log('✅ 5b. Deleted Text in DB:', checkMsg3?.text);
  if (!checkMsg3?.text.includes('deleted')) throw new Error('Expected deleted message text');

  console.log('🎉 ALL MESSAGING & STATUS FLOW TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
