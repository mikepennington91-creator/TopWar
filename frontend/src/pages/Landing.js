import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Shield, Users, CheckCircle, ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HolidayOverlay from "@/components/HolidayOverlay";
import SeasonalOverlay from "@/components/SeasonalOverlay";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture">
      <Helmet>
        <title>Top War — Moderator Recruitment Portal</title>
        <meta name="description" content="Top War Moderator Applications Portal — Apply to join the moderation team, manage server assignments, track community polls, and access moderator tools for Top War." />
        <meta property="og:title" content="Top War — Moderator Recruitment Portal" />
        <meta property="og:description" content="Join the Top War moderation team. Apply online, manage server assignments, vote in community polls, and help shape the player experience." />
      </Helmet>
      {/* Holiday Animation Overlay (overrides seasonal when active) */}
      <HolidayOverlay />
      {/* Seasonal Animation Overlay */}
      <SeasonalOverlay />
      
      {/* Hero Section */}
      <div className="hero-glow relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1704229266209-47d8d6ad0c46?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
            filter: 'grayscale(100%) contrast(120%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <div className="mb-8">
            <span className="eyebrow mb-8"><Sparkles className="w-3.5 h-3.5" /> Community operations</span>
            <div className="brand-mark !w-16 !h-16 !rounded-2xl mx-auto mb-7"><Shield className="w-8 h-8" /></div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5 text-white leading-[0.95]">
              Lead the community.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-400 to-amber-300">Shape the game.</span>
            </h1>
            <h2 className="text-sm md:text-base font-bold uppercase tracking-[0.28em] text-slate-400">Top War Moderator Recruitment</h2>
          </div>

          <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            Join the team that keeps Top War welcoming, fair and fun. Support players, solve problems and help build a stronger global community.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              data-testid="apply-now-btn"
              onClick={() => navigate('/apply')}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-8 py-6 text-base rounded-lg shadow-xl shadow-sky-500/20"
            >
              Apply now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              data-testid="moderator-login-btn"
              onClick={() => navigate('/moderator/login')}
              variant="outline"
              className="border border-slate-600 bg-slate-900/40 text-slate-100 hover:bg-slate-800/80 font-bold px-8 py-6 text-base rounded-lg"
            >
              Moderator Login
            </Button>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-slate-300 md:hidden pointer-events-none">
          <p className="text-xs uppercase tracking-[0.2em]">More details below</p>
          <ChevronDown className="w-5 h-5 text-amber-500 animate-bounce" />
        </div>
      </div>

      {/* Mission Brief Section */}
      <div className="py-24 px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold uppercase tracking-wider text-center mb-16 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Mission Brief
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-lg hover:border-amber-500/50 transition-all duration-300">
              <Shield className="w-12 h-12 text-amber-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Enforce Guidelines
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Maintain community standards and ensure all players follow the rules. Your authority shapes the battlefield.
              </p>
            </div>

            <div className="glass-card p-8 rounded-lg hover:border-emerald-500/50 transition-all duration-300">
              <Users className="w-12 h-12 text-emerald-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Support Players
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Guide new recruits, answer questions, and create a welcoming environment for the Top War community.
              </p>
            </div>

            <div className="glass-card p-8 rounded-lg hover:border-amber-500/50 transition-all duration-300">
              <CheckCircle className="w-12 h-12 text-amber-500 mb-4" />
              <h4 className="text-2xl font-semibold uppercase tracking-wide mb-3" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Resolve Conflicts
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Handle disputes professionally, mediate conflicts, and maintain peace across all servers and channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
