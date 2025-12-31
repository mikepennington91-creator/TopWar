import { useState, useEffect, useCallback } from "react";

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
  const count = 25;
  return Array.from({ length: count }, (_, i) => {
    const duration = 8 + Math.random() * 8;
    return {
      id: i,
      left: Math.random() * 100,
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
  return stored !== 'false';
};

/**
 * SeasonalOverlay - Renders seasonal particle animations with bonus effects
 * Winter: Snowflakes + snow buildup + occasional snowman
 * Spring: Cherry blossoms + butterflies + occasional rainbow
 * Summer: Fireflies + shooting stars + occasional sun burst
 * Autumn: Falling leaves + occasional squirrel + wind gusts
 * Note: Holiday animations override seasonal when active
 */
export default function SeasonalOverlay() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(checkReducedMotion);
  const [animationEnabled, setAnimationEnabled] = useState(checkAnimationEnabled);
  const [holidayActive, setHolidayActive] = useState(false);
  const [particles] = useState(generateParticles);
  const [season] = useState(getCurrentSeason);
  
  // Special effects state
  const [showSnowPile, setShowSnowPile] = useState(false);
  const [showSnowman, setShowSnowman] = useState(false);
  const [snowmanPosition, setSnowmanPosition] = useState(-100);
  const [showButterfly, setShowButterfly] = useState(false);
  const [butterflyPath, setButterflyPath] = useState({ startX: 0, startY: 50 });
  const [showShootingStar, setShowShootingStar] = useState(false);
  const [shootingStarPos, setShootingStarPos] = useState({ x: 80, y: 10 });
  const [showSquirrel, setShowSquirrel] = useState(false);
  const [squirrelPosition, setSquirrelPosition] = useState(-100);
  const [showWindGust, setShowWindGust] = useState(false);
  const [groundLeaves, setGroundLeaves] = useState([]);

  // Snowman walking animation
  const triggerSnowman = useCallback(() => {
    if (season !== 'winter' || showSnowman) return;
    setSnowmanPosition(-100);
    setShowSnowman(true);
    
    let pos = -100;
    const walkInterval = setInterval(() => {
      pos += 2;
      setSnowmanPosition(pos);
      if (pos > 110) {
        clearInterval(walkInterval);
        setShowSnowman(false);
      }
    }, 50);
  }, [season, showSnowman]);

  // Butterfly animation
  const triggerButterfly = useCallback(() => {
    if (season !== 'spring' || showButterfly) return;
    setButterflyPath({ 
      startX: Math.random() > 0.5 ? -10 : 110, 
      startY: 30 + Math.random() * 40 
    });
    setShowButterfly(true);
    setTimeout(() => setShowButterfly(false), 8000);
  }, [season, showButterfly]);

  // Shooting star animation
  const triggerShootingStar = useCallback(() => {
    if (season !== 'summer' || showShootingStar) return;
    setShootingStarPos({ 
      x: 60 + Math.random() * 30, 
      y: 5 + Math.random() * 15 
    });
    setShowShootingStar(true);
    setTimeout(() => setShowShootingStar(false), 1500);
  }, [season, showShootingStar]);

  // Squirrel animation
  const triggerSquirrel = useCallback(() => {
    if (season !== 'autumn' || showSquirrel) return;
    const goingRight = Math.random() > 0.5;
    setSquirrelPosition(goingRight ? -10 : 110);
    setShowSquirrel(true);
    
    let pos = goingRight ? -10 : 110;
    const runInterval = setInterval(() => {
      pos += goingRight ? 3 : -3;
      setSquirrelPosition(pos);
      if ((goingRight && pos > 110) || (!goingRight && pos < -10)) {
        clearInterval(runInterval);
        setShowSquirrel(false);
      }
    }, 40);
  }, [season, showSquirrel]);

  // Wind gust animation for autumn
  const triggerWindGust = useCallback(() => {
    if (season !== 'autumn' || showWindGust) return;
    setShowWindGust(true);
    // Add some ground leaves that blow across
    const newLeaves = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      startY: 85 + Math.random() * 10,
      delay: Math.random() * 0.5,
    }));
    setGroundLeaves(newLeaves);
    setTimeout(() => {
      setShowWindGust(false);
      setGroundLeaves([]);
    }, 3000);
  }, [season, showWindGust]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
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

  // Snow pile effect - builds up gradually
  useEffect(() => {
    if (season !== 'winter' || !animationEnabled || prefersReducedMotion) return;
    
    // Show snow pile after a delay
    const pileTimer = setTimeout(() => {
      setShowSnowPile(true);
      // Hide it after some time
      setTimeout(() => setShowSnowPile(false), 15000);
    }, 10000);
    
    return () => clearTimeout(pileTimer);
  }, [season, animationEnabled, prefersReducedMotion]);

  // Random special effects timer
  useEffect(() => {
    if (!animationEnabled || prefersReducedMotion) return;

    const triggerRandomEffect = () => {
      const random = Math.random();
      
      switch (season) {
        case 'winter':
          if (random < 0.3) triggerSnowman();
          break;
        case 'spring':
          if (random < 0.4) triggerButterfly();
          break;
        case 'summer':
          if (random < 0.5) triggerShootingStar();
          break;
        case 'autumn':
          if (random < 0.3) triggerSquirrel();
          else if (random < 0.5) triggerWindGust();
          break;
        default:
          break;
      }
    };

    // Trigger random effects periodically
    const effectInterval = setInterval(triggerRandomEffect, 12000);
    
    // Initial trigger after short delay
    const initialTimer = setTimeout(triggerRandomEffect, 5000);
    
    return () => {
      clearInterval(effectInterval);
      clearTimeout(initialTimer);
    };
  }, [season, animationEnabled, prefersReducedMotion, triggerSnowman, triggerButterfly, triggerShootingStar, triggerSquirrel, triggerWindGust]);

  if (prefersReducedMotion || !animationEnabled || holidayActive) return null;

  const getParticleContent = () => {
    switch (season) {
      case 'winter': return '❄';
      case 'spring': return '🌸';
      case 'summer': return '✨';
      case 'autumn': return '🍂';
      default: return '❄';
    }
  };

  const getAnimationClass = () => {
    switch (season) {
      case 'winter': return 'animate-snowfall';
      case 'spring': return 'animate-petalfall';
      case 'summer': return 'animate-firefly';
      case 'autumn': return showWindGust ? 'animate-leaffall-windy' : 'animate-leaffall';
      default: return 'animate-snowfall';
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
          10% { opacity: var(--particle-opacity); }
          90% { opacity: var(--particle-opacity); }
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
          10% { opacity: var(--particle-opacity); }
          50% { transform: translateY(50vh) translateX(var(--sway-amount)) rotate(180deg) scale(0.9); }
          90% { opacity: var(--particle-opacity); }
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
          10% { opacity: var(--particle-opacity); }
          25% { transform: translateY(25vh) translateX(var(--sway-amount)) rotate(90deg); }
          50% { transform: translateY(50vh) translateX(calc(var(--sway-amount) * -0.7)) rotate(180deg); }
          75% { transform: translateY(75vh) translateX(var(--sway-amount)) rotate(270deg); }
          90% { opacity: var(--particle-opacity); }
          100% {
            transform: translateY(110vh) translateX(calc(var(--sway-amount) * -0.3)) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes leaffall-windy {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: var(--particle-opacity); }
          25% { transform: translateY(20vh) translateX(80px) rotate(180deg); }
          50% { transform: translateY(45vh) translateX(150px) rotate(360deg); }
          75% { transform: translateY(70vh) translateX(200px) rotate(540deg); }
          90% { opacity: var(--particle-opacity); }
          100% {
            transform: translateY(100vh) translateX(250px) rotate(720deg);
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

        /* Snow pile build up animation */
        @keyframes snowPileGrow {
          0% { transform: scaleY(0) translateY(100%); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: scaleY(1) translateY(0); opacity: 0.9; }
        }

        @keyframes snowPileFade {
          0% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(20px); }
        }

        /* Snowman walk animation */
        @keyframes snowmanBob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }

        /* Butterfly flutter */
        @keyframes butterflyFly {
          0% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: 0;
          }
          10% { opacity: 0.9; }
          25% { transform: translate(25vw, -10vh) rotate(10deg); }
          50% { transform: translate(50vw, 5vh) rotate(-5deg); }
          75% { transform: translate(75vw, -15vh) rotate(8deg); }
          90% { opacity: 0.9; }
          100% { 
            transform: translate(120vw, 0) rotate(0deg); 
            opacity: 0;
          }
        }

        @keyframes butterflyWings {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.3); }
        }

        /* Shooting star */
        @keyframes shootingStar {
          0% { 
            transform: translate(0, 0) rotate(-45deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% { 
            transform: translate(-200px, 200px) rotate(-45deg);
            opacity: 0;
          }
        }

        @keyframes starTrail {
          0% { width: 0; opacity: 1; }
          50% { width: 100px; opacity: 0.8; }
          100% { width: 150px; opacity: 0; }
        }

        /* Squirrel run */
        @keyframes squirrelRun {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-8px) scaleY(0.9); }
        }

        /* Wind gust leaves */
        @keyframes groundLeafBlow {
          0% { 
            transform: translateX(-100vw) translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          50% { transform: translateX(0) translateY(-30px) rotate(360deg); }
          90% { opacity: 0.6; }
          100% { 
            transform: translateX(120vw) translateY(10px) rotate(720deg);
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

        .animate-leaffall-windy {
          animation: leaffall-windy calc(var(--duration) * 0.7) ease-in-out infinite;
        }

        .animate-firefly {
          animation: firefly var(--duration) ease-in-out infinite;
        }
      `}</style>

      {/* Regular falling particles */}
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

      {/* === WINTER SPECIAL EFFECTS === */}
      {season === 'winter' && (
        <>
          {/* Snow pile at bottom */}
          {showSnowPile && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden"
              style={{
                animation: 'snowPileGrow 3s ease-out forwards',
              }}
            >
              <div className="absolute bottom-0 w-full">
                {/* Snow mound shapes */}
                <svg viewBox="0 0 1200 80" className="w-full h-16" preserveAspectRatio="none">
                  <path 
                    d="M0,80 Q100,20 200,60 T400,50 T600,65 T800,45 T1000,55 T1200,40 L1200,80 Z" 
                    fill="rgba(255,255,255,0.7)"
                  />
                  <path 
                    d="M0,80 Q150,40 300,70 T600,55 T900,70 T1200,50 L1200,80 Z" 
                    fill="rgba(255,255,255,0.5)"
                  />
                </svg>
                {/* Sparkle effects on snow */}
                <div className="absolute bottom-2 left-1/4 text-xs opacity-60">✨</div>
                <div className="absolute bottom-4 left-1/2 text-xs opacity-40">✨</div>
                <div className="absolute bottom-3 left-3/4 text-xs opacity-50">✨</div>
              </div>
            </div>
          )}

          {/* Walking snowman */}
          {showSnowman && (
            <div 
              className="absolute bottom-4 text-4xl"
              style={{
                left: `${snowmanPosition}%`,
                animation: 'snowmanBob 0.5s ease-in-out infinite',
                transform: snowmanPosition > 50 ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            >
              ⛄
            </div>
          )}
        </>
      )}

      {/* === SPRING SPECIAL EFFECTS === */}
      {season === 'spring' && showButterfly && (
        <div 
          className="absolute text-2xl"
          style={{
            left: `${butterflyPath.startX}%`,
            top: `${butterflyPath.startY}%`,
            animation: 'butterflyFly 8s ease-in-out forwards',
          }}
        >
          <span style={{ 
            display: 'inline-block',
            animation: 'butterflyWings 0.2s ease-in-out infinite',
          }}>
            🦋
          </span>
        </div>
      )}

      {/* === SUMMER SPECIAL EFFECTS === */}
      {season === 'summer' && showShootingStar && (
        <div 
          className="absolute"
          style={{
            left: `${shootingStarPos.x}%`,
            top: `${shootingStarPos.y}%`,
            animation: 'shootingStar 1.5s ease-out forwards',
          }}
        >
          <div className="relative">
            <span className="text-xl">⭐</span>
            <div 
              className="absolute top-1/2 left-full h-0.5 bg-gradient-to-r from-yellow-200 to-transparent"
              style={{
                animation: 'starTrail 1.5s ease-out forwards',
                transformOrigin: 'left center',
              }}
            />
          </div>
        </div>
      )}

      {/* === AUTUMN SPECIAL EFFECTS === */}
      {season === 'autumn' && (
        <>
          {/* Running squirrel */}
          {showSquirrel && (
            <div 
              className="absolute bottom-8 text-3xl"
              style={{
                left: `${squirrelPosition}%`,
                animation: 'squirrelRun 0.3s ease-in-out infinite',
                transform: squirrelPosition > 50 ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            >
              🐿️
            </div>
          )}

          {/* Ground leaves blown by wind */}
          {showWindGust && groundLeaves.map((leaf) => (
            <div
              key={leaf.id}
              className="absolute text-xl"
              style={{
                top: `${leaf.startY}%`,
                left: 0,
                animation: `groundLeafBlow 3s ease-in-out ${leaf.delay}s forwards`,
              }}
            >
              🍁
            </div>
          ))}

          {/* Wind indicator */}
          {showWindGust && (
            <div className="absolute top-1/3 left-0 right-0 flex gap-8 opacity-30">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="text-2xl text-slate-400"
                  style={{
                    animation: `groundLeafBlow 2s ease-in-out ${i * 0.2}s forwards`,
                  }}
                >
                  〰️
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
