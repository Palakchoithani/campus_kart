export const MOCK_LISTINGS = [
  {
    id: 'm1',
    title: 'MacBook Pro 14" (M2 Pro)',
    price: 145000,
    category: 'Electronics',
    location: 'Central Library',
    description: 'Space Gray, 16GB RAM, 512GB SSD. Like new condition, only 20 battery cycles. Perfect for CS students.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    userId: 'user1',
    userName: 'Alex Johnson',
    userEmail: 'alex.cs@college.edu',
    isPremium: true,
    isUrgent: false,
    condition: 'like-new',
    createdAt: new Date().toISOString()
  },
  {
    id: 'm2',
    title: 'Herman Miller Aeron Chair',
    price: 45000,
    category: 'Furniture',
    location: 'North Dorms',
    description: 'Size B, classic mesh, fully adjustable arms. Essential for those long study nights.',
    image: 'https://images.unsplash.com/photo-1580480055273-228ff50d8ef4?auto=format&fit=crop&q=80&w=800',
    userId: 'user2',
    userName: 'Sarah Chen',
    userEmail: 'design.sarah@college.edu',
    isPremium: false,
    isUrgent: true,
    condition: 'good',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'm3',
    title: 'Sony WH-1000XM5',
    price: 24000,
    category: 'Electronics',
    location: 'Student Union',
    description: 'Industry-leading noise cancellation. Barely used, includes original box and accessories.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    userId: 'user3',
    userName: 'Mike Ross',
    userEmail: 'mike.beats@college.edu',
    isPremium: true,
    isUrgent: false,
    condition: 'like-new',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'm4',
    title: 'Fujifilm X100V',
    price: 120000,
    category: 'Electronics',
    location: 'Arts Block',
    description: 'The cult classic. Mint condition with a shutter count of only 500. Includes extra batteries.',
    image: 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=800',
    userId: 'user4',
    userName: 'ProPhotographer',
    userEmail: 'photo.pro@college.edu',
    isPremium: false,
    isUrgent: false,
    condition: 'mint',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'm5',
    title: 'Mountain Bike - Trek Marlin 7',
    price: 35000,
    category: 'Bicycle',
    location: 'East Gate',
    description: 'Excellent trail bike. Recently serviced. Perfect for commuting or weekend adventures.',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
    userId: 'user5',
    userName: 'Trek Rider',
    userEmail: 'trek.rider@college.edu',
    isPremium: false,
    isUrgent: false,
    condition: 'good',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    listingId: 'm1',
    listingTitle: 'MacBook Pro 14"',
    sellerId: 'user1',
    otherUserName: 'Alex Johnson',
    otherUserEmail: 'alex.cs@college.edu',
    lastMessage: 'Is the price negotiable? I can pay cash today.',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2
  },
  {
    id: 'c2',
    listingId: 'm2',
    listingTitle: 'Aeron Chair',
    sellerId: 'user2',
    otherUserName: 'Sarah Chen',
    otherUserEmail: 'design.sarah@college.edu',
    lastMessage: 'I can pick it up this evening from North Dorms.',
    lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
    unreadCount: 0
  },
  {
    id: 'c3',
    listingId: 'm3',
    listingTitle: 'Sony WH-1000XM5',
    sellerId: 'user3',
    otherUserName: 'Mike Ross',
    otherUserEmail: 'mike.beats@college.edu',
    lastMessage: 'Does it still have the international warranty?',
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0
  }
];

export const MOCK_CHAT_MESSAGES = {
  'c1': [
    { id: 'msg1', senderId: 'user2', senderName: 'Interested Buyer', text: 'Hey! Saw your MacBook listing - is it still available?', createdAt: new Date(Date.now() - 7200000).toISOString(), listingId: 'm1' },
    { id: 'msg2', senderId: 'user1', senderName: 'Alex', text: 'Yes, it is still available! Perfect condition, barely used.', createdAt: new Date(Date.now() - 6600000).toISOString(), listingId: 'm1' },
    { id: 'msg3', senderId: 'user2', senderName: 'Interested Buyer', text: 'Great! What are the specs again? And is the price negotiable?', createdAt: new Date(Date.now() - 6000000).toISOString(), listingId: 'm1' },
    { id: 'msg4', senderId: 'user1', senderName: 'Alex', text: 'M2 Pro, 16GB RAM, 512GB SSD. Price is pretty firm but I\'m open to reasonable offers. Can meet on campus anytime.', createdAt: new Date(Date.now() - 3600000).toISOString(), listingId: 'm1' },
    { id: 'msg5', senderId: 'user2', senderName: 'Interested Buyer', text: 'Can you drop it by 2k? And when can we meet?', createdAt: new Date(Date.now() - 1800000).toISOString(), listingId: 'm1' }
  ],
  'c2': [
    { id: 'msg6', senderId: 'user1', senderName: 'Interested Buyer', text: 'Hi! Love the Aeron chair. Is it still available?', createdAt: new Date(Date.now() - 5400000).toISOString(), listingId: 'm2' },
    { id: 'msg7', senderId: 'user2', senderName: 'Sarah', text: 'Yes! Still available. It\'s in great condition, very comfortable.', createdAt: new Date(Date.now() - 4800000).toISOString(), listingId: 'm2' },
    { id: 'msg8', senderId: 'user1', senderName: 'Interested Buyer', text: 'Perfect! When can I come check it out? I\'m near North Dorms.', createdAt: new Date(Date.now() - 3600000).toISOString(), listingId: 'm2' },
    { id: 'msg9', senderId: 'user2', senderName: 'Sarah', text: 'Great! I\'m at North Dorms. Can you come by this evening? Around 6?', createdAt: new Date(Date.now() - 2700000).toISOString(), listingId: 'm2' },
    { id: 'msg10', senderId: 'user1', senderName: 'Interested Buyer', text: 'Perfect! See you at 6. Which building?', createdAt: new Date(Date.now() - 900000).toISOString(), listingId: 'm2' }
  ],
  'c3': [
    { id: 'msg11', senderId: 'user1', senderName: 'Interested Buyer', text: 'Are the Sony headphones still available?', createdAt: new Date(Date.now() - 10800000).toISOString(), listingId: 'm3' },
    { id: 'msg12', senderId: 'user3', senderName: 'Mike', text: 'Yes, still have them! Excellent condition.', createdAt: new Date(Date.now() - 9000000).toISOString(), listingId: 'm3' },
    { id: 'msg13', senderId: 'user1', senderName: 'Interested Buyer', text: 'Does it still have the international warranty?', createdAt: new Date(Date.now() - 7200000).toISOString(), listingId: 'm3' },
    { id: 'msg14', senderId: 'user3', senderName: 'Mike', text: 'Yes, warranty is still valid. Can meet on campus anytime.', createdAt: new Date(Date.now() - 3600000).toISOString(), listingId: 'm3' }
  ]
};
