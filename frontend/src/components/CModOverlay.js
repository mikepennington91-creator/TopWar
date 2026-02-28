import { useEffect, useState } from "react";

/**
 * CModOverlay - Falling top hats animation overlay for CMod mode
 */
export default function CModOverlay({ isActive }) {
  const [topHats, setTopHats] = useState([]);

  useEffect(() => {
    if (!isActive) {
      setTopHats([]);
      return;
    }

    // Create initial top hats
    const createTopHat = () => ({
      id: Math.random().toString(36).substr(2, 9),
      left: Math.random() * 100,
      animationDuration: 3 + Math.random() * 4,
      animationDelay: Math.random() * 2,
      size: 20 + Math.random() * 20,
      rotation: Math.random() * 360,
      rotationSpeed: 20 + Math.random() * 40,
    });

    // Initial batch of top hats
    setTopHats(Array(15).fill(null).map(createTopHat));

    // Continuously add new top hats
    const interval = setInterval(() => {
      setTopHats(prev => {
        const newHats = [...prev, createTopHat()];
        // Keep only the last 30 hats to prevent memory issues
        return newHats.slice(-30);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="cmod-overlay" data-testid="cmod-overlay">
      {topHats.map((hat) => (
        <div
          key={hat.id}
          className="falling-tophat"
          style={{
            left: `${hat.left}%`,
            animationDuration: `${hat.animationDuration}s`,
            animationDelay: `${hat.animationDelay}s`,
            fontSize: `${hat.size}px`,
            '--rotation-speed': `${hat.rotationSpeed}deg`,
          }}
        >
          🎩
        </div>
      ))}
      <style>{`
        .cmod-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          overflow: hidden;
          z-index: 9999;
        }

        .falling-tophat {
          position: absolute;
          top: -50px;
          animation: fallAndSpin linear forwards;
          will-change: transform;
        }

        @keyframes fallAndSpin {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(var(--rotation-speed, 360deg));
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
