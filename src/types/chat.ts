export type Language = 'fa' | 'en' | 'kr';
export type Country = 'KR' | 'IR' | 'UZ';
export type SourceScope = 'books' | 'web_books' | 'web';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantMessage extends ChatMessage {
  role: 'assistant';
  verse: {
    fa: string;
    en?: string;
    kr?: string;
  };
  interpretation: string;
  advice: string[];
  citations: Citation[];
  retrievedCandidates?: RetrievedCandidate[];
}

export interface Citation {
  book: string;
  page: number;
  refId: string;
  snippet: string;
}

export interface RetrievedCandidate {
  book: string;
  page: number;
  refId: string;
}

export interface ChatRequest {
  message: string;
  language: Language;
  country: Country;
  sourceScope: SourceScope;
  history: ChatMessage[];
}

export interface ChatResponse {
  id: string;
  verse: {
    fa: string;
    en?: string;
    kr?: string;
  };
  interpretation: string;
  advice: string[];
  citations: Citation[];
  retrievedCandidates?: RetrievedCandidate[];
}