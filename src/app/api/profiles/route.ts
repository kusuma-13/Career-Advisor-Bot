import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const profile = await db.select()
        .from(profiles)
        .where(and(
          eq(profiles.id, parseInt(id)),
          eq(profiles.userId, user.id)
        ))
        .limit(1);

      if (profile.length === 0) {
        return NextResponse.json({ 
          error: 'Profile not found',
          code: "PROFILE_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(profile[0], { status: 200 });
    }

    // List with pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const results = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
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

    const { experienceLevel, education, skills, interests, resumeUrl, resumeText, phone, location } = body;

    // Validate required fields
    if (!experienceLevel || typeof experienceLevel !== 'string' || experienceLevel.trim() === '') {
      return NextResponse.json({ 
        error: "Experience level is required",
        code: "MISSING_EXPERIENCE_LEVEL" 
      }, { status: 400 });
    }

    if (!education || typeof education !== 'string' || education.trim() === '') {
      return NextResponse.json({ 
        error: "Education is required",
        code: "MISSING_EDUCATION" 
      }, { status: 400 });
    }

    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json({ 
        error: "Skills must be provided as an array",
        code: "INVALID_SKILLS" 
      }, { status: 400 });
    }

    if (!interests || !Array.isArray(interests)) {
      return NextResponse.json({ 
        error: "Interests must be provided as an array",
        code: "INVALID_INTERESTS" 
      }, { status: 400 });
    }

    const insertData: any = {
      userId: user.id,
      experienceLevel: experienceLevel.trim(),
      education: education.trim(),
      skills: JSON.stringify(skills),
      interests: JSON.stringify(interests),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (resumeUrl !== undefined && resumeUrl !== null) {
      insertData.resumeUrl = typeof resumeUrl === 'string' ? resumeUrl.trim() : resumeUrl;
    }
    if (resumeText !== undefined && resumeText !== null) {
      insertData.resumeText = typeof resumeText === 'string' ? resumeText.trim() : resumeText;
    }
    if (phone !== undefined && phone !== null) {
      insertData.phone = typeof phone === 'string' ? phone.trim() : phone;
    }
    if (location !== undefined && location !== null) {
      insertData.location = typeof location === 'string' ? location.trim() : location;
    }

    const newProfile = await db.insert(profiles)
      .values(insertData)
      .returning();

    const result = {
      ...newProfile[0],
      skills: JSON.parse(newProfile[0].skills as string),
      interests: JSON.parse(newProfile[0].interests as string)
    };

    return NextResponse.json(result, { status: 201 });

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

    // Security check
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if profile exists and belongs to user
    const existingProfile = await db.select()
      .from(profiles)
      .where(and(
        eq(profiles.id, parseInt(id)),
        eq(profiles.userId, user.id)
      ))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: "PROFILE_NOT_FOUND" 
      }, { status: 404 });
    }

    const { experienceLevel, education, skills, interests, resumeUrl, resumeText, phone, location } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (experienceLevel !== undefined) {
      updateData.experienceLevel = experienceLevel.trim();
    }

    if (education !== undefined) {
      updateData.education = education.trim();
    }

    if (skills !== undefined) {
      updateData.skills = JSON.stringify(skills);
    }

    if (interests !== undefined) {
      updateData.interests = JSON.stringify(interests);
    }

    if (resumeUrl !== undefined) {
      updateData.resumeUrl = resumeUrl && typeof resumeUrl === 'string' ? resumeUrl.trim() : resumeUrl;
    }

    if (resumeText !== undefined) {
      updateData.resumeText = resumeText && typeof resumeText === 'string' ? resumeText.trim() : resumeText;
    }

    if (phone !== undefined) {
      updateData.phone = phone && typeof phone === 'string' ? phone.trim() : phone;
    }

    if (location !== undefined) {
      updateData.location = location && typeof location === 'string' ? location.trim() : location;
    }

    const updated = await db.update(profiles)
      .set(updateData)
      .where(and(
        eq(profiles.id, parseInt(id)),
        eq(profiles.userId, user.id)
      ))
      .returning();

    const result = {
      ...updated[0],
      skills: JSON.parse(updated[0].skills as string),
      interests: JSON.parse(updated[0].interests as string)
    };

    return NextResponse.json(result, { status: 200 });

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

    const existingProfile = await db.select()
      .from(profiles)
      .where(and(
        eq(profiles.id, parseInt(id)),
        eq(profiles.userId, user.id)
      ))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: "PROFILE_NOT_FOUND" 
      }, { status: 404 });
    }

    const deleted = await db.delete(profiles)
      .where(and(
        eq(profiles.id, parseInt(id)),
        eq(profiles.userId, user.id)
      ))
      .returning();

    const result = {
      ...deleted[0],
      skills: JSON.parse(deleted[0].skills as string),
      interests: JSON.parse(deleted[0].interests as string)
    };

    return NextResponse.json({
      message: 'Profile deleted successfully',
      profile: result
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}