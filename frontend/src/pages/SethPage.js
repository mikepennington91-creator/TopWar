import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Star,
  Sparkles,
  Crown,
  ArrowLeft,
  Skull,
  Globe,
  Shield,
  Users,
  Trophy,
  Zap,
  PartyPopper
} from "lucide-react";

// Seth's profile image
const SETH_IMAGE = "https://customer-assets.emergentagent.com/job_f55fb419-be1a-4743-9d45-fe811badb52c/artifacts/e15cpfaa_Screenshot_20260218_122519_Spotify.jpg";

// Appreciation messages for Seth
const APPRECIATION_MESSAGES = [
  {
    icon: Shield,
    title: "In-Game Legend",
    description: "A fantastic In-Game Mod who keeps the community running smoothly and fairly",
    color: "purple"
  },
  {
    icon: Globe,
    title: "Turkish Ambassador",
    description: "The bridge between communities - representing and supporting the Turkish player base with dedication",
    color: "red"
  },
  {
    icon: Users,
    title: "Community Champion",
    description: "Always there for the players, answering questions and solving problems with patience",
    color: "blue"
  },
  {
    icon: Trophy,
    title: "Trusted Veteran",
    description: "Experience and wisdom that makes him an invaluable part of the moderation team",
    color: "amber"
  },
  {
    icon: Zap,
    title: "Quick Response",
    description: "Lightning fast when it comes to helping out and addressing issues in-game",
    color: "yellow"
  },
  {
    icon: Heart,
    title: "Heart of the Team",
    description: "Brings positive energy and dedication to everything he does",
    color: "pink"
  }
];

// Fun facts about Seth
const SETH_FACTS = [
  "Can spot a rule-breaker from a mile away 👀",
  "Fluent in both English and Turkish - twice the modding power! 🌍",
  "Has probably answered 'How do I...' questions more times than anyone can count 💬",
  "The Turkish community's favourite person to tag for help 🏷️",
  "Rumour has it he never sleeps - always online! 🦉",
  "Makes moderation look effortless 😎"
];

const getColorClasses = (color, isEvilMode) => {
  if (isEvilMode) {
    return "from-purple-500/30 to-pink-500/30 border-purple-400/50 text-purple-300";
  }
  const colors = {
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400"
  };
  return colors[color] || colors.purple;
};

// Unicorn component for Evil Mode
function Unicorn({ style }) {
  return (
    <div className="unicorn" style={style}>
      🦄
    </div>
  );
}

// Rainbow component for Evil Mode
function Rainbow({ style }) {
  return (
    <div className="rainbow-arc" style={style}>
      🌈
    </div>
  );
}

export default function SethPage() {
  const navigate = useNavigate();
  const [currentFact, setCurrentFact] = useState(0);
  const [isEvilMode, setIsEvilMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [unicorns, setUnicorns] = useState([]);
  const [rainbows, setRainbows] = useState([]);

  // Check localStorage for existing evil mode timer on mount
  useEffect(() => {
    const savedEndTime = localStorage.getItem('sethEvilModeEndTime');
    if (savedEndTime) {
      const endTime = parseInt(savedEndTime, 10);
      const now = Date.now();
      if (endTime > now) {
        setIsEvilMode(true);
        setTimeRemaining(Math.ceil((endTime - now) / 1000));
      } else {
        localStorage.removeItem('sethEvilModeEndTime');
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsEvilMode(false);
            localStorage.removeItem('sethEvilModeEndTime');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Rotate facts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % SETH_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Spawn unicorns in evil mode
  useEffect(() => {
    if (!isEvilMode) {
      setUnicorns([]);
      return;
    }
    
    const spawnUnicorn = () => {
      const newUnicorn = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 2
      };
      setUnicorns(prev => [...prev.slice(-8), newUnicorn]);
    };

    spawnUnicorn();
    const interval = setInterval(spawnUnicorn, 1500);
    return () => clearInterval(interval);
  }, [isEvilMode]);

  // Spawn rainbows in evil mode
  useEffect(() => {
    if (!isEvilMode) {
      setRainbows([]);
      return;
    }
    
    const spawnRainbow = () => {
      const newRainbow = {
        id: Date.now() + Math.random(),
        left: Math.random() * 80,
        top: Math.random() * 60,
        duration: 4 + Math.random() * 3,
        size: 40 + Math.random() * 40
      };
      setRainbows(prev => [...prev.slice(-5), newRainbow]);
    };

    spawnRainbow();
    const interval = setInterval(spawnRainbow, 2500);
    return () => clearInterval(interval);
  }, [isEvilMode]);

  const activateEvilMode = useCallback(() => {
    if (isEvilMode) return; // Can't click if already active
    
    const FIVE_MINUTES = 5 * 60 * 1000;
    const endTime = Date.now() + FIVE_MINUTES;
    localStorage.setItem('sethEvilModeEndTime', endTime.toString());
    setIsEvilMode(true);
    setTimeRemaining(300); // 5 minutes in seconds
  }, [isEvilMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen ${isEvilMode 
      ? 'bg-gradient-to-br from-purple-950 via-fuchsia-950 to-violet-950' 
      : 'bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950'
    } text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-1000`}>
      
      {/* Animated styles */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes bounce-icon {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes unicorn-dance {
            0% { transform: translateY(100vh) rotate(0deg) scale(1); }
            25% { transform: translateY(50vh) rotate(15deg) scale(1.2); }
            50% { transform: translateY(25vh) rotate(-15deg) scale(1); }
            75% { transform: translateY(10vh) rotate(10deg) scale(1.1); }
            100% { transform: translateY(-20vh) rotate(-5deg) scale(0.8); opacity: 0; }
          }
          @keyframes rainbow-float {
            0% { transform: translateX(-100%) rotate(-10deg); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(100vw) rotate(10deg); opacity: 0; }
          }
          @keyframes evil-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
            50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(236, 72, 153, 0.4); }
          }
          @keyframes rainbow-text {
            0% { color: #ff0000; }
            17% { color: #ff8800; }
            33% { color: #ffff00; }
            50% { color: #00ff00; }
            67% { color: #0088ff; }
            83% { color: #8800ff; }
            100% { color: #ff0000; }
          }
          @keyframes disco {
            0% { background-color: rgba(168, 85, 247, 0.1); }
            25% { background-color: rgba(236, 72, 153, 0.1); }
            50% { background-color: rgba(59, 130, 246, 0.1); }
            75% { background-color: rgba(16, 185, 129, 0.1); }
            100% { background-color: rgba(168, 85, 247, 0.1); }
          }
          .float-1 { animation: float 6s ease-in-out infinite; }
          .float-2 { animation: float 8s ease-in-out infinite 1s; }
          .float-3 { animation: float 7s ease-in-out infinite 2s; }
          .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
          .shimmer-text {
            background: linear-gradient(
              90deg,
              #a855f7 0%,
              #ec4899 25%,
              #f472b6 50%,
              #ec4899 75%,
              #a855f7 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s linear infinite;
          }
          .shimmer-text-dark {
            background: linear-gradient(
              90deg,
              #64748b 0%,
              #94a3b8 25%,
              #cbd5e1 50%,
              #94a3b8 75%,
              #64748b 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s linear infinite;
          }
          .bounce-icon { animation: bounce-icon 1s ease-in-out infinite; }
          .sparkle { animation: sparkle 2s ease-in-out infinite; }
          .unicorn {
            position: fixed;
            font-size: 48px;
            pointer-events: none;
            z-index: 100;
            animation: unicorn-dance linear forwards;
          }
          .rainbow-arc {
            position: fixed;
            font-size: 60px;
            pointer-events: none;
            z-index: 99;
            animation: rainbow-float linear forwards;
          }
          .evil-pulse { animation: evil-pulse 2s ease-in-out infinite; }
          .rainbow-text { animation: rainbow-text 2s linear infinite; }
          .disco-bg { animation: disco 3s ease-in-out infinite; }
          .evil-button-locked {
            background: linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b, #10b981, #3b82f6, #7c3aed);
            background-size: 400% 400%;
            animation: gradient-shift 3s ease infinite;
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      {/* Unicorns for Evil Mode */}
      {unicorns.map(unicorn => (
        <Unicorn 
          key={unicorn.id}
          style={{
            left: `${unicorn.left}%`,
            animationDuration: `${unicorn.duration}s`,
            animationDelay: `${unicorn.delay}s`
          }}
        />
      ))}

      {/* Rainbows for Evil Mode */}
      {rainbows.map(rainbow => (
        <Rainbow 
          key={rainbow.id}
          style={{
            left: `${rainbow.left}%`,
            top: `${rainbow.top}%`,
            fontSize: `${rainbow.size}px`,
            animationDuration: `${rainbow.duration}s`
          }}
        />
      ))}

      {/* Floating decorative elements */}
      <div className={`absolute top-20 left-10 w-32 h-32 ${isEvilMode ? 'bg-purple-500/20' : 'bg-slate-500/10'} rounded-full blur-3xl float-1 transition-colors duration-1000`} />
      <div className={`absolute top-40 right-20 w-40 h-40 ${isEvilMode ? 'bg-pink-500/20' : 'bg-zinc-500/10'} rounded-full blur-3xl float-2 transition-colors duration-1000`} />
      <div className={`absolute bottom-20 left-1/3 w-36 h-36 ${isEvilMode ? 'bg-fuchsia-500/20' : 'bg-slate-600/10'} rounded-full blur-3xl float-3 transition-colors duration-1000`} />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Evil Mode Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={activateEvilMode}
            disabled={isEvilMode}
            className={`relative px-6 py-3 rounded-full font-bold text-lg transition-all duration-300 ${
              isEvilMode 
                ? 'evil-button-locked text-white cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30'
            }`}
            data-testid="evil-mode-btn"
          >
            <div className="flex items-center gap-2">
              {isEvilMode ? (
                <>
                  <span className="rainbow-text">🦄 EVIL MODE ACTIVE 🌈</span>
                  <span className="ml-2 bg-black/30 px-3 py-1 rounded-full text-sm">
                    {formatTime(timeRemaining)}
                  </span>
                </>
              ) : (
                <>
                  <Skull className="w-5 h-5" />
                  <span>Evil Mode</span>
                  <Skull className="w-5 h-5" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center gap-2 ${isEvilMode ? 'bg-purple-500/20 border-purple-400/40' : 'bg-zinc-800/50 border-zinc-700/50'} border rounded-full px-4 py-2 mb-4 transition-colors duration-500`}>
            <Star className={`w-4 h-4 ${isEvilMode ? 'text-purple-400' : 'text-zinc-400'} bounce-icon`} />
            <span className={`${isEvilMode ? 'text-purple-300' : 'text-zinc-400'} text-sm font-medium uppercase tracking-wider`}>
              {isEvilMode ? '✨ Fabulous Appreciation Page ✨' : 'Appreciation Page'}
            </span>
            <Star className={`w-4 h-4 ${isEvilMode ? 'text-purple-400' : 'text-zinc-400'} bounce-icon`} />
          </div>
          
          {/* Profile Image */}
          <div className="relative inline-block mb-6">
            <div className={`w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-full flex items-center justify-center border-4 ${
              isEvilMode 
                ? 'border-purple-400/50 evil-pulse' 
                : 'border-zinc-700/50 pulse-glow'
            } overflow-hidden transition-all duration-500`}>
              <img 
                src={SETH_IMAGE}
                alt="Seth profile" 
                className="w-full h-full object-cover rounded-full"
                data-testid="seth-profile-image"
              />
            </div>
            {/* Floating sparkles */}
            <Sparkles className={`absolute -top-2 -right-2 w-6 h-6 ${isEvilMode ? 'text-pink-400' : 'text-zinc-500'} sparkle`} />
            <Sparkles className={`absolute -bottom-2 -left-2 w-5 h-5 ${isEvilMode ? 'text-purple-400' : 'text-zinc-600'} sparkle`} style={{ animationDelay: '0.5s' }} />
            {isEvilMode && (
              <>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce">🦄</span>
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🌈</span>
              </>
            )}
          </div>
          
          <h1 className={`text-4xl sm:text-6xl font-bold mb-2 ${isEvilMode ? 'shimmer-text' : 'shimmer-text-dark'}`}
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {isEvilMode ? '🌟 SETH 🌟' : '⚔️ SETH ⚔️'}
          </h1>
          <p className={`${isEvilMode ? 'text-purple-300' : 'text-zinc-400'} text-lg sm:text-xl max-w-2xl mx-auto transition-colors duration-500`}>
            In-Game Moderator & Turkish Community Ambassador
          </p>
        </div>

        {/* Welcome Back Banner */}
        <Card className={`${isEvilMode 
          ? 'bg-gradient-to-r from-purple-900/40 via-fuchsia-900/30 to-purple-900/40 border-purple-500/30 disco-bg' 
          : 'bg-gradient-to-r from-zinc-900/50 via-slate-900/50 to-zinc-900/50 border-zinc-700/30'
        } mb-8 backdrop-blur-sm transition-all duration-500`}>
          <CardContent className="p-6 sm:p-8 text-center">
            <PartyPopper className={`w-10 h-10 ${isEvilMode ? 'text-pink-400' : 'text-amber-500'} mx-auto mb-4`} />
            <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${isEvilMode ? 'rainbow-text' : 'text-zinc-200'}`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Welcome Back to the Team! 🎉
            </h2>
            <p className={`${isEvilMode ? 'text-purple-200' : 'text-zinc-400'} text-lg max-w-xl mx-auto`}>
              We're thrilled to have you back, Seth! The team hasn't been the same without you. 
              Your dedication to the community and your expertise are truly invaluable.
            </p>
          </CardContent>
        </Card>

        {/* Main Quote */}
        <Card className={`${isEvilMode 
          ? 'bg-gradient-to-r from-fuchsia-950/40 via-purple-900/30 to-fuchsia-950/40 border-fuchsia-500/30' 
          : 'bg-gradient-to-r from-zinc-900/50 via-slate-800/50 to-zinc-900/50 border-zinc-700/30'
        } mb-8 backdrop-blur-sm transition-all duration-500`}>
          <CardContent className="p-6 sm:p-8 text-center">
            <Crown className={`w-10 h-10 ${isEvilMode ? 'text-amber-400' : 'text-amber-600'} mx-auto mb-4`} />
            <blockquote className={`text-xl sm:text-2xl ${isEvilMode ? 'text-purple-100' : 'text-zinc-300'} leading-relaxed font-medium`}>
              "Seth brings the perfect blend of experience, dedication, and community spirit. 
              A true asset to the moderation team and a bridge between cultures."
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Shield className={`w-5 h-5 ${isEvilMode ? 'text-purple-400' : 'text-zinc-500'}`} />
              <span className={`${isEvilMode ? 'text-fuchsia-300' : 'text-zinc-500'} font-bold text-lg`}>— The Mod Team</span>
              <Shield className={`w-5 h-5 ${isEvilMode ? 'text-purple-400' : 'text-zinc-500'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Rotating Fun Facts */}
        <Card className={`${isEvilMode 
          ? 'bg-gradient-to-r from-violet-950/40 via-purple-900/30 to-violet-950/40 border-violet-500/30' 
          : 'bg-gradient-to-r from-slate-900/50 via-zinc-800/50 to-slate-900/50 border-slate-700/30'
        } mb-8 backdrop-blur-sm transition-all duration-500`}>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap className={`w-6 h-6 ${isEvilMode ? 'text-pink-400' : 'text-amber-500'}`} />
              <h3 className={`text-lg font-bold ${isEvilMode ? 'text-pink-300' : 'text-zinc-400'}`}>
                Seth Fact #{currentFact + 1}
              </h3>
            </div>
            <p className={`${isEvilMode ? 'text-purple-200' : 'text-zinc-400'} text-lg transition-all duration-500`}>
              {SETH_FACTS[currentFact]}
            </p>
          </CardContent>
        </Card>

        {/* Appreciation Grid */}
        <h2 className={`text-2xl font-bold text-center ${isEvilMode ? 'text-fuchsia-300' : 'text-zinc-400'} mb-6 transition-colors duration-500`}
            style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {isEvilMode ? '🦄 WHY SETH IS MAGICAL 🦄' : '⚔️ WHY SETH IS BRILLIANT ⚔️'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {APPRECIATION_MESSAGES.map((item, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-br ${getColorClasses(item.color, isEvilMode)} backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-default`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${isEvilMode ? 'bg-purple-900/50' : 'bg-slate-900/50'} flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className={`font-bold ${isEvilMode ? 'text-purple-100' : 'text-zinc-200'}`}>{item.title}</h3>
                </div>
                <p className={`text-sm ${isEvilMode ? 'text-purple-300' : 'text-zinc-500'}`}>{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Turkish Ambassador Section */}
        <Card className={`${isEvilMode 
          ? 'bg-gradient-to-r from-red-950/40 via-purple-900/30 to-red-950/40 border-red-500/30' 
          : 'bg-gradient-to-r from-red-950/30 via-zinc-900/50 to-red-950/30 border-red-900/30'
        } mb-8 backdrop-blur-sm transition-all duration-500`}>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="text-4xl mb-4">🇹🇷</div>
            <h3 className={`text-xl font-bold ${isEvilMode ? 'text-red-300' : 'text-red-400'} mb-3`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Turkish Community Ambassador
            </h3>
            <p className={`${isEvilMode ? 'text-purple-200' : 'text-zinc-400'} max-w-lg mx-auto`}>
              Seth serves as the vital link between the Turkish gaming community and the wider player base. 
              His bilingual skills and cultural understanding make him the perfect ambassador, ensuring every 
              Turkish player feels heard, supported, and valued.
            </p>
            <div className="mt-4 text-2xl">
              {isEvilMode ? '🦄🌈✨🇹🇷✨🌈🦄' : '⭐🇹🇷⭐'}
            </div>
          </CardContent>
        </Card>

        {/* Final Message */}
        <div className="text-center mb-8">
          <div className={`inline-block ${isEvilMode 
            ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-400/30' 
            : 'bg-gradient-to-r from-zinc-800/50 via-slate-800/50 to-zinc-800/50 border-zinc-700/30'
          } border rounded-lg p-6 sm:p-8 transition-all duration-500`}>
            <div className="flex justify-center gap-2 mb-4">
              {isEvilMode 
                ? ['🦄', '🌈', '✨', '🌈', '🦄'].map((emoji, i) => (
                    <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
                  ))
                : ['⚔️', '🛡️', '👑', '🛡️', '⚔️'].map((emoji, i) => (
                    <span key={i} className="text-2xl">{emoji}</span>
                  ))
              }
            </div>
            <h3 className={`text-2xl font-bold ${isEvilMode ? 'text-fuchsia-300' : 'text-zinc-300'} mb-3`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {isEvilMode ? 'YOU\'RE ABSOLUTELY FABULOUS! 💖' : 'GLAD TO HAVE YOU BACK! 🎯'}
            </h3>
            <p className={`${isEvilMode ? 'text-purple-300' : 'text-zinc-500'} max-w-lg mx-auto mb-4`}>
              Seth, your return to the team is a massive boost for everyone. Your experience, your patience, 
              and your dedication to both the game and the Turkish community make you irreplaceable. 
              Here's to many more great moments together!
            </p>
            <div className="text-3xl mb-4">
              {isEvilMode ? '🎉🦄🌈💜🌟💜🌈🦄🎉' : '🎮⚔️🏆👑🏆⚔️🎮'}
            </div>
            <p className={`${isEvilMode ? 'text-pink-300' : 'text-zinc-400'} font-semibold text-lg`}>
              Welcome back, legend! {isEvilMode ? '🦄✨' : '💪'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className={`${isEvilMode 
              ? 'border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-500/50 hover:bg-purple-500/10' 
              : 'border-zinc-700/50 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600/50 hover:bg-zinc-800/30'
            } transition-all duration-300`}
            data-testid="back-to-login-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
