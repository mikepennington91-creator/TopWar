import { useEffect, useMemo } from "react";
import { Shield, MessageCircle, Bug, Heart, Star, Award, Swords, Users, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  { icon: Bug, label: "Bug Hunter", desc: "First to report in-game issues", color: "text-amber-500" },
  { icon: Heart, label: "Community Pillar", desc: "Always polite, helpful and kind", color: "text-rose-400" },
  { icon: Users, label: "Team Player", desc: "Positive and collaborative spirit", color: "text-emerald-500" },
  { icon: Star, label: "Great Asset", desc: "Recognised as invaluable to the team", color: "text-amber-400" },
  { icon: Swords, label: "Event Ready", desc: "Reliable during big events", color: "text-sky-400" },
  { icon: MessageCircle, label: "Always Online", desc: "Happy to help anytime", color: "text-violet-400" },
];

const STATS = [
  { label: "Role", value: "Discord Mod" },
  { label: "Known For", value: "Bug Reporting" },
  { label: "Personality", value: "Kind & Polite" },
  { label: "Status", value: "Great Asset" },
];

function CherryBlossoms() {
  const petals = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      fontSize: `${0.5 + Math.random() * 0.8}rem`,
      animDelay: `-${Math.random() * 15}s`,
      duration: `${8 + Math.random() * 8}s`,
      opacity: 0.3 + Math.random() * 0.4,
      sway: `${20 + Math.random() * 40}px`,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute animate-petalfall"
          style={{
            left: p.left,
            fontSize: p.fontSize,
            animationDelay: p.animDelay,
            "--duration": p.duration,
            "--particle-opacity": p.opacity,
            "--sway-amount": p.sway,
            filter: "none",
          }}
        >
          {"\uD83C\uDF38"}
        </div>
      ))}
    </div>
  );
}

function QuoteCard({ text, author, index }) {
  return (
    <div
      data-testid={`quote-card-${index}`}
      className="glass-card p-8 rounded-lg hover:border-amber-500/50 transition-all duration-500 group"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex items-start gap-4">
        <MessageCircle className="w-8 h-8 text-amber-500 shrink-0 mt-1 opacity-60 group-hover:opacity-100 transition-opacity" />
        <div>
          <p className="text-slate-300 leading-relaxed text-lg italic">"{text}"</p>
          <p className="text-amber-500/70 mt-4 text-sm uppercase tracking-wider font-semibold" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            — {author}
          </p>
        </div>
      </div>
    </div>
  );
}

function AchievementBadge({ icon: Icon, label, desc, color, index }) {
  return (
    <div
      data-testid={`achievement-badge-${index}`}
      className="glass-card p-6 rounded-lg hover:border-amber-500/30 transition-all duration-300 text-center group"
    >
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700/50 group-hover:border-amber-500/40 transition-colors">
          <Icon className={`w-8 h-8 ${color} transition-transform group-hover:scale-110`} />
        </div>
      </div>
      <h4 className="text-lg font-bold uppercase tracking-wide text-slate-200 mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
        {label}
      </h4>
      <p className="text-slate-400 text-sm">{desc}</p>
    </div>
  );
}

export default function KyriosAppreciation() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture" data-testid="kyrios-appreciation-page">
      <CherryBlossoms />

      {/* Back nav */}
      <div className="fixed top-6 left-6 z-40">
        <button
          data-testid="back-button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-sm uppercase tracking-wider group"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${SAMURAI_AVATAR})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
            filter: "grayscale(100%) blur(2px)",
          }}
        />
        {/* Radial overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          {/* Avatar */}
          <div className="mb-8 flex justify-center" data-testid="kyrios-avatar">
            <div className="relative">
              <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-2xl shadow-amber-500/20">
                <img
                  src={SAMURAI_AVATAR}
                  alt="Kyrios Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Online ring */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Name */}
          <h1
            data-testid="kyrios-name"
            className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-2 text-amber-500"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            Kyrios
          </h1>

          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12 bg-amber-500/40" />
            <h2
              data-testid="kyrios-title"
              className="text-xl md:text-2xl font-semibold uppercase tracking-[0.25em] text-emerald-500"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              Discord Moderator
            </h2>
            <div className="h-px w-12 bg-amber-500/40" />
          </div>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            A knowledgeable and dedicated moderator — always first on the scene, always ready to help. Kyrios embodies what it means to be a true team player.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10" data-testid="stats-row">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                <p className="text-2xl md:text-3xl font-bold text-amber-500" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Quotes Section */}
      <section className="py-24 px-8 bg-slate-900/50" data-testid="quotes-section">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-16">
            <Award className="w-8 h-8 text-amber-500" />
            <h3
              data-testid="quotes-heading"
              className="text-4xl font-bold uppercase tracking-wider text-center text-amber-500"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              What The Team Says
            </h3>
          </div>
          <div className="space-y-6">
            {TEAM_QUOTES.map((quote, i) => (
              <QuoteCard key={i} {...quote} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 px-8" data-testid="achievements-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-16">
            <Star className="w-8 h-8 text-amber-500" />
            <h3
              data-testid="achievements-heading"
              className="text-4xl font-bold uppercase tracking-wider text-center text-amber-500"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              Achievements Unlocked
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {ACHIEVEMENTS.map((ach, i) => (
              <AchievementBadge key={i} {...ach} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Fun Facts Section */}
      <section className="py-24 px-8 bg-slate-900/50" data-testid="fun-facts-section">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-16">
            <Swords className="w-8 h-8 text-amber-500" />
            <h3
              data-testid="fun-facts-heading"
              className="text-4xl font-bold uppercase tracking-wider text-center text-amber-500"
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              Intel Report
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-lg" data-testid="fun-fact-0">
              <h4 className="text-lg font-bold uppercase tracking-wide text-emerald-500 mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                Bug Detection Specialist
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Known as one of the first to always report in-game issues. If there's a bug, Kyrios has probably already filed it.
              </p>
            </div>
            <div className="glass-card p-6 rounded-lg" data-testid="fun-fact-1">
              <h4 className="text-lg font-bold uppercase tracking-wide text-emerald-500 mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                Event Veteran
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Whether it's a small question or a server-wide event, Kyrios is always there lending a hand. Reliability is his middle name.
              </p>
            </div>
            <div className="glass-card p-6 rounded-lg" data-testid="fun-fact-2">
              <h4 className="text-lg font-bold uppercase tracking-wide text-emerald-500 mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                The Samurai Spirit
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Rocking a samurai avatar that perfectly reflects his disciplined, honourable approach to moderation. Bushido runs through his veins.
              </p>
            </div>
            <div className="glass-card p-6 rounded-lg" data-testid="fun-fact-3">
              <h4 className="text-lg font-bold uppercase tracking-wide text-emerald-500 mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                Knowledge Base Walking
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Described as a knowledgeable mod, Kyrios is the go-to person when you need answers. Think of him as the team's walking encyclopedia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 text-center border-t border-slate-800/50" data-testid="appreciation-footer">
        <Shield className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-400 text-sm uppercase tracking-[0.2em]" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          Top War Mod Team — Team Appreciation
        </p>
        <p className="text-slate-500 text-xs mt-2">Thank you, Kyrios, for everything you do.</p>
      </footer>
    </div>
  );
}
