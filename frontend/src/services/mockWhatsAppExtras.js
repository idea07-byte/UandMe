/**
 * Dummy data for WhatsApp-style Calls, Status updates, and Communities.
 * Adheres to UI/UX specification (Page 2-5).
 */

export const MOCK_CALLS = [
  {
    id: 'call_1',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    type: 'video', // 'video' | 'voice'
    direction: 'incoming', // 'incoming' | 'outgoing' | 'missed'
    timestamp: 'Today, 10:14 AM',
    duration: '14 mins',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 'call_2',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'voice',
    direction: 'missed',
    timestamp: 'Today, 9:02 AM',
    duration: 'Missed',
    phone: '+1 (555) 876-5432',
  },
  {
    id: 'call_3',
    name: 'Dr. Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    type: 'video',
    direction: 'outgoing',
    timestamp: 'Yesterday, 4:45 PM',
    duration: '32 mins',
    phone: '+1 (555) 345-6789',
  },
  {
    id: 'call_4',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'voice',
    direction: 'incoming',
    timestamp: 'Yesterday, 1:15 PM',
    duration: '6 mins',
    phone: '+1 (555) 456-7890',
  },
  {
    id: 'call_5',
    name: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    type: 'voice',
    direction: 'outgoing',
    timestamp: 'October 21, 6:30 PM',
    duration: '18 mins',
    phone: '+1 (555) 567-8901',
  },
];

export const MOCK_STATUSES = [
  {
    id: 'status_1',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    time: '35 minutes ago',
    storiesCount: 2,
    hasUnseen: true,
    latestStory: {
      type: 'text',
      content: 'Wrapping up the capstone presentation slides! 🚀✨',
      bgColor: '#005C4B',
    },
  },
  {
    id: 'status_2',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    time: 'Today, 8:40 AM',
    storiesCount: 1,
    hasUnseen: true,
    latestStory: {
      type: 'image',
      content: 'Campus library early morning coding session ☕💻',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'status_3',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    time: 'Yesterday, 11:15 PM',
    storiesCount: 3,
    hasUnseen: false,
    latestStory: {
      type: 'text',
      content: 'AI & Cloud Computing midterm exam tomorrow morning! Wish us luck 📚',
      bgColor: '#1F2C34',
    },
  },
];

export const MOCK_COMMUNITIES = [
  {
    id: 'comm_1',
    name: 'Computer Science Department',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80',
    description: 'Official announcements, research papers, and event updates for CS students & faculty.',
    announcementGroup: 'Announcements 📢',
    subgroups: [
      { id: 'sub_1', name: 'Announcements 📢', lastMsg: 'Dean: Registration deadline extended to Friday', unread: 2 },
      { id: 'sub_2', name: 'Capstone Projects 2026', lastMsg: 'Evaluation rubric posted on the portal', unread: 0 },
      { id: 'sub_3', name: 'Internship & Job Postings', lastMsg: 'Google Summer of Code & Campus placements open', unread: 1 },
    ],
  },
  {
    id: 'comm_2',
    name: 'Campus Developer Society',
    avatar: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80',
    description: 'Community for web, mobile, AI developers and open source enthusiasts.',
    announcementGroup: 'Dev Society Announcements 🚀',
    subgroups: [
      { id: 'sub_4', name: 'Dev Society Announcements 🚀', lastMsg: 'Hackathon kickoff meeting this Saturday at 10 AM', unread: 0 },
      { id: 'sub_5', name: 'React & Node.js Builders', lastMsg: 'Check out the new Socket.IO real-time architecture!', unread: 4 },
    ],
  },
];
