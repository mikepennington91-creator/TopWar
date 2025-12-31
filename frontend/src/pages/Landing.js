import { useNavigate } from "react-router-dom";
import { Shield, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import HolidayOverlay from "@/components/HolidayOverlay";
import SeasonalOverlay from "@/components/SeasonalOverlay";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 grid-texture pt-12">
      {/* Holiday Animation Overlay (overrides seasonal when active) */}
      <HolidayOverlay />
      {/* Seasonal Animation Overlay */}
      <SeasonalOverlay />
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1704229266209-47d8d6ad0c46?crop=entropy&cs=srgb&fm=jpg&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            filter: 'grayscale(100%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="mb-8">
            <Shield className="w-20 h-20 mx-auto text-amber-500 mb-6" />
            <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              TOP WAR
            </h1>
            <h2 className="text-3xl md:text-5xl font-semibold uppercase tracking-wider mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Moderator Recruitment
            </h2>
          </div>

          <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join our elite moderation team. Help maintain order, enforce community guidelines, and shape the future of Top War's player experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              data-testid="apply-now-btn"
              onClick={() => navigate('/apply')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wide px-8 py-6 text-lg rounded-sm btn-glow"
            >
              Apply Now
            </Button>
            <Button
              data-testid="moderator-login-btn"
              onClick={() => navigate('/moderator/login')}
              variant="outline"
              className="border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 font-bold uppercase tracking-wide px-8 py-6 text-lg rounded-sm"
            >
              Moderator Login
            </Button>
          </div>
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
