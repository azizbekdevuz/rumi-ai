'use client';

interface AboutPageShellProps {
  children: React.ReactNode;
}

export default function AboutPageShell({ children }: AboutPageShellProps) {

  return (
    <div className="about-page-shell">
      {/* Page Background Stack - Same as BooksPageShell */}
      {/* Layer 1: Background Image (z-index: 0) */}
      <div className="about-background" aria-hidden="true" />
      
      {/* Layer 2: Soft Radial Bloom Behind Panel (z-index: 1) */}
      <div className="about-background-bloom" aria-hidden="true" />
      
      {/* Layer 3: Ultra Subtle Grain Overlay (z-index: 2) */}
      <div className="about-background-grain" aria-hidden="true" />
      
      {/* Layer 4: Top/Bottom Vignette Gradient (z-index: 3) */}
      <div className="about-background-vignette" aria-hidden="true" />

      {/* Main Content (z-index: 10+) */}
      <div className="about-content-wrapper">
        {children}
      </div>
    </div>
  );
}
