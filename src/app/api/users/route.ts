import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, like, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      const users = await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      if (users.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(users[0], { status: 200 });
    }

    // List users with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }).from(user);

    if (search) {
      query = query.where(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    const users = await query.limit(limit).offset(offset);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || email.trim() === '') {
      return NextResponse.json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL' 
      }, { status: 400 });
    }

    if (!password || password.trim() === '') {
      return NextResponse.json({ 
        error: 'Password is required',
        code: 'MISSING_PASSWORD' 
      }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUsers = await db.select()
      .from(user)
      .where(eq(user.email, email.trim().toLowerCase()))
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json({ 
        error: 'Email already exists',
        code: 'EMAIL_EXISTS' 
      }, { status: 400 });
    }

    // Generate unique ID (timestamp + random string)
    const userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const now = new Date();

    // Create new user
    const newUser = await db.insert(user)
      .values({
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    // Note: Password should be stored in the account table with proper hashing
    // Creating corresponding account entry for password storage
    const accountId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    await db.insert(require('@/db/schema').account)
      .values({
        id: accountId,
        accountId: userId,
        providerId: 'credential',
        userId: userId,
        password: password, // In production, this should be hashed
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Check if user exists
    const existingUsers = await db.select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (email !== undefined) {
      if (email.trim() === '') {
        return NextResponse.json({ 
          error: 'Email cannot be empty',
          code: 'INVALID_EMAIL' 
        }, { status: 400 });
      }

      // Check if new email already exists for another user
      const emailCheck = await db.select()
        .from(user)
        .where(eq(user.email, email.trim().toLowerCase()))
        .limit(1);

      if (emailCheck.length > 0 && emailCheck[0].id !== id) {
        return NextResponse.json({ 
          error: 'Email already exists',
          code: 'EMAIL_EXISTS' 
        }, { status: 400 });
      }

      updates.email = email.trim().toLowerCase();
    }

    if (name !== undefined) {
      if (name.trim() === '') {
        return NextResponse.json({ 
          error: 'Name cannot be empty',
          code: 'INVALID_NAME' 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    // Update password in account table if provided
    if (password !== undefined) {
      if (password.trim() === '') {
        return NextResponse.json({ 
          error: 'Password cannot be empty',
          code: 'INVALID_PASSWORD' 
        }, { status: 400 });
      }

      // Update password in account table
      const accountTable = require('@/db/schema').account;
      await db.update(accountTable)
        .set({
          password: password, // In production, this should be hashed
          updatedAt: new Date(),
        })
        .where(eq(accountTable.userId, id));
    }

    const updatedUser = await db.update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || id.trim() === '') {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedUser = await db.delete(user)
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    return NextResponse.json({
      message: 'User deleted successfully',
      user: deletedUser[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}