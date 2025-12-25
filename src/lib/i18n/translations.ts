export type Language = 'fa' | 'en' | 'kr';

export interface Translations {
  nav: {
    home: string;
    chat: string;
    books: string;
    about: string;
  };
  footer: {
    tagline: string;
    quickLinks: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
  };
  hero: {
    quote: string;
    quoteTranslation: string;
    cta: string;
  };
  features: {
    chat: { title: string; description: string };
    books: { title: string; description: string };
    multilingual: { title: string; description: string };
    daily: { title: string; description: string };
  };
  howItWorks: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    cta: string;
  };
  chat?: {
    emptyTitle: string;
    emptyText: string;
    inputPlaceholder: string;
    scopeBooks: string;
    scopeWebBooks: string;
    scopeWeb: string;
    verse: string;
    interpretation: string;
    advice: string;
    citations: string;
    helpful: string;
    notHelpful: string;
    report: string;
  };
  books?: {
    title: string;
    searchPlaceholder: string;
    filterAll: string;
    noResults: string;
    readBook: string;
    pages: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      chat: 'Chat',
      books: 'Books',
      about: 'About',
    },
    footer: {
      tagline: 'AI wisdom inspired by the poetry of Rumi.',
      quickLinks: 'Quick Links',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
    },
    hero: {
      quote: 'مرجِ در جُشِن آیی، آیی',
      quoteTranslation: 'You are what you seek.',
      cta: 'Ask Rumi',
    },
    features: {
      chat: {
        title: 'Chat',
        description: 'Get guidance from Rumi AI.',
      },
      books: {
        title: 'Books',
        description: "Explore Rumi's works.",
      },
      multilingual: {
        title: 'Multilingual',
        description: 'Supports فارسی | English | 한국어',
      },
      daily: {
        title: 'Daily Inspiration',
        description: 'Receive daily wisdom.',
      },
    },
    howItWorks: {
      title: 'How It Works',
      step1: 'Ask your question',
      step2: 'Rumi finds quotes',
      step3: 'Receive guidance',
      step4: 'See citations',
      cta: 'Start your journey',
    },
    chat: {
      emptyTitle: 'Ask Rumi for Guidance',
      emptyText: "Share your questions or concerns, and receive wisdom from Rumi's poetry.",
      inputPlaceholder: 'Describe your struggle or ask a question...',
      scopeBooks: 'My Sources Only',
      scopeWebBooks: 'Web + Books',
      scopeWeb: 'Web Only',
      verse: 'Verse',
      interpretation: 'Interpretation',
      advice: 'Practical Advice',
      citations: 'Citations',
      helpful: 'Helpful',
      notHelpful: 'Not helpful',
      report: 'Report issue',
    },
    books: {
      title: 'Library',
      searchPlaceholder: 'Search books...',
      filterAll: 'All Books',
      noResults: 'No books found matching your search.',
      readBook: 'Read Book',
      pages: 'pages',
    },
  },
  fa: {
    nav: {
      home: 'خانه',
      chat: 'گفتگو',
      books: 'کتاب‌ها',
      about: 'درباره',
    },
    footer: {
      tagline: 'خرد هوش مصنوعی الهام‌گرفته از شعر مولانا رومی.',
      quickLinks: 'پیوندهای سریع',
      language: 'زبان',
      theme: 'تم',
      light: 'روشن',
      dark: 'تاریک',
    },
    hero: {
      quote: 'مرجِ در جُشِن آیی، آیی',
      quoteTranslation: 'تو همان هستی که می‌جویی.',
      cta: 'از مولانا بپرسید',
    },
    features: {
      chat: {
        title: 'گفتگو',
        description: 'راهنمایی از هوش مصنوعی مولانا دریافت کنید.',
      },
      books: {
        title: 'کتاب‌ها',
        description: 'آثار مولانا را کاوش کنید.',
      },
      multilingual: {
        title: 'چندزبانه',
        description: 'پشتیبانی از فارسی | English | 한국어',
      },
      daily: {
        title: 'الهام روزانه',
        description: 'دریافت خرد روزانه.',
      },
    },
    howItWorks: {
      title: 'چگونه کار می‌کند',
      step1: 'پرسش خود را بپرسید',
      step2: 'مولانا نقل‌قول‌ها را پیدا می‌کند',
      step3: 'راهنمایی دریافت کنید',
      step4: 'استنادات را ببینید',
      cta: 'سفر خود را آغاز کنید',
    },
    chat: {
      emptyTitle: 'از مولانا راهنمایی بخواهید',
      emptyText: 'پرسش‌ها یا نگرانی‌های خود را به اشتراک بگذارید و از اشعار مولانا خرد دریافت کنید.',
      inputPlaceholder: 'مشکل خود را شرح دهید یا سؤالی بپرسید...',
      scopeBooks: 'فقط منابع من',
      scopeWebBooks: 'وب + کتاب‌ها',
      scopeWeb: 'فقط وب',
      verse: 'بیت',
      interpretation: 'تفسیر',
      advice: 'توصیه عملی',
      citations: 'استنادات',
      helpful: 'مفید بود',
      notHelpful: 'مفید نبود',
      report: 'گزارش مشکل',
    },
    books: {
      title: 'کتابخانه',
      searchPlaceholder: 'جستجوی کتاب‌ها...',
      filterAll: 'همه کتاب‌ها',
      noResults: 'کتابی مطابق جستجوی شما یافت نشد.',
      readBook: 'خواندن کتاب',
      pages: 'صفحه',
    },
  },
  kr: {
    nav: {
      home: '홈',
      chat: '채팅',
      books: '도서',
      about: '소개',
    },
    footer: {
      tagline: '루미의 시에서 영감을 받은 AI 지혜.',
      quickLinks: '빠른 링크',
      language: '언어',
      theme: '테마',
      light: '라이트',
      dark: '다크',
    },
    hero: {
      quote: 'مرجِ در جُشِن آیی، آیی',
      quoteTranslation: '당신은 당신이 찾는 것입니다.',
      cta: '루미에게 물어보기',
    },
    features: {
      chat: {
        title: '채팅',
        description: '루미 AI로부터 안내를 받으세요.',
      },
      books: {
        title: '도서',
        description: '루미의 작품을 탐색하세요.',
      },
      multilingual: {
        title: '다국어',
        description: 'فارسی | English | 한국어 지원',
      },
      daily: {
        title: '매일의 영감',
        description: '매일 지혜를 받으세요.',
      },
    },
    howItWorks: {
      title: '작동 방식',
      step1: '질문하기',
      step2: '루미가 인용구를 찾습니다',
      step3: '안내 받기',
      step4: '인용 보기',
      cta: '여정 시작하기',
    },
    chat: {
      emptyTitle: '루미에게 안내를 구하세요',
      emptyText: '질문이나 걱정을 나누고 루미의 시에서 지혜를 받으세요.',
      inputPlaceholder: '고민을 설명하거나 질문을 하세요...',
      scopeBooks: '내 자료만',
      scopeWebBooks: '웹 + 도서',
      scopeWeb: '웹만',
      verse: '시구',
      interpretation: '해석',
      advice: '실용적 조언',
      citations: '인용',
      helpful: '도움이 됨',
      notHelpful: '도움이 안 됨',
      report: '문제 신고',
    },
    books: {
      title: '도서관',
      searchPlaceholder: '도서 검색...',
      filterAll: '모든 도서',
      noResults: '검색어와 일치하는 도서가 없습니다.',
      readBook: '도서 읽기',
      pages: '페이지',
    },
  },
};