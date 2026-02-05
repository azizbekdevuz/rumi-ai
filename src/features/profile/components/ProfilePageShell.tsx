'use client';

interface ProfilePageShellProps {
  children: React.ReactNode;
}

export default function ProfilePageShell({ children }: ProfilePageShellProps) {
  return (
    <div className="profile-page-shell">
      {/* Page Background Stack - Same as ChatPageShell/AboutPageShell */}
      {/* Layer 1: Background Image (z-index: 0) */}
      <div className="profile-background" aria-hidden="true" />
      
      {/* Layer 2: Soft Radial Bloom Behind Panel (z-index: 1) */}
      <div className="profile-background-bloom" aria-hidden="true" />
      
      {/* Layer 3: Ultra Subtle Grain Overlay (z-index: 2) */}
      <div className="profile-background-grain" aria-hidden="true" />
      
      {/* Layer 4: Top/Bottom Vignette Gradient (z-index: 3) */}
      <div className="profile-background-vignette" aria-hidden="true" />

      {/* Main Content (z-index: 10+) */}
      <div className="profile-content-wrapper">
        {children}
      </div>
    </div>
  );
}
