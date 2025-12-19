import { ChatResponse } from '../../types/chat';

export const mockResponses: ChatResponse[] = [
  {
    id: 'mock-1',
    verse: {
      fa: 'بشنو از نی چون حکایت می‌کند / از جدایی‌ها شکایت می‌کند',
      en: 'Listen to the reed, how it tells a tale, / Complaining of separations.',
      kr: '갈대의 이야기를 들어보세요 / 이별을 한탄하며',
    },
    interpretation:
      'Rumi uses the reed flute as a metaphor for the human soul separated from its divine source. Just as the reed was cut from the reed bed and now laments through music, we too feel the pain of separation from our true home. This separation is not meant to cause despair, but rather to awaken in us a deep longing for reunion with the divine.',
    advice: [
      'Acknowledge your feelings of separation or loneliness as natural and meaningful',
      'Use creative expression (music, writing, art) to channel your longing into something beautiful',
      'Remember that your yearning itself is a sign of your connection to something greater',
      'Seek community with others who understand this spiritual journey',
    ],
    citations: [
      {
        book: 'Masnavi',
        page: 1,
        refId: 'masnavi-1-1',
        snippet: 'Listen to the reed, how it tells a tale, complaining of separations...',
      },
      {
        book: 'Divan-e Shams',
        page: 45,
        refId: 'divan-45-3',
        snippet: 'The pain of separation is the bridge to union...',
      },
    ],
    retrievedCandidates: [
      { book: 'Masnavi', page: 1, refId: 'masnavi-1-1' },
      { book: 'Masnavi', page: 12, refId: 'masnavi-1-12' },
      { book: 'Divan-e Shams', page: 45, refId: 'divan-45-3' },
      { book: 'Fihi Ma Fihi', page: 78, refId: 'fihi-78-2' },
    ],
  },
];

export function getMockResponse(): ChatResponse {
  return {
    ...mockResponses[0],
    id: `msg-${Date.now()}`,
  };
}