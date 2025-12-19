export interface Book {
    id: string;
    title: string;
    titleFa: string;
    titleKr: string;
    author: string;
    description: string;
    descriptionFa: string;
    descriptionKr: string;
    pages: number;
    category: string;
    icon: string;
  }
  
  export const books: Book[] = [
    {
      id: 'masnavi',
      title: 'Masnavi',
      titleFa: 'مثنوی معنوی',
      titleKr: '마스나비',
      author: 'Rumi',
      description: "Rumi's greatest masterpiece, a six-volume spiritual epic containing stories, parables, and teachings.",
      descriptionFa: 'شاهکار بزرگ مولانا، یک حماسه معنوی شش جلدی شامل داستان‌ها، تمثیل‌ها و آموزه‌ها.',
      descriptionKr: '루미의 가장 위대한 걸작, 이야기, 우화, 가르침을 담은 6권의 영적 서사시.',
      pages: 1200,
      category: 'Poetry',
      icon: '📖',
    },
    {
      id: 'divan-e-shams',
      title: 'Divan-e Shams-e Tabrizi',
      titleFa: 'دیوان شمس تبریزی',
      titleKr: '디반 에 샴스',
      author: 'Rumi',
      description: 'A collection of lyric poems dedicated to Shams-e Tabrizi, expressing divine love and spiritual ecstasy.',
      descriptionFa: 'مجموعه اشعار غنایی تقدیم شده به شمس تبریزی، بیان عشق الهی و وجد معنوی.',
      descriptionKr: '샴스 에 타브리지에게 헌정된 서정시 모음집, 신성한 사랑과 영적 황홀경을 표현.',
      pages: 800,
      category: 'Poetry',
      icon: '🌟',
    },
    {
      id: 'fihi-ma-fihi',
      title: 'Fihi Ma Fihi',
      titleFa: 'فیه ما فیه',
      titleKr: '피히 마 피히',
      author: 'Rumi',
      description: 'Discourses and conversations on spiritual matters, philosophy, and mysticism.',
      descriptionFa: 'گفتارها و گفتگوهایی درباره مسائل معنوی، فلسفه و عرفان.',
      descriptionKr: '영적 문제, 철학, 신비주의에 대한 담론과 대화.',
      pages: 350,
      category: 'Prose',
      icon: '💭',
    },
    {
      id: 'majales-e-saba',
      title: "Majāles-e Sab'a",
      titleFa: 'مجالس سبعه',
      titleKr: '마잘레스 에 사바',
      author: 'Rumi',
      description: 'Seven sermons delivered by Rumi, containing wisdom on spiritual practice and divine love.',
      descriptionFa: 'هفت خطبه ایراد شده توسط مولانا، حاوی حکمت در مورد عمل معنوی و عشق الهی.',
      descriptionKr: '루미가 전한 일곱 설교, 영적 실천과 신성한 사랑에 대한 지혜를 담고 있음.',
      pages: 120,
      category: 'Prose',
      icon: '📜',
    },
    {
      id: 'rubaiyat',
      title: 'Rubaiyat',
      titleFa: 'رباعیات',
      titleKr: '루바이야트',
      author: 'Rumi',
      description: 'Collection of quatrains expressing profound spiritual insights in concise form.',
      descriptionFa: 'مجموعه رباعیات بیان کننده بینش‌های عمیق معنوی به شکل مختصر.',
      descriptionKr: '간결한 형태로 깊은 영적 통찰을 표현한 4행시 모음집.',
      pages: 200,
      category: 'Poetry',
      icon: '✨',
    },
    {
      id: 'letters',
      title: 'Maktubat (Letters)',
      titleFa: 'مکتوبات',
      titleKr: '마크투바트 (편지)',
      author: 'Rumi',
      description: "Rumi's correspondence with students, friends, and spiritual seekers.",
      descriptionFa: 'مکاتبات مولانا با شاگردان، دوستان و جویندگان معنوی.',
      descriptionKr: '학생, 친구, 영적 구도자들과의 루미의 서신.',
      pages: 180,
      category: 'Prose',
      icon: '✉️',
    },
  ];
  
  export function getBookById(id: string): Book | undefined {
    return books.find((book) => book.id === id);
  }
  
  export function searchBooks(query: string, bookFilter?: string): Book[] {
    const lowerQuery = query.toLowerCase();
    
    return books.filter((book) => {
      const matchesQuery =
        book.title.toLowerCase().includes(lowerQuery) ||
        book.titleFa.includes(query) ||
        book.titleKr.includes(query) ||
        book.description.toLowerCase().includes(lowerQuery) ||
        book.category.toLowerCase().includes(lowerQuery);
      
      const matchesFilter = !bookFilter || bookFilter === 'all' || book.id === bookFilter;
      
      return matchesQuery && matchesFilter;
    });
  }