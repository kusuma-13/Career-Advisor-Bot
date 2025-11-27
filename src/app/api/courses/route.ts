import { NextResponse } from 'next/server';

// Mock data for courses from different platforms with Indian Rupee pricing
const MOCK_COURSES = [
  {
    id: '1',
    name: 'Introduction to Web Development',
    category: 'Web Development',
    duration: '10 hours',
    level: 'Beginner',
    description: 'Learn the basics of web development with HTML, CSS, and JavaScript.',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/intro-to-web-development/',
    instructor: 'John Doe',
    rating: 4.5,
    students: '10,000+',
    price: '₹999'
  },
  {
    id: '2',
    name: 'Data Science Fundamentals',
    category: 'Data Science',
    duration: '15 hours',
    level: 'Intermediate',
    description: 'Learn the fundamentals of data science with Python and popular libraries.',
    platform: 'Coursera',
    url: 'https://www.coursera.org/learn/data-science-fundamentals',
    instructor: 'Jane Smith',
    rating: 4.7,
    students: '25,000+',
    price: 'Free (Certificate for ₹3,999)'
  },
  {
    id: '3',
    name: 'Mobile App Development with React Native',
    category: 'Mobile Development',
    duration: '20 hours',
    level: 'Intermediate',
    description: 'Build cross-platform mobile apps using React Native.',
    platform: 'Simplilearn',
    url: 'https://www.simplilearn.com/react-native-certification-training',
    instructor: 'Alex Johnson',
    rating: 4.6,
    students: '15,000+',
    price: '₹2,499'
  },
  {
    id: '4',
    name: 'AWS Certified Cloud Practitioner',
    category: 'Cloud Computing',
    duration: '16 hours',
    level: 'Beginner',
    description: 'Everything you need to pass the AWS Certified Cloud Practitioner exam',
    platform: 'AWS Training',
    url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    instructor: 'AWS Team',
    rating: 4.7,
    students: '100,000+',
    price: 'Free (Exam: ₹11,500)'
  },
  {
    id: '5',
    name: 'Python for Data Science and Machine Learning',
    category: 'Data Science',
    duration: '25 hours',
    level: 'Intermediate',
    description: 'Learn how to use NumPy, Pandas, Seaborn, Matplotlib, and Machine Learning with Python',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/',
    instructor: 'Jose Portilla',
    rating: 4.6,
    students: '200,000+',
    price: '₹1,099'
  },
  {
    id: '6',
    name: 'Financial Accounting Fundamentals',
    category: 'B.Com',
    duration: '8 weeks',
    level: 'Beginner',
    description: 'Master the basics of financial accounting and bookkeeping principles.',
    platform: 'Coursera',
    url: 'https://www.coursera.org/learn/financial-accounting-fundamentals',
    instructor: 'Prof. Brian Bushee',
    rating: 4.8,
    students: '50,000+',
    price: 'Free (Certificate for ₹3,999)'
  },
  {
    id: '7',
    name: 'Business Analytics Specialization',
    category: 'BBA',
    duration: '6 months',
    level: 'Intermediate',
    description: 'Learn to analyze data and make better business decisions with analytics.',
    platform: 'Coursera',
    url: 'https://www.coursera.org/specializations/business-analytics',
    instructor: 'Prof. Janice Hammond',
    rating: 4.7,
    students: '120,000+',
    price: '₹2,999/month'
  },
  {
    id: '8',
    name: 'Data Structures & Algorithms in Java',
    category: 'BCA',
    duration: '35 hours',
    level: 'Beginner',
    description: 'Essential computer science concepts for software development interviews.',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/data-structures-and-algorithms-java/',
    instructor: 'Dheeraj Khatri',
    rating: 4.6,
    students: '85,000+',
    price: '₹1,099'
  },
  {
    id: '9',
    name: 'Big Data Analytics with Hadoop',
    category: 'BDA',
    duration: '12 weeks',
    level: 'Advanced',
    description: 'Master big data processing using Hadoop and related technologies.',
    platform: 'edX',
    url: 'https://www.edx.org/course/big-data-analytics-with-hadoop',
    instructor: 'Prof. Rajiv Misra',
    rating: 4.5,
    students: '35,000+',
    price: 'Free (Certificate for ₹14,999)'
  },
  {
    id: '10',
    name: 'Strategic Management Specialization',
    category: 'MBA',
    duration: '5 months',
    level: 'Advanced',
    description: 'Develop your ability to think strategically and make better business decisions.',
    platform: 'Coursera',
    url: 'https://www.coursera.org/specializations/strategic-management',
    instructor: 'Prof. Michael Lenox',
    rating: 4.8,
    students: '95,000+',
    price: '₹3,999/month'
  },
  {
    id: '11',
    name: 'Advanced Database Management',
    category: 'MCA',
    duration: '10 weeks',
    level: 'Advanced',
    description: 'In-depth study of database systems and management.',
    platform: 'edX',
    url: 'https://www.edx.org/course/advanced-database-queries',
    instructor: 'Prof. Jennifer Widom',
    rating: 4.6,
    students: '28,000+',
    price: 'Free (Certificate for ₹12,499)'
  },
  {
    id: '12',
    name: 'Nursing Leadership & Management',
    category: 'M.Sc Nursing',
    duration: '8 weeks',
    level: 'Advanced',
    description: 'Essential leadership skills for nursing professionals.',
    platform: 'Coursera',
    url: 'https://www.coursera.org/learn/leadership-nursing',
    instructor: 'Dr. Linda Aiken',
    rating: 4.7,
    students: '15,000+',
    price: 'Free (Certificate for ₹3,999)'
  },
  {
    id: '13',
    name: 'Digital Marketing Fundamentals',
    category: 'BBA/MBA',
    duration: '6 weeks',
    level: 'Beginner',
    description: 'Learn the core concepts of digital marketing and social media strategy.',
    platform: 'Google Digital Garage',
    url: 'https://learndigital.withgoogle.com/digitalgarage/course/digital-marketing',
    instructor: 'Google Experts',
    rating: 4.7,
    students: '500,000+',
    price: 'Free'
  },
  {
    id: '14',
    name: 'The Complete JavaScript Course 2024',
    category: 'Web Development',
    duration: '69 hours',
    level: 'Beginner to Advanced',
    description: 'The modern JavaScript course for everyone! Master JavaScript with projects, challenges and theory.',
    platform: 'Udemy',
    url: 'https://www.udemy.com/course/the-complete-javascript-course/',
    instructor: 'Jonas Schmedtmann',
    rating: 4.7,
    students: '800,000+',
    price: '₹1,099'
  }
];

export async function GET() {
  try {
    // In a real app, you would fetch from actual APIs here
    // For now, we'll return mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({ 
      success: true, 
      courses: MOCK_COURSES 
    });
    
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses' 
      },
      { status: 500 }
    );
  }
}
