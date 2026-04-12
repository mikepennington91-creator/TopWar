import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Handshake,
  FlaskConical,
  Atom,
  Microscope,
  Bomb,
  Radiation,
  BrainCircuit,
  Beaker,
  ChevronDown,
  Languages,
  Image as ImageIcon,
  PartyPopper,
  ShieldAlert,
  Timer
} from "lucide-react";

// ── April Fools Time Gate ──
// April 1st 2026, 12:00 PM BST = 11:00 UTC
const APRIL_FOOLS_TRIGGER = new Date("2026-04-01T11:00:00Z").getTime();

function isAprilFoolsRevealed() {
  // Allow ?testreveal=1 in URL to preview the reveal animation
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("testreveal") === "1") return true;
  return Date.now() >= APRIL_FOOLS_TRIGGER;
}

// ── Confetti Particle Component ──
function ConfettiCanvas() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#ff0", "#f0f", "#0ff", "#f00", "#0f0", "#ff8800", "#ff00aa", "#00ff88", "#8800ff", "#fff"];
    const shapes = ["rect", "circle", "strip"];

    // Create 200 confetti particles
    for (let i = 0; i < 200; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        vy: Math.random() * 3 + 1.5,
        vx: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        opacity: Math.random() * 0.5 + 0.5
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles.current) {
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === "circle") {
          ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -1, p.w, 2);
        }
        ctx.restore();
      }
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", handleResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ── April Fools Reveal Page ──
function AprilFoolsReveal({ onViewAnyway }) {
  const [phase, setPhase] = useState(0); // 0=breach, 1=glitch, 2=reveal
  const [elapsed, setElapsed] = useState("");

  // Animate through phases
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2500);  // glitch after 2.5s
    const t2 = setTimeout(() => setPhase(2), 4000);  // reveal after 4s
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Elapsed timer
  const updateElapsed = useCallback(() => {
    const diff = Date.now() - APRIL_FOOLS_TRIGGER;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    setElapsed(`${hrs}h ${mins}m ${secs}s`);
  }, []);

  useEffect(() => {
    updateElapsed();
    const iv = setInterval(updateElapsed, 1000);
    return () => clearInterval(iv);
  }, [updateElapsed]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes breach-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes glitch-text {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); filter: hue-rotate(90deg); }
          40% { transform: translate(3px, -3px); filter: hue-rotate(180deg); }
          60% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); }
          80% { transform: translate(2px, 2px); filter: hue-rotate(360deg); }
          100% { transform: translate(0); }
        }
        @keyframes glitch-clip {
          0% { clip-path: inset(0 0 90% 0); }
          10% { clip-path: inset(20% 0 60% 0); }
          20% { clip-path: inset(50% 0 20% 0); }
          30% { clip-path: inset(10% 0 70% 0); }
          40% { clip-path: inset(80% 0 0 0); }
          50% { clip-path: inset(30% 0 30% 0); }
          60% { clip-path: inset(0 0 50% 0); }
          70% { clip-path: inset(60% 0 10% 0); }
          80% { clip-path: inset(0 0 0 0); }
          90% { clip-path: inset(40% 0 40% 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes slam-in {
          0% { transform: scale(3) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          80% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .glitch-active {
          animation: glitch-text 0.15s infinite;
        }
        .glitch-clip {
          animation: glitch-clip 0.3s steps(1) infinite;
        }
      `}</style>

      {/* Phase 0: Security Breach Warning */}
      {phase === 0 && (
        <div className="text-center" style={{ animation: 'breach-flash 0.5s ease-in-out infinite' }}>
          <ShieldAlert className="w-24 h-24 mx-auto text-red-500 mb-6" />
          <h1 className="text-4xl sm:text-6xl font-bold text-red-500 uppercase tracking-widest mb-4 font-mono">
            SECURITY BREACH
          </h1>
          <p className="text-red-400 text-xl font-mono animate-pulse">DETECTING INTRUSION...</p>
          <div className="mt-6 flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-red-500 rounded-full animate-ping" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Phase 1: Glitch Transition */}
      {phase === 1 && (
        <div className="text-center glitch-active">
          <h1 className="text-4xl sm:text-6xl font-bold text-red-500 uppercase tracking-widest font-mono glitch-clip">
            SYS_ERROR_0x04_01
          </h1>
          <div className="mt-4 text-green-400 font-mono text-sm glitch-clip">
            <p>OVERRIDE DETECTED... RECALIBRATING...</p>
            <p>PAYLOAD: april_fools.exe</p>
            <p>STATUS: DEPLOYING...</p>
          </div>
        </div>
      )}

      {/* Phase 2: The Big Reveal */}
      {phase === 2 && (
        <>
          <ConfettiCanvas />
          <div className="relative z-50 text-center px-4 max-w-3xl mx-auto">
            {/* Main Title */}
            <div style={{ animation: 'slam-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
              <PartyPopper className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-400 mb-4" />
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-2" style={{
                background: 'linear-gradient(90deg, #ff0, #f0f, #0ff, #0f0, #ff0)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 2s linear infinite'
              }}>
                APRIL FOOLS!
              </h1>
              <h2 className="text-3xl sm:text-5xl font-bold text-yellow-300 mb-6">
                愚人节快乐!
              </h2>
            </div>

            {/* Cheeky Message */}
            <div style={{ animation: 'float-up 0.8s ease-out 0.3s both' }}>
              <p className="text-lg sm:text-xl text-slate-300 mb-2 leading-relaxed">
                You didn't <em>really</em> think we'd leak our entire
              </p>
              <p className="text-lg sm:text-xl text-slate-300 mb-6 leading-relaxed">
                development roadmap in Chinese, did you?
              </p>
            </div>

            {/* Timer */}
            <div style={{ animation: 'float-up 0.8s ease-out 0.6s both' }}>
              <div className="inline-flex items-center gap-3 bg-slate-800/80 border border-yellow-500/30 rounded-full px-6 py-3 mb-8">
                <Timer className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-mono text-sm">PRANK LIVE FOR: {elapsed}</span>
              </div>
            </div>

            {/* Credits */}
            <div style={{ animation: 'float-up 0.8s ease-out 0.9s both' }}>
              <p className="text-slate-500 text-sm mb-8 italic">
                None of the heroes, troopers, skills, or collaborations are real.
                <br />
                But you have to admit... the IKEA one was tempting.
              </p>
            </div>

            {/* View Anyway Button */}
            <div style={{ animation: 'float-up 0.8s ease-out 1.2s both' }}>
              <Button
                onClick={onViewAnyway}
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 px-8 py-6 text-lg"
                data-testid="view-anyway-btn"
              >
                <Eye className="w-5 h-5 mr-2" />
                View the "Roadmap" Anyway
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Translations ──
const T = {
  zh: {
    classified: "机密信息",
    title: "🔐 开发者权限",
    clearance: "权限等级：最高",
    warning: "此信息仅供授权人员查看。未经授权的披露将被追究。",
    hide: "隐藏",
    reveal: "显示",
    unreleased: "未发布",
    beta: "测试版",
    roadmap: "路线图",
    topSecret: "绝密",
    newPath: "新路径",
    // Skill tree
    skillTreeTitle: "超级科学家技能树",
    tier: "层级",
    foundation: "基础",
    appliedSciences: "应用科学",
    quantumResearch: "量子研究",
    finalPerk: "终极技能",
    ultimate: "终极",
    unlocked: "已解锁",
    shieldPenetration: "护盾穿透：在护盾剩余时间低于50%时激活",
    skillTreeSummary: "是一个4层级的进阶路径，专注于研究优势和武器技术。终极技能",
    skillTreeSummary2: "会部署一枚弹头，当目标的护盾剩余时间低于50%时，可以穿透敌方护盾。此技能无法被阻挡或反射。",
    skillTreeEta: "预计时间：2026年6月 | 状态：内部测试中",
    // Skill names & descriptions
    labBasics: "实验室基础",
    labBasicsDesc: "解锁研究队列。所有科技研究速度+5%。",
    materialAnalysis: "材料分析",
    materialAnalysisDesc: "识别敌方部队弱点。对扫描目标伤害+8%。",
    volatileCompounds: "挥发性化合物",
    volatileCompoundsDesc: "攻城武器溅射伤害+15%。燃烧效果延长3秒。",
    neuralUplink: "神经连接",
    neuralUplinkDesc: "指挥官技能触发率+10%。冷却时间减少2秒。",
    particleAccelerator: "粒子加速器",
    particleAcceleratorDesc: "能量武器无视25%敌方护甲。弹道速度+20%。",
    radiationPulse: "辐射脉冲",
    radiationPulseDesc: "范围减益：范围内敌方部队攻击力降低12%，持续8秒。",
    invincibleBomb: "无敌炸弹",
    invincibleBombDesc: "部署一枚无法阻挡的弹头，当目标护盾剩余时间低于50%时可穿透玩家护盾。无视所有防御屏障。冷却90秒。",
    // Heroes
    heroesTitle: "即将推出的英雄",
    expected: "预计",
    // Hero details
    shadowReaper: "暗影收割者",
    assassin: "刺客",
    shadowReaperAbility: "相位突袭 - 瞬移至敌方身后，直接对后排部队造成伤害",
    stormTitan: "风暴泰坦",
    tank: "坦克",
    stormTitanAbility: "雷霆神盾 - 吸收80%伤害并以闪电形式反射",
    phoenixQueen: "凤凰女王",
    support: "辅助",
    phoenixQueenAbility: "重生之焰 - 以50%的堆叠生命值复活阵亡部队",
    voidEmperor: "虚空皇帝",
    mage: "法师",
    voidEmperorAbility: "现实撕裂 - 创造黑洞造成600%范围伤害",
    // Troopers
    troopersTitle: "新型重装部队",
    atk: "攻击",
    def: "防御",
    spd: "速度",
    siegeBreaker: "破城者 MK-IV",
    siegeBreakerSpecial: "堡垒毁灭者 - 对建筑伤害+200%",
    inTesting: "测试中",
    plasmaArtillery: "等离子炮兵单位",
    plasmaArtillerySpecial: "离子轰炸 - 远程范围攻击附带灼烧效果",
    finalReview: "最终审核",
    stealthMech: "隐形机甲 Alpha",
    stealthMechSpecial: "隐形力场 - 战斗开始前10秒处于隐形状态",
    concept: "概念",
    // Mechanics
    mechanicsTitle: "即将推出的游戏机制",
    allianceWars: "联盟战争 2.0",
    allianceWarsDesc: "跨服联盟战斗，拥有领土控制。占领区域可获得资源加成。",
    development: "开发中",
    weatherSystem: "动态天气系统",
    weatherSystemDesc: "雨天影响空军精准度。雪天降低陆军攻击速度。雾天降低海军暴击率。",
    testing: "测试中",
    mercenarySystem: "雇佣兵系统",
    mercenarySystemDesc: "雇佣NPC指挥官获得临时加成。费用随战力等级增长。",
    approved: "已批准",
    eta: "预计时间",
    // Collaborations
    collabsTitle: "即将到来的合作",
    partner: "合作方",
    fiftyShades: "五十度灰",
    fiftyShadesParter: "多乐士涂料",
    fiftyShadesDesc: "用50种独家配色方案改造你的基地！从'战术灰褐'到'战场米色'，用高级设计师配色定制你的总部。限量版油漆桶在使用时会掉落额外资源。",
    negotiation: "谈判中",
    fastFurious: "速度与激情：战争版",
    fastFuriousParter: "环球影业",
    fastFuriousDesc: "多姆·托雷托带着家人来到Top War！解锁独家肌肉车单位，配备氮气加速能力。特殊'家族纽带'增益使附近盟友攻击速度提升25%。因为没有什么比家人更强大。",
    contractSigned: "已签约",
    gordonRamsay: "戈登·拉姆齐的战争厨房",
    gordonRamsayPartner: "地狱厨房",
    gordonRamsayDesc: "拉姆齐主厨作为传奇指挥官加入！他的'这是生的！'技能对敌军造成食物中毒减益。建造地狱厨房建筑获得高级部队恢复加成。驴子不包括在内。",
    inDevelopment: "开发中",
    ikeaFortress: "宜家堡垒建造师",
    ikeaPartner: "宜家",
    ikeaDesc: "用平板包装的方式走向胜利！解锁带有令人困惑的组装说明的瑞典设计防御工事。部队获得'六角扳手'被动技能 - 10%几率立即拆解敌方建筑。肉丸补给空投包含在内。",
    // Footer
    sessionId: "会话ID",
    exitSecure: "退出安全区域",
    // Game Screenshots button (stays in Chinese always)
    gameScreenshots: "游戏截图",
    screenshotLoginTitle: "游戏截图访问",
    screenshotLoginDesc: "请输入您的内部开发者凭证以查看游戏截图。",
    screenshotUsername: "用户名",
    screenshotPassword: "密码",
    screenshotUsernamePlaceholder: "输入内部用户名",
    screenshotPasswordPlaceholder: "输入访问密码",
    screenshotLogin: "登录",
    screenshotCancel: "取消",
    screenshotError: "认证失败。访问被拒绝。",
    langToggle: "English"
  },
  en: {
    classified: "Classified Information",
    title: "🔐 DEVELOPER ACCESS",
    clearance: "CLEARANCE LEVEL: MAXIMUM",
    warning: "This information is for authorized personnel only. Unauthorized disclosure is prohibited.",
    hide: "Hide",
    reveal: "Reveal",
    unreleased: "UNRELEASED",
    beta: "BETA",
    roadmap: "ROADMAP",
    topSecret: "TOP SECRET",
    newPath: "NEW PATH",
    skillTreeTitle: "SUPER SCIENTIST SKILL TREE",
    tier: "Tier",
    foundation: "Foundation",
    appliedSciences: "Applied Sciences",
    quantumResearch: "Quantum Research",
    finalPerk: "FINAL PERK",
    ultimate: "ULTIMATE",
    unlocked: "UNLOCKED",
    shieldPenetration: "SHIELD PENETRATION: ACTIVE BELOW 50% SHIELD TIMER",
    skillTreeSummary: "is a 4-tier progression path focused on research superiority and weapon tech. The ultimate perk,",
    skillTreeSummary2: ", deploys a warhead that bypasses enemy shields when the target has less than 50% of their shield duration remaining. This ability cannot be blocked or reflected.",
    skillTreeEta: "ETA: June 2026 | Status: Internal Playtesting",
    labBasics: "Lab Basics",
    labBasicsDesc: "Unlock research queue. +5% research speed for all tech.",
    materialAnalysis: "Material Analysis",
    materialAnalysisDesc: "Identify enemy troop weaknesses. +8% damage vs scanned targets.",
    volatileCompounds: "Volatile Compounds",
    volatileCompoundsDesc: "Siege weapons deal +15% splash damage. Burning effect lasts 3s longer.",
    neuralUplink: "Neural Uplink",
    neuralUplinkDesc: "Commanders gain +10% skill activation rate. Reduced cooldowns by 2s.",
    particleAccelerator: "Particle Accelerator",
    particleAcceleratorDesc: "Energy weapons ignore 25% of enemy armor. +20% projectile speed.",
    radiationPulse: "Radiation Pulse",
    radiationPulseDesc: "AoE debuff: enemy troops within radius lose 12% attack for 8s.",
    invincibleBomb: "Invincible Bomb",
    invincibleBombDesc: "Deploys an unstoppable warhead that penetrates player shields if the target has less than 50% of their shield time remaining. Ignores all defensive barriers. 90s cooldown.",
    heroesTitle: "UPCOMING HEROES",
    expected: "Expected",
    shadowReaper: "Shadow Reaper",
    assassin: "Assassin",
    shadowReaperAbility: "Phase Strike - Teleport behind enemy and deal damage directly to back row of units",
    stormTitan: "Storm Titan",
    tank: "Tank",
    stormTitanAbility: "Thunder Aegis - Absorb 80% damage and reflect as lightning",
    phoenixQueen: "Phoenix Queen",
    support: "Support",
    phoenixQueenAbility: "Rebirth Flame - Revive fallen units with 50% of stack health",
    voidEmperor: "Void Emperor",
    mage: "Mage",
    voidEmperorAbility: "Reality Tear - Create black hole dealing 600% AoE damage",
    troopersTitle: "NEW HEAVY TROOPERS",
    atk: "ATK",
    def: "DEF",
    spd: "SPD",
    siegeBreaker: "Siege Breaker MK-IV",
    siegeBreakerSpecial: "Fortification Destroyer - +200% damage vs buildings",
    inTesting: "In Testing",
    plasmaArtillery: "Plasma Artillery Unit",
    plasmaArtillerySpecial: "Ion Bombardment - Long range AoE with burn effect",
    finalReview: "Final Review",
    stealthMech: "Stealth Mech Alpha",
    stealthMechSpecial: "Cloaking Field - Invisible for first 10 seconds of battle",
    concept: "Concept",
    mechanicsTitle: "UPCOMING GAME MECHANICS",
    allianceWars: "Alliance Wars 2.0",
    allianceWarsDesc: "Cross-server alliance battles with territory control. Capture zones to gain resource bonuses.",
    development: "Development",
    weatherSystem: "Dynamic Weather System",
    weatherSystemDesc: "Rain affects air unit accuracy. Snow reduces land unit attack speed. Fog reduces naval crit rate.",
    testing: "Testing",
    mercenarySystem: "Mercenary System",
    mercenarySystemDesc: "Hire NPC commanders for temporary boosts. Cost scales with power level.",
    approved: "Approved",
    eta: "ETA",
    collabsTitle: "UPCOMING COLLABORATIONS",
    partner: "Partner",
    fiftyShades: "50 Shades of Grey",
    fiftyShadesParter: "Dulux Paints",
    fiftyShadesDesc: "Transform your base with 50 exclusive paint schemes! From 'Tactical Taupe' to 'Battlefield Beige', customize your headquarters with premium designer colors. Limited edition paint buckets drop bonus resources when applied.",
    negotiation: "Negotiation",
    fastFurious: "Fast & Furious: War Edition",
    fastFuriousParter: "Universal Studios",
    fastFuriousDesc: "Dom Toretto brings the family to Top War! Unlock exclusive muscle car units with nitro boost abilities. Special 'Family Bond' buff increases nearby ally attack speed by 25%. Because nothing is stronger than family.",
    contractSigned: "Contract Signed",
    gordonRamsay: "Gordon Ramsay's War Kitchen",
    gordonRamsayPartner: "Hell's Kitchen",
    gordonRamsayDesc: "Chef Ramsay joins as a legendary commander! His 'It's RAW!' ability debuffs enemy troops with food poisoning. Build the Hell's Kitchen structure for premium troop recovery buffs. Donkey not included.",
    inDevelopment: "In Development",
    ikeaFortress: "IKEA Fortress Builder",
    ikeaPartner: "IKEA",
    ikeaDesc: "Flat-pack your way to victory! Unlock Swedish-designed fortifications with confusing assembly instructions. Troops gain the 'Allen Key' passive - 10% chance to instantly disassemble enemy structures. Meatball supply drops included.",
    sessionId: "SESSION ID",
    exitSecure: "Exit Secure Area",
    // Game Screenshots - ALWAYS Chinese
    gameScreenshots: "游戏截图",
    screenshotLoginTitle: "游戏截图访问",
    screenshotLoginDesc: "请输入您的内部开发者凭证以查看游戏截图。",
    screenshotUsername: "用户名",
    screenshotPassword: "密码",
    screenshotUsernamePlaceholder: "输入内部用户名",
    screenshotPasswordPlaceholder: "输入访问密码",
    screenshotLogin: "登录",
    screenshotCancel: "取消",
    screenshotError: "认证失败。访问被拒绝。",
    langToggle: "中文"
  }
};

// ── Skill Tree Data (uses translation keys) ──
const SKILL_TREE_TIERS = [
  {
    tier: 1,
    nameKey: "foundation",
    skills: [
      { nameKey: "labBasics", descKey: "labBasicsDesc", icon: Beaker, unlocked: true },
      { nameKey: "materialAnalysis", descKey: "materialAnalysisDesc", icon: Microscope, unlocked: true }
    ]
  },
  {
    tier: 2,
    nameKey: "appliedSciences",
    skills: [
      { nameKey: "volatileCompounds", descKey: "volatileCompoundsDesc", icon: FlaskConical, unlocked: true },
      { nameKey: "neuralUplink", descKey: "neuralUplinkDesc", icon: BrainCircuit, unlocked: true }
    ]
  },
  {
    tier: 3,
    nameKey: "quantumResearch",
    skills: [
      { nameKey: "particleAccelerator", descKey: "particleAcceleratorDesc", icon: Atom, unlocked: false },
      { nameKey: "radiationPulse", descKey: "radiationPulseDesc", icon: Radiation, unlocked: false }
    ]
  },
  {
    tier: 4,
    nameKey: "finalPerk",
    skills: [
      { nameKey: "invincibleBomb", descKey: "invincibleBombDesc", icon: Bomb, unlocked: false, isFinal: true }
    ]
  }
];

// ── Heroes Data ──
const HEROES = [
  { nameKey: "shadowReaper", type: "SSR", classKey: "assassin", abilityKey: "shadowReaperAbility", releaseDate: "November 2026", icon: Skull, color: "purple" },
  { nameKey: "stormTitan", type: "SSSR", classKey: "tank", abilityKey: "stormTitanAbility", releaseDate: "Q1 2027", icon: Zap, color: "blue" },
  { nameKey: "phoenixQueen", type: "SSR", classKey: "support", abilityKey: "phoenixQueenAbility", releaseDate: "September 2026", icon: Flame, color: "orange" },
  { nameKey: "voidEmperor", type: "SSSR", classKey: "mage", abilityKey: "voidEmperorAbility", releaseDate: "Q2 2027", icon: Crown, color: "violet" }
];

// ── Troopers Data ──
const TROOPERS = [
  { nameKey: "siegeBreaker", stats: { attack: 2850, defense: 3200, speed: 45 }, specialKey: "siegeBreakerSpecial", statusKey: "inTesting" },
  { nameKey: "plasmaArtillery", stats: { attack: 4200, defense: 1800, speed: 25 }, specialKey: "plasmaArtillerySpecial", statusKey: "finalReview" },
  { nameKey: "stealthMech", stats: { attack: 3100, defense: 2400, speed: 85 }, specialKey: "stealthMechSpecial", statusKey: "concept" }
];

// ── Mechanics Data ──
const MECHANICS = [
  { nameKey: "allianceWars", descKey: "allianceWarsDesc", statusKey: "development", eta: "April 2026" },
  { nameKey: "weatherSystem", descKey: "weatherSystemDesc", statusKey: "testing", eta: "Q2 2026" },
  { nameKey: "mercenarySystem", descKey: "mercenarySystemDesc", statusKey: "approved", eta: "April 2026" }
];

// ── Collaborations Data ──
const COLLABS = [
  { nameKey: "fiftyShades", partnerKey: "fiftyShadesParter", descKey: "fiftyShadesDesc", statusKey: "negotiation", eta: "Q3 2026" },
  { nameKey: "fastFurious", partnerKey: "fastFuriousParter", descKey: "fastFuriousDesc", statusKey: "contractSigned", eta: "Q2 2026" },
  { nameKey: "gordonRamsay", partnerKey: "gordonRamsayPartner", descKey: "gordonRamsayDesc", statusKey: "inDevelopment", eta: "Q4 2026" },
  { nameKey: "ikeaFortress", partnerKey: "ikeaPartner", descKey: "ikeaDesc", statusKey: "concept", eta: "2027" }
];

const getStatusColor = (status) => {
  const s = status.toLowerCase();
  if (s.includes("testing") || s === "测试中") return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  if (s.includes("review") || s.includes("approved") || s === "最终审核" || s === "已批准") return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (s.includes("concept") || s === "概念") return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (s.includes("development") || s === "开发中") return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  if (s.includes("negotiation") || s === "谈判中") return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  if (s.includes("contract") || s.includes("signed") || s === "已签约") return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

const getTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case 'sssr': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
    case 'ssr': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
    default: return 'bg-slate-600 text-white';
  }
};

export default function DevSecrets() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("zh");
  const t = T[lang];

  const [isRevealed, setIsRevealed] = useState(isAprilFoolsRevealed);
  const [showRevealPage, setShowRevealPage] = useState(isAprilFoolsRevealed);
  const [viewAnyway, setViewAnyway] = useState(false);

  // Re-check time every 30s in case user is on the page when noon hits
  useEffect(() => {
    const iv = setInterval(() => {
      if (!isRevealed && isAprilFoolsRevealed()) {
        setIsRevealed(true);
        setShowRevealPage(true);
      }
    }, 30000);
    return () => clearInterval(iv);
  }, [isRevealed]);

  const [revealedSections, setRevealedSections] = useState({
    skillTree: false,
    heroes: false,
    troopers: false,
    mechanics: false,
    collaborations: false
  });

  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [screenshotCreds, setScreenshotCreds] = useState({ username: "", password: "" });
  const [screenshotError, setScreenshotError] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  const toggleReveal = (section) => {
    setRevealedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleScreenshotLogin = (e) => {
    e.preventDefault();
    setScreenshotLoading(true);
    setScreenshotError(false);
    // Fake loading then always fail
    setTimeout(() => {
      setScreenshotLoading(false);
      setScreenshotError(true);
    }, 1500);
  };

  // Show April Fools reveal takeover
  if (showRevealPage && !viewAnyway) {
    return <AprilFoolsReveal onViewAnyway={() => { setViewAnyway(true); setShowRevealPage(false); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      <Helmet>
        <title>2026开发者路线图 — 机密</title>
        <meta name="description" content="开发者路线图：密码丢失后被迫专注于顶级英雄开发。包含未公开英雄资料、技能树及内部测试数据。严禁外泄。" />
        <meta property="og:title" content="2026开发者路线图 — 机密文件" />
        <meta property="og:description" content="开发者路线图：密码丢失后被迫专注于顶级英雄开发。包含未公开英雄资料、技能树及内部测试数据。严禁外泄。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.twapplications.com/2026Roadmap" />
        <meta name="twitter:title" content="2026开发者路线图 — 机密文件" />
        <meta name="twitter:description" content="开发者路线图：密码丢失后被迫专注于顶级英雄开发。包含未公开英雄资料、技能树及内部测试数据。严禁外泄。" />
      </Helmet>

      {/* APRIL FOOLS watermark when viewing via "View Anyway" */}
      {viewAnyway && (
        <>
          <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" style={{ opacity: 0.07 }}>
            {[...Array(8)].map((_, row) => (
              <div key={row} className="flex whitespace-nowrap" style={{ transform: `rotate(-25deg) translateY(${row * 140 - 100}px) translateX(-200px)` }}>
                {[...Array(6)].map((_, col) => (
                  <span key={col} className="text-6xl sm:text-7xl font-black text-red-500 mx-16 select-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    APRIL FOOLS
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
            <Button
              onClick={() => setShowRevealPage(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg shadow-yellow-500/30"
              data-testid="back-to-reveal-btn"
            >
              <PartyPopper className="w-4 h-4 mr-2" />
              Back to April Fools Reveal
            </Button>
          </div>
        </>
      )}

      {/* Animated background grid */}
      <style>
        {`
          @keyframes pulse-glow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
          @keyframes scan-line { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
          @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.3); } 50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); } }
          @keyframes bomb-glow { 0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4), 0 0 24px rgba(239, 68, 68, 0.2); } 50% { box-shadow: 0 0 24px rgba(239, 68, 68, 0.7), 0 0 48px rgba(239, 68, 68, 0.3); } }
          .grid-bg {
            background-image: linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
          }
          .scan-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.5), transparent); animation: scan-line 4s linear infinite; }
        `}
      </style>

      <div className="absolute inset-0 grid-bg" />
      <div className="scan-line" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top bar: Language toggle + Game Screenshots */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            variant="outline"
            size="sm"
            className="border-cyan-500/40 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            data-testid="language-toggle"
          >
            <Languages className="w-4 h-4 mr-2" />
            {t.langToggle}
          </Button>

          <Button
            onClick={() => { setScreenshotDialogOpen(true); setScreenshotError(false); setScreenshotCreds({ username: "", password: "" }); }}
            variant="outline"
            size="sm"
            className="border-amber-500/40 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            data-testid="game-screenshots-btn"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            游戏截图
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-red-400 text-sm font-mono uppercase tracking-wider">{t.classified}</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 mb-2" 
              style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {t.title}
          </h1>
          <p className="text-slate-500 font-mono text-sm">{t.clearance}</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 border border-red-500/20 rounded-lg p-4 mb-8 text-center">
          <Lock className="w-5 h-5 inline-block text-red-400 mr-2" />
          <span className="text-red-300 text-sm">{t.warning}</span>
        </div>

        {/* ═══ 1. SUPER SCIENTIST SKILL TREE (moved to top) ═══ */}
        <Card className="bg-slate-900/80 border-green-500/30 mb-6 backdrop-blur-sm" data-testid="skill-tree-section">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-green-400" />
              <CardTitle className="text-xl text-green-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {t.skillTreeTitle}
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t.newPath}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleReveal('skillTree')} className="text-green-400 hover:text-green-300 hover:bg-green-500/10" data-testid="skill-tree-toggle">
              {revealedSections.skillTree ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.skillTree ? t.hide : t.reveal}
            </Button>
          </CardHeader>
          {revealedSections.skillTree && (
            <CardContent>
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-green-500/60 via-green-400/40 to-red-500/60 hidden md:block" />
                {SKILL_TREE_TIERS.map((tier, tierIndex) => (
                  <div key={tierIndex} className="relative mb-8 last:mb-0">
                    <div className="flex items-center justify-center mb-4">
                      <div className={`px-4 py-1 rounded-full text-xs font-mono uppercase tracking-widest z-10 ${
                        tier.tier === 4 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-green-500/10 text-green-500/70 border border-green-500/20'
                      }`}>
                        {tier.tier === 4 ? (
                          <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> {t.finalPerk}</span>
                        ) : (
                          `${t.tier} ${tier.tier} — ${t[tier.nameKey]}`
                        )}
                      </div>
                    </div>
                    <div className={`grid gap-4 ${tier.skills.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                      {tier.skills.map((skill, skillIndex) => {
                        const Icon = skill.icon;
                        const isFinal = skill.isFinal;
                        return (
                          <div key={skillIndex}
                            className={`relative rounded-lg p-4 transition-all duration-300 ${
                              isFinal ? 'bg-gradient-to-br from-red-950/60 via-red-900/40 to-orange-950/60 border-2 border-red-500/50 hover:border-red-400/80'
                              : skill.unlocked ? 'bg-slate-800/50 border border-green-500/30 hover:border-green-400/60'
                              : 'bg-slate-800/30 border border-slate-700/50 opacity-70 hover:opacity-90'
                            }`}
                            style={isFinal ? { animation: 'bomb-glow 2s ease-in-out infinite' } : skill.unlocked ? { animation: 'glow-pulse 3s ease-in-out infinite' } : {}}
                            data-testid={`skill-${t[skill.nameKey].toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {!skill.unlocked && !isFinal && <div className="absolute top-2 right-2"><Lock className="w-4 h-4 text-slate-600" /></div>}
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isFinal ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30' : skill.unlocked ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-slate-700/30'
                              }`}>
                                <Icon className={`w-6 h-6 ${isFinal ? 'text-red-400' : skill.unlocked ? 'text-green-400' : 'text-slate-500'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-bold text-sm ${isFinal ? 'text-red-300' : skill.unlocked ? 'text-green-300' : 'text-slate-400'}`}>{t[skill.nameKey]}</h4>
                                  {isFinal && <Badge className="bg-red-500/30 text-red-300 border-red-500/40 text-[10px] px-1.5 py-0">{t.ultimate}</Badge>}
                                  {skill.unlocked && !isFinal && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">{t.unlocked}</Badge>}
                                </div>
                                <p className={`text-xs leading-relaxed ${isFinal ? 'text-red-300/80' : 'text-slate-400'}`}>{t[skill.descKey]}</p>
                                {isFinal && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] text-red-400/70 font-mono">
                                    <AlertTriangle className="w-3 h-3" />{t.shieldPenetration}
                                  </div>
                                )}
                              </div>
                            </div>
                            {!isFinal && <div className="hidden md:flex justify-center mt-3"><ChevronDown className={`w-4 h-4 ${skill.unlocked ? 'text-green-500/40' : 'text-slate-600/30'}`} /></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-slate-800/30 border border-green-500/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bomb className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-green-400 font-semibold">{t.skillTreeTitle.replace("SUPER SCIENTIST SKILL TREE", "Super Scientist").replace("超级科学家技能树", "Super Scientist")}</span> {t.skillTreeSummary} <span className="text-red-400 font-semibold">{t.invincibleBomb}</span>{t.skillTreeSummary2}
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono mt-2">{t.skillTreeEta}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══ 2. UPCOMING HEROES ═══ */}
        <Card className="bg-slate-900/80 border-purple-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-purple-400" />
              <CardTitle className="text-xl text-purple-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{t.heroesTitle}</CardTitle>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{t.unreleased}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleReveal('heroes')} className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
              {revealedSections.heroes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.heroes ? t.hide : t.reveal}
            </Button>
          </CardHeader>
          {revealedSections.heroes && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HEROES.map((hero, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <hero.icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-200">{t[hero.nameKey]}</h3>
                          <p className="text-xs text-slate-500">{t[hero.classKey]}</p>
                        </div>
                      </div>
                      <Badge className={getTypeColor(hero.type)}>{hero.type}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2"><Zap className="w-3 h-3 inline mr-1 text-yellow-400" />{t[hero.abilityKey]}</p>
                    <p className="text-xs text-slate-500">{t.expected}: {hero.releaseDate}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══ 3. HEAVY TROOPERS ═══ */}
        <Card className="bg-slate-900/80 border-orange-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-orange-400" />
              <CardTitle className="text-xl text-orange-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{t.troopersTitle}</CardTitle>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{t.beta}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleReveal('troopers')} className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
              {revealedSections.troopers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.troopers ? t.hide : t.reveal}
            </Button>
          </CardHeader>
          {revealedSections.troopers && (
            <CardContent>
              <div className="space-y-4">
                {TROOPERS.map((trooper, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-orange-400" />
                        <h3 className="font-bold text-slate-200">{t[trooper.nameKey]}</h3>
                      </div>
                      <Badge className={getStatusColor(t[trooper.statusKey])}>{t[trooper.statusKey]}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-red-500/10 rounded">
                        <p className="text-xs text-slate-500">{t.atk}</p>
                        <p className="text-lg font-bold text-red-400">{trooper.stats.attack}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-500/10 rounded">
                        <p className="text-xs text-slate-500">{t.def}</p>
                        <p className="text-lg font-bold text-blue-400">{trooper.stats.defense}</p>
                      </div>
                      <div className="text-center p-2 bg-green-500/10 rounded">
                        <p className="text-xs text-slate-500">{t.spd}</p>
                        <p className="text-lg font-bold text-green-400">{trooper.stats.speed}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400"><Star className="w-3 h-3 inline mr-1 text-yellow-400" />{t[trooper.specialKey]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══ 4. GAME MECHANICS ═══ */}
        <Card className="bg-slate-900/80 border-cyan-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-cyan-400" />
              <CardTitle className="text-xl text-cyan-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{t.mechanicsTitle}</CardTitle>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{t.roadmap}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleReveal('mechanics')} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
              {revealedSections.mechanics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.mechanics ? t.hide : t.reveal}
            </Button>
          </CardHeader>
          {revealedSections.mechanics && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MECHANICS.map((mechanic, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-200">{t[mechanic.nameKey]}</h3>
                      <Badge className={getStatusColor(t[mechanic.statusKey])}>{t[mechanic.statusKey]}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{t[mechanic.descKey]}</p>
                    <p className="text-xs text-cyan-400 font-mono">{t.eta}: {mechanic.eta}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══ 5. COLLABORATIONS ═══ */}
        <Card className="bg-slate-900/80 border-pink-500/30 mb-6 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Handshake className="w-6 h-6 text-pink-400" />
              <CardTitle className="text-xl text-pink-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{t.collabsTitle}</CardTitle>
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">{t.topSecret}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleReveal('collaborations')} className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
              {revealedSections.collaborations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {revealedSections.collaborations ? t.hide : t.reveal}
            </Button>
          </CardHeader>
          {revealedSections.collaborations && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLLABS.map((collab, index) => (
                  <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-pink-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-200">{t[collab.nameKey]}</h3>
                      <Badge className={getStatusColor(t[collab.statusKey])}>{t[collab.statusKey]}</Badge>
                    </div>
                    <p className="text-xs text-pink-400 font-semibold mb-2">{t.partner}: {t[collab.partnerKey]}</p>
                    <p className="text-sm text-slate-400 mb-2">{t[collab.descKey]}</p>
                    <p className="text-xs text-pink-400 font-mono">{t.eta}: {collab.eta}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-xs font-mono mb-4">{t.sessionId}: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
          <Button
            onClick={() => navigate('/moderator/login')}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          >
            <Lock className="w-4 h-4 mr-2" />
            {t.exitSecure}
          </Button>
        </div>
      </div>

      {/* ═══ Fake Game Screenshots Login Dialog (always Chinese) ═══ */}
      <Dialog open={screenshotDialogOpen} onOpenChange={setScreenshotDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-md" data-testid="screenshot-login-dialog">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              游戏截图访问
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              请输入您的内部开发者凭证以查看游戏截图。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScreenshotLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="screenshot-username" className="text-slate-300 font-medium">用户名</Label>
              <Input
                id="screenshot-username"
                type="text"
                value={screenshotCreds.username}
                onChange={(e) => setScreenshotCreds(prev => ({ ...prev, username: e.target.value }))}
                required
                className="bg-slate-950/60 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                placeholder="输入内部用户名"
                data-testid="screenshot-username-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screenshot-password" className="text-slate-300 font-medium">密码</Label>
              <Input
                id="screenshot-password"
                type="password"
                value={screenshotCreds.password}
                onChange={(e) => setScreenshotCreds(prev => ({ ...prev, password: e.target.value }))}
                required
                className="bg-slate-950/60 border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 rounded-sm"
                placeholder="输入访问密码"
                data-testid="screenshot-password-input"
              />
            </div>
            {screenshotError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center" data-testid="screenshot-error">
                <AlertTriangle className="w-4 h-4 inline mr-2 text-red-400" />
                <span className="text-red-400 text-sm">认证失败。访问被拒绝。</span>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setScreenshotDialogOpen(false)} className="border-slate-600 text-slate-200 hover:bg-slate-800">
                取消
              </Button>
              <Button
                type="submit"
                disabled={screenshotLoading || !screenshotCreds.username.trim() || !screenshotCreds.password.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                data-testid="screenshot-login-btn"
              >
                {screenshotLoading ? "验证中..." : "登录"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
