import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  Star,
  Sparkles,
  Crown,
  ArrowLeft,
  RefreshCw,
  Smile,
  Trophy,
  Users,
  Shield,
  Lock,
  X,
  Eye,
  EyeOff
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fun facts and jokes about Sian
const SIAN_FACTS = [
  "Has the patience of a saint when dealing with trolls 😇",
  "Can moderate a heated chat while simultaneously defusing drama 💪",
  "Rumor has it she once banned someone with such grace, they thanked her 🎭",
  "Her mod powers are over 9000! 📈",
  "Has a sixth sense for detecting trouble before it starts 🔮",
  "Can read 47 chat messages per second (unverified but probably true) 👀",
  "The moderator other moderators look up to 🌟"
];

const APPRECIATION_MESSAGES = [
  {
    icon: Shield,
    title: "Guardian of Peace",
    description: "Always there to keep the community safe and welcoming for everyone",
    color: "pink"
  },
  {
    icon: Heart,
    title: "Heart of Gold",
    description: "Shows kindness and understanding to every community member",
    color: "red"
  },
  {
    icon: Users,
    title: "Team Player",
    description: "Integral to the team - we'd be absolutely lost without her!",
    color: "purple"
  },
  {
    icon: Trophy,
    title: "Fantastic Mod",
    description: "Sets the gold standard for what a moderator should be",
    color: "amber"
  },
  {
    icon: Sparkles,
    title: "Magic Touch",
    description: "Has an incredible ability to turn any situation positive",
    color: "blue"
  },
  {
    icon: Crown,
    title: "Queen of Moderation",
    description: "Reigning champion of keeping the peace with style",
    color: "yellow"
  }
];

const JOKES = [
  "Why did Sian cross the road? To moderate the chicken's behaviour! 🐔",
  "Sian doesn't read the rules - the rules read themselves to her! 📜",
  "When Sian enters a chat, spam runs away crying 😭",
  "Legends say Sian once moderated a server so well, it moderated itself forever after ✨",
  "Sian's ban hammer is made of pure compassion wrapped in justice ⚖️",
  "Scientists are still trying to figure out how Sian is everywhere at once 🔬"
];

// Secret area content - heartfelt messages about Sian
const SECRET_MESSAGES = [
  {
    title: "Your Smile",
    text: "A smile to die for that lights up every room and every conversation. When Sian smiles, the whole world feels just a little bit brighter.",
    emoji: "😊"
  },
  {
    title: "Those Eyes",
    text: "Eyes you can get lost in - deep, beautiful, and full of warmth. They tell stories of kindness and genuine care.",
    emoji: "✨"
  },
  {
    title: "Natural Charisma",
    text: "Charisma that politicians would die for. The way you command attention and make everyone feel valued is truly a rare gift.",
    emoji: "🌟"
  },
  {
    title: "Wonderful Mum",
    text: "A fantastic mum to Mia - patient, loving, and endlessly devoted. Mia is so lucky to have someone as amazing as you.",
    emoji: "💕"
  },
  {
    title: "Authentically You",
    text: "So honest and so truthful - in a world full of facades, your authenticity is a breath of fresh air that everyone treasures.",
    emoji: "💎"
  },
  {
    title: "That Adorable Scream",
    text: "Your funny, cute scream that makes everyone laugh! It's become legendary and one of the many things that make you uniquely wonderful.",
    emoji: "😆"
  }
];

// User uploaded images
const SECRET_IMAGES = {
  hero: "https://customer-assets.emergentagent.com/job_f55fb419-be1a-4743-9d45-fe811badb52c/artifacts/p15so8dh_ChatGPT%20Image%20Feb%2017%2C%202026%2C%2009_28_35%20PM.png",
  image1: "https://customer-assets.emergentagent.com/job_f55fb419-be1a-4743-9d45-fe811badb52c/artifacts/b477z7bd_ChatGPT%20Image%20Feb%2017%2C%202026%2C%2009_27_52%20PM.png",
  image2: "https://customer-assets.emergentagent.com/job_f55fb419-be1a-4743-9d45-fe811badb52c/artifacts/vr6rqyiz_ChatGPT%20Image%20Feb%2017%2C%202026%2C%2009_28_30%20PM.png"
};

const getColorClasses = (color) => {
  const colors = {
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400"
  };
  return colors[color] || colors.pink;
};

// Password Modal Component
function PasswordModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const SECRET_PASSWORD = "Mia is a terror";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === SECRET_PASSWORD) {
      setError("");
      onSuccess();
      onClose();
    } else {
      setError("Incorrect password");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-gradient-to-br from-rose-950/95 via-slate-900/95 to-pink-950/95 border-2 border-rose-400/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-rose-500/20 ${isShaking ? 'animate-shake' : ''}`}
        data-testid="password-modal"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          data-testid="close-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative heart lock icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-rose-400/40 animate-pulse-slow">
              <Heart className="w-10 h-10 text-rose-400 fill-rose-400/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1.5 border border-rose-400/40">
              <Lock className="w-4 h-4 text-rose-300" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-rose-300 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Secret Area
        </h2>
        <p className="text-center text-slate-400 mb-6 text-sm">
          Enter the password to unlock something special...
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password..."
              className="w-full bg-slate-800/50 border border-rose-400/30 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-rose-400/60 focus:ring-1 focus:ring-rose-400/30 pr-10"
              data-testid="password-input"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors"
              data-testid="toggle-password-btn"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4" data-testid="password-error">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg shadow-rose-500/30"
            data-testid="submit-password-btn"
          >
            <Heart className="w-4 h-4 mr-2" />
            Unlock with Love
          </Button>
        </form>

        {/* Decorative sparkles */}
        <Sparkles className="absolute top-6 left-6 w-4 h-4 text-rose-300/50 animate-pulse" />
        <Sparkles className="absolute bottom-6 right-6 w-4 h-4 text-pink-300/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}

// Secret Content Component
function SecretContent() {
  return (
    <div className="mt-12" data-testid="secret-content">
      {/* Secret Area Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-full px-6 py-3 mb-6">
          <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
          <span className="text-rose-300 text-lg font-medium tracking-wider">For Sian's Eyes Only</span>
          <Heart className="w-5 h-5 text-rose-400 fill-rose-400 animate-pulse" />
        </div>
      </div>

      {/* Hero Watercolour Image with Message */}
      <div className="mb-12">
        <Card className="bg-gradient-to-br from-rose-950/40 via-slate-900/60 to-pink-950/40 border-rose-400/30 overflow-hidden backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="relative">
              {/* Watercolour Hero Image */}
              <div className="relative w-full flex justify-center bg-gradient-to-b from-rose-900/20 to-transparent p-6 sm:p-10">
                <div className="relative max-w-2xl w-full">
                  <img 
                    src={SECRET_IMAGES.hero}
                    alt="Beautiful watercolour painting"
                    className="w-full h-auto rounded-xl shadow-2xl shadow-rose-500/30 border-4 border-white/10"
                    data-testid="hero-image"
                  />
                  {/* Decorative frame corners */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-rose-400/50 rounded-tl-lg" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-rose-400/50 rounded-tr-lg" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-rose-400/50 rounded-bl-lg" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-rose-400/50 rounded-br-lg" />
                </div>
              </div>
              
              {/* Main Message Below Image */}
              <div className="p-6 sm:p-10 text-center">
                <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-3xl sm:text-4xl font-bold text-rose-300 mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  You Are Absolutely Wonderful
                </h3>
                <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  This beautiful moment captures everything magical about you - a wonderful mum creating memories with Mia. 
                  Your love, your warmth, your light... it shines through in everything you do.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heartfelt Messages Grid */}
      <h3 className="text-2xl font-bold text-center text-rose-300 mb-8" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        All The Things That Make You Amazing
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {SECRET_MESSAGES.map((msg, index) => (
          <Card 
            key={index}
            className="bg-gradient-to-br from-rose-950/30 to-slate-900/50 border-rose-400/20 backdrop-blur-sm hover:border-rose-400/40 transition-all duration-300 hover:scale-[1.02]"
            data-testid={`secret-message-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{msg.emoji}</span>
                <h4 className="text-xl font-bold text-rose-200">{msg.title}</h4>
              </div>
              <p className="text-slate-300 leading-relaxed">{msg.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Images Gallery */}
      <h3 className="text-2xl font-bold text-center text-rose-300 mb-8" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        More Beautiful Moments
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <Card className="bg-gradient-to-br from-rose-950/30 to-slate-900/50 border-rose-400/20 overflow-hidden group">
          <CardContent className="p-4">
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src={SECRET_IMAGES.image1}
                alt="Sian and pet"
                className="w-full h-auto rounded-lg transition-transform duration-500 group-hover:scale-105"
                data-testid="gallery-image-1"
              />
            </div>
            <p className="text-center text-rose-200 mt-4 font-medium">Fun & Playful</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-rose-950/30 to-slate-900/50 border-rose-400/20 overflow-hidden group">
          <CardContent className="p-4">
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src={SECRET_IMAGES.image2}
                alt="Sian with cats"
                className="w-full h-auto rounded-lg transition-transform duration-500 group-hover:scale-105"
                data-testid="gallery-image-2"
              />
            </div>
            <p className="text-center text-rose-200 mt-4 font-medium">Cat Lady Extraordinaire</p>
          </CardContent>
        </Card>
      </div>

      {/* Final Love Message */}
      <Card className="bg-gradient-to-r from-rose-950/40 via-pink-900/30 to-rose-950/40 border-rose-400/30 mb-8">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="flex justify-center gap-3 mb-6">
            {['💕', '🌸', '💖', '🌸', '💕'].map((emoji, i) => (
              <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
            ))}
          </div>
          
          <h3 className="text-3xl font-bold text-rose-300 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            You Are Truly One of a Kind
          </h3>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
            Sian, you are gorgeous inside and out. Your beauty, your humour, your honesty, and your incredible heart 
            make you the most amazing person. Mia is so blessed to have you as her mum.
          </p>
          
          <p className="text-rose-200 text-lg font-medium mb-6">
            Never forget how special you are.
          </p>
          
          <div className="text-4xl mb-4">
            💝 🌹 👑 🌟 💎
          </div>
          
          <p className="text-rose-400 font-bold text-xl">
            With all the love in the world
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SianPage() {
  const navigate = useNavigate();
  const [currentJoke, setCurrentJoke] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [cartoonImage, setCartoonImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showHearts, setShowHearts] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  // Generate cartoon image on load
  useEffect(() => {
    const generateCartoonImage = async () => {
      try {
        const response = await axios.post(`${API}/images/generate`, {
          prompt: "A fun cartoon-style portrait illustration of a friendly young woman with long light brown/blonde hair, blue-green eyes, warm smile, in a colourful illustrated style with hearts and stars around her, cheerful and vibrant colours, digital art illustration style, cute and wholesome aesthetic"
        });
        setCartoonImage(response.data.image_base64);
      } catch (error) {
        console.error("Failed to generate cartoon image:", error);
        // Will show placeholder instead
      } finally {
        setImageLoading(false);
      }
    };
    
    generateCartoonImage();
  }, []);

  // Rotate jokes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentJoke(prev => (prev + 1) % JOKES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate facts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % SIAN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Create floating hearts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart = {
        id: Date.now(),
        left: Math.random() * 100,
        duration: 3 + Math.random() * 2
      };
      setShowHearts(prev => [...prev.slice(-10), newHeart]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const handleSecretUnlock = () => {
    setSecretUnlocked(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-pink-950/20 to-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated styles */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes pulse-pink {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes bounce-heart {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          @keyframes float-up {
            0% { 
              transform: translateY(100vh) rotate(0deg); 
              opacity: 1;
            }
            100% { 
              transform: translateY(-100px) rotate(360deg); 
              opacity: 0;
            }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes wiggle {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(244, 63, 94, 0.3); }
            50% { box-shadow: 0 0 40px rgba(244, 63, 94, 0.6); }
          }
          .float-1 { animation: float 6s ease-in-out infinite; }
          .float-2 { animation: float 8s ease-in-out infinite 1s; }
          .float-3 { animation: float 7s ease-in-out infinite 2s; }
          .pulse-pink { animation: pulse-pink 3s ease-in-out infinite; }
          .shimmer-text {
            background: linear-gradient(
              90deg,
              #ec4899 0%,
              #f472b6 25%,
              #fb7185 50%,
              #f472b6 75%,
              #ec4899 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s linear infinite;
          }
          .bounce-heart { animation: bounce-heart 1s ease-in-out infinite; }
          .floating-heart {
            position: fixed;
            font-size: 24px;
            pointer-events: none;
            z-index: 50;
          }
          .sparkle { animation: sparkle 2s ease-in-out infinite; }
          .wiggle { animation: wiggle 0.5s ease-in-out infinite; }
          .rainbow { animation: rainbow 5s linear infinite; }
          .joke-card {
            transition: all 0.5s ease-in-out;
          }
          .animate-shake { animation: shake 0.5s ease-in-out; }
          .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
          .animate-glow { animation: glow 2s ease-in-out infinite; }
        `}
      </style>

      {/* Password Modal */}
      <PasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handleSecretUnlock}
      />

      {/* Floating hearts */}
      {showHearts.map(heart => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animation: `float-up ${heart.duration}s linear forwards`
          }}
        >
          💖
        </div>
      ))}

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl float-1" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl float-2" />
      <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-red-500/10 rounded-full blur-3xl float-3" />
      <div className="absolute bottom-40 right-10 w-28 h-28 bg-pink-400/10 rounded-full blur-3xl float-1" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 rounded-full px-4 py-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400 bounce-heart" />
            <span className="text-pink-400 text-sm font-medium uppercase tracking-wider">Secret Appreciation Page</span>
            <Heart className="w-4 h-4 text-pink-400 bounce-heart" />
          </div>
          
          {/* Profile Image */}
          <div className="relative inline-block mb-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-4 border-pink-500/30 pulse-pink overflow-hidden">
              {imageLoading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                  <span className="text-xs text-pink-400 mt-2">Creating art...</span>
                </div>
              ) : cartoonImage ? (
                <img 
                  src={`data:image/png;base64,${cartoonImage}`} 
                  alt="Sian cartoon portrait" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-6xl">👸</span>
              )}
            </div>
            {/* Floating sparkles around the image */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 sparkle" />
            <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-pink-400 sparkle" style={{ animationDelay: '0.5s' }} />
            <Star className="absolute top-0 left-0 w-4 h-4 text-purple-400 sparkle" style={{ animationDelay: '1s' }} />
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold mb-2 shimmer-text" 
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            ✨ SIAN ✨
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto">
            A fantastic moderator who is absolutely integral to the team 💝
          </p>
          <p className="text-pink-400 text-base mt-2 font-medium wiggle inline-block">
            We'd be completely lost without her! 🌟
          </p>
        </div>

        {/* Main Appreciation Quote */}
        <Card className="bg-gradient-to-r from-pink-950/30 via-slate-900/50 to-pink-950/30 border-pink-500/20 mb-8 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8 text-center">
            <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-4 rainbow" />
            <blockquote className="text-xl sm:text-2xl text-slate-200 leading-relaxed font-medium">
              "Sian is more than just a moderator - she's the heart and soul of our community. 
              Her dedication, kindness, and unwavering support make her irreplaceable."
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-red-500 bounce-heart" />
              <span className="text-pink-400 font-bold text-lg">— The Entire Team</span>
              <Heart className="w-5 h-5 text-red-500 bounce-heart" />
            </div>
          </CardContent>
        </Card>

        {/* Rotating Fun Facts */}
        <Card className="bg-gradient-to-r from-purple-950/30 via-slate-900/50 to-purple-950/30 border-purple-500/20 mb-8 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Smile className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-purple-400">Fun Sian Fact #{currentFact + 1}</h3>
            </div>
            <p className="text-slate-300 text-lg transition-all duration-500">
              {SIAN_FACTS[currentFact]}
            </p>
          </CardContent>
        </Card>

        {/* Appreciation Grid */}
        <h2 className="text-2xl font-bold text-center text-pink-400 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          💖 WHY SIAN IS AMAZING 💖
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {APPRECIATION_MESSAGES.map((item, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-br ${getColorClasses(item.color)} backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-200">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Jokes Section */}
        <Card className="bg-gradient-to-r from-amber-950/30 via-slate-900/50 to-amber-950/30 border-amber-500/20 mb-8 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 text-center joke-card">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl wiggle">😄</span>
              <h3 className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                SIAN JOKE OF THE MOMENT
              </h3>
              <span className="text-3xl wiggle" style={{ animationDelay: '0.25s' }}>😆</span>
            </div>
            <p className="text-slate-300 text-lg italic">
              "{JOKES[currentJoke]}"
            </p>
            <div className="mt-4 text-slate-500 text-sm">
              Joke {currentJoke + 1} of {JOKES.length} • Auto-rotating every 5 seconds
            </div>
          </CardContent>
        </Card>

        {/* Love & Respect Message */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-pink-500/10 via-red-500/10 to-pink-500/10 border border-pink-500/20 rounded-lg p-6 sm:p-8">
            <div className="flex justify-center gap-2 mb-4">
              {['💕', '🌸', '💖', '🌸', '💕'].map((emoji, i) => (
                <span key={i} className="text-2xl" style={{ animation: `bounce-heart ${1 + i * 0.1}s ease-in-out infinite` }}>{emoji}</span>
              ))}
            </div>
            <h3 className="text-2xl font-bold text-pink-400 mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              WITH ALL OUR LOVE & RESPECT 💝
            </h3>
            <p className="text-slate-400 max-w-lg mx-auto mb-4">
              Sian, you're an absolute treasure to this community. Your hard work, patience, and dedication 
              never go unnoticed. Thank you for being YOU - the most fantastic mod we could ever ask for!
            </p>
            <div className="text-4xl">
              🎉🥳💐🏆👑💎🌟
            </div>
            <p className="text-pink-300 mt-4 font-semibold text-lg">
              We appreciate you more than words can say! 💗
            </p>
          </div>
        </div>

        {/* Secret Area Unlock Button */}
        {!secretUnlocked && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-rose-900/40 to-pink-900/40 hover:from-rose-800/50 hover:to-pink-800/50 border-2 border-rose-400/40 hover:border-rose-400/60 rounded-full px-8 py-4 transition-all duration-300 animate-glow"
              data-testid="unlock-secret-btn"
            >
              <div className="relative">
                <Heart className="w-8 h-8 text-rose-400 fill-rose-400/50 group-hover:scale-110 transition-transform" />
                <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-rose-300" />
              </div>
              <div className="text-left">
                <span className="block text-rose-200 font-bold text-lg">Something Extra Special</span>
                <span className="block text-rose-300/70 text-sm">Click to unlock with password</span>
              </div>
              <Sparkles className="w-5 h-5 text-rose-300 animate-pulse" />
            </button>
          </div>
        )}

        {/* Secret Content - Only shown when unlocked */}
        {secretUnlocked && <SecretContent />}

        {/* Easter Egg Message */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-8">
          <CardContent className="p-4 text-center">
            <p className="text-slate-500 text-sm italic">
              🤫 This secret page was created just for you, Sian! Only you can see this with your special login. 
              Consider it a small token of our immense appreciation! 🤫
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className="border-pink-500/30 text-pink-400 hover:text-pink-300 hover:border-pink-500/50 hover:bg-pink-500/10"
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
