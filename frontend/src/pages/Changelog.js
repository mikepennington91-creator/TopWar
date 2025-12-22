import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Sparkles, Bug, Wrench, Plus } from "lucide-react";

// Changelog data - newest first
const CHANGELOG_DATA = [
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
        <Button
          data-testid="back-to-portal-btn"
          onClick={() => navigate('/moderator/portal')}
          variant="ghost"
          size="sm"
          className="mb-4 sm:mb-8 text-amber-500 hover:text-amber-400 hover:bg-slate-900 text-sm"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
          Back to Portal
        </Button>

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

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Have feedback or feature requests? Contact an administrator.</p>
        </div>
      </div>
    </div>
  );
}
