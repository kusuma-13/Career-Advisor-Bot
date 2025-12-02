import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// AI-powered skill recommendation based on resume text
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { resumeText, education } = await request.json();

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    // Simple keyword-based skill extraction
    const skillsDatabase = {
      technical: [
        'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Angular', 'Vue.js',
        'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
        'Git', 'REST API', 'GraphQL', 'TypeScript', 'HTML', 'CSS', 'Machine Learning',
        'Data Science', 'AI', 'Cloud Computing', 'DevOps', 'Agile', 'Scrum'
      ],
      finance: [
        'Financial Accounting', 'Taxation', 'GST', 'Tally', 'Excel', 'Financial Analysis',
        'Auditing', 'Cost Accounting', 'Financial Reporting', 'Budgeting', 'Forecasting',
        'SAP', 'QuickBooks', 'Business Analytics', 'Financial Modeling', 'Compliance'
      ],
      soft: [
        'Communication', 'Leadership', 'Team Management', 'Problem Solving',
        'Critical Thinking', 'Time Management', 'Project Management', 'Presentation'
      ]
    };

    const text = resumeText.toLowerCase();
    const detectedSkills: string[] = [];

    // Detect skills based on education
    if (education) {
      const edu = education.toLowerCase();
      if (edu.includes('bca') || edu.includes('mca') || edu.includes('b.tech') || edu.includes('computer')) {
        skillsDatabase.technical.forEach(skill => {
          if (text.includes(skill.toLowerCase())) {
            detectedSkills.push(skill);
          }
        });
      } else if (edu.includes('bcom') || edu.includes('mba') || edu.includes('commerce') || edu.includes('finance')) {
        skillsDatabase.finance.forEach(skill => {
          if (text.includes(skill.toLowerCase())) {
            detectedSkills.push(skill);
          }
        });
      }
    }

    // Detect all skills
    [...skillsDatabase.technical, ...skillsDatabase.finance, ...skillsDatabase.soft].forEach(skill => {
      if (text.includes(skill.toLowerCase()) && !detectedSkills.includes(skill)) {
        detectedSkills.push(skill);
      }
    });

    // If no skills detected, recommend based on education
    if (detectedSkills.length === 0) {
      if (education) {
        const edu = education.toLowerCase();
        if (edu.includes('bca') || edu.includes('mca') || edu.includes('b.tech') || edu.includes('computer')) {
          detectedSkills.push('JavaScript', 'React', 'Node.js', 'SQL', 'Git');
        } else if (edu.includes('bcom') || edu.includes('mba') || edu.includes('commerce') || edu.includes('finance')) {
          detectedSkills.push('Excel', 'Financial Accounting', 'Tally', 'Taxation', 'Business Analytics');
        }
      }
    }

    return NextResponse.json({
      skills: detectedSkills.slice(0, 10),
      message: `Detected ${detectedSkills.length} relevant skills from your resume`
    });

  } catch (error) {
    console.error('Skill recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
