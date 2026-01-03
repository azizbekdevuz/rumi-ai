import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse } from '../../../types/chat';
import { getMockResponse } from '@/lib/data/mock-responses';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response: ChatResponse = getMockResponse();

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}