import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse } from '../../../types/chat';
import { getMockResponse } from '@/lib/data/mock-responses';

export async function POST(_request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _body: ChatRequest = await _request.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response: ChatResponse = getMockResponse();

    return NextResponse.json(response);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}