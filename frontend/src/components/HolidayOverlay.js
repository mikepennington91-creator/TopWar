import { useState, useEffect } from "react";

// ==================== HOLIDAY DEFINITIONS ====================

// Helper to get Easter date (Computus algorithm)
const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

// Helper to get nth weekday of month
const getNthWeekday = (year, month, weekday, n) => {
  const firstDay = new Date(year, month, 1);
  let day = 1 + ((weekday - firstDay.getDay() + 7) % 7);
  day += (n - 1) * 7;
  return new Date(year, month, day);
};

// Helper to get last weekday of month
const getLastWeekday = (year, month, weekday) => {
  const lastDay = new Date(year, month + 1, 0);
  const diff = (lastDay.getDay() - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - diff);
};

// Chinese lunar calendar approximations (simplified - actual dates vary)
const getChineseNewYear = (year) => {
  // Approximate dates - Chinese New Year falls between Jan 21 and Feb 20
  const dates = {
    2024: new Date(2024, 1, 10),  // Feb 10, 2024
    2025: new Date(2025, 0, 29),  // Jan 29, 2025
    2026: new Date(2026, 1, 17),  // Feb 17, 2026
    2027: new Date(2027, 1, 6),   // Feb 6, 2027
    2028: new Date(2028, 0, 26),  // Jan 26, 2028
    2029: new Date(2029, 1, 13),  // Feb 13, 2029
    2030: new Date(2030, 1, 3),   // Feb 3, 2030
  };
  return dates[year] || new Date(year, 1, 1);
};

const getDragonBoatFestival = (year) => {
  const dates = {
    2024: new Date(2024, 5, 10),  // June 10, 2024
    2025: new Date(2025, 4, 31),  // May 31, 2025
    2026: new Date(2026, 5, 19),  // June 19, 2026
    2027: new Date(2027, 5, 9),   // June 9, 2027
    2028: new Date(2028, 4, 28),  // May 28, 2028
    2029: new Date(2029, 5, 16),  // June 16, 2029
    2030: new Date(2030, 5, 5),   // June 5, 2030
  };
  return dates[year] || new Date(year, 5, 1);
};

const getMidAutumnFestival = (year) => {
  const dates = {
    2024: new Date(2024, 8, 17),  // Sep 17, 2024
    2025: new Date(2025, 9, 6),   // Oct 6, 2025
    2026: new Date(2026, 8, 25),  // Sep 25, 2026
    2027: new Date(2027, 8, 15),  // Sep 15, 2027
    2028: new Date(2028, 9, 3),   // Oct 3, 2028
    2029: new Date(2029, 8, 22),  // Sep 22, 2029
    2030: new Date(2030, 8, 12),  // Sep 12, 2030
  };
  return dates[year] || new Date(year, 8, 15);
};

const getQingmingFestival = (year) => {
  // Usually April 4 or 5
  return new Date(year, 3, 4);
};

// Get all holidays for a given year
const getHolidays = (year) => {
  const easter = getEasterDate(year);
  
  return [
    // ============ SHARED HOLIDAYS ============
    { 
      name: "New Year's Day", 
      date: new Date(year, 0, 1), 
      type: "newyear",
      regions: ["UK", "US", "CN"],
      emoji: "🎊",
      description: "Celebrate the start of a new year!"
    },
    { 
      name: "Christmas Day", 
      date: new Date(year, 11, 25), 
      type: "christmas",
      regions: ["UK", "US"],
      emoji: "🎄",
      description: "Merry Christmas!"
    },
    
    // ============ UK HOLIDAYS ============
    { 
      name: "Boxing Day", 
      date: new Date(year, 11, 26), 
      type: "christmas",
      regions: ["UK"],
      emoji: "🎁",
      description: "Boxing Day celebrations"
    },
    { 
      name: "Easter Sunday", 
      date: easter, 
      type: "easter",
      regions: ["UK", "US"],
      emoji: "🐰",
      description: "Happy Easter!"
    },
    { 
      name: "Good Friday", 
      date: new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000), 
      type: "easter",
      regions: ["UK"],
      emoji: "✝️",
      description: "Good Friday"
    },
    { 
      name: "Easter Monday", 
      date: new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000), 
      type: "easter",
      regions: ["UK"],
      emoji: "🥚",
      description: "Easter Monday"
    },
    { 
      name: "Early May Bank Holiday", 
      date: getNthWeekday(year, 4, 1, 1), // First Monday of May
      type: "spring",
      regions: ["UK"],
      emoji: "🌷",
      description: "May Day Bank Holiday"
    },
    { 
      name: "Spring Bank Holiday", 
      date: getLastWeekday(year, 4, 1), // Last Monday of May
      type: "spring",
      regions: ["UK"],
      emoji: "🌸",
      description: "Spring Bank Holiday"
    },
    { 
      name: "Summer Bank Holiday", 
      date: getLastWeekday(year, 7, 1), // Last Monday of August
      type: "summer",
      regions: ["UK"],
      emoji: "☀️",
      description: "Summer Bank Holiday"
    },
    
    // ============ US HOLIDAYS ============
    { 
      name: "Martin Luther King Jr. Day", 
      date: getNthWeekday(year, 0, 1, 3), // Third Monday of January
      type: "patriotic",
      regions: ["US"],
      emoji: "✊",
      description: "Honoring Dr. Martin Luther King Jr."
    },
    { 
      name: "Presidents' Day", 
      date: getNthWeekday(year, 1, 1, 3), // Third Monday of February
      type: "patriotic",
      regions: ["US"],
      emoji: "🇺🇸",
      description: "Presidents' Day"
    },
    { 
      name: "Memorial Day", 
      date: getLastWeekday(year, 4, 1), // Last Monday of May
      type: "patriotic",
      regions: ["US"],
      emoji: "🎖️",
      description: "Honoring those who served"
    },
    { 
      name: "Independence Day", 
      date: new Date(year, 6, 4), 
      type: "july4th",
      regions: ["US"],
      emoji: "🎆",
      description: "Happy 4th of July!"
    },
    { 
      name: "Labor Day", 
      date: getNthWeekday(year, 8, 1, 1), // First Monday of September
      type: "labor",
      regions: ["US"],
      emoji: "👷",
      description: "Labor Day"
    },
    { 
      name: "Thanksgiving", 
      date: getNthWeekday(year, 10, 4, 4), // Fourth Thursday of November
      type: "thanksgiving",
      regions: ["US"],
      emoji: "🦃",
      description: "Happy Thanksgiving!"
    },
    
    // ============ CHINESE HOLIDAYS ============
    { 
      name: "Chinese New Year", 
      date: getChineseNewYear(year), 
      type: "cny",
      regions: ["CN"],
      emoji: "🧧",
      description: "新年快乐! Happy Chinese New Year!"
    },
    { 
      name: "Qingming Festival", 
      date: getQingmingFestival(year), 
      type: "qingming",
      regions: ["CN"],
      emoji: "🌿",
      description: "Qingming Festival (Tomb Sweeping Day)"
    },
    { 
      name: "Dragon Boat Festival", 
      date: getDragonBoatFestival(year), 
      type: "dragonboat",
      regions: ["CN"],
      emoji: "🐉",
      description: "端午节快乐! Dragon Boat Festival"
    },
    { 
      name: "Mid-Autumn Festival", 
      date: getMidAutumnFestival(year), 
      type: "midautumn",
      regions: ["CN"],
      emoji: "🥮",
      description: "中秋节快乐! Happy Mid-Autumn Festival"
    },
    { 
      name: "National Day of China", 
      date: new Date(year, 9, 1), 
      type: "nationalday",
      regions: ["CN"],
      emoji: "🇨🇳",
      description: "国庆节快乐! Happy National Day"
    },
  ];
};

// Check if date is within holiday range (day before, day of, day after)
const isWithinHolidayRange = (holidayDate, checkDate) => {
  const dayBefore = new Date(holidayDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(holidayDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  dayAfter.setHours(23, 59, 59, 999);
  
  const check = new Date(checkDate);
  check.setHours(12, 0, 0, 0);
  
  return check >= dayBefore && check <= dayAfter;
};

// Get current active holiday
const getCurrentHoliday = () => {
  const now = new Date();
  const year = now.getFullYear();
  
  // Check current year and next year (for holidays near year boundary)
  const allHolidays = [...getHolidays(year), ...getHolidays(year + 1)];
  
  for (const holiday of allHolidays) {
    if (isWithinHolidayRange(holiday.date, now)) {
      return holiday;
    }
  }
  
  return null;
};

// ==================== ANIMATION CONFIGURATIONS ====================

const HOLIDAY_ANIMATIONS = {
  newyear: {
    particles: ['🎊', '🎉', '✨', '🎆', '🥳', '🎇'],
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1'],
    animation: 'confetti',
    background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.1) 0%, rgba(238, 130, 238, 0.1) 100%)',
  },
  christmas: {
    particles: ['🎄', '⭐', '🎅', '🎁', '❄️', '🔔', '🦌'],
    colors: ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF'],
    animation: 'snowfall',
    background: 'linear-gradient(180deg, rgba(0, 100, 0, 0.05) 0%, rgba(139, 0, 0, 0.05) 100%)',
  },
  easter: {
    particles: ['🐰', '🥚', '🐣', '🌷', '🌸', '🦋'],
    colors: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#FFFACD'],
    animation: 'float',
    background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.1) 0%, rgba(152, 251, 152, 0.1) 100%)',
  },
  july4th: {
    particles: ['🎆', '🎇', '⭐', '🇺🇸', '🦅', '✨'],
    colors: ['#B22234', '#FFFFFF', '#3C3B6E'],
    animation: 'fireworks',
    background: 'linear-gradient(180deg, rgba(60, 59, 110, 0.1) 0%, rgba(178, 34, 52, 0.1) 100%)',
  },
  thanksgiving: {
    particles: ['🦃', '🍂', '🎃', '🌽', '🥧', '🍁'],
    colors: ['#D2691E', '#8B4513', '#FF8C00', '#CD853F', '#DEB887'],
    animation: 'leaffall',
    background: 'linear-gradient(180deg, rgba(210, 105, 30, 0.08) 0%, rgba(139, 69, 19, 0.08) 100%)',
  },
  cny: {
    particles: ['🧧', '🏮', '🐉', '🎊', '💰', '🎆', '🧨'],
    colors: ['#FF0000', '#FFD700', '#FF4500'],
    animation: 'lantern',
    background: 'linear-gradient(180deg, rgba(255, 0, 0, 0.08) 0%, rgba(255, 215, 0, 0.05) 100%)',
  },
  midautumn: {
    particles: ['🥮', '🏮', '🌕', '🐇', '✨', '🌙'],
    colors: ['#FFD700', '#FF8C00', '#FFA500', '#FFFACD'],
    animation: 'moonrise',
    background: 'linear-gradient(180deg, rgba(25, 25, 112, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
  },
  dragonboat: {
    particles: ['🐉', '🚣', '🎋', '🥟', '💚', '🌊'],
    colors: ['#228B22', '#32CD32', '#006400', '#90EE90'],
    animation: 'wave',
    background: 'linear-gradient(180deg, rgba(0, 100, 0, 0.08) 0%, rgba(0, 128, 128, 0.08) 100%)',
  },
  nationalday: {
    particles: ['🇨🇳', '🎆', '⭐', '🎊', '✨', '🎉'],
    colors: ['#DE2910', '#FFDE00'],
    animation: 'fireworks',
    background: 'linear-gradient(180deg, rgba(222, 41, 16, 0.08) 0%, rgba(255, 222, 0, 0.05) 100%)',
  },
  patriotic: {
    particles: ['🇺🇸', '⭐', '🦅', '✨', '🎖️'],
    colors: ['#B22234', '#FFFFFF', '#3C3B6E'],
    animation: 'float',
    background: 'linear-gradient(135deg, rgba(178, 34, 52, 0.05) 0%, rgba(60, 59, 110, 0.05) 100%)',
  },
  spring: {
    particles: ['🌷', '🌸', '🌼', '🦋', '🐝', '☀️'],
    colors: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD'],
    animation: 'float',
    background: 'linear-gradient(135deg, rgba(255, 182, 193, 0.08) 0%, rgba(135, 206, 235, 0.08) 100%)',
  },
  summer: {
    particles: ['☀️', '🌴', '🌊', '🍦', '🏖️', '🌺'],
    colors: ['#FFD700', '#FF6347', '#00CED1', '#32CD32'],
    animation: 'float',
    background: 'linear-gradient(180deg, rgba(135, 206, 235, 0.1) 0%, rgba(255, 223, 0, 0.08) 100%)',
  },
  labor: {
    particles: ['👷', '🔧', '⚙️', '🏗️', '💪', '⭐'],
    colors: ['#FFD700', '#4169E1', '#DC143C'],
    animation: 'float',
    background: 'linear-gradient(135deg, rgba(65, 105, 225, 0.08) 0%, rgba(255, 215, 0, 0.08) 100%)',
  },
  qingming: {
    particles: ['🌿', '🍃', '🌱', '🌾', '🕊️', '💐'],
    colors: ['#228B22', '#90EE90', '#98FB98', '#3CB371'],
    animation: 'float',
    background: 'linear-gradient(180deg, rgba(144, 238, 144, 0.08) 0%, rgba(34, 139, 34, 0.05) 100%)',
  },
};

// Generate particles for animation
const generateHolidayParticles = (config) => {
  const count = 25;
  return Array.from({ length: count }, (_, i) => {
    const duration = 10 + Math.random() * 10;
    return {
      id: i,
      left: Math.random() * 100,
      delay: -Math.random() * duration,
      duration: duration,
      size: 0.8 + Math.random() * 1.2,
      opacity: 0.4 + Math.random() * 0.4,
      swayAmount: 30 + Math.random() * 60,
      particle: config.particles[Math.floor(Math.random() * config.particles.length)],
      rotationSpeed: 0.5 + Math.random() * 1.5,
    };
  });
};

// Check animation preferences
const checkHolidayAnimationEnabled = () => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('holiday_animation_enabled');
  return stored !== 'false';
};

const checkReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Get initial holiday and particles (lazy initialization)
const getInitialHolidayState = () => {
  const holiday = getCurrentHoliday();
  return holiday;
};

const getInitialParticles = () => {
  const holiday = getCurrentHoliday();
  if (holiday && HOLIDAY_ANIMATIONS[holiday.type]) {
    return generateHolidayParticles(HOLIDAY_ANIMATIONS[holiday.type]);
  }
  return [];
};

// ==================== COMPONENT ====================

export default function HolidayOverlay() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(checkReducedMotion);
  const [animationEnabled, setAnimationEnabled] = useState(checkHolidayAnimationEnabled);
  const [currentHoliday] = useState(getInitialHolidayState);
  const [particles] = useState(getInitialParticles);

  useEffect(() => {
    // Check for current holiday
    const holiday = getCurrentHoliday();
    setCurrentHoliday(holiday);
    
    if (holiday && HOLIDAY_ANIMATIONS[holiday.type]) {
      setParticles(generateHolidayParticles(HOLIDAY_ANIMATIONS[holiday.type]));
    }
  }, []);

  useEffect(() => {
    // Listen for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Listen for holiday animation toggle events
    const handleAnimationToggle = (e) => {
      setAnimationEnabled(e.detail.enabled);
    };
    window.addEventListener('holidayAnimationToggle', handleAnimationToggle);

    // Dispatch event to notify seasonal overlay that holiday is active
    if (currentHoliday) {
      window.dispatchEvent(new CustomEvent('holidayActive', { detail: { active: true, holiday: currentHoliday } }));
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('holidayAnimationToggle', handleAnimationToggle);
    };
  }, [currentHoliday]);

  // Don't render if no holiday, reduced motion, or disabled
  if (!currentHoliday || prefersReducedMotion || !animationEnabled) return null;

  const config = HOLIDAY_ANIMATIONS[currentHoliday.type];
  if (!config) return null;

  const getAnimationClass = () => {
    switch (config.animation) {
      case 'confetti':
        return 'animate-confetti';
      case 'snowfall':
        return 'animate-holiday-snow';
      case 'fireworks':
        return 'animate-firework';
      case 'float':
        return 'animate-holiday-float';
      case 'leaffall':
        return 'animate-holiday-leaf';
      case 'lantern':
        return 'animate-lantern';
      case 'moonrise':
        return 'animate-moonrise';
      case 'wave':
        return 'animate-wave';
      default:
        return 'animate-holiday-float';
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-40"
      aria-hidden="true"
      style={{ background: config.background }}
    >
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: var(--particle-opacity);
          }
          50% {
            transform: translateY(50vh) translateX(var(--sway-amount)) rotate(360deg) scale(0.9);
          }
          90% {
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) translateX(calc(var(--sway-amount) * -0.5)) rotate(720deg) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes holiday-snow {
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

        @keyframes firework {
          0% {
            transform: translateY(110vh) scale(0.3);
            opacity: 0;
          }
          30% {
            transform: translateY(30vh) scale(1);
            opacity: var(--particle-opacity);
          }
          50% {
            transform: translateY(20vh) translateX(var(--sway-amount)) scale(1.3);
            opacity: 1;
          }
          70% {
            transform: translateY(40vh) translateX(calc(var(--sway-amount) * -0.5)) scale(1);
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes holiday-float {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: var(--particle-opacity);
          }
          30% {
            transform: translateY(25vh) translateX(var(--sway-amount)) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--sway-amount) * -0.5)) rotate(180deg);
          }
          70% {
            transform: translateY(75vh) translateX(var(--sway-amount)) rotate(270deg);
          }
          85% {
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(110vh) translateX(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes holiday-leaf {
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

        @keyframes lantern {
          0% {
            transform: translateY(-10vh) translateX(0) scale(0.8);
            opacity: 0;
          }
          20% {
            opacity: var(--particle-opacity);
            transform: translateY(10vh) translateX(var(--sway-amount)) scale(1);
          }
          40% {
            transform: translateY(30vh) translateX(calc(var(--sway-amount) * -0.5)) scale(1.1);
          }
          60% {
            transform: translateY(50vh) translateX(var(--sway-amount)) scale(1);
          }
          80% {
            opacity: var(--particle-opacity);
            transform: translateY(80vh) translateX(calc(var(--sway-amount) * -0.3)) scale(0.9);
          }
          100% {
            transform: translateY(110vh) translateX(0) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes moonrise {
          0% {
            transform: translateY(110vh) translateX(0) scale(0.5);
            opacity: 0;
          }
          30% {
            transform: translateY(60vh) translateX(var(--sway-amount)) scale(0.8);
            opacity: var(--particle-opacity);
          }
          60% {
            transform: translateY(30vh) translateX(calc(var(--sway-amount) * -0.5)) scale(1);
            opacity: 1;
          }
          80% {
            transform: translateY(10vh) translateX(var(--sway-amount)) scale(1.1);
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(-10vh) translateX(0) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes wave {
          0% {
            transform: translateY(50vh) translateX(-20vw) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: translateY(45vh) translateX(0) rotate(10deg);
            opacity: var(--particle-opacity);
          }
          40% {
            transform: translateY(55vh) translateX(20vw) rotate(-10deg);
          }
          60% {
            transform: translateY(45vh) translateX(40vw) rotate(10deg);
          }
          80% {
            transform: translateY(55vh) translateX(60vw) rotate(-10deg);
            opacity: var(--particle-opacity);
          }
          100% {
            transform: translateY(50vh) translateX(120vw) rotate(0deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti var(--duration) ease-out infinite;
        }

        .animate-holiday-snow {
          animation: holiday-snow var(--duration) linear infinite;
        }

        .animate-firework {
          animation: firework var(--duration) ease-in-out infinite;
        }

        .animate-holiday-float {
          animation: holiday-float var(--duration) ease-in-out infinite;
        }

        .animate-holiday-leaf {
          animation: holiday-leaf var(--duration) ease-in-out infinite;
        }

        .animate-lantern {
          animation: lantern var(--duration) ease-in-out infinite;
        }

        .animate-moonrise {
          animation: moonrise var(--duration) ease-in-out infinite;
        }

        .animate-wave {
          animation: wave var(--duration) linear infinite;
        }
      `}</style>

      {/* Holiday Banner */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 z-50 pointer-events-auto">
        <span className="text-sm text-white/90 font-medium">
          {currentHoliday.emoji} {currentHoliday.name}
        </span>
      </div>

      {/* Particles */}
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
          }}
        >
          {particle.particle}
        </div>
      ))}
    </div>
  );
}

// Export holiday data for use in Changelog
export { getHolidays, HOLIDAY_ANIMATIONS };
