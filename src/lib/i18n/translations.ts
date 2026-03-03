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
    privacy: string;
    contact: string;
    copyright: string;
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
  about?: {
    heroTitle: string;
    heroSubtitle: string;
    missionTitle: string;
    missionText: string;
    featureMissionTitle: string;
    featureMissionText: string;
    featureMultilingualTitle: string;
    featureMultilingualText: string;
    featureCitationTitle: string;
    featureCitationText: string;
    privacyPolicy: string;
    contactUs: string;
  };
  privacy?: {
    title: string;
    subtitle: string;
    lastUpdated: string;
    sections: {
      heading: string;
      content: string;
    }[];
  };
  contact?: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    successTitle: string;
    successText: string;
    sendAnother: string;
    errorText: string;
    infoTitle: string;
    infoEmail: string;
    infoResponse: string;
    infoResponseText: string;
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
      privacy: 'Privacy',
      contact: 'Contact',
      copyright: '© 2026 Rumi AI Project. All rights reserved.',
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
    about: {
      heroTitle: 'Rumi AI Agent',
      heroSubtitle: 'Bridging timeless wisdom with modern technology',
      missionTitle: 'Our Mission',
      missionText: 'Rumi AI exists to make the timeless wisdom of Persian poetry accessible and relevant to modern seekers. We believe that the insights of Rumi, Hafez, and other great masters can guide us through contemporary challenges with grace and understanding.',
      featureMissionTitle: 'Our Mission',
      featureMissionText: 'Making ancient wisdom accessible and relevant for modern life through AI-powered guidance.',
      featureMultilingualTitle: 'Multilingual Support',
      featureMultilingualText: 'Experience Rumi\'s wisdom in your native language with full support for Persian, English, and Korean.',
      featureCitationTitle: 'Citation-Based Guidance',
      featureCitationText: 'Every response is grounded in authentic sources, ensuring accuracy and respect for the original teachings.',
      privacyPolicy: 'Privacy Policy',
      contactUs: 'Contact Us',
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Your privacy matters to us. This policy explains how Rumi AI collects, uses, and protects your personal information.',
      lastUpdated: 'Last updated: March 2026',
      sections: [
        {
          heading: 'Information We Collect',
          content: 'We collect information you provide directly, such as your email address and name when creating an account. When using the chat feature, your questions are processed to generate responses but are only stored if you are signed in, to maintain your chat history. We also collect basic usage analytics (page visits, feature usage) to improve the service.',
        },
        {
          heading: 'How We Use Your Information',
          content: 'Your information is used to provide and improve the Rumi AI service, including: generating personalized responses grounded in Rumi\'s poetry, maintaining your chat history and saved preferences, improving our AI models and retrieval accuracy, and communicating important service updates. We never sell your personal data to third parties.',
        },
        {
          heading: 'Data Storage & Security',
          content: 'Your data is stored securely using industry-standard encryption. Chat sessions are stored in PostgreSQL databases with proper access controls. We implement rate limiting, input validation, and secure authentication to protect your account. All data transmissions use HTTPS encryption.',
        },
        {
          heading: 'Cookies & Local Storage',
          content: 'We use minimal browser storage to remember your theme preference (light/dark), language selection, and authentication session. No third-party tracking cookies are used. You can clear this data at any time through your browser settings.',
        },
        {
          heading: 'Your Rights',
          content: 'You have the right to: access your personal data, request correction of inaccurate data, request deletion of your account and associated data, export your chat history, and withdraw consent at any time. To exercise these rights, please contact us through the contact page.',
        },
        {
          heading: 'AI & Content Disclaimer',
          content: 'Rumi AI uses Retrieval-Augmented Generation (RAG) to provide guidance based on authentic Rumi poetry. While we strive for accuracy, AI-generated interpretations and advice should not replace professional counseling. All responses include citations to the original source texts for transparency.',
        },
        {
          heading: 'Changes to This Policy',
          content: 'We may update this privacy policy from time to time. We will notify registered users of significant changes via email. Continued use of the service after changes constitutes acceptance of the updated policy.',
        },
      ],
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Have a question, suggestion, or feedback? We\'d love to hear from you.',
      nameLabel: 'Your Name',
      namePlaceholder: 'Enter your name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'you@example.com',
      subjectLabel: 'Subject',
      subjectPlaceholder: 'What is this about?',
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us what\'s on your mind...',
      send: 'Send Message',
      sending: 'Sending...',
      successTitle: 'Message Sent!',
      successText: 'Thank you for reaching out. We\'ll get back to you as soon as possible.',
      sendAnother: 'Send another message',
      errorText: 'Something went wrong. Please try again later.',
      infoTitle: 'Other Ways to Reach Us',
      infoEmail: 'rumi.ai.agent@gmail.com',
      infoResponse: 'Response Time',
      infoResponseText: 'We typically respond within 24–48 hours.',
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
      privacy: 'حریم خصوصی',
      contact: 'تماس',
      copyright: '© ۲۰۲۶ پروژه رومی AI. تمامی حقوق محفوظ است.',
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
    about: {
      heroTitle: 'رومی AI Agent',
      heroSubtitle: 'پیوند حکمت بی‌زمان با فناوری مدرن',
      missionTitle: 'مأموریت ما',
      missionText: 'رومی AI وجود دارد تا حکمت بی‌زمان شعر فارسی را برای جویندگان امروزی قابل دسترس و مرتبط سازد. ما باور داریم که بینش‌های مولانا، حافظ و دیگر استادان بزرگ می‌توانند ما را در چالش‌های معاصر با لطف و درک راهنمایی کنند.',
      featureMissionTitle: 'مأموریت ما',
      featureMissionText: 'دسترس‌پذیر کردن حکمت کهن و مرتبط ساختن آن با زندگی مدرن از طریق راهنمایی مبتنی بر هوش مصنوعی.',
      featureMultilingualTitle: 'پشتیبانی چندزبانه',
      featureMultilingualText: 'حکمت مولانا را به زبان مادری خود تجربه کنید با پشتیبانی کامل از فارسی، انگلیسی و کره‌ای.',
      featureCitationTitle: 'راهنمایی مبتنی بر استناد',
      featureCitationText: 'هر پاسخ بر اساس منابع معتبر استوار است و دقت و احترام به آموزه‌های اصلی را تضمین می‌کند.',
      privacyPolicy: 'سیاست حریم خصوصی',
      contactUs: 'تماس با ما',
    },
    privacy: {
      title: 'سیاست حریم خصوصی',
      subtitle: 'حریم خصوصی شما برای ما مهم است. این سیاست نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات شخصی شما را توضیح می‌دهد.',
      lastUpdated: 'آخرین به‌روزرسانی: اسفند ۱۴۰۴',
      sections: [
        {
          heading: 'اطلاعاتی که جمع‌آوری می‌کنیم',
          content: 'ما اطلاعاتی را که مستقیماً ارائه می‌دهید جمع‌آوری می‌کنیم، مانند آدرس ایمیل و نام شما هنگام ایجاد حساب. هنگام استفاده از ویژگی گفتگو، پرسش‌های شما برای تولید پاسخ پردازش می‌شوند اما فقط در صورت ورود به سیستم ذخیره می‌شوند.',
        },
        {
          heading: 'نحوه استفاده از اطلاعات شما',
          content: 'اطلاعات شما برای ارائه و بهبود خدمات رومی AI استفاده می‌شود. ما هرگز اطلاعات شخصی شما را به اشخاص ثالث نمی‌فروشیم.',
        },
        {
          heading: 'ذخیره‌سازی و امنیت داده‌ها',
          content: 'داده‌های شما با استفاده از رمزنگاری استاندارد صنعتی به صورت امن ذخیره می‌شوند. تمام انتقال داده‌ها از رمزنگاری HTTPS استفاده می‌کنند.',
        },
        {
          heading: 'کوکی‌ها و ذخیره‌سازی محلی',
          content: 'ما از حداقل ذخیره‌سازی مرورگر برای به خاطر سپردن تنظیمات تم، انتخاب زبان و جلسه احراز هویت شما استفاده می‌کنیم. هیچ کوکی ردیابی شخص ثالثی استفاده نمی‌شود.',
        },
        {
          heading: 'حقوق شما',
          content: 'شما حق دسترسی به داده‌های شخصی، درخواست اصلاح، حذف حساب و صادرات تاریخچه گفتگو را دارید. برای استفاده از این حقوق، لطفاً از طریق صفحه تماس با ما ارتباط برقرار کنید.',
        },
        {
          heading: 'سلب مسئولیت هوش مصنوعی',
          content: 'رومی AI از فناوری تولید تقویت‌شده با بازیابی (RAG) برای ارائه راهنمایی استفاده می‌کند. پاسخ‌های تولید شده توسط هوش مصنوعی نباید جایگزین مشاوره حرفه‌ای شوند.',
        },
        {
          heading: 'تغییرات در این سیاست',
          content: 'ما ممکن است این سیاست حریم خصوصی را به‌روزرسانی کنیم. تغییرات مهم از طریق ایمیل به کاربران ثبت‌نام شده اطلاع‌رسانی خواهد شد.',
        },
      ],
    },
    contact: {
      title: 'تماس با ما',
      subtitle: 'سؤال، پیشنهاد یا بازخوردی دارید؟ خوشحال می‌شویم از شما بشنویم.',
      nameLabel: 'نام شما',
      namePlaceholder: 'نام خود را وارد کنید',
      emailLabel: 'آدرس ایمیل',
      emailPlaceholder: 'you@example.com',
      subjectLabel: 'موضوع',
      subjectPlaceholder: 'موضوع پیام چیست؟',
      messageLabel: 'پیام',
      messagePlaceholder: 'پیام خود را بنویسید...',
      send: 'ارسال پیام',
      sending: 'در حال ارسال...',
      successTitle: 'پیام ارسال شد!',
      successText: 'از تماس شما متشکریم. در اسرع وقت پاسخ خواهیم داد.',
      sendAnother: 'ارسال پیام دیگر',
      errorText: 'مشکلی پیش آمد. لطفاً بعداً دوباره تلاش کنید.',
      infoTitle: 'راه‌های دیگر تماس',
      infoEmail: 'rumi.ai.agent@gmail.com',
      infoResponse: 'زمان پاسخ',
      infoResponseText: 'معمولاً ظرف ۲۴ تا ۴۸ ساعت پاسخ می‌دهیم.',
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
      privacy: '개인정보',
      contact: '문의',
      copyright: '© 2026 Rumi AI 프로젝트. 모든 권리 보유.',
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
    about: {
      heroTitle: 'Rumi AI Agent',
      heroSubtitle: '시대를 초월한 지혜와 현대 기술의 연결',
      missionTitle: '우리의 사명',
      missionText: 'Rumi AI는 페르시아 시의 시대를 초월한 지혜를 현대의 탐구자들에게 접근 가능하고 관련성 있게 만들기 위해 존재합니다. 우리는 루미, 하페즈 및 다른 위대한 스승들의 통찰력이 우아함과 이해로 현대의 도전을 헤쳐나갈 수 있다고 믿습니다.',
      featureMissionTitle: '우리의 사명',
      featureMissionText: 'AI 기반 안내를 통해 고대의 지혜를 현대 생활에 접근 가능하고 관련성 있게 만드는 것.',
      featureMultilingualTitle: '다국어 지원',
      featureMultilingualText: '페르시아어, 영어, 한국어를 완전히 지원하여 모국어로 루미의 지혜를 경험하세요.',
      featureCitationTitle: '인용 기반 안내',
      featureCitationText: '모든 응답은 진정한 출처에 기반하여 정확성과 원래 가르침에 대한 존중을 보장합니다.',
      privacyPolicy: '개인정보 보호정책',
      contactUs: '문의하기',
    },
    privacy: {
      title: '개인정보 보호정책',
      subtitle: '귀하의 개인정보는 저희에게 중요합니다. 이 정책은 Rumi AI가 귀하의 개인정보를 어떻게 수집, 사용 및 보호하는지 설명합니다.',
      lastUpdated: '최종 업데이트: 2026년 3월',
      sections: [
        {
          heading: '수집하는 정보',
          content: '계정 생성 시 이메일 주소와 이름과 같이 직접 제공하는 정보를 수집합니다. 채팅 기능을 사용할 때 질문은 응답을 생성하기 위해 처리되지만 로그인한 경우에만 저장됩니다.',
        },
        {
          heading: '정보 사용 방법',
          content: '귀하의 정보는 Rumi AI 서비스를 제공하고 개선하는 데 사용됩니다. 귀하의 개인 데이터를 제3자에게 판매하지 않습니다.',
        },
        {
          heading: '데이터 저장 및 보안',
          content: '귀하의 데이터는 업계 표준 암호화를 사용하여 안전하게 저장됩니다. 모든 데이터 전송은 HTTPS 암호화를 사용합니다.',
        },
        {
          heading: '쿠키 및 로컬 저장소',
          content: '테마 설정, 언어 선택 및 인증 세션을 기억하기 위해 최소한의 브라우저 저장소를 사용합니다. 제3자 추적 쿠키는 사용되지 않습니다.',
        },
        {
          heading: '귀하의 권리',
          content: '개인 데이터에 대한 접근, 수정 요청, 계정 삭제 및 채팅 기록 내보내기 권리가 있습니다. 이러한 권리를 행사하려면 연락처 페이지를 통해 문의하세요.',
        },
        {
          heading: 'AI 및 콘텐츠 면책 조항',
          content: 'Rumi AI는 검색 증강 생성(RAG) 기술을 사용합니다. AI 생성 응답은 전문 상담을 대체해서는 안 됩니다.',
        },
        {
          heading: '이 정책의 변경',
          content: '이 개인정보 보호정책을 수시로 업데이트할 수 있습니다. 중요한 변경 사항은 이메일로 알려드립니다.',
        },
      ],
    },
    contact: {
      title: '문의하기',
      subtitle: '질문, 제안 또는 피드백이 있으신가요? 여러분의 의견을 듣고 싶습니다.',
      nameLabel: '이름',
      namePlaceholder: '이름을 입력하세요',
      emailLabel: '이메일 주소',
      emailPlaceholder: 'you@example.com',
      subjectLabel: '제목',
      subjectPlaceholder: '무엇에 관한 것인가요?',
      messageLabel: '메시지',
      messagePlaceholder: '메시지를 작성하세요...',
      send: '메시지 보내기',
      sending: '전송 중...',
      successTitle: '메시지가 전송되었습니다!',
      successText: '문의해 주셔서 감사합니다. 가능한 빨리 답변드리겠습니다.',
      sendAnother: '다른 메시지 보내기',
      errorText: '문제가 발생했습니다. 나중에 다시 시도해 주세요.',
      infoTitle: '다른 연락 방법',
      infoEmail: 'rumi.ai.agent@gmail.com',
      infoResponse: '응답 시간',
      infoResponseText: '일반적으로 24~48시간 이내에 응답합니다.',
    },
  },
};
