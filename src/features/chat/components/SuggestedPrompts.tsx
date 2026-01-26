'use client';

import { useState } from 'react';
import { Language } from '@/lib/i18n/translations';
import { getPromptsForCountryAndLanguage } from '@/lib/data/suggested-prompts';
import { Country } from '@/types/chat';

interface SuggestedPromptsProps {
  language: Language;
  onPromptClick: (prompt: string) => void;
}

export default function SuggestedPrompts({ language, onPromptClick }: SuggestedPromptsProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>('KR');
  
  const prompts = getPromptsForCountryAndLanguage(selectedCountry, language);

  const countries: { code: Country; name: string; flag: string }[] = [
    { code: 'KR', name: 'Korea', flag: '🇰🇷' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  ];

  return (
    <div className="suggested-prompts" role="region" aria-labelledby="prompts-title">
      <div className="prompts-header">
        <h3 id="prompts-title" className="prompts-title">
          {language === 'fa' ? 'پرسش‌های پیشنهادی' : language === 'kr' ? '추천 질문' : 'Suggested Questions'}
        </h3>
        <div className="country-selector" role="group" aria-label="Select region">
          {countries.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelectedCountry(country.code)}
              className={`country-btn ${selectedCountry === country.code ? 'active' : ''}`}
              aria-pressed={selectedCountry === country.code}
              title={country.name}
            >
              {country.flag}
            </button>
          ))}
        </div>
      </div>
      
      <div className="prompts-list" role="list">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt.text)}
            className="prompt-chip"
            aria-label={`Ask: ${prompt.text}`}
          >
            <span className="prompt-category">{prompt.category}</span>
            <span className="prompt-text">{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
