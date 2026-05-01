export interface FeedCard {
  id: string
  type: 'text' | 'text-image' | 'video' | 'quiz' | 'audio'
  title: string
  content: string
  imageUrl?: string
  videoUrl?: string
  audioUrl?: string
  quiz?: {
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }
  category: string
  readTime: number // in minutes
  likes: number
  comments: number
}

export const sampleFeedContent: FeedCard[] = [
  {
    id: '1',
    type: 'text-image',
    title: 'How Photosynthesis Works',
    content: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This amazing chemical reaction is what makes life on Earth possible!',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    category: 'Science',
    readTime: 2,
    likes: 124,
    comments: 8
  },
  {
    id: '2',
    type: 'quiz',
    title: 'Test Your Knowledge: Ancient Rome',
    content: 'When was the Roman Empire founded?',
    quiz: {
      question: 'When was the Roman Empire founded?',
      options: ['753 BC', '509 BC', '27 BC', '476 AD'],
      correctAnswer: 0,
      explanation: 'The Roman Empire was traditionally founded in 753 BC by Romulus and Remus.'
    },
    category: 'History',
    readTime: 1,
    likes: 89,
    comments: 15
  },
  {
    id: '3',
    type: 'text-image',
    title: 'The Art of Making a Chair',
    content: 'Did you know that making a simple chair involves woodworking, design principles, and engineering? From selecting the right wood to ensuring stability, chair-making combines art and science.',
    imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
    category: 'Daily Life',
    readTime: 3,
    likes: 67,
    comments: 12
  },
  {
    id: '4',
    type: 'video',
    title: 'Geography: Understanding Maps',
    content: 'Maps are more than just drawings of the world. They represent complex geographical concepts and help us understand our planet\'s layout.',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    category: 'Geography',
    readTime: 4,
    likes: 156,
    comments: 23
  },
  {
    id: '5',
    type: 'quiz',
    title: 'Science Quiz: The Human Body',
    content: 'Which organ is responsible for pumping blood throughout your body?',
    quiz: {
      question: 'Which organ is responsible for pumping blood throughout your body?',
      options: ['Brain', 'Heart', 'Lungs', 'Liver'],
      correctAnswer: 1,
      explanation: 'The heart is a muscular organ that pumps blood through the circulatory system.'
    },
    category: 'Science',
    readTime: 1,
    likes: 203,
    comments: 31
  },
  {
    id: '6',
    type: 'text-image',
    title: 'The Silk Road: Ancient Trade Routes',
    content: 'The Silk Road was a network of trade routes connecting East and West. It facilitated not just trade in silk, but also the exchange of ideas, cultures, and technologies.',
    imageUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop',
    category: 'History',
    readTime: 3,
    likes: 98,
    comments: 7
  },
  {
    id: '7',
    type: 'audio',
    title: 'The Water Cycle Explained',
    content: 'Listen to this short explanation of how water moves through our environment in a continuous cycle.',
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    category: 'Science',
    readTime: 2,
    likes: 45,
    comments: 3
  },
  {
    id: '8',
    type: 'text-image',
    title: 'Volcanoes: Nature\'s Fireworks',
    content: 'Volcanoes are openings in the Earth\'s crust where molten rock, gases, and ash erupt. They shape our landscapes and create new land.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759844-d150f39ac1ac?w=400&h=300&fit=crop',
    category: 'Geography',
    readTime: 2,
    likes: 178,
    comments: 19
  },
  {
    id: '9',
    type: 'quiz',
    title: 'Daily Life: Cooking Basics',
    content: 'What cooking method uses dry heat in an oven?',
    quiz: {
      question: 'What cooking method uses dry heat in an oven?',
      options: ['Boiling', 'Frying', 'Baking', 'Steaming'],
      correctAnswer: 2,
      explanation: 'Baking uses dry heat in an oven to cook food, typically at temperatures between 300-450°F.'
    },
    category: 'Daily Life',
    readTime: 1,
    likes: 76,
    comments: 9
  },
  {
    id: '10',
    type: 'text',
    title: 'The Power of Compound Interest',
    content: 'Compound interest is the interest on a loan or deposit calculated based on both the initial principal and the accumulated interest from previous periods. It\'s like money working for you!',
    category: 'Daily Life',
    readTime: 2,
    likes: 134,
    comments: 22
  }
]