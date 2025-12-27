import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Swords, 
  Zap, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Rocket,
  Target,
  Flame,
  Skull,
  Crown,
  Star,
  Handshake
} from "lucide-react";

// Fake upcoming heroes data
const UPCOMING_HEROES = [
  {
    name: "Shadow Reaper",
    type: "SSR",
    class: "Assassin",
    ability: "Phase Strike - Teleport behind enemy and deal damage directly to back row of units",
    releaseDate: "Q1 2026",
    icon: Skull,
    color: "purple"
  },
  {
    name: "Storm Titan",
    type: "SSSR",
    class: "Tank",
    ability: "Thunder Aegis - Absorb 80% damage and reflect as lightning",
    releaseDate: "Q2 2026",
    icon: Zap,
    color: "blue"
  },
  {
    name: "Phoenix Queen",
    type: "SSR",
    class: "Support",
    ability: "Rebirth Flame - Revive fallen units with 50% of stack health",
    releaseDate: "Q1 2026",
    icon: Flame,
    color: "orange"
  },
  {
    name: "Void Emperor",
    type: "SSSR",
    class: "Mage",
    ability: "Reality Tear - Create black hole dealing 600% AoE damage",
    releaseDate: "Q3 2026",
    icon: Crown,
    color: "violet"
  }
];

// Fake heavy troopers data
const HEAVY_TROOPERS = [
  {
    name: "Siege Breaker MK-IV",
    stats: { attack: 2850, defense: 3200, speed: 45 },
    special: "Fortification Destroyer - +200% damage vs buildings",
    status: "In Testing"
  },
  {
    name: "Plasma Artillery Unit",
    stats: { attack: 4200, defense: 1800, speed: 25 },
    special: "Ion Bombardment - Long range AoE with burn effect",
    status: "Final Review"
  },
  {
    name: "Stealth Mech Alpha",
    stats: { attack: 3100, defense: 2400, speed: 85 },
    special: "Cloaking Field - Invisible for first 10 seconds of battle",
    status: "Concept"
  }
];

// Fake game mechanics
const GAME_MECHANICS = [
  {
    name: "Alliance Wars 2.0",
    description: "Cross-server alliance battles with territory control. Capture zones to gain resource bonuses.",
    status: "Development",
    eta: "March 2026"
  },
  {
    name: "Dynamic Weather System",
    description: "Rain affects air unit accuracy. Snow reduces land unit attack speed. Fog reduces naval crit rate.",
    status: "Testing",
    eta: "Q2 2026"
  },
  {
    name: "Mercenary System",
    description: "Hire NPC commanders for temporary boosts. Cost scales with power level.",
    status: "Approved",
    eta: "January 2026"
  }
];

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'in testing':
    case 'testing':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'final review':
    case 'approved':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'concept':
    case 'design phase':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'development':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case 'sssr':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    case 'ssr':
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
};

export default function DevSecrets() {
  const navigate = useNavigate();
  const [revealedSections, setRevealedSections] = useState({
    heroes: false,
    troopers: false,
    mechanics: false
  });

  const toggleReveal = (section) => {
    setRevealedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background grid */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          @keyframes scan-line {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          .grid-bg {
            background-image: 
              linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
          }
          .scan-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), transparent);
            animation: scan-line 4s linear infinite;
          }
        `}
      </style>

      {/* Background effects */}
      <div className="absolute inset-0 grid-bg" />
      <div className="scan-line" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-red-400 text-sm font-mono uppercase tracking-wider">Classified Information</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 mb-2" 
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            🔐 DEVELOPER ACCESS
          </h1>
          <p className="text-slate-500 font-mono text-sm">CLEARANCE LEVEL: MAXIMUM</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 border border-red-500/20 rounded-lg p-4 mb-8 text-center">
          <Lock className="w-5 h-5 inline-block text-red-400 mr-2" />
          <span className="text-red-300 text-sm">This information is for authorized personnel only. Unauthorized disclosure is prohibited.</span>
        </div>

        {/* Upcoming Heroes Section */}
        <Card className="bg-slate-900/80 border-purple-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-xl text-purple-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                UPCOMING HEROES
              </CardTitle>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">UNRELEASED</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleReveal('heroes')}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              {revealedSections.heroes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.heroes ? 'Hide' : 'Reveal'}
            </Button>
          </CardHeader>
          {revealedSections.heroes && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {UPCOMING_HEROES.map((hero, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <hero.icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-200">{hero.name}</h3>
                          <p className="text-xs text-slate-500">{hero.class}</p>
                        </div>
                      </div>
                      <Badge className={getTypeColor(hero.type)}>{hero.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2"><Zap className="w-3 h-3 inline mr-1 text-yellow-400" />{hero.ability}</p>
                    <p className="text-xs text-slate-500">📅 Expected: {hero.releaseDate}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Heavy Troopers Section */}
        <Card className="bg-slate-900/80 border-orange-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-orange-400" />
              <CardTitle className="text-xl text-orange-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                NEW HEAVY TROOPERS
              </CardTitle>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">BETA</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleReveal('troopers')}
              className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            >
              {revealedSections.troopers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.troopers ? 'Hide' : 'Reveal'}
            </Button>
          </CardHeader>
          {revealedSections.troopers && (
            <CardContent>
              <div className="space-y-4">
                {HEAVY_TROOPERS.map((trooper, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-orange-400" />
                        <h3 className="font-bold text-slate-200">{trooper.name}</h3>
                      </div>
                      <Badge className={getStatusColor(trooper.status)}>{trooper.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-red-500/10 rounded">
                        <p className="text-xs text-slate-500">ATK</p>
                        <p className="text-lg font-bold text-red-400">{trooper.stats.attack}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-500/10 rounded">
                        <p className="text-xs text-slate-500">DEF</p>
                        <p className="text-lg font-bold text-blue-400">{trooper.stats.defense}</p>
                      </div>
                      <div className="text-center p-2 bg-green-500/10 rounded">
                        <p className="text-xs text-slate-500">SPD</p>
                        <p className="text-lg font-bold text-green-400">{trooper.stats.speed}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400"><Star className="w-3 h-3 inline mr-1 text-yellow-400" />{trooper.special}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Game Mechanics Section */}
        <Card className="bg-slate-900/80 border-cyan-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-cyan-400" />
              <CardTitle className="text-xl text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                UPCOMING GAME MECHANICS
              </CardTitle>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">ROADMAP</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => toggleReveal('mechanics')}
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              {revealedSections.mechanics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.mechanics ? 'Hide' : 'Reveal'}
            </Button>
          </CardHeader>
          {revealedSections.mechanics && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GAME_MECHANICS.map((mechanic, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-200">{mechanic.name}</h3>
                      <Badge className={getStatusColor(mechanic.status)}>{mechanic.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{mechanic.description}</p>
                    <p className="text-xs text-cyan-400 font-mono">🚀 ETA: {mechanic.eta}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-xs font-mono mb-4">SESSION ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          >
            <Lock className="w-4 h-4 mr-2" />
            Exit Secure Area
          </Button>
        </div>
      </div>
    </div>
  );
}
