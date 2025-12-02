import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { jobApplications, courseViews, profiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get job applications count and recent applications
    const applications = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, user.id))
      .orderBy(desc(jobApplications.appliedAt))
      .limit(5);

    const totalApplications = applications.length;

    // Get course views count
    const courses = await db
      .select()
      .from(courseViews)
      .where(eq(courseViews.userId, user.id))
      .orderBy(desc(courseViews.viewedAt))
      .limit(5);

    const totalCourseViews = courses.length;

    // Get profile info
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const profileCompleteness = userProfile.length > 0 ? calculateProfileCompleteness(userProfile[0]) : 0;

    // Calculate activity stats
    const recentActivity = [
      ...applications.map(app => ({
        type: 'application',
        title: `Applied to ${app.jobTitle}`,
        company: app.company,
        date: app.appliedAt,
        status: app.status,
      })),
      ...courses.map(course => ({
        type: 'course',
        title: `Viewed ${course.courseName}`,
        category: course.courseCategory,
        date: course.viewedAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return NextResponse.json({
      stats: {
        totalApplications,
        totalCourseViews,
        profileCompleteness,
        skillsCount: userProfile.length > 0 ? (JSON.parse(userProfile[0].skills || '[]').length || 0) : 0,
      },
      recentApplications: applications,
      recentCourses: courses,
      recentActivity,
      profile: userProfile[0] || null,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateProfileCompleteness(profile: any): number {
  let score = 0;
  const fields = ['experienceLevel', 'education', 'skills', 'interests', 'resumeUrl', 'phone', 'location'];
  
  fields.forEach(field => {
    if (profile[field] && profile[field] !== '' && profile[field] !== '[]') {
      score += (100 / fields.length);
    }
  });
  
  return Math.round(score);
}
