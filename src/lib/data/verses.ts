/**
 * Sample verses for the Books page carousel
 */

export interface Verse {
  fa: string;
  en: string;
  kr?: string;
  book: string;
  page?: number;
}

export const sampleVerses: Verse[] = [
  {
    fa: 'بشنو از نی چون حکایت می‌کند / از جدایی‌ها شکایت می‌کند',
    en: 'Listen to the reed, how it tells a tale, / Complaining of separations.',
    kr: '갈대의 이야기를 들어보세요 / 이별을 한탄하며',
    book: 'Masnavi',
    page: 1,
  },
  {
    fa: 'در دل هر ذره‌ای که پنهان است / آفتابیش می‌تواند خواند',
    en: 'In the heart of every particle / The sun can be read.',
    kr: '모든 입자의 마음 속에 / 태양을 읽을 수 있습니다',
    book: 'Divan-e Shams',
    page: 45,
  },
  {
    fa: 'عاشقان را دل و جان در میان است / عاشقان را جهان بی‌مکان است',
    en: 'Lovers have heart and soul in between / Lovers have a world without place.',
    kr: '연인들은 마음과 영혼 사이에 있고 / 연인들은 장소 없는 세상을 가집니다',
    book: 'Fihi Ma Fihi',
    page: 78,
  },
  {
    fa: 'چون که صد آمد نود هم پیش ماست / چون که درویشی و فقر از خدا خواست',
    en: 'When a hundred comes, ninety is also with us / When poverty and need are asked from God.',
    kr: '백이 오면 구십도 우리와 함께 있습니다 / 가난과 필요가 신에게 요청될 때',
    book: 'Masnavi',
    page: 12,
  },
  {
    fa: 'هر که را جامه ز عشقی چاک شد / او ز حرص و عیب کلی پاک شد',
    en: 'Whoever has a garment torn by love / Is completely cleansed of greed and fault.',
    kr: '사랑으로 옷이 찢어진 자는 / 탐욕과 결점에서 완전히 정화됩니다',
    book: 'Divan-e Shams',
    page: 67,
  },
  {
    fa: 'از کجا آمده‌ام، آمدنم بهر چه بود / به کجا می‌روم آخر ننمایی وطنم',
    en: 'Where have I come from, what was the purpose of my coming? / Where am I going, you do not show me my homeland.',
    kr: '어디서 왔는지, 내가 온 목적은 무엇이었는지 / 어디로 가는지, 당신은 내 고향을 보여주지 않습니다',
    book: 'Fihi Ma Fihi',
    page: 102,
  },
];
