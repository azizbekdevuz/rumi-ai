import { Country, Language } from '../../types/chat';

interface SuggestedPrompt {
  text: string;
  category: string;
}

type PromptData = Record<Country, Record<Language, SuggestedPrompt[]>>;

export const suggestedPrompts: PromptData = {
  KR: {
    en: [
      { text: 'How can I find balance in a competitive work environment?', category: 'Work Stress' },
      { text: 'I feel lonely despite being surrounded by people', category: 'Relationships' },
      { text: 'How do I cope with economic pressure and anxiety?', category: 'Economic Pressure' },
      { text: 'I feel burnt out and searching for meaning', category: 'Burnout' },
      { text: 'How can I handle constant comparison with others?', category: 'Competition' },
      { text: 'What is the path to inner peace amid external chaos?', category: 'Peace' },
    ],
    kr: [
      { text: '경쟁적인 업무 환경에서 균형을 찾으려면 어떻게 해야 할까요?', category: '업무 스트레스' },
      { text: '사람들에 둘러싸여 있지만 외로움을 느낍니다', category: '관계' },
      { text: '경제적 압박과 불안에 어떻게 대처해야 할까요?', category: '경제적 압박' },
      { text: '번아웃을 느끼고 의미를 찾고 있습니다', category: '번아웃' },
      { text: '다른 사람들과의 끊임없는 비교를 어떻게 다뤄야 할까요?', category: '경쟁' },
      { text: '외부의 혼돈 속에서 내면의 평화로 가는 길은 무엇인가요?', category: '평화' },
    ],
    fa: [
      { text: 'چگونه می‌توانم در محیط کاری رقابتی تعادل پیدا کنم؟', category: 'استرس کاری' },
      { text: 'علی‌رغم اینکه احاطه‌ام کرده‌اند احساس تنهایی می‌کنم', category: 'روابط' },
      { text: 'چگونه با فشار اقتصادی و اضطراب کنار بیایم؟', category: 'فشار اقتصادی' },
      { text: 'احساس فرسودگی می‌کنم و به دنبال معنا هستم', category: 'فرسودگی' },
      { text: 'چگونه با مقایسه دائمی با دیگران برخورد کنم؟', category: 'رقابت' },
      { text: 'مسیر به آرامش درونی در میان هرج و مرج بیرونی چیست؟', category: 'آرامش' },
    ],
  },
  IR: {
    en: [
      { text: 'How can I find hope during times of uncertainty?', category: 'Uncertainty' },
      { text: 'What wisdom helps navigate economic hardship?', category: 'Economic Hardship' },
      { text: 'How do I maintain resilience in difficult times?', category: 'Resilience' },
      { text: 'I feel anxious about the future', category: 'Anxiety' },
      { text: 'How can I find peace amid social tension?', category: 'Social Tension' },
      { text: 'What gives strength when facing challenges?', category: 'Strength' },
    ],
    fa: [
      { text: 'چگونه در زمان‌های عدم قطعیت امید پیدا کنم؟', category: 'عدم قطعیت' },
      { text: 'چه خردی در پیمودن سختی‌های اقتصادی کمک می‌کند؟', category: 'سختی اقتصادی' },
      { text: 'چگونه در زمان‌های دشوار انعطاف‌پذیری را حفظ کنم؟', category: 'انعطاف‌پذیری' },
      { text: 'نسبت به آینده احساس اضطراب می‌کنم', category: 'اضطراب' },
      { text: 'چگونه در میان تنش اجتماعی آرامش پیدا کنم؟', category: 'تنش اجتماعی' },
      { text: 'چه چیزی هنگام مواجهه با چالش‌ها قدرت می‌دهد؟', category: 'قدرت' },
    ],
    kr: [
      { text: '불확실한 시기에 어떻게 희망을 찾을 수 있을까요?', category: '불확실성' },
      { text: '경제적 어려움을 헤쳐 나가는 데 도움이 되는 지혜는 무엇인가요?', category: '경제적 어려움' },
      { text: '어려운 시기에 어떻게 회복력을 유지할 수 있을까요?', category: '회복력' },
      { text: '미래에 대해 불안함을 느낍니다', category: '불안' },
      { text: '사회적 긴장 속에서 어떻게 평화를 찾을 수 있을까요?', category: '사회적 긴장' },
      { text: '도전에 직면했을 때 무엇이 힘을 줄까요?', category: '힘' },
    ],
  },
  UZ: {
    en: [
      { text: 'How can I cope with being far from family?', category: 'Migration' },
      { text: 'I feel stuck in my career path', category: 'Career Stagnation' },
      { text: 'How do I build trust in uncertain times?', category: 'Trust' },
      { text: 'What wisdom helps with separation anxiety?', category: 'Separation' },
      { text: 'How can I improve my daily health habits?', category: 'Health' },
      { text: 'What brings meaning when feeling disconnected?', category: 'Connection' },
    ],
    fa: [
      { text: 'چگونه با دور بودن از خانواده کنار بیایم؟', category: 'مهاجرت' },
      { text: 'احساس می‌کنم در مسیر شغلی‌ام گیر کرده‌ام', category: 'رکود شغلی' },
      { text: 'چگونه در زمان‌های نامطمئن اعتماد بسازم؟', category: 'اعتماد' },
      { text: 'چه خردی با اضطراب جدایی کمک می‌کند؟', category: 'جدایی' },
      { text: 'چگونه می‌توانم عادات بهداشتی روزانه‌ام را بهبود بخشم؟', category: 'سلامت' },
      { text: 'چه چیزی هنگام احساس قطع ارتباط معنا می‌آورد؟', category: 'ارتباط' },
    ],
    kr: [
      { text: '가족과 멀리 떨어져 있는 것에 어떻게 대처할 수 있을까요?', category: '이주' },
      { text: '제 경력 경로에서 막힌 느낌입니다', category: '경력 정체' },
      { text: '불확실한 시기에 어떻게 신뢰를 구축할 수 있을까요?', category: '신뢰' },
      { text: '분리 불안에 도움이 되는 지혜는 무엇인가요?', category: '분리' },
      { text: '일상적인 건강 습관을 어떻게 개선할 수 있을까요?', category: '건강' },
      { text: '단절감을 느낄 때 무엇이 의미를 가져다줄까요?', category: '연결' },
    ],
  },
};

export function getPromptsForCountryAndLanguage(
  country: Country,
  language: Language
): SuggestedPrompt[] {
  return suggestedPrompts[country][language] || suggestedPrompts[country].en;
}