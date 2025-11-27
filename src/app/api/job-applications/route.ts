import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobApplications } from '@/db/schema';
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

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const jobApplication = await db
        .select()
        .from(jobApplications)
        .where(and(eq(jobApplications.id, parseInt(id)), eq(jobApplications.userId, user.id)))
        .limit(1);

      if (jobApplication.length === 0) {
        return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
      }

      return NextResponse.json(jobApplication[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = db.select().from(jobApplications).where(eq(jobApplications.userId, user.id));

    const conditions = [eq(jobApplications.userId, user.id)];

    if (search) {
      conditions.push(
        or(
          like(jobApplications.jobTitle, `%${search}%`),
          like(jobApplications.company, `%${search}%`),
          like(jobApplications.location, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(jobApplications.status, status));
    }

    query = db
      .select()
      .from(jobApplications)
      .where(and(...conditions))
      .orderBy(desc(jobApplications.appliedAt))
      .limit(limit)
      .offset(offset);

    const results = await query;

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { jobTitle, company, location, salary, jobDescription, status } = body;

    if (!jobTitle || jobTitle.trim() === '') {
      return NextResponse.json(
        { error: 'Job title is required', code: 'MISSING_JOB_TITLE' },
        { status: 400 }
      );
    }

    if (!company || company.trim() === '') {
      return NextResponse.json(
        { error: 'Company is required', code: 'MISSING_COMPANY' },
        { status: 400 }
      );
    }

    if (!location || location.trim() === '') {
      return NextResponse.json(
        { error: 'Location is required', code: 'MISSING_LOCATION' },
        { status: 400 }
      );
    }

    if (!salary || isNaN(parseInt(salary)) || parseInt(salary) <= 0) {
      return NextResponse.json(
        { error: 'Valid salary is required (must be positive number)', code: 'INVALID_SALARY' },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.trim() === '') {
      return NextResponse.json(
        { error: 'Job description is required', code: 'MISSING_JOB_DESCRIPTION' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newJobApplication = await db
      .insert(jobApplications)
      .values({
        userId: user.id,
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        location: location.trim(),
        salary: parseInt(salary),
        jobDescription: jobDescription.trim(),
        status: status || 'Applied',
        appliedAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newJobApplication[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const existingRecord = await db
      .select()
      .from(jobApplications)
      .where(and(eq(jobApplications.id, parseInt(id)), eq(jobApplications.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    const { jobTitle, company, location, salary, jobDescription, status } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (jobTitle !== undefined) {
      if (jobTitle.trim() === '') {
        return NextResponse.json(
          { error: 'Job title cannot be empty', code: 'INVALID_JOB_TITLE' },
          { status: 400 }
        );
      }
      updates.jobTitle = jobTitle.trim();
    }

    if (company !== undefined) {
      if (company.trim() === '') {
        return NextResponse.json(
          { error: 'Company cannot be empty', code: 'INVALID_COMPANY' },
          { status: 400 }
        );
      }
      updates.company = company.trim();
    }

    if (location !== undefined) {
      if (location.trim() === '') {
        return NextResponse.json(
          { error: 'Location cannot be empty', code: 'INVALID_LOCATION' },
          { status: 400 }
        );
      }
      updates.location = location.trim();
    }

    if (salary !== undefined) {
      if (isNaN(parseInt(salary)) || parseInt(salary) <= 0) {
        return NextResponse.json(
          { error: 'Valid salary is required (must be positive number)', code: 'INVALID_SALARY' },
          { status: 400 }
        );
      }
      updates.salary = parseInt(salary);
    }

    if (jobDescription !== undefined) {
      if (jobDescription.trim() === '') {
        return NextResponse.json(
          { error: 'Job description cannot be empty', code: 'INVALID_JOB_DESCRIPTION' },
          { status: 400 }
        );
      }
      updates.jobDescription = jobDescription.trim();
    }

    if (status !== undefined) {
      updates.status = status;
    }

    const updated = await db
      .update(jobApplications)
      .set(updates)
      .where(and(eq(jobApplications.id, parseInt(id)), eq(jobApplications.userId, user.id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingRecord = await db
      .select()
      .from(jobApplications)
      .where(and(eq(jobApplications.id, parseInt(id)), eq(jobApplications.userId, user.id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    const deleted = await db
      .delete(jobApplications)
      .where(and(eq(jobApplications.id, parseInt(id)), eq(jobApplications.userId, user.id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Job application deleted successfully',
        deletedRecord: deleted[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}