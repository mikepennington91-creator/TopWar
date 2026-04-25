import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

// Rose petal component
const RosePetal = ({ style }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      ...style,
      fontSize: '24px',
      animation: `fall ${style.duration}s linear infinite`,
      animationDelay: `${style.delay}s`,
    }}
  >
    🌹
  </div>
);

export default function SecretProposalAlt() {
  const navigate = useNavigate();
  const [petals, setPetals] = useState([]);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    // Generate rose petals
    const newPetals = [];
    for (let i = 0; i < 30; i++) {
      newPetals.push({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: 5 + Math.random() * 5,
        delay: Math.random() * 5,
        size: 16 + Math.random() * 16,
      });
    }
    setPetals(newPetals);
  }, []);

  const handleAnswer = () => {
    setAnswered(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 via-pink-950 to-red-950 text-rose-100 flex items-center justify-center px-4 py-6 overflow-hidden relative">
      {/* CSS for falling animation */}
      <style>
        {`
          @keyframes fall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0.3;
            }
          }
          @keyframes pulse-heart {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          @keyframes sparkle {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Rose petals falling */}
      {petals.map((petal) => (
        <RosePetal
          key={petal.id}
          style={{
            left: petal.left,
            duration: petal.duration,
            delay: petal.delay,
            fontSize: `${petal.size}px`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-gradient-to-br from-rose-900/80 to-pink-900/80 backdrop-blur-sm border border-rose-500/30 rounded-2xl p-8 sm:p-12 shadow-2xl shadow-rose-900/50">
          {/* Decorative hearts */}
          <div className="absolute -top-4 -left-4">
            <Heart 
              className="w-8 h-8 text-rose-400 fill-rose-400" 
              style={{ animation: 'pulse-heart 2s ease-in-out infinite' }}
            />
          </div>
          <div className="absolute -top-4 -right-4">
            <Heart 
              className="w-8 h-8 text-rose-400 fill-rose-400" 
              style={{ animation: 'pulse-heart 2s ease-in-out infinite', animationDelay: '0.5s' }}
            />
          </div>
          <div className="absolute -bottom-4 -left-4">
            <Heart 
              className="w-6 h-6 text-pink-400 fill-pink-400" 
              style={{ animation: 'pulse-heart 2s ease-in-out infinite', animationDelay: '1s' }}
            />
          </div>
          <div className="absolute -bottom-4 -right-4">
            <Heart 
              className="w-6 h-6 text-pink-400 fill-pink-400" 
              style={{ animation: 'pulse-heart 2s ease-in-out infinite', animationDelay: '1.5s' }}
            />
          </div>

          {/* Main heart icon */}
          <div className="text-center mb-8">
            <Heart 
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-rose-400 fill-rose-400" 
              style={{ animation: 'pulse-heart 1.5s ease-in-out infinite' }}
            />
          </div>

          {/* The question */}
          <div className="text-center mb-10">
            <p className="text-lg sm:text-xl text-rose-200 mb-6 italic leading-relaxed">
              "In all the stars across the universe, my heart found its way to you. 
              Every moment with you feels like a dream I never want to wake from."
            </p>
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-rose-300 leading-tight"
              style={{ 
                fontFamily: 'Georgia, serif',
                textShadow: '0 0 30px rgba(244, 63, 94, 0.5)'
              }}
            >
              Will you Marry me?
            </h1>
          </div>

          {/* Sparkle decorations */}
          <div className="flex justify-center gap-2 mb-8">
            {['✨', '💕', '✨', '💕', '✨'].map((emoji, i) => (
              <span 
                key={i} 
                className="text-xl"
                style={{ animation: 'sparkle 2s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {/* Answer buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleAnswer}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-rose-500/30 transition-all duration-300 hover:scale-105 hover:shadow-rose-500/50"
            >
              💍 Yes
            </Button>
            <Button
              onClick={handleAnswer}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105 hover:shadow-pink-500/50"
            >
              💖 I thought you'd never ask
            </Button>
          </div>

          {/* Back link - subtle */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/moderator/login')}
              className="text-rose-400/60 hover:text-rose-300 text-sm underline underline-offset-4 transition-colors"
            >
              Return to reality
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
