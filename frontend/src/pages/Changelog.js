import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Sparkles, Bug, Wrench, Plus, PartyPopper, Globe } from "lucide-react";

// Changelog data - newest first
const CHANGELOG_DATA = [
  {
    version: "3.6.0",
    date: "14 February 2026",
    title: "Application Approval Workflow & Leader Roles",
    changes: [
      { type: "feature", text: "Added new intermediate application statuses: In-Game Approved and Discord Approved" },
      { type: "feature", text: "Added two new moderator roles: In-Game Leader and Discord Leader" },
      { type: "feature", text: "In-Game Leader and Discord Leader can now apply In-Game/Discord Approved and Rejected application statuses" },
      { type: "improvement", text: "Approve Application action now appears only when an application is In-Game Approved or Discord Approved" },
      { type: "feature", text: "Added new form question: 'What is your highest character level' (numeric, max 4 digits)" },
      { type: "improvement", text: "Application list sorting now supports vote-based sorts: Most Positive Votes and Most Negative Votes" },
      { type: "improvement", text: "Role settings now use one primary role plus separate In-Game Leader / Discord Leader toggles" },
    ]
  },
  {
    version: "3.5.1",
    date: "17 January 2026",
    title: "Moderator Email Confirmation",
    changes: [
      { type: "feature", text: "Moderators without an email are prompted after login to add one for password recovery" },
      { type: "feature", text: "Confirmation emails are sent when moderators register or add an email address" },
      { type: "improvement", text: "Email validation and uniqueness checks enforced for moderator accounts" },
    ]
  },
  {
    version: "3.5.0",
    date: "16 January 2026",
    title: "Application Management Overhaul",
    changes: [
      { type: "feature", text: "Dashboard tabs: Pending, Approved, Waiting, Rejected - applications now organized into separate sections" },
      { type: "feature", text: "New 'Waiting' status for approved applicants when no vacancy available" },
      { type: "feature", text: "Automatic waitlist email sent when application marked as Waiting" },
      { type: "feature", text: "'Convert to Approved' button for waiting applications when vacancy opens" },
      { type: "feature", text: "Application Control toggle in Settings - Admins can enable/disable new applications" },
      { type: "feature", text: "'No Vacancies' page displays when applications are disabled" },
      { type: "improvement", text: "Stats cards now show counts for all 4 statuses: Needs Review, Approved, Waiting, Rejected" },
      { type: "improvement", text: "Final Decision section now includes 'Waiting List' option alongside Approve/Reject" },
      { type: "improvement", text: "Improved email templates with warmer, more professional messaging" },
    ]
  },
  {
    version: "3.4.0",
    date: "31 December 2025",
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
    version: "3.3.0",
    date: "28 December 2025",
    title: "Announcement Dismiss & Feature Requests",
    changes: [
      { type: "feature", text: "Moderators can now mark announcements as 'read' to minimize them" },
      { type: "feature", text: "Read announcements are collapsed into a 'Read Announcements' section" },
      { type: "feature", text: "Click to expand and view previously read announcements" },
      { type: "feature", text: "NEW: Feature Request system - Submit suggestions for website improvements" },
      { type: "feature", text: "Feature requests visible to Admins, MMODs, and Developers for review" },
      { type: "feature", text: "Track status of your feature requests: Pending → Reviewed → Approved/Rejected → Implemented" },
      { type: "improvement", text: "Request categories: General, UI, Functionality, Bug Report, Other" },
      { type: "improvement", text: "Admins can add notes/responses to feature requests" },
    ]
  },
  {
    version: "3.2.0",
    date: "28 December 2025",
    title: "Enhanced Seasonal Animations",
    changes: [
      { type: "feature", text: "🌨️ Winter: Snow pile buildup - Snow gradually accumulates at the bottom of the screen, then melts away" },
      { type: "feature", text: "🌨️ Winter: Walking snowman ⛄ - Occasionally waddles across the bottom of the screen with a bobbing animation" },
      { type: "feature", text: "🌸 Spring: Butterfly 🦋 - Flutters across the screen with wing-flapping animation following a curved path" },
      { type: "feature", text: "☀️ Summer: Shooting star ⭐ - Streaks across the night sky with a glowing trail effect" },
      { type: "feature", text: "🍂 Autumn: Running squirrel 🐿️ - Dashes across the bottom of the screen collecting acorns" },
      { type: "feature", text: "🍂 Autumn: Wind gusts - Periodically blows leaves sideways with wind indicators and ground leaves being swept across" },
      { type: "improvement", text: "Special effects trigger randomly every 12 seconds for subtle, non-intrusive animations" },
      { type: "improvement", text: "All animations respect 'Reduced Motion' preference and can be toggled in Settings" },
    ]
  },
  {
    version: "3.1.0",
    date: "28 December 2025",
    title: "Collapsible Settings Sections",
    changes: [
      { type: "feature", text: "All Settings page sections are now collapsible for easier mobile navigation" },
      { type: "feature", text: "Click on any section header to expand/collapse the content" },
      { type: "feature", text: "Chevron icons indicate section state (▲ expanded, ▼ collapsed)" },
      { type: "improvement", text: "Change Your Password section expanded by default, others collapsed" },
      { type: "improvement", text: "Reduced scrolling required on mobile devices" },
      { type: "improvement", text: "Cleaner, more organized settings interface" },
    ]
  },
  {
    version: "3.0.0",
    date: "28 December 2025",
    title: "Major Backend Refactor & Admin Easter Egg Management",
    changes: [
      { type: "feature", text: "Full backend refactoring into modular architecture (routes, models, utils)" },
      { type: "feature", text: "Admin-only Easter Egg Management - Edit username, password, and content for all joke pages" },
      { type: "feature", text: "Mobile back button - All users can now navigate back on mobile devices" },
      { type: "feature", text: "Real names from applications now hidden from non-Training Managers" },
      { type: "improvement", text: "Easter egg credentials now stored in database instead of hardcoded" },
      { type: "improvement", text: "Better code organization for easier maintenance and scaling" },
      { type: "fix", text: "Fixed auto-logout issue when viewing application questions" },
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400 font-medium">Holiday</th>
                      <th className="text-left p-2 text-slate-400 font-medium">Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden sm:table-cell">2025 Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden md:table-cell">Animation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "New Year's Day", date: "January 1", date2025: "Jan 1", emoji: "🎊", effects: "Confetti, fireworks" },
                      { name: "Good Friday", date: "Friday before Easter", date2025: "Apr 18", emoji: "✝️", effects: "Easter eggs, flowers" },
                      { name: "Easter Sunday", date: "Variable", date2025: "Apr 20", emoji: "🐰", effects: "Bunnies, eggs" },
                      { name: "Easter Monday", date: "Day after Easter", date2025: "Apr 21", emoji: "🥚", effects: "Easter eggs, flowers" },
                      { name: "Early May Bank Holiday", date: "1st Monday of May", date2025: "May 5", emoji: "🌷", effects: "Spring flowers" },
                      { name: "Spring Bank Holiday", date: "Last Monday of May", date2025: "May 26", emoji: "🌸", effects: "Cherry blossoms" },
                      { name: "Summer Bank Holiday", date: "Last Monday of Aug", date2025: "Aug 25", emoji: "☀️", effects: "Sunshine, beach" },
                      { name: "Christmas Day", date: "December 25", date2025: "Dec 25", emoji: "🎄", effects: "Ornaments, snow" },
                      { name: "Boxing Day", date: "December 26", date2025: "Dec 26", emoji: "🎁", effects: "Gift boxes" },
                    ].map((holiday, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="p-2">
                          <span className="mr-2">{holiday.emoji}</span>
                          <span className="text-slate-200">{holiday.name}</span>
                        </td>
                        <td className="p-2 text-slate-400">{holiday.date}</td>
                        <td className="p-2 text-cyan-400 font-mono hidden sm:table-cell">{holiday.date2025}</td>
                        <td className="p-2 text-slate-500 hidden md:table-cell">{holiday.effects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* US Holidays */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                🇺🇸 United States Holidays
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400 font-medium">Holiday</th>
                      <th className="text-left p-2 text-slate-400 font-medium">Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden sm:table-cell">2025 Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden md:table-cell">Animation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "New Year's Day", date: "January 1", date2025: "Jan 1", emoji: "🎊", effects: "Confetti, fireworks" },
                      { name: "MLK Day", date: "3rd Monday of Jan", date2025: "Jan 20", emoji: "✊", effects: "Patriotic stars" },
                      { name: "Presidents' Day", date: "3rd Monday of Feb", date2025: "Feb 17", emoji: "🇺🇸", effects: "Flags, stars" },
                      { name: "Easter Sunday", date: "Variable", date2025: "Apr 20", emoji: "🐰", effects: "Bunnies, eggs" },
                      { name: "Memorial Day", date: "Last Monday of May", date2025: "May 26", emoji: "🎖️", effects: "Patriotic ribbons" },
                      { name: "Independence Day", date: "July 4", date2025: "Jul 4", emoji: "🎆", effects: "Red/white/blue fireworks" },
                      { name: "Labor Day", date: "1st Monday of Sep", date2025: "Sep 1", emoji: "👷", effects: "Tools, gears" },
                      { name: "Thanksgiving", date: "4th Thursday of Nov", date2025: "Nov 27", emoji: "🦃", effects: "Turkey, leaves" },
                      { name: "Christmas Day", date: "December 25", date2025: "Dec 25", emoji: "🎄", effects: "Ornaments, snow" },
                    ].map((holiday, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="p-2">
                          <span className="mr-2">{holiday.emoji}</span>
                          <span className="text-slate-200">{holiday.name}</span>
                        </td>
                        <td className="p-2 text-slate-400">{holiday.date}</td>
                        <td className="p-2 text-cyan-400 font-mono hidden sm:table-cell">{holiday.date2025}</td>
                        <td className="p-2 text-slate-500 hidden md:table-cell">{holiday.effects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chinese Holidays */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                🇨🇳 Chinese Holidays
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400 font-medium">Holiday</th>
                      <th className="text-left p-2 text-slate-400 font-medium">Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden sm:table-cell">2025 Date</th>
                      <th className="text-left p-2 text-slate-400 font-medium hidden md:table-cell">Animation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Chinese New Year", date: "Lunar New Year", date2025: "Jan 29", emoji: "🧧", effects: "Lanterns, gold coins" },
                      { name: "Qingming Festival", date: "April 4-5", date2025: "Apr 4", emoji: "🌿", effects: "Green leaves" },
                      { name: "Dragon Boat Festival", date: "5th day of 5th lunar month", date2025: "May 31", emoji: "🐉", effects: "Dragons, boats" },
                      { name: "Mid-Autumn Festival", date: "15th day of 8th lunar month", date2025: "Oct 6", emoji: "🥮", effects: "Mooncakes, lanterns" },
                      { name: "National Day", date: "October 1", date2025: "Oct 1", emoji: "🇨🇳", effects: "Fireworks, stars" },
                    ].map((holiday, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                        <td className="p-2">
                          <span className="mr-2">{holiday.emoji}</span>
                          <span className="text-slate-200">{holiday.name}</span>
                        </td>
                        <td className="p-2 text-slate-400">{holiday.date}</td>
                        <td className="p-2 text-cyan-400 font-mono hidden sm:table-cell">{holiday.date2025}</td>
                        <td className="p-2 text-slate-500 hidden md:table-cell">{holiday.effects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
