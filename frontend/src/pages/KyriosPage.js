import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  MessageCircle, 
  Bug, 
  Heart, 
  Star, 
  Swords, 
  Users, 
  ArrowLeft,
  Award
} from "lucide-react";

const SAMURAI_AVATAR = "https://images.pexels.com/photos/29145665/pexels-photo-29145665.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const TEAM_QUOTES = [
  {
    text: "Kyrios is a knowledgable mod who is always happy to help. He is one of the first to always report ingame issues which players come across. He is always polite, helpful and kind. A great asset to our mod team.",
    author: "The Team",
  },
  {
    text: "Always helpful, whether for small stuff or during big events.",
    author: "Team Member",
  },
  {
    text: "Positive team player.",
    author: "Team Member",
  },
];

const ACHIEVEMENTS = [
  { icon: Bug, label: "Bug Hunter", desc: "First to report in-game issues", color: "amber" },
  { icon: Heart, label: "Community Pillar", desc: "Always polite, helpful and kind", color: "red" },
  { icon: Users, label: "Team Player", desc: "Positive and collaborative spirit", color: "green" },
  { icon: Star, label: "Great Asset", desc: "Recognised as invaluable to the team", color: "yellow" },
  { icon: Swords, label: "Event Ready", desc: "Reliable during big events", color: "blue" },
  { icon: MessageCircle, label: "Always Online", desc: "Happy to help anytime", color: "purple" },
];

const KYRIOS_FACTS = [
  "If there's a bug, Kyrios has probably already reported it before you even noticed it",
  "Known for being one of the first to flag in-game issues players encounter",
  "Can spot a glitch faster than most people can spot a typo",
  "His politeness level is permanently set to maximum",
  "Rumour has it he has a sixth sense for bugs",
  "The mod team's very own quality assurance department"
];

const INTEL_CARDS = [
  {
    title: "Bug Detection Specialist",
    desc: "Known as one of the first to always report in-game issues. If there's a bug, Kyrios has probably already filed it.",
    color: "amber"
  },
  {
    title: "Event Veteran",
    desc: "Whether it's a small question or a server-wide event, Kyrios is always there lending a hand. Reliability is his middle name.",
    color: "blue"
  },
  {
    title: "The Samurai Spirit",
    desc: "Rocking a samurai avatar that perfectly reflects his disciplined, honourable approach to moderation. Bushido runs through his veins.",
    color: "purple"
  },
  {
    title: "Knowledge Base Walking",
    desc: "Described as a knowledgeable mod, Kyrios is the go-to person when you need answers. Think of him as the team's walking encyclopedia.",
    color: "green"
  }
];

const getColorClasses = (color) => {
  const colors = {
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400"
  };
  return colors[color] || colors.amber;
};

function useScrollReveal(threshold = 0.15) {
  const observe = useCallback((node) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );
    observer.observe(node);
  }, [threshold]);
  return observe;
}

export default function KyriosPage() {
  const navigate = useNavigate();
  const [currentFact, setCurrentFact] = useState(0);

  const revealQuotesHeading = useScrollReveal();
  const revealAchHeading = useScrollReveal();
  const revealIntelHeading = useScrollReveal();
  const revealThankYou = useScrollReveal();

  // Rotate facts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % KYRIOS_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden" data-testid="kyrios-appreciation-page">
      <Helmet>
        <title>Kyrios — Top War Discord Moderator</title>
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Kyrios — Top War Discord Moderator" />
        <meta property="og:description" content="A knowledgeable and dedicated moderator — always first on the scene, always ready to help. Kyrios embodies what it means to be a true team player." />
        <meta property="og:image" content={SAMURAI_AVATAR} />
        <meta property="og:site_name" content="TW Applications" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kyrios — Top War Discord Moderator" />
        <meta name="twitter:description" content="A knowledgeable and dedicated moderator — always first on the scene, always ready to help." />
        <meta name="twitter:image" content={SAMURAI_AVATAR} />
      </Helmet>

      {/* Animations */}
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
          @keyframes katana-slash {
            0% { transform: rotate(-45deg) scale(0.8); opacity: 0; }
            50% { transform: rotate(0deg) scale(1.1); opacity: 1; }
            100% { transform: rotate(5deg) scale(1); opacity: 1; }
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
          .katana-entrance { animation: katana-slash 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

          /* Scroll reveal */
          .reveal {
            opacity: 0;
            transform: translateY(32px);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .reveal.visible {
            opacity: 1;
            transform: translateY(0);
          }
          .reveal-scale {
            opacity: 0;
            transform: scale(0.88);
            transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .reveal-scale.visible {
            opacity: 1;
            transform: scale(1);
          }
          .reveal-left {
            opacity: 0;
            transform: translateX(-32px);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .reveal-left.visible {
            opacity: 1;
            transform: translateX(0);
          }
          .reveal-right {
            opacity: 0;
            transform: translateX(32px);
            transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                        transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .reveal-right.visible {
            opacity: 1;
            transform: translateX(0);
          }
        `}
      </style>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl float-1" />
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl float-2" />
      <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-amber-500/8 rounded-full blur-3xl float-3" />
      <div className="absolute bottom-40 right-10 w-28 h-28 bg-blue-500/8 rounded-full blur-3xl float-1" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 mb-4" data-testid="role-badge">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium uppercase tracking-wider">Discord Moderator</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          
          {/* Samurai Avatar */}
          <div className="relative inline-block mb-6" data-testid="kyrios-avatar">
            <div className="w-32 h-32 sm:w-44 sm:h-44 mx-auto rounded-full overflow-hidden border-4 border-amber-500/40 pulse-gold shadow-2xl shadow-amber-500/20">
              <img
                src={SAMURAI_AVATAR}
                alt="Kyrios Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-7 h-7 bg-emerald-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold mb-2 shimmer-text" 
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
              data-testid="kyrios-name">
            KYRIOS
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto" data-testid="kyrios-tagline">
            A knowledgeable and dedicated moderator — always first on the scene, always ready to help
          </p>
        </div>

        {/* Main Team Quote */}
        <Card className="bg-gradient-to-r from-amber-950/30 via-slate-900/50 to-amber-950/30 border-amber-500/20 mb-8 backdrop-blur-sm" data-testid="main-quote-card">
          <CardContent className="p-6 sm:p-8 text-center">
            <MessageCircle className="w-8 h-8 text-amber-400 mx-auto mb-4 opacity-50" />
            <blockquote className="text-lg sm:text-xl text-slate-300 italic leading-relaxed">
              "{TEAM_QUOTES[0].text}"
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-amber-400 font-medium">— {TEAM_QUOTES[0].author}</span>
              <Heart className="w-4 h-4 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Additional Quotes */}
        <div ref={revealQuotesHeading} className="reveal">
          <h2 className="text-2xl font-bold text-center text-amber-400 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }} data-testid="quotes-heading">
            <Award className="w-6 h-6 inline-block mr-2 mb-1" />
            WHAT THE TEAM SAYS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {TEAM_QUOTES.slice(1).map((quote, i) => (
              <QuoteCard key={i} quote={quote} index={i} />
            ))}
          </div>
        </div>

        {/* Rotating Fun Facts */}
        <Card className="bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-emerald-950/30 border-emerald-500/20 mb-8 backdrop-blur-sm" data-testid="fun-facts-card">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bug className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-emerald-400">Kyrios Fact #{currentFact + 1}</h3>
            </div>
            <p className="text-slate-300 text-lg transition-all duration-500" data-testid="current-fact">
              {KYRIOS_FACTS[currentFact]}
            </p>
            <div className="mt-3 text-slate-500 text-sm">
              Fact {currentFact + 1} of {KYRIOS_FACTS.length}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Grid */}
        <div ref={revealAchHeading} className="reveal">
          <h2 className="text-2xl font-bold text-center text-amber-400 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }} data-testid="achievements-heading">
            <Star className="w-6 h-6 inline-block mr-2 mb-1" />
            ACHIEVEMENTS UNLOCKED
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {ACHIEVEMENTS.map((item, index) => (
              <AchievementCard key={index} item={item} index={index} />
            ))}
          </div>
        </div>

        {/* Intel Report */}
        <div ref={revealIntelHeading} className="reveal">
          <h2 className="text-2xl font-bold text-center text-amber-400 mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }} data-testid="intel-heading">
            <Swords className="w-6 h-6 inline-block mr-2 mb-1" />
            INTEL REPORT
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {INTEL_CARDS.map((card, index) => (
              <IntelCard key={index} card={card} index={index} />
            ))}
          </div>
        </div>

        {/* Thank You Message */}
        <div ref={revealThankYou} className="reveal text-center mb-8" data-testid="thank-you-section">
          <div className="inline-block bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-500/20 rounded-lg p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-amber-400 mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              THANK YOU, KYRIOS!
            </h3>
            <p className="text-slate-400 max-w-lg mx-auto">
              Your dedication, knowledge, and kindness don't go unnoticed. 
              Thank you for being an amazing part of our mod team — we'd be lost without you!
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {['⚔️', '🛡️', '🎮', '🏆', '💪', '⭐'].map((emoji, i) => (
                <span key={i} className="text-2xl">{emoji}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center" data-testid="appreciation-footer">
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/10"
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

function QuoteCard({ quote, index }) {
  const reveal = useScrollReveal(0.2);
  return (
    <Card 
      ref={reveal}
      className={`reveal-scale bg-gradient-to-br from-amber-950/20 to-slate-900/50 border-amber-500/20 backdrop-blur-sm`}
      style={{ transitionDelay: `${index * 100}ms` }}
      data-testid={`quote-card-${index}`}
    >
      <CardContent className="p-5">
        <MessageCircle className="w-5 h-5 text-amber-400 mb-3 opacity-50" />
        <p className="text-slate-300 italic leading-relaxed">"{quote.text}"</p>
        <p className="text-amber-400/70 mt-3 text-sm font-medium">— {quote.author}</p>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ item, index }) {
  const reveal = useScrollReveal(0.15);
  return (
    <Card 
      ref={reveal}
      className={`reveal-scale bg-gradient-to-br ${getColorClasses(item.color)} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
      style={{ transitionDelay: `${index * 80}ms` }}
      data-testid={`achievement-badge-${index}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center">
            <item.icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200">{item.label}</h3>
        </div>
        <p className="text-sm text-slate-400">{item.desc}</p>
      </CardContent>
    </Card>
  );
}

function IntelCard({ card, index }) {
  const reveal = useScrollReveal(0.2);
  const direction = index % 2 === 0 ? "reveal-left" : "reveal-right";
  return (
    <Card 
      ref={reveal}
      className={`${direction} bg-gradient-to-br ${getColorClasses(card.color)} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}
      style={{ transitionDelay: `${index * 100}ms` }}
      data-testid={`fun-fact-${index}`}
    >
      <CardContent className="p-5">
        <h4 className="font-bold text-slate-200 mb-2 uppercase tracking-wide text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {card.title}
        </h4>
        <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
      </CardContent>
    </Card>
  );
}
