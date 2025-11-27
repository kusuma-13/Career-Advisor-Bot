import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { education, skills, interests } = await request.json();

    const coursesDatabase = {
      bca: [
        { 
          name: 'Web Development Bootcamp', 
          category: 'Programming', 
          duration: '8 weeks', 
          level: 'Beginner', 
          description: 'Learn HTML, CSS, JavaScript, and React to build modern web applications',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
          instructor: 'Dr. Angela Yu'
        },
        { 
          name: 'Data Structures & Algorithms', 
          category: 'Computer Science', 
          duration: '10 weeks', 
          level: 'Intermediate', 
          description: 'Master essential data structures and algorithms for technical interviews',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/data-structures-algorithms',
          instructor: 'UC San Diego'
        },
        { 
          name: 'AWS Certified Solutions Architect', 
          category: 'Cloud Computing', 
          duration: '6 weeks', 
          level: 'Intermediate', 
          description: 'Deploy and manage applications on AWS cloud infrastructure',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
          instructor: 'Stephane Maarek'
        },
        { 
          name: 'Machine Learning Specialization', 
          category: 'Artificial Intelligence', 
          duration: '12 weeks', 
          level: 'Beginner', 
          description: 'Introduction to machine learning, neural networks, and AI applications',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/machine-learning-introduction',
          instructor: 'Andrew Ng'
        },
        { 
          name: 'Full Stack MERN Development', 
          category: 'Programming', 
          duration: '16 weeks', 
          level: 'Advanced', 
          description: 'Master both frontend and backend development with MERN stack',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/mern-stack-front-to-back/',
          instructor: 'Brad Traversy'
        },
        { 
          name: 'React Native - Mobile App Development', 
          category: 'Mobile Development', 
          duration: '10 weeks', 
          level: 'Intermediate', 
          description: 'Build cross-platform mobile apps with React Native',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-react-native-and-redux-course/',
          instructor: 'Stephen Grider'
        },
      ],
      bcom: [
        { 
          name: 'Financial Accounting Fundamentals', 
          category: 'Finance', 
          duration: '8 weeks', 
          level: 'Beginner', 
          description: 'Learn accounting principles, financial statements, and bookkeeping',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/wharton-accounting',
          instructor: 'University of Pennsylvania'
        },
        { 
          name: 'Excel Skills for Business', 
          category: 'Analytics', 
          duration: '6 weeks', 
          level: 'Beginner', 
          description: 'Master Excel for data analysis, reporting, and business insights',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/excel',
          instructor: 'Macquarie University'
        },
        { 
          name: 'Taxation & GST Compliance', 
          category: 'Finance', 
          duration: '10 weeks', 
          level: 'Intermediate', 
          description: 'Complete guide to Indian taxation system and GST compliance',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/complete-gst-course/',
          instructor: 'CA Yash Khandelwal'
        },
        { 
          name: 'Financial Modeling & Valuation', 
          category: 'Finance', 
          duration: '8 weeks', 
          level: 'Advanced', 
          description: 'Build financial models for valuation, budgeting, and forecasting',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/financial-modeling-for-business-analysts-and-consultants/',
          instructor: '365 Careers'
        },
        { 
          name: 'Corporate Finance Essentials', 
          category: 'Finance', 
          duration: '12 weeks', 
          level: 'Intermediate', 
          description: 'Learn capital budgeting, financial planning, and corporate strategy',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/wharton-finance',
          instructor: 'University of Pennsylvania'
        },
        { 
          name: 'QuickBooks Online Training', 
          category: 'Accounting Software', 
          duration: '4 weeks', 
          level: 'Beginner', 
          description: 'Master QuickBooks for small business accounting',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/quickbooks-pro-tutorial/',
          instructor: 'Simon Sez IT'
        },
        {
          name: 'Investment Banking Fundamentals',
          category: 'Finance',
          duration: '10 weeks',
          level: 'Advanced',
          description: 'Learn M&A, IPOs, and corporate finance advisory',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/investment-banking/',
          instructor: '365 Financial Analyst'
        },
        {
          name: 'Chartered Accountant Preparation',
          category: 'Accounting',
          duration: '16 weeks',
          level: 'Advanced',
          description: 'Complete CA foundation and intermediate preparation course',
          platform: 'Coursera',
          url: 'https://www.coursera.org/professional-certificates/accounting',
          instructor: 'ICAI Partners'
        },
      ],
      bda: [
        {
          name: 'Business Analytics with Excel',
          category: 'Analytics',
          duration: '8 weeks',
          level: 'Beginner',
          description: 'Master Excel for business analytics, pivot tables, and data visualization',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/excel-data-analytics-visualization',
          instructor: 'Rice University'
        },
        {
          name: 'Data Analysis with Python',
          category: 'Data Science',
          duration: '10 weeks',
          level: 'Intermediate',
          description: 'Learn Python, Pandas, NumPy for data analysis and visualization',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/data-analysis-with-python',
          instructor: 'IBM'
        },
        {
          name: 'SQL for Data Analysis',
          category: 'Database',
          duration: '6 weeks',
          level: 'Beginner',
          description: 'Master SQL queries for business intelligence and reporting',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
          instructor: 'Jose Portilla'
        },
        {
          name: 'Power BI Complete Course',
          category: 'Business Intelligence',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Build interactive dashboards and reports with Power BI',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/microsoft-power-bi-up-running-with-power-bi-desktop/',
          instructor: 'Maven Analytics'
        },
        {
          name: 'Tableau for Business Analytics',
          category: 'Data Visualization',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Create stunning visualizations and dashboards with Tableau',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/data-visualization',
          instructor: 'UC Davis'
        },
        {
          name: 'Predictive Analytics & Machine Learning',
          category: 'Data Science',
          duration: '12 weeks',
          level: 'Advanced',
          description: 'Apply ML algorithms for business forecasting and predictions',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/machinelearning/',
          instructor: 'Kirill Eremenko'
        },
        {
          name: 'Big Data Analytics',
          category: 'Big Data',
          duration: '10 weeks',
          level: 'Advanced',
          description: 'Work with Hadoop, Spark, and big data technologies',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/big-data',
          instructor: 'UC San Diego'
        },
        {
          name: 'Statistical Analysis for Business',
          category: 'Statistics',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Apply statistical methods for business decision making',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/business-statistics-analysis',
          instructor: 'Rice University'
        },
      ],
      bba: [
        {
          name: 'Strategic Management & Planning',
          category: 'Business Strategy',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Learn strategic planning, competitive analysis, and business models',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/strategic-management',
          instructor: 'Copenhagen Business School'
        },
        {
          name: 'Digital Marketing Masterclass',
          category: 'Marketing',
          duration: '10 weeks',
          level: 'Beginner',
          description: 'Master SEO, SEM, social media marketing, and content strategy',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/learn-digital-marketing-course/',
          instructor: 'Phil Ebiner'
        },
        {
          name: 'Human Resource Management',
          category: 'HR',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Recruitment, training, performance management, and employee relations',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/human-resource-management',
          instructor: 'University of Minnesota'
        },
        {
          name: 'Operations Management',
          category: 'Operations',
          duration: '8 weeks',
          level: 'Intermediate',
          description: 'Supply chain, logistics, and process optimization',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/operations-management',
          instructor: 'University of Illinois'
        },
        {
          name: 'Entrepreneurship & Startup Management',
          category: 'Entrepreneurship',
          duration: '10 weeks',
          level: 'Beginner',
          description: 'Launch and grow your startup with proven strategies',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-business-plan-course/',
          instructor: 'Chris Benjamin'
        },
        {
          name: 'Project Management Professional (PMP)',
          category: 'Project Management',
          duration: '12 weeks',
          level: 'Advanced',
          description: 'Complete PMP certification preparation with real-world projects',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/pmp-certification-exam-prep-course-pmbok-6th-edition/',
          instructor: 'Joseph Phillips'
        },
        {
          name: 'Business Communication Skills',
          category: 'Communication',
          duration: '6 weeks',
          level: 'Beginner',
          description: 'Effective communication, presentation, and negotiation skills',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/business-english',
          instructor: 'University of Washington'
        },
        {
          name: 'Financial Management for Non-Finance',
          category: 'Finance',
          duration: '8 weeks',
          level: 'Beginner',
          description: 'Understand financial statements, budgeting, and financial planning',
          platform: 'Coursera',
          url: 'https://www.coursera.org/learn/finance-for-non-finance',
          instructor: 'Rice University'
        },
      ],
      mba: [
        { 
          name: 'Strategic Leadership and Management', 
          category: 'Business Strategy', 
          duration: '10 weeks', 
          level: 'Advanced', 
          description: 'Develop business strategies and competitive advantage',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/strategic-leadership',
          instructor: 'University of Illinois'
        },
        { 
          name: 'Financial Planning & Analysis', 
          category: 'Finance', 
          duration: '8 weeks', 
          level: 'Advanced', 
          description: 'Master FP&A, budgeting, and financial decision-making',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-financial-analyst-course/',
          instructor: '365 Careers'
        },
        { 
          name: 'Business Analytics Specialization', 
          category: 'Analytics', 
          duration: '12 weeks', 
          level: 'Intermediate', 
          description: 'Use data analytics for business insights and decision-making',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/business-analytics',
          instructor: 'University of Pennsylvania'
        },
        { 
          name: 'Digital Marketing Masterclass', 
          category: 'Marketing', 
          duration: '8 weeks', 
          level: 'Intermediate', 
          description: 'Learn SEO, SEM, social media marketing, and content strategy',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/learn-digital-marketing-course/',
          instructor: 'Phil Ebiner'
        },
      ],
      tech: [
        { 
          name: 'Python for Everybody', 
          category: 'Programming', 
          duration: '8 weeks', 
          level: 'Beginner', 
          description: 'Learn Python from basics to advanced concepts',
          platform: 'Coursera',
          url: 'https://www.coursera.org/specializations/python',
          instructor: 'University of Michigan'
        },
        { 
          name: 'SQL - MySQL for Data Analytics', 
          category: 'Database', 
          duration: '6 weeks', 
          level: 'Intermediate', 
          description: 'Master SQL, database design, and optimization',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-ultimate-mysql-bootcamp-go-from-sql-beginner-to-expert/',
          instructor: 'Colt Steele'
        },
        { 
          name: 'DevOps, CI/CD & Kubernetes', 
          category: 'DevOps', 
          duration: '10 weeks', 
          level: 'Advanced', 
          description: 'Learn CI/CD, Docker, Kubernetes, and cloud deployment',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/',
          instructor: 'Maximilian Schwarzmüller'
        },
      ]
    };

    let recommendedCourses: any[] = [];

    // Recommend based on education
    if (education) {
      const edu = education.toLowerCase();
      if (edu.includes('bca') || edu.includes('computer applications')) {
        recommendedCourses = [...coursesDatabase.bca, ...coursesDatabase.tech];
      } else if (edu.includes('bcom') || edu.includes('b.com') || edu.includes('commerce')) {
        recommendedCourses = coursesDatabase.bcom;
      } else if (edu.includes('bda') || edu.includes('business data analytics') || edu.includes('data analytics')) {
        recommendedCourses = coursesDatabase.bda;
      } else if (edu.includes('bba') || edu.includes('b.b.a') || edu.includes('business administration')) {
        recommendedCourses = coursesDatabase.bba;
      } else if (edu.includes('mba') || edu.includes('management')) {
        recommendedCourses = [...coursesDatabase.mba, ...coursesDatabase.bba];
      } else if (edu.includes('mca') || edu.includes('b.tech') || edu.includes('engineering')) {
        recommendedCourses = [...coursesDatabase.tech, ...coursesDatabase.bca];
      } else {
        // Default recommendations
        recommendedCourses = [...coursesDatabase.bca.slice(0, 3), ...coursesDatabase.bcom.slice(0, 3), ...coursesDatabase.bda.slice(0, 2)];
      }
    }

    // Filter by skills and interests if provided
    if (skills && skills.length > 0) {
      const skillsLower = skills.map((s: string) => s.toLowerCase());
      const skillMatched = recommendedCourses.filter(course => 
        skillsLower.some((skill: string) => 
          course.name.toLowerCase().includes(skill) || 
          course.category.toLowerCase().includes(skill) ||
          course.description.toLowerCase().includes(skill)
        )
      );
      if (skillMatched.length > 0) {
        recommendedCourses = [...skillMatched, ...recommendedCourses.filter(c => !skillMatched.includes(c))];
      }
    }

    if (interests && interests.length > 0) {
      const interestsLower = interests.map((i: string) => i.toLowerCase());
      const interestMatched = recommendedCourses.filter(course => 
        interestsLower.some((interest: string) => 
          course.name.toLowerCase().includes(interest) || 
          course.category.toLowerCase().includes(interest) ||
          course.description.toLowerCase().includes(interest)
        )
      );
      if (interestMatched.length > 0) {
        recommendedCourses = [...interestMatched, ...recommendedCourses.filter(c => !interestMatched.includes(c))];
      }
    }

    // Remove duplicates and limit to 15 courses
    recommendedCourses = Array.from(new Set(recommendedCourses.map(c => c.name)))
      .map(name => recommendedCourses.find(c => c.name === name))
      .slice(0, 15);

    return NextResponse.json({
      courses: recommendedCourses,
      totalCourses: recommendedCourses.length
    });

  } catch (error) {
    console.error('Course recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}