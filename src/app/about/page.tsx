'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { 
  BookOpen, 
  Heart, 
  Globe, 
  Sparkles,
  Quote,
  Users,
  Target,
  Feather
} from 'lucide-react';
import { motion } from 'framer-motion';
import { motion as motionTokens } from '@/lib/design-system/motion';
import { useReducedMotion } from '@/lib/hooks';

export default function AboutPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t, language, dir } = useI18n();
  const direction = dir;
  const reducedMotion = useReducedMotion();

  const content = {
    en: {
      title: 'About Rumi AI',
      subtitle: 'Bridging Ancient Wisdom with Modern Life',
      mission: {
        title: 'Our Mission',
        text: 'Rumi AI exists to make the timeless wisdom of Persian poetry accessible and relevant to modern seekers. We believe that the insights of Rumi, Hafez, and other great masters can guide us through contemporary challenges with grace and understanding.',
      },
      story: {
        title: 'Our Story',
        text: 'Born from a deep appreciation for Persian literature and the belief that technology can bridge cultures, Rumi AI brings 800 years of spiritual wisdom into the digital age. Our AI has been trained on authentic sources, ensuring each response honors the original teachings while making them applicable to your unique situation.',
      },
      values: [
        {
          icon: BookOpen,
          title: 'Authenticity',
          text: 'Every verse and interpretation is drawn from verified academic sources.',
        },
        {
          icon: Heart,
          title: 'Compassion',
          text: 'We approach each question with the warmth Rumi himself embodied.',
        },
        {
          icon: Globe,
          title: 'Accessibility',
          text: 'Ancient wisdom should be available to everyone, in their own language.',
        },
        {
          icon: Sparkles,
          title: 'Relevance',
          text: 'We bridge the gap between 13th century poetry and 21st century life.',
        },
      ],
      team: {
        title: 'The Team',
        text: 'We are scholars, engineers, and poets united by a shared love for Persian literature and a vision of technology that heals rather than divides.',
      },
      quote: {
        text: 'Out beyond ideas of wrongdoing and rightdoing, there is a field. I\'ll meet you there.',
        author: 'Rumi',
      },
    },
    fa: {
      title: 'درباره رومی AI',
      subtitle: 'پیوند حکمت کهن با زندگی مدرن',
      mission: {
        title: 'مأموریت ما',
        text: 'رومی AI وجود دارد تا حکمت بی‌زمان شعر فارسی را برای جویندگان امروزی قابل دسترس و مرتبط سازد. ما باور داریم که بینش‌های مولانا، حافظ و دیگر استادان بزرگ می‌توانند ما را در چالش‌های معاصر با لطف و درک راهنمایی کنند.',
      },
      story: {
        title: 'داستان ما',
        text: 'زاده از قدردانی عمیق از ادبیات فارسی و باور به اینکه فناوری می‌تواند فرهنگ‌ها را به هم پیوند دهد، رومی AI هشتصد سال حکمت معنوی را به عصر دیجیتال می‌آورد. هوش مصنوعی ما بر روی منابع معتبر آموزش دیده است و اطمینان می‌دهد که هر پاسخ به آموزه‌های اصلی احترام می‌گذارد.',
      },
      values: [
        {
          icon: BookOpen,
          title: 'اصالت',
          text: 'هر بیت و تفسیری از منابع علمی تأیید شده گرفته شده است.',
        },
        {
          icon: Heart,
          title: 'شفقت',
          text: 'ما به هر سؤال با گرمایی که خود مولانا داشت نزدیک می‌شویم.',
        },
        {
          icon: Globe,
          title: 'دسترسی',
          text: 'حکمت کهن باید برای همه، به زبان خودشان در دسترس باشد.',
        },
        {
          icon: Sparkles,
          title: 'ارتباط',
          text: 'ما شکاف بین شعر قرن سیزدهم و زندگی قرن بیست و یکم را پر می‌کنیم.',
        },
      ],
      team: {
        title: 'تیم',
        text: 'ما محققان، مهندسان و شاعرانی هستیم که با عشق مشترک به ادبیات فارسی و چشم‌انداز فناوری که شفا می‌دهد متحد شده‌ایم.',
      },
      quote: {
        text: 'از پس اندیشه‌های نیک و بد، دشتی است. همان‌جا ملاقاتت می‌کنم.',
        author: 'مولانا',
      },
    },
    kr: {
      title: 'Rumi AI 소개',
      subtitle: '고대의 지혜와 현대 삶을 연결하다',
      mission: {
        title: '우리의 사명',
        text: 'Rumi AI는 페르시아 시의 시대를 초월한 지혜를 현대의 탐구자들에게 접근 가능하고 관련성 있게 만들기 위해 존재합니다. 우리는 루미, 하페즈 및 다른 위대한 스승들의 통찰력이 우아함과 이해로 현대의 도전을 헤쳐나갈 수 있다고 믿습니다.',
      },
      story: {
        title: '우리의 이야기',
        text: '페르시아 문학에 대한 깊은 감사와 기술이 문화를 연결할 수 있다는 믿음에서 태어난 Rumi AI는 800년의 영적 지혜를 디지털 시대로 가져옵니다. 우리의 AI는 진정한 출처에서 훈련되었으며, 각 응답이 원래의 가르침을 존중하면서 당신의 독특한 상황에 적용될 수 있도록 합니다.',
      },
      values: [
        {
          icon: BookOpen,
          title: '진정성',
          text: '모든 시구와 해석은 검증된 학술 자료에서 가져옵니다.',
        },
        {
          icon: Heart,
          title: '연민',
          text: '우리는 루미 자신이 체현한 따뜻함으로 각 질문에 접근합니다.',
        },
        {
          icon: Globe,
          title: '접근성',
          text: '고대의 지혜는 모든 사람이 자신의 언어로 이용할 수 있어야 합니다.',
        },
        {
          icon: Sparkles,
          title: '관련성',
          text: '우리는 13세기 시와 21세기 삶 사이의 격차를 해소합니다.',
        },
      ],
      team: {
        title: '팀',
        text: '우리는 페르시아 문학에 대한 공유된 사랑과 분열보다 치유하는 기술의 비전으로 하나가 된 학자, 엔지니어, 시인입니다.',
      },
      quote: {
        text: '옳고 그름의 생각 너머에 들판이 있습니다. 거기서 만나겠습니다.',
        author: '루미',
      },
    },
  };

  const c = content[language] || content.en;

  const fadeUpVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.fadeUp;
  const staggerVariants = reducedMotion ? motionTokens.variants.reducedMotion : motionTokens.variants.staggerContainer;

  return (
    <main className="about-page" dir={direction}>
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-teal)]/5 to-transparent" />
        <div className="about-container relative">
          <motion.div 
            className="about-header"
            initial="initial"
            animate="animate"
            variants={staggerVariants}
          >
            <motion.div
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              <Feather className="w-20 h-20 mx-auto mb-8 text-[var(--accent-teal)]" />
            </motion.div>
            <motion.h1 
              className="about-title"
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              {c.title}
            </motion.h1>
            <motion.p 
              className="about-subtitle"
              variants={fadeUpVariants}
              transition={{ delay: 0.3 }}
            >
              {c.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <motion.section 
        className="py-20 lg:py-32"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerVariants}
      >
        <div className="about-container">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-20">
            <motion.div 
              className="about-section"
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <motion.div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-gold-light)' }}
                  whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                >
                  <Target className="w-6 h-6 text-[var(--accent-gold)]" />
                </motion.div>
                <h2 className="about-section-title" style={{ marginBottom: 0 }}>
                  {c.mission.title}
                </h2>
              </div>
              <p className="about-text">
                {c.mission.text}
              </p>
            </motion.div>
            <motion.div 
              className="about-section"
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <motion.div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-gold-light)' }}
                  whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                >
                  <Feather className="w-6 h-6 text-[var(--accent-gold)]" />
                </motion.div>
                <h2 className="about-section-title" style={{ marginBottom: 0 }}>
                  {c.story.title}
                </h2>
              </div>
              <p className="about-text">
                {c.story.text}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Values Section */}
      <motion.section 
        className="py-20 lg:py-32" 
        style={{ background: 'var(--bg-secondary)' }}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerVariants}
      >
        <div className="about-container">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
              variants={staggerVariants}
            >
              {c.values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    className="text-center p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] transition-all"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
                    variants={fadeUpVariants}
                    whileHover={reducedMotion ? {} : { 
                      y: -8, 
                      boxShadow: 'var(--shadow-lg)',
                      transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
                    }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--accent-teal-light)' }}
                      whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-8 h-8 text-[var(--accent-teal)]" />
                    </motion.div>
                    <h3 
                      className="text-xl font-serif font-bold mb-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {value.title}
                    </h3>
                    <p 
                      className="text-base leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {value.text}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Quote Section */}
      <motion.section 
        className="py-24 lg:py-40"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerVariants}
      >
        <div className="about-container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              <Quote className="w-16 h-16 mx-auto mb-8 text-[var(--accent-gold)] opacity-40" />
            </motion.div>
            <motion.blockquote 
              className="text-2xl md:text-3xl lg:text-5xl font-serif italic mb-8 leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              &ldquo;{c.quote.text}&rdquo;
            </motion.blockquote>
            <motion.cite 
              className="text-xl font-medium not-italic block"
              style={{ color: 'var(--accent-teal)' }}
              variants={fadeUpVariants}
              transition={{ delay: 0.3 }}
            >
              — {c.quote.author}
            </motion.cite>
          </div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="py-20 lg:py-32" 
        style={{ background: 'var(--bg-secondary)' }}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerVariants}
      >
        <div className="about-container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent-teal-light)' }}
              variants={fadeUpVariants}
              whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
            >
              <Users className="w-10 h-10 text-[var(--accent-teal)]" />
            </motion.div>
            <motion.h2 
              className="text-3xl lg:text-4xl font-serif font-bold mb-8"
              style={{ color: 'var(--text-primary)' }}
              variants={fadeUpVariants}
              transition={{ delay: 0.1 }}
            >
              {c.team.title}
            </motion.h2>
            <motion.p 
              className="text-xl leading-relaxed max-w-2xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
              variants={fadeUpVariants}
              transition={{ delay: 0.2 }}
            >
              {c.team.text}
            </motion.p>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
