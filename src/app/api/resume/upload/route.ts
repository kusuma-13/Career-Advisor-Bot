import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db';
import { profiles, userInteractions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and Word documents are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Read file content for text extraction (simplified)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resumeText = buffer.toString('utf-8', 0, Math.min(buffer.length, 5000)); // Extract first 5000 chars

    // In production, you would upload to storage (S3, Supabase Storage, etc.)
    const resumeUrl = `https://storage.example.com/resumes/${user.id}/${file.name}`;

    // FIXED: Pass metadata as object directly, not JSON.stringify()
    await db.insert(userInteractions).values({
      userId: user.id,
      interactionType: 'resume_upload',
      metadata: { 
        fileName: file.name, 
        fileSize: `${(file.size / 1024).toFixed(2)}KB`,
        fileType: file.type
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      resumeUrl,
      resumeText,
      fileName: file.name,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}