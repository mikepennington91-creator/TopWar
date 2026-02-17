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
  MessageCircle,
  ArrowLeft,
  RefreshCw,
  Smile,
  Trophy,
  Users,
  Shield
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
  "Why did Sian cross the road? To moderate the chicken's behavior! 🐔",
  "Sian doesn't read the rules - the rules read themselves to her! 📜",
  "When Sian enters a chat, spam runs away crying 😭",
  "Legends say Sian once moderated a server so well, it moderated itself forever after ✨",
  "Sian's ban hammer is made of pure compassion wrapped in justice ⚖️",
  "Scientists are still trying to figure out how Sian is everywhere at once 🔬"
];

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

export default function SianPage() {
  const navigate = useNavigate();
  const [currentJoke, setCurrentJoke] = useState(0);
  const [currentFact, setCurrentFact] = useState(0);
  const [cartoonImage, setCartoonImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [showHearts, setShowHearts] = useState([]);

  // Generate cartoon image on load
  useEffect(() => {
    const generateCartoonImage = async () => {
      try {
        const response = await axios.post(`${API}/images/generate`, {
          prompt: "A fun cartoon-style portrait illustration of a friendly young woman with long light brown/blonde hair, blue-green eyes, warm smile, in a colorful illustrated style with hearts and stars around her, cheerful and vibrant colors, digital art illustration style, cute and wholesome aesthetic"
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
        `}
      </style>

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
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
