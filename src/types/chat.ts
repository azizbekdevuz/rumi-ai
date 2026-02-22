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
  /** True when the response is grounded in retrieved corpus data */
  grounded?: boolean;
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

/** Single turn in the history payload sent to the backend */
export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  language: Language;
  country: Country;
  sourceScope: SourceScope;
  sessionId?: string;
  history?: HistoryTurn[];
}

export interface ChatResponse {
  id: string;
  sessionId?: string;
  verse: {
    fa: string;
    en?: string;
    kr?: string;
  };
  interpretation: string;
  advice: string[];
  citations: Citation[];
  retrievedCandidates?: RetrievedCandidate[];
  grounded?: boolean;
}