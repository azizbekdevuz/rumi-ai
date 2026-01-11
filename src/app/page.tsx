import Hero from '@/components/home/Hero';
import FeatureCards from '@/components/home/FeatureCards';
import HowItWorks from '@/components/home/HowItWorks';
import { SectionDivider } from '@/components/ui';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureCards />
      <SectionDivider />
      <HowItWorks />
    </>
  );
}