import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Frown, ThumbsDown, AlertCircle, Sparkles } from "lucide-react";

// Default content
const DEFAULT_CONTENT = {
  header_text: "NICE TRY, FUNNY GUY!",
  sub_header: "We see what you did there... 👀",
  status_text: "Application Status: TROLL DETECTED 🚨",
  message: "We regret to inform you that your \"application\" will not be considered for the prestigious position of Top War Moderator.",
  funny_reasons: [
    "Your application contained 47 uses of the word 'lol'",
    "We noticed you listed 'Professional Troll' as previous experience",
    "Your Discord handle was 'xX_TrollMaster_Xx'",
    "You answered every question with 'ur mom'",
    "Your essay was just the bee movie script",
    "You claimed to be 420 years old",
    "Your server number was '69420'",
    "You attached a picture of a potato as your ID"
  ],
  roast_text: "Your troll attempt was slightly less funny than you thought it was 😬",
  encouragement: "But hey, at least you found our secret page! That's gotta count for something, right? ...Right? 🦗",
  troll_score: "3/10 - needs work 📝"
};

// Troll emoji component with bounce animation
const BouncingEmoji = ({ emoji, delay }) => (
  <span 
    className="inline-block text-4xl"
    style={{ 
      animation: `bounce 1s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  >
    {emoji}
  </span>
);

export default function TrollPage() {
  const navigate = useNavigate();
  const [showRealMessage, setShowRealMessage] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  // Initialize content from sessionStorage or use default
  const [content] = useState(() => {
    const storedContent = sessionStorage.getItem('easter_egg_content');
    if (storedContent) {
      try {
        return { ...DEFAULT_CONTENT, ...JSON.parse(storedContent) };
      } catch {
        return DEFAULT_CONTENT;
      }
    }
    return DEFAULT_CONTENT;
  });

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      sessionStorage.removeItem('easter_egg_content');
    };
  }, []);
  
  const [randomReason] = useState(() => {
    const reasons = content.funny_reasons || DEFAULT_CONTENT.funny_reasons;
    return reasons[Math.floor(Math.random() * reasons.length)];
  });

  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount >= 4) {
      setShowRealMessage(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 text-white flex items-center justify-center px-4 py-6 overflow-hidden relative">
      {/* CSS Animations */}
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes wiggle {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(5deg); }
            66% { transform: translateY(5px) rotate(-5deg); }
          }
          @keyframes rainbow {
            0% { color: #ff0000; }
            17% { color: #ff8000; }
            33% { color: #ffff00; }
            50% { color: #00ff00; }
            67% { color: #0080ff; }
            83% { color: #8000ff; }
            100% { color: #ff0000; }
          }
          @keyframes slide-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .rainbow-text {
            animation: rainbow 3s linear infinite;
          }
          .wiggle {
            animation: wiggle 0.5s ease-in-out infinite;
          }
          .float {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* Floating background emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['🤡', '🎭', '😜', '🃏', '👻', '🎪'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-4xl opacity-20 float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
        <div 
          className="bg-gradient-to-br from-purple-800/90 to-indigo-800/90 backdrop-blur-sm border-2 border-purple-400/50 rounded-3xl p-8 sm:p-12 shadow-2xl"
          style={{ animation: 'slide-in 0.5s ease-out' }}
        >
          {/* Header with bouncing emojis */}
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4 mb-4">
              <BouncingEmoji emoji="🎭" delay={0} />
              <BouncingEmoji emoji="🤡" delay={0.2} />
              <BouncingEmoji emoji="🎭" delay={0.4} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 rainbow-text">
              {content.header_text}
            </h1>
            
            <p className="text-purple-200 text-lg">
              {content.sub_header}
            </p>
          </div>

          {/* The message */}
          <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-purple-500/30">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1 wiggle" />
              <div>
                <h2 className="text-xl font-bold text-yellow-400 mb-2">
                  {content.status_text}
                </h2>
                <p className="text-purple-100 leading-relaxed">
                  {content.message}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-purple-900/50 rounded-xl">
              <p className="text-sm text-purple-300 mb-2">📋 Reason for rejection:</p>
              <p className="text-white italic">&ldquo;{randomReason}&rdquo;</p>
            </div>
          </div>

          {/* The gentle roast */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-6 border border-pink-500/30">
              <Frown className="w-12 h-12 mx-auto text-pink-400 mb-3" />
              <p className="text-lg text-purple-100 mb-2">
                We have to be honest with you...
              </p>
              <p className="text-xl font-bold text-pink-300">
                {content.roast_text}
              </p>
            </div>
          </div>

          {/* Encouragement */}
          <div className="text-center mb-8 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <Sparkles className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-green-300">
              {content.encouragement}
            </p>
          </div>

          {/* Interactive buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleButtonClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              {clickCount === 0 && "I demand a recount!"}
              {clickCount === 1 && "No seriously, reconsider!"}
              {clickCount === 2 && "Please? 🥺"}
              {clickCount === 3 && "Pretty please?"}
              {clickCount === 4 && "I'll be good!"}
              {clickCount >= 5 && "...fine 😤"}
            </Button>
          </div>

          {/* Hidden message after clicking */}
          {showRealMessage && (
            <div 
              className="mt-6 text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30"
              style={{ animation: 'slide-in 0.3s ease-out' }}
            >
              <p className="text-yellow-300 text-sm">
                Okay okay, we appreciate the persistence! 😄
                <br />
                If you&rsquo;re actually interested in moderating, feel free to submit a <span className="underline">real</span> application!
              </p>
            </div>
          )}

          {/* Score card - for fun */}
          <div className="mt-8 text-center">
            <div className="inline-block bg-black/30 rounded-lg px-6 py-3">
              <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">Troll Score</p>
              <p className="text-2xl font-bold">
                <span className="text-yellow-400">3</span>
                <span className="text-purple-400">/</span>
                <span className="text-green-400">10</span>
              </p>
              <p className="text-xs text-purple-500">{content.troll_score}</p>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/moderator/login')}
              className="text-purple-400/60 hover:text-purple-300 text-sm underline underline-offset-4 transition-colors"
            >
              🚪 Fine, I&rsquo;ll leave...
            </button>
          </div>

          {/* Rick Roll - the ultimate troll */}
          <div className="mt-8 text-center">
            <p className="text-purple-400 text-sm mb-3">Oh, and one more thing... 🎵</p>
            <div className="rounded-xl overflow-hidden border-2 border-purple-500/50 inline-block shadow-lg shadow-purple-500/20">
              <img 
                src="https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif" 
                alt="Never Gonna Give You Up"
                className="w-full max-w-sm"
              />
            </div>
            <p className="text-purple-300 text-xs mt-2 italic">
              🎤 Never gonna give you up, never gonna let you down... 🎤
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
