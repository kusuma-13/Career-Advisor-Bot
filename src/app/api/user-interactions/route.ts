import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userInteractions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { 
            error: "Valid ID is required",
            code: "INVALID_ID" 
          }, 
          { status: 400 }
        );
      }

      const interaction = await db.select()
        .from(userInteractions)
        .where(and(
          eq(userInteractions.id, parseInt(id)),
          eq(userInteractions.userId, user.id)
        ))
        .limit(1);

      if (interaction.length === 0) {
        return NextResponse.json(
          { 
            error: 'User interaction not found',
            code: "NOT_FOUND" 
          }, 
          { status: 404 }
        );
      }

      return NextResponse.json(interaction[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const interactionType = searchParams.get('interactionType');

    let query = db.select().from(userInteractions).where(eq(userInteractions.userId, user.id));

    if (interactionType) {
      query = query.where(and(
        eq(userInteractions.userId, user.id),
        eq(userInteractions.interactionType, interactionType)
      ));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, 
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
    const { interactionType, metadata } = body;

    if (!interactionType || typeof interactionType !== 'string' || interactionType.trim() === '') {
      return NextResponse.json(
        { 
          error: "interactionType is required",
          code: "MISSING_INTERACTION_TYPE" 
        }, 
        { status: 400 }
      );
    }

    const validTypes = ['profile_update', 'course_view', 'job_search', 'job_apply', 'resume_upload'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { 
          error: `interactionType must be one of: ${validTypes.join(', ')}`,
          code: "INVALID_INTERACTION_TYPE" 
        }, 
        { status: 400 }
      );
    }

    const insertData: any = {
      userId: user.id,
      interactionType: interactionType.trim(),
      timestamp: new Date().toISOString()
    };

    if (metadata !== undefined) {
      if (typeof metadata === 'object' && metadata !== null) {
        insertData.metadata = metadata;
      } else {
        return NextResponse.json(
          { 
            error: "metadata must be a valid JSON object",
            code: "INVALID_METADATA" 
          }, 
          { status: 400 }
        );
      }
    }

    const newInteraction = await db.insert(userInteractions)
      .values(insertData)
      .returning();

    return NextResponse.json(newInteraction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message }, 
      { status: 500 }
    );
  }
}