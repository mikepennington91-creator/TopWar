import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Sparkles, Bug, Wrench, Plus, PartyPopper, Globe } from "lucide-react";

// Changelog data - newest first
const CHANGELOG_DATA = [
  {
    version: "2.9.0",
    date: "26 December 2025",
    title: "Holiday Animations System",
    changes: [
      { type: "feature", text: "Added holiday animation system for UK, US, and Chinese holidays" },
      { type: "feature", text: "Holiday animations display 3 days: day before, day of, and day after" },
      { type: "feature", text: "Holiday effects override seasonal animations when active" },
      { type: "feature", text: "Added separate toggle in Settings to enable/disable holiday animations" },
      { type: "feature", text: "Added info tooltips (ℹ️) explaining animation settings" },
      { type: "improvement", text: "Each holiday has unique themed particle effects and colors" },
    ]
  },
  {
    version: "2.8.0",
    date: "24 December 2025",
    title: "Application Review Status Tracking",
    changes: [
      { type: "feature", text: "Added 'My Status' column to application review table" },
      { type: "feature", text: "Shows 'New' badge for applications you haven't viewed yet" },
      { type: "feature", text: "Shows 'Viewed' badge (amber) for applications you've opened but not voted on" },
      { type: "feature", text: "Shows 'Voted' badge (green/red) indicating your vote on each application" },
      { type: "improvement", text: "View tracking persists - status remains after page refresh" },
      { type: "improvement", text: "Mobile cards also display your interaction status" },
    ]
  },
  {
    version: "2.7.0",
    date: "23 December 2025",
    title: "Easter Eggs & Secret Pages",
    changes: [
      { type: "feature", text: "Added secret troll page - Login with Username: Troll | Password: FunnyGuy" },
      { type: "feature", text: "Added Valentine's proposal page - Login with Username: Valentine | Password: Iloveyou" },
      { type: "feature", text: "Added Developer secrets page - Login with Username: Developer | Password: Money" },
      { type: "improvement", text: "Developer page shows upcoming heroes, heavy troopers, and game mechanics (all fake!)" },
      { type: "improvement", text: "Romantic pages feature falling rose petal animations" },
    ]
  },
  {
    version: "2.6.0",
    date: "22 December 2025",
    title: "Date Picker & Form Improvements",
    changes: [
      { type: "feature", text: "Added calendar date picker for Start Date and End Date on Server Assignments" },
      { type: "improvement", text: "Click to open calendar popup instead of typing date manually" },
      { type: "improvement", text: "Changed 'How many heroes can be mutated?' to numerical-only input field" },
      { type: "fix", text: "Removed redundant '(Numerical)' text from heroes mutation question" },
    ]
  },
  {
    version: "2.5.0",
    date: "22 December 2025",
    title: "Moderator Activity & Security Enhancements",
    changes: [
      { type: "feature", text: "Added last login tracking to Manage Moderators list in Settings" },
      { type: "feature", text: "Displays 'Never' for users who haven't logged in yet" },
      { type: "feature", text: "Color-coded activity indicator dot (green=today, yellow=this month, red=inactive 30+ days)" },
      { type: "feature", text: "New users must change password on first login" },
      { type: "feature", text: "Password reset by admin now forces password change on next login" },
      { type: "improvement", text: "Enhanced security with mandatory password change flow" },
    ]
  },
  {
    version: "2.4.0",
    date: "22 December 2025",
    title: "Server Assignments Enhancements",
    changes: [
      { type: "feature", text: "Added sortable columns to Server Assignment Records (Server, Moderator, Tag, Start Date, Reason)" },
      { type: "feature", text: "Added search/filter bar to quickly find records by server, moderator, reason, or tag" },
      { type: "improvement", text: "Redesigned table with modern spreadsheet-style layout and alternating row colors" },
      { type: "feature", text: "Added summary footer showing record count and current sort status" },
      { type: "feature", text: "Added mobile sort dropdown for easier sorting on phones" },
      { type: "fix", text: "Fixed mobile overflow issue with long reason text (e.g., 'Other (State in comments)')" },
    ]
  },
  {
    version: "2.3.0",
    date: "22 December 2025",
    title: "Visual Preferences & Animation Controls",
    changes: [
      { type: "feature", text: "Added 'Visual Preferences' section in Settings" },
      { type: "feature", text: "Added toggle to enable/disable seasonal animations" },
      { type: "improvement", text: "Animation preference is saved and persists across sessions" },
    ]
  },
  {
    version: "2.2.0",
    date: "21 December 2025",
    title: "Seasonal Animations",
    changes: [
      { type: "feature", text: "Added seasonal particle animations to Landing page and Moderator Portal" },
      { type: "feature", text: "Winter: Snowflakes ❄️, Spring: Cherry blossoms 🌸, Summer: Fireflies ✨, Autumn: Falling leaves 🍂" },
      { type: "improvement", text: "Animations respect user's 'prefers-reduced-motion' accessibility setting" },
      { type: "fix", text: "Fixed animation particles 'hanging' at top of screen on page load" },
    ]
  },
  {
    version: "2.1.0",
    date: "21 December 2025",
    title: "Application Form & Dashboard Improvements",
    changes: [
      { type: "feature", text: "Added conditional questions for 'In-Game' position applicants" },
      { type: "feature", text: "New question: 'How long have you been playing Top War for?'" },
      { type: "feature", text: "New question: 'Why do you think you would make a good moderator?'" },
      { type: "feature", text: "Added toggle on Moderator Dashboard to switch between short and full question labels" },
      { type: "feature", text: "Restricted applicant email visibility to Training Managers only" },
    ]
  },
  {
    version: "2.0.0",
    date: "December 2025",
    title: "Major Platform Update",
    changes: [
      { type: "feature", text: "Implemented tiered voting system with role-based permissions" },
      { type: "feature", text: "Added commenting system for applications" },
      { type: "feature", text: "Added Poll system for moderator voting" },
      { type: "feature", text: "Added Audit Log for tracking application changes" },
      { type: "feature", text: "Added Server Assignments page with Excel download" },
      { type: "feature", text: "Added Announcements system" },
      { type: "improvement", text: "Enhanced user management with role hierarchy" },
      { type: "improvement", text: "Added Training Manager permission flag" },
    ]
  },
  {
    version: "1.0.0",
    date: "December 2025",
    title: "Initial Release",
    changes: [
      { type: "feature", text: "Moderator recruitment application form" },
      { type: "feature", text: "JWT-based moderator authentication" },
      { type: "feature", text: "Application review and management dashboard" },
      { type: "feature", text: "Email notifications (submission, approval, rejection)" },
      { type: "feature", text: "Role-based access control (Admin, Developer, MMOD, SMod, LMod, Moderator)" },
      { type: "feature", text: "Mobile-responsive military/tactical UI theme" },
      { type: "feature", text: "Password management and security features" },
    ]
  },
];

const getChangeIcon = (type) => {
  switch (type) {
    case 'feature':
      return <Plus className="h-3 w-3 text-emerald-400" />;
    case 'improvement':
      return <Sparkles className="h-3 w-3 text-amber-400" />;
    case 'fix':
      return <Bug className="h-3 w-3 text-red-400" />;
    default:
      return <Wrench className="h-3 w-3 text-slate-400" />;
  }
};

const getChangeBadge = (type) => {
  switch (type) {
    case 'feature':
      return <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">NEW</span>;
    case 'improvement':
      return <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">IMPROVED</span>;
    case 'fix':
      return <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">FIX</span>;
    default:
      return null;
  }
};

export default function Changelog() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('moderator_token');
    if (!token) {
      navigate('/moderator/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 grid-texture">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl sm:text-4xl font-bold uppercase tracking-wider mb-3 sm:mb-4 text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          <FileText className="inline-block mr-2 sm:mr-3 h-6 w-6 sm:h-10 sm:w-10" />
          Changelog
        </h1>
        <p className="text-slate-400 mb-6 sm:mb-8">
          Track all updates, new features, and improvements to the moderator platform.
        </p>

        {/* Changelog Timeline */}
        <div className="space-y-6">
          {CHANGELOG_DATA.map((release, index) => (
            <Card key={release.version} className="glass-card border-slate-700 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      v{release.version}
                      {index === 0 && (
                        <span className="ml-2 text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full uppercase">
                          Latest
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm mt-1">
                      {release.title}
                    </CardDescription>
                  </div>
                  <span className="text-xs text-slate-500 mono">{release.date}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {release.changes.map((change, changeIndex) => (
                    <li 
                      key={changeIndex}
                      className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors"
                    >
                      <span className="mt-1 flex-shrink-0">
                        {getChangeIcon(change.type)}
                      </span>
                      <span className="flex-1 text-sm text-slate-300">
                        {change.text}
                      </span>
                      <span className="flex-shrink-0 hidden sm:block">
                        {getChangeBadge(change.type)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Holiday Animations Reference */}
        <Card className="glass-card border-slate-700 mt-8 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl sm:text-2xl font-bold text-amber-500" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <PartyPopper className="inline-block mr-2 h-6 w-6" />
              Holiday Animations Reference
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm mt-1">
              All holiday animations and their display duration (day before + day of + day after = 3 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* UK Holidays */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                🇬🇧 United Kingdom Holidays
              </h3>
              <div className="grid gap-2">
                {[
                  { name: "New Year's Day", date: "January 1", emoji: "🎊", effects: "Confetti, fireworks sparkles" },
                  { name: "Good Friday", date: "Variable (March/April)", emoji: "✝️", effects: "Easter eggs, spring flowers" },
                  { name: "Easter Sunday", date: "Variable (March/April)", emoji: "🐰", effects: "Bunnies, eggs, butterflies" },
                  { name: "Easter Monday", date: "Variable (March/April)", emoji: "🥚", effects: "Easter eggs, spring flowers" },
                  { name: "Early May Bank Holiday", date: "First Monday of May", emoji: "🌷", effects: "Spring flowers, butterflies" },
                  { name: "Spring Bank Holiday", date: "Last Monday of May", emoji: "🌸", effects: "Cherry blossoms, sunshine" },
                  { name: "Summer Bank Holiday", date: "Last Monday of August", emoji: "☀️", effects: "Sunshine, beach vibes" },
                  { name: "Christmas Day", date: "December 25", emoji: "🎄", effects: "Ornaments, snowflakes, holly" },
                  { name: "Boxing Day", date: "December 26", emoji: "🎁", effects: "Gift boxes, festive sparkles" },
                ].map((holiday, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span>{holiday.emoji}</span>
                      <span className="text-slate-200">{holiday.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-xs hidden sm:block">{holiday.effects}</span>
                      <span className="text-slate-400 text-xs mono">{holiday.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* US Holidays */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                🇺🇸 United States Holidays
              </h3>
              <div className="grid gap-2">
                {[
                  { name: "New Year's Day", date: "January 1", emoji: "🎊", effects: "Confetti, fireworks sparkles" },
                  { name: "Martin Luther King Jr. Day", date: "Third Monday of January", emoji: "✊", effects: "Patriotic stars, eagles" },
                  { name: "Presidents' Day", date: "Third Monday of February", emoji: "🇺🇸", effects: "American flags, stars" },
                  { name: "Easter Sunday", date: "Variable (March/April)", emoji: "🐰", effects: "Bunnies, eggs, butterflies" },
                  { name: "Memorial Day", date: "Last Monday of May", emoji: "🎖️", effects: "Patriotic ribbons, flags" },
                  { name: "Independence Day", date: "July 4", emoji: "🎆", effects: "Red/white/blue fireworks, stars" },
                  { name: "Labor Day", date: "First Monday of September", emoji: "👷", effects: "Tools, gears, stars" },
                  { name: "Thanksgiving", date: "Fourth Thursday of November", emoji: "🦃", effects: "Turkey, autumn leaves, pumpkins" },
                  { name: "Christmas Day", date: "December 25", emoji: "🎄", effects: "Ornaments, snowflakes, holly" },
                ].map((holiday, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span>{holiday.emoji}</span>
                      <span className="text-slate-200">{holiday.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-xs hidden sm:block">{holiday.effects}</span>
                      <span className="text-slate-400 text-xs mono">{holiday.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chinese Holidays */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                🇨🇳 Chinese Holidays
              </h3>
              <div className="grid gap-2">
                {[
                  { name: "Chinese New Year (Spring Festival)", date: "Variable (Jan 21 - Feb 20)", emoji: "🧧", effects: "Red lanterns, gold coins, firecrackers" },
                  { name: "Qingming Festival", date: "April 4-5", emoji: "🌿", effects: "Green leaves, spring growth" },
                  { name: "Dragon Boat Festival", date: "Variable (May/June)", emoji: "🐉", effects: "Dragons, boats, waves" },
                  { name: "Mid-Autumn Festival", date: "Variable (September/October)", emoji: "🥮", effects: "Mooncakes, lanterns, full moon" },
                  { name: "National Day", date: "October 1", emoji: "🇨🇳", effects: "Fireworks, stars, celebrations" },
                ].map((holiday, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span>{holiday.emoji}</span>
                      <span className="text-slate-200">{holiday.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500 text-xs hidden sm:block">{holiday.effects}</span>
                      <span className="text-slate-400 text-xs mono">{holiday.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <p className="text-sm text-amber-400">
                <strong>Note:</strong> Holiday animations override seasonal animations when active. 
                Each animation displays for 3 days: the day before, day of, and day after the holiday. 
                You can toggle these in Settings → Visual Preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Have feedback or feature requests? Contact an administrator.</p>
        </div>
      </div>
    </div>
  );
}
