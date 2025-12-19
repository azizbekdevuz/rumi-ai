export interface BookPage {
    page: number;
    contentFa: string;
    contentEn: string;
    contentKr: string;
  }
  
  // Mock book content for demonstration
  export function getBookContent(bookId: string, page: number): BookPage | null {
    // In a real app, this would fetch from a database or API
    const mockContent: Record<string, BookPage[]> = {
      masnavi: [
        {
          page: 1,
          contentFa: `بشنو از نی چون حکایت می‌کند
  از جدایی‌ها شکایت می‌کند
  
  کز نیستان تا مرا ببریده‌اند
  در نفیرم مرد و زن نالیده‌اند
  
  سینه خواهم شرحه شرحه از فراق
  تا بگویم شرح درد اشتیاق`,
          contentEn: `Listen to the reed, how it tells a tale,
  Complaining of separations.
  
  Saying, "Ever since I was severed from the reed bed,
  My lament has caused men and women to moan.
  
  I want a breast torn by severance,
  That I may unfold the pain of love-desire."`,
          contentKr: `갈대의 소리를 들어보세요, 어떻게 이야기를 전하는지,
  이별을 한탄하며.
  
  "갈대밭에서 잘려나온 이후로,
  나의 애가는 남녀를 신음하게 했네.
  
  나는 이별로 찢긴 가슴을 원하노니,
  사랑의 갈망의 고통을 펼칠 수 있도록."`,
        },
        {
          page: 12,
          contentFa: `گر چه تفسیر زبان روشن است
  لیک عشق بی‌زبان روشن‌تر است
  
  چون قلم اندر نوشتن می‌شتافت
  وقت ذکر عشق بشکست او بنافت`,
          contentEn: `Though the explanation of the tongue is clear,
  Yet love without tongue is clearer.
  
  When the pen hastened in writing,
  At the mention of love it split in two.`,
          contentKr: `혀의 설명은 분명하지만,
  말없는 사랑이 더 분명하네.
  
  펜이 서둘러 쓸 때,
  사랑을 언급하자 둘로 갈라졌네.`,
        },
      ],
      'divan-e-shams': [
        {
          page: 45,
          contentFa: `نه در زمین و نه در آسمان‌م
  نه از آب و نه از خاک، نه از باد و نه از آتش‌م
  من از جان جان جانانم
  آن دیگری را اثری نیست در وجودم`,
          contentEn: `Not of earth, nor water, nor air, nor fire am I;
  Not of the empyrean, of the dust, of existence, of entity am I.
  I am not of India, nor China, nor Bulgaria, nor Saqseen;
  Not of the kingdom of the Iraqs, nor of the land of Khorasan am I.`,
          contentKr: `나는 땅도, 물도, 공기도, 불도 아니네;
  천상도, 먼지도, 존재도, 실체도 아니네.
  인도도, 중국도, 불가리아도, 삭신도 아니며;
  이라크 왕국도, 호라산 땅도 아니네.`,
        },
      ],
      'fihi-ma-fihi': [
        {
          page: 78,
          contentFa: `علم چراغی است که نور دل است
  نه آنکه همه دانش کتاب‌ها و حرف‌ها است
  
  کسی که به دنبال علم حقیقی است
  باید در دل خویش جستجو کند`,
          contentEn: `Knowledge is a lamp that illuminates the heart,
  Not all the learning of books and words.
  
  One who seeks true knowledge
  Must search within their own heart.`,
          contentKr: `지식은 마음을 밝히는 등불이요,
  책과 말의 모든 학문이 아니네.
  
  진정한 지식을 찾는 자는
  자신의 마음속을 탐구해야 하네.`,
        },
      ],
    };
  
    const bookPages = mockContent[bookId];
    if (!bookPages) return null;
  
    return bookPages.find((p) => p.page === page) || null;
  }