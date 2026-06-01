export const SOFT_MOTION_CSS = `@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-8px) rotate(4deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 820px) {
  .app-shell,
  .soft-shell {
    grid-template-columns: 1fr;
  }

  .soft-nav {
    position: relative;
    min-height: auto;
  }

  .soft-nav-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .soft-main {
    padding: 20px;
  }

  .soft-hero {
    padding: 24px;
  }

  .soft-hero::after {
    width: 72px;
    height: 72px;
    opacity: 0.7;
  }

  .soft-title {
    font-size: clamp(1.875rem, 11vw, 3rem);
  }
}`;
