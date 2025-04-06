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

    // Check if user is a participant in the chat
    const chat = await GroupChat.findById(groupId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isParticipant = chat.participants.some(participantId => participantId.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this chat' });
    }

    // Get messages
    const messages = await Message.find({ groupId })
      .populate('sender', 'username profilePicture')
      .sort({ createdAt: 1 });

    // Update last seen and reset unread count
    await GroupChatMeta.findOneAndUpdate(
      { groupId, userId },
      { lastSeen: new Date(), unreadCount: 0 }
    );

    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
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
      readBy: [userId] // Sender has read the message
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

    // Populate sender info for response
    await message.populate('sender', 'username profilePicture');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    
    // Log the room name for debugging
    const roomName = `team-${groupId}`;
    console.log(`Emitting message to room: ${roomName}`);
    
    // Emit to the team chat room only
    io.to(roomName).emit('newMessage', {
      groupId,
      message
    });

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

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
}; 