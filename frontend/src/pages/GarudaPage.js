import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Youtube, 
  Users, 
  Server, 
  Calendar, 
  MessageCircle, 
  Star,
  Trophy,
  Heart,
  Globe,
  ArrowLeft
} from "lucide-react";

const CONTRIBUTIONS = [
  {
    icon: Users,
    title: "Team Support",
    description: "Always around to support the team and help fellow members succeed",
    color: "amber"
  },
  {
    icon: Server,
    title: "Server Building",
    description: "Dedicated effort in building and maintaining server infrastructure",
    color: "blue"
  },
  {
    icon: Trophy,
    title: "Recruitment",
    description: "Active in recruitment efforts to grow and strengthen the community",
    color: "green"
  },
  {
    icon: Calendar,
    title: "Event Planning",
    description: "Key participant in big event planning and coordination",
    color: "purple"
  },
  {
    icon: Youtube,
    title: "Content Creator",
    description: "Creating YouTube gameplay videos to help and entertain the community",
    color: "red"
  },
  {
    icon: Globe,
    title: "Indian Community Support",
    description: "Dedicated to supporting Indian players with game-related questions",
    color: "orange"
  }
];

const getColorClasses = (color) => {
  const colors = {
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400"
  };
  return colors[color] || colors.amber;
};

export default function GarudaPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes pulse-gold {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          .float-1 { animation: float 6s ease-in-out infinite; }
          .float-2 { animation: float 8s ease-in-out infinite 1s; }
          .float-3 { animation: float 7s ease-in-out infinite 2s; }
          .pulse-gold { animation: pulse-gold 3s ease-in-out infinite; }
          .shimmer-text {
            background: linear-gradient(
              90deg,
              #f59e0b 0%,
              #fbbf24 25%,
              #fcd34d 50%,
              #fbbf24 75%,
              #f59e0b 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s linear infinite;
          }
        `}
      </style>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl float-1" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl float-2" />
      <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-yellow-500/10 rounded-full blur-3xl float-3" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 mb-4">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium uppercase tracking-wider">Community Champion</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          
          {/* Eagle/Garuda Icon */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border-2 border-amber-500/30 pulse-gold">
              <span className="text-5xl sm:text-6xl">🦅</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold mb-2 shimmer-text" 
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            GARUDA
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto">
            A pillar of the Top War community - supporting, building, and inspiring
          </p>
        </div>

        {/* Quote Card */}
        <Card className="bg-gradient-to-r from-amber-950/30 via-slate-900/50 to-amber-950/30 border-amber-500/20 mb-8 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8 text-center">
            <MessageCircle className="w-8 h-8 text-amber-400 mx-auto mb-4 opacity-50" />
            <blockquote className="text-lg sm:text-xl text-slate-300 italic leading-relaxed">
              "I am known for being around and supporting the team, building servers, recruitment, 
              and actively participating in big event planning. Creating YouTube videos for gameplay. 
              More of supporting Indian players for questions related to the game."
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-amber-400 font-medium">— Garuda</span>
              <Heart className="w-4 h-4 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Contributions Grid */}
        <h2 className="text-2xl font-bold text-center text-amber-400 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          🏆 CONTRIBUTIONS & ACHIEVEMENTS
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CONTRIBUTIONS.map((item, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-to-br ${getColorClasses(item.color)} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-200">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* YouTube Section */}
        <Card className="bg-gradient-to-r from-red-950/30 via-slate-900/50 to-red-950/30 border-red-500/20 mb-8 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/30">
                  <Youtube className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  📺 YOUTUBE CHANNEL
                </h3>
                <p className="text-slate-400 mb-4">
                  Check out Garuda's gameplay videos, strategies, and Top War content!
                </p>
                <a 
                  href="https://youtube.com/@garudatopwar?si=agidpCU46DFjVwDF" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2"
                  >
                    <Youtube className="w-5 h-5" />
                    Visit Channel
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-lg p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-amber-400 mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              🙏 THANK YOU, GARUDA!
            </h3>
            <p className="text-slate-400 max-w-lg mx-auto">
              Your dedication to the community doesn't go unnoticed. 
              Thank you for being an amazing part of our Top War family!
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {['⭐', '🦅', '🎮', '🏆', '💪'].map((emoji, i) => (
                <span key={i} className="text-2xl">{emoji}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
