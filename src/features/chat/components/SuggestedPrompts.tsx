'use client';

import { Language } from '@/lib/i18n/translations';
import { getPromptsForCountryAndLanguage } from '@/lib/data/suggested-prompts';
import { Country } from '@/types/chat';

interface SuggestedPromptsProps {
  language: Language;
  onPromptClick: (prompt: string) => void;
}

export default function SuggestedPrompts({ language, onPromptClick }: SuggestedPromptsProps) {
  // Use default country (KR) - no country selector in chat area
  const selectedCountry: Country = 'KR';
  const prompts = getPromptsForCountryAndLanguage(selectedCountry, language);

  return (
    <div className="suggested-prompts" role="region" aria-labelledby="prompts-title">
      <div className="prompts-header">
        <h3 id="prompts-title" className="prompts-title">
          {language === 'fa' ? 'پرسش‌های پیشنهادی' : language === 'kr' ? '추천 질문' : 'Suggested Questions'}
        </h3>
      </div>
      
      <div className="prompts-list" role="list">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt.text)}
            className="prompt-chip"
            aria-label={`Ask: ${prompt.text}`}
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
