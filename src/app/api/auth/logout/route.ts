import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface LogoutResponse {
  success: boolean;
  message?: string;
}

export async function POST(_request: NextRequest) {
  try {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.delete('rumi_token');

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout API route error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process logout request' },
      { status: 500 }
    );
  }
}
