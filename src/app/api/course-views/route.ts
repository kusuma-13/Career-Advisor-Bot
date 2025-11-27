import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courseViews } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const courseView = await db.select()
        .from(courseViews)
        .where(and(
          eq(courseViews.id, parseInt(id)),
          eq(courseViews.userId, user.id)
        ))
        .limit(1);

      if (courseView.length === 0) {
        return NextResponse.json({ 
          error: 'Course view not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(courseView[0], { status: 200 });
    }

    // List with pagination, search, and filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const courseCategory = searchParams.get('courseCategory');

    let query = db.select().from(courseViews);
    
    const conditions = [eq(courseViews.userId, user.id)];

    if (search) {
      conditions.push(
        or(
          like(courseViews.courseName, `%${search}%`),
          like(courseViews.courseCategory, `%${search}%`)
        )!
      );
    }

    if (courseCategory) {
      conditions.push(eq(courseViews.courseCategory, courseCategory));
    }

    query = query.where(and(...conditions));

    const results = await query
      .orderBy(desc(courseViews.viewedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { courseName, courseCategory } = body;

    // Validate required fields
    if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
      return NextResponse.json({ 
        error: "courseName is required and must be a non-empty string",
        code: "MISSING_COURSE_NAME" 
      }, { status: 400 });
    }

    if (!courseCategory || typeof courseCategory !== 'string' || courseCategory.trim() === '') {
      return NextResponse.json({ 
        error: "courseCategory is required and must be a non-empty string",
        code: "MISSING_COURSE_CATEGORY" 
      }, { status: 400 });
    }

    // Create course view
    const newCourseView = await db.insert(courseViews)
      .values({
        userId: user.id,
        courseName: courseName.trim(),
        courseCategory: courseCategory.trim(),
        viewedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newCourseView[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existing = await db.select()
      .from(courseViews)
      .where(and(
        eq(courseViews.id, parseInt(id)),
        eq(courseViews.userId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Course view not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {};

    if (body.courseName !== undefined) {
      if (typeof body.courseName !== 'string' || body.courseName.trim() === '') {
        return NextResponse.json({ 
          error: "courseName must be a non-empty string",
          code: "INVALID_COURSE_NAME" 
        }, { status: 400 });
      }
      updates.courseName = body.courseName.trim();
    }

    if (body.courseCategory !== undefined) {
      if (typeof body.courseCategory !== 'string' || body.courseCategory.trim() === '') {
        return NextResponse.json({ 
          error: "courseCategory must be a non-empty string",
          code: "INVALID_COURSE_CATEGORY" 
        }, { status: 400 });
      }
      updates.courseCategory = body.courseCategory.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    const updated = await db.update(courseViews)
      .set(updates)
      .where(and(
        eq(courseViews.id, parseInt(id)),
        eq(courseViews.userId, user.id)
      ))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists and belongs to user
    const existing = await db.select()
      .from(courseViews)
      .where(and(
        eq(courseViews.id, parseInt(id)),
        eq(courseViews.userId, user.id)
      ))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Course view not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(courseViews)
      .where(and(
        eq(courseViews.id, parseInt(id)),
        eq(courseViews.userId, user.id)
      ))
      .returning();

    return NextResponse.json({ 
      message: 'Course view deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}