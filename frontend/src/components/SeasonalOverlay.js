import { useState, useEffect } from "react";

// Helper function to get current season
const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'autumn';  // Sep-Nov
  return 'winter'; // Dec-Feb
};

// Helper function to generate particles
const generateParticles = () => {
  const count = 20;
  return Array.from({ length: count }, (_, i) => {
    const duration = 8 + Math.random() * 8;
    return {
      id: i,
      left: Math.random() * 100,
      // Negative delay so particles start mid-animation (already falling)
      delay: -Math.random() * duration,
      duration: duration,
      size: 0.5 + Math.random() * 0.8,
      opacity: 0.3 + Math.random() * 0.4,
      swayAmount: 20 + Math.random() * 40,
    };
  });
};

// Check for reduced motion preference
const checkReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if animation is enabled in localStorage
const checkAnimationEnabled = () => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('seasonal_animation_enabled');
  return stored !== 'false'; // Default to true if not set
};

/**
 * SeasonalOverlay - Renders unobtrusive seasonal particle animations
 * Winter: Snowflakes, Spring: Cherry blossoms, Summer: Fireflies, Autumn: Falling leaves
 * Note: Holiday animations override seasonal when active
 */
export default function SeasonalOverlay() {
  // Initialize state with lazy initializers
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(checkReducedMotion);
  const [animationEnabled, setAnimationEnabled] = useState(checkAnimationEnabled);
  const [holidayActive, setHolidayActive] = useState(false);
  const [particles] = useState(generateParticles);
  const [season] = useState(getCurrentSeason);

  useEffect(() => {
    // Listen for changes to reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Listen for animation toggle events from Settings
    const handleAnimationToggle = (e) => {
      setAnimationEnabled(e.detail.enabled);
    };
    window.addEventListener('seasonalAnimationToggle', handleAnimationToggle);
    
    // Listen for holiday active events
    const handleHolidayActive = (e) => {
      setHolidayActive(e.detail.active);
    };
    window.addEventListener('holidayActive', handleHolidayActive);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('seasonalAnimationToggle', handleAnimationToggle);
      window.removeEventListener('holidayActive', handleHolidayActive);
    };
  }, []);

  // Don't render if user prefers reduced motion, has disabled animation, or holiday is active
  if (prefersReducedMotion || !animationEnabled || holidayActive) return null;

  const getParticleContent = () => {
    switch (season) {
      case 'winter':
        return '❄';
      case 'spring':
        return '🌸';
      case 'summer':
        return '✨';
      case 'autumn':
        return '🍂';
      default:
        return '❄';
    }
  };

  const getAnimationClass = () => {
    switch (season) {
      case 'winter':
        return 'animate-snowfall';
      case 'spring':
        return 'animate-petalfall';
      case 'summer':
        return 'animate-firefly';
      case 'autumn':
        return 'animate-leaffall';
      default:
        return 'animate-snowfall';
    }
  };

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-50"
      aria-hidden="true"
    >
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity);
          }
          90% {
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) translateX(var(--sway-amount)) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes petalfall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity);
          }
          50% {
            transform: translateY(50vh) translateX(var(--sway-amount)) rotate(180deg) scale(0.9);
          }
          90% {
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) translateX(calc(var(--sway-amount) * -0.5)) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes leaffall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity);
          }
          25% {
            transform: translateY(25vh) translateX(var(--sway-amount)) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--sway-amount) * -0.7)) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(var(--sway-amount)) rotate(270deg);
          }
          90% {
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) translateX(calc(var(--sway-amount) * -0.3)) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes firefly {
          0% {
            transform: translateY(100vh) translateX(0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: var(--particle-opacity);
            transform: translateY(80vh) translateX(var(--sway-amount)) scale(1);
          }
          40% {
            opacity: calc(var(--particle-opacity) * 0.3);
            transform: translateY(60vh) translateX(calc(var(--sway-amount) * -0.5)) scale(0.8);
          }
          60% {
            opacity: var(--particle-opacity);
            transform: translateY(40vh) translateX(var(--sway-amount)) scale(1.1);
          }
          80% {
            opacity: calc(var(--particle-opacity) * 0.4);
            transform: translateY(20vh) translateX(calc(var(--sway-amount) * -0.7)) scale(0.7);
          }
          100% {
            transform: translateY(-10vh) translateX(0) scale(0.5);
            opacity: 0;
          }
        }

        .animate-snowfall {
          animation: snowfall var(--duration) linear infinite;
        }

        .animate-petalfall {
          animation: petalfall var(--duration) ease-in-out infinite;
        }

        .animate-leaffall {
          animation: leaffall var(--duration) ease-in-out infinite;
        }

        .animate-firefly {
          animation: firefly var(--duration) ease-in-out infinite;
        }
      `}</style>

      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${getAnimationClass()}`}
          style={{
            left: `${particle.left}%`,
            fontSize: `${particle.size}rem`,
            animationDelay: `${particle.delay}s`,
            '--duration': `${particle.duration}s`,
            '--particle-opacity': particle.opacity,
            '--sway-amount': `${particle.swayAmount}px`,
            filter: season === 'summer' ? 'blur(1px)' : 'none',
          }}
        >
          {getParticleContent()}
        </div>
      ))}
    </div>
  );
}
