import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Simple mock user database
const MOCK_USERS = [
  {
    id: '123',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received sign-in request:', body);
    
    const { email, password } = SignInSchema.parse(body);
    console.log('Validated input:', { email });

    // Find user in mock database
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('Authentication failed: Invalid credentials');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set a simple session cookie
    cookies().set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    console.log('Cookie set successfully');

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    console.log('Sending response:', response);
    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 