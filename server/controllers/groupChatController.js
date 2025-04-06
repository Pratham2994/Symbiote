const GroupChat = require('../models/GroupChat');
const GroupChatMeta = require('../models/GroupChatMeta');
const Message = require('../models/Message');
const Team = require('../models/Team');

// Create a group chat for a team
exports.createGroupChat = async (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user.id;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team
    const isMember = team.members.some(memberId => memberId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    // Check if group chat already exists
    const existingChat = await GroupChat.findOne({ teamId });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    // Create new group chat
    const chat = await GroupChat.create({
      teamId,
      participants: team.members
    });

    // Create meta records for all participants
    await Promise.all(team.members.map(id => {
      return GroupChatMeta.create({ groupId: chat._id, userId: id });
    }));

    // Update team with group chat reference
    team.groupChat = chat._id;
    await team.save();

    res.status(201).json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a group chat
exports.getGroupChatMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    console.log(`Getting messages for group chat ${groupId} for user ${userId}`);

    // Check if user is a participant in the chat
    const chat = await GroupChat.findById(groupId);
    if (!chat) {
      console.log(`Chat not found with ID ${groupId}`);
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    console.log(`Found chat: ${chat._id}`);
    console.log(`Chat participants: ${chat.participants.map(id => id.toString()).join(', ')}`);
    console.log(`User ID: ${userId}`);

    const isParticipant = chat.participants.some(participantId => participantId.toString() === userId.toString());
    console.log(`Is user a participant? ${isParticipant}`);
    
    if (!isParticipant) {
      console.log(`User ${userId} is not a participant in chat ${groupId}`);
      
      // Check if user is a member of the team
      const team = await Team.findById(chat.teamId);
      if (!team) {
        console.log(`Team not found for chat ${groupId}`);
        return res.status(404).json({ message: 'Team not found' });
      }
      
      const isTeamMember = team.members.some(memberId => memberId.toString() === userId.toString());
      console.log(`Is user a team member? ${isTeamMember}`);
      
      if (isTeamMember) {
        console.log(`User ${userId} is a team member but not a chat participant. Adding as participant.`);
        
        // Add user as participant
        chat.participants.push(userId);
        await chat.save();
        
        // Create meta record for the user
        await GroupChatMeta.create({ groupId: chat._id, userId });
        
        console.log(`Added user ${userId} as participant in chat ${groupId}`);
      } else {
        console.log(`User ${userId} is not a team member. Access denied.`);
        return res.status(403).json({ message: 'You are not a participant in this chat' });
      }
    }

    // Get messages
    const messages = await Message.find({ groupId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });
    
    console.log(`Found ${messages.length} messages for chat ${groupId}`);

    // Update last seen and reset unread count
    await GroupChatMeta.findOneAndUpdate(
      { groupId, userId },
      { lastSeen: new Date(), unreadCount: 0 }
    );
    
    console.log(`Updated last seen for user ${userId} in chat ${groupId}`);

    res.status(200).json(messages);
  } catch (err) {
    console.error('Error getting group chat messages:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a message to the group chat
exports.sendMessage = async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a participant in the chat
    const chat = await GroupChat.findById(groupId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(participantId => participantId.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Create message
    const message = await Message.create({
      groupId,
      sender: userId,
      content,
      type,
      readBy: [userId], // Sender has read the message
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000) // 36 hours from now
    });

    // Add message to chat
    chat.messages.push(message._id);
    await chat.save();

    // Update unread count for all participants except sender
    await GroupChatMeta.updateMany(
      {
        groupId,
        userId: { $ne: userId }
      },
      { $inc: { unreadCount: 1 } }
    );

    // Get updated unread counts for all participants
    const updatedMetas = await GroupChatMeta.find({ groupId });
    
    // Populate sender info for response
    await message.populate('sender', 'username profilePicture');

    // Emit socket events for real-time updates
    const io = req.app.get('io');
    
    // Log the room name for debugging
    const roomName = `team-${groupId}`;
    console.log(`Emitting message to room: ${roomName}`);
    
    // Emit to the team chat room only
    io.to(roomName).emit('newMessage', {
      groupId,
      message
    });

    // Emit unread count updates to each participant
    for (const meta of updatedMetas) {
      io.to(meta.userId.toString()).emit('unreadCountUpdate', {
        groupId,
        count: meta.unreadCount
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get unread message count for a user
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all teams the user is a member of
    const teams = await Team.find({ members: userId });
    const teamIds = teams.map(team => team._id);

    // Get all group chats for these teams
    const chats = await GroupChat.find({ teamId: { $in: teamIds } });
    const chatIds = chats.map(chat => chat._id);

    // Get unread counts for all chats
    const metas = await GroupChatMeta.find({
      userId,
      groupId: { $in: chatIds }
    });

    // Format response
    const result = {};
    metas.forEach(meta => {
      result[meta.groupId] = meta.unreadCount;
    });

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch unread counts' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Update last seen and reset unread count
    await GroupChatMeta.findOneAndUpdate(
      { groupId, userId },
      { lastSeen: new Date(), unreadCount: 0 }
    );

    // Update readBy for all messages
    await Message.updateMany(
      {
        groupId,
        readBy: { $ne: userId }
      },
      { $push: { readBy: userId } }
    );

    // Emit unread count update to the user
    const io = req.app.get('io');
    io.to(userId.toString()).emit('unreadCountUpdate', {
      groupId,
      count: 0
    });

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Update group chat participants when team members change
exports.updateGroupChatParticipants = async (teamId, newMembers) => {
  try {
    console.log(`Updating group chat participants for team ${teamId}`);
    console.log(`New members: ${newMembers.map(id => id.toString()).join(', ')}`);
    
    // Find the group chat for this team
    const chat = await GroupChat.findOne({ teamId });
    if (!chat) {
      console.log(`No group chat found for team ${teamId}`);
      return;
    }
    
    console.log(`Found group chat: ${chat._id}`);
    console.log(`Current participants: ${chat.participants.map(id => id.toString()).join(', ')}`);

    // Update participants to match team members
    chat.participants = newMembers;
    await chat.save();
    console.log(`Updated group chat participants for team ${teamId}`);
    console.log(`New participants: ${chat.participants.map(id => id.toString()).join(', ')}`);

    // Create meta records for any new participants
    const existingMetaUserIds = (await GroupChatMeta.find({ groupId: chat._id }))
      .map(meta => meta.userId.toString());
    
    console.log(`Existing meta user IDs: ${existingMetaUserIds.join(', ')}`);
    
    const newParticipants = newMembers.filter(
      memberId => !existingMetaUserIds.includes(memberId.toString())
    );
    
    console.log(`New participants to add meta for: ${newParticipants.map(id => id.toString()).join(', ')}`);

    if (newParticipants.length > 0) {
      await Promise.all(newParticipants.map(id => {
        return GroupChatMeta.create({ groupId: chat._id, userId: id });
      }));
      console.log(`Added ${newParticipants.length} new participants to group chat meta`);
    }

    return chat;
  } catch (err) {
    console.error('Error updating group chat participants:', err);
    throw err;
  }
};

// Cleanup expired messages from GroupChat references
const cleanupExpiredMessages = async () => {
  try {
    console.log('Starting expired messages cleanup...');
    
    // Get all group chats
    const chats = await GroupChat.find({});
    
    for (const chat of chats) {
      // Find all valid messages for this chat
      const validMessageIds = await Message.find({ 
        _id: { $in: chat.messages },
        expiresAt: { $gt: new Date() }
      }).distinct('_id');
      
      // Update chat to only include valid messages
      if (chat.messages.length !== validMessageIds.length) {
        chat.messages = validMessageIds;
        await chat.save();
        console.log(`Cleaned up expired messages from chat ${chat._id}`);
      }
    }
    
    console.log('Finished expired messages cleanup');
  } catch (err) {
    console.error('Error cleaning up expired messages:', err);
  }
};

// Run cleanup every 12 hours
setInterval(cleanupExpiredMessages, 12 * 60 * 60 * 1000);

// Force cleanup of expired messages and orphaned data
exports.forceCleanup = async () => {
  try {
    console.log('Starting forced cleanup of chat data...');
    
    // Delete all expired messages first
    const expiredMessages = await Message.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Deleted ${expiredMessages.deletedCount} expired messages`);
    
    // Find all group chats
    const chats = await GroupChat.find({});
    console.log(`Found ${chats.length} group chats to check`);
    
    for (const chat of chats) {
      // Find the associated team
      const team = await Team.findById(chat.teamId);
      
      if (!team) {
        console.log(`Team not found for chat ${chat._id}, cleaning up orphaned chat data...`);
        
        // Delete all messages for this chat
        const deletedMessages = await Message.deleteMany({ groupId: chat._id });
        console.log(`Deleted ${deletedMessages.deletedCount} orphaned messages`);
        
        // Delete all meta records
        const deletedMeta = await GroupChatMeta.deleteMany({ groupId: chat._id });
        console.log(`Deleted ${deletedMeta.deletedCount} orphaned meta records`);
        
        // Delete the orphaned chat
        await GroupChat.findByIdAndDelete(chat._id);
        console.log(`Deleted orphaned chat ${chat._id}`);
      }
    }
    
    console.log('Forced cleanup completed');
  } catch (err) {
    console.error('Error during forced cleanup:', err);
    throw err;
  }
};

// Export the cleanup function for testing or manual runs
exports.cleanupExpiredMessages = cleanupExpiredMessages; 