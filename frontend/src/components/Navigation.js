import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3, 
  ScrollText, 
  Users, 
  LogOut,
  Menu,
  X,
  Shield,
  ClipboardList,
  ArrowLeft
} from "lucide-react";
import { useCMod } from "@/hooks/useCMod";

// Pages that should show the navigation
const SHOW_NAV_ROUTES = [
  '/moderator/portal',
  '/moderator/dashboard',
  '/moderator/settings',
  '/moderator/server-assignments',
  '/moderator/audit-log',
  '/moderator/polls',
  '/moderator/changelog',
];

// Pages that should show limited navigation (back to home only)
const SHOW_LIMITED_NAV = [
  '/moderator/login',
];

// Pages with no navigation at all
const NO_NAV_PAGES = [
  '/',
  '/apply',
];

// Hidden pages (Easter eggs) - no nav
const HIDDEN_PAGES = [
  '/secret-proposal',
  '/secret-valentine',
  '/dev-secrets',
  '/troll-detected',
  '/sian-appreciation',
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const currentPath = location.pathname;
  
  // Don't show nav on Easter egg pages or no-nav pages
  if (HIDDEN_PAGES.includes(currentPath) || NO_NAV_PAGES.includes(currentPath)) {
    return null;
  }
  
  const isLoggedIn = !!localStorage.getItem('moderator_token');
  const showFullNav = SHOW_NAV_ROUTES.includes(currentPath);
  const showLimitedNav = SHOW_LIMITED_NAV.includes(currentPath);
  
  // Check if we can go back (has history)
  const canGoBack = window.history.length > 1;
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('moderator_token');
    localStorage.removeItem('moderator_role');
    localStorage.removeItem('moderator_username');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/moderator/portal', label: 'Portal', icon: Home, color: 'text-amber-500' },
    { path: '/moderator/dashboard', label: 'Apps', icon: FileText, color: 'text-amber-400' },
    { path: '/moderator/server-assignments', label: 'Servers', icon: Calendar, color: 'text-emerald-400' },
    { path: '/moderator/polls', label: 'Polls', icon: BarChart3, color: 'text-cyan-400' },
    { path: '/moderator/audit-log', label: 'Audit', icon: ClipboardList, color: 'text-orange-400' },
    { path: '/moderator/settings', label: 'Settings', icon: Settings, color: 'text-slate-400' },
    { path: '/moderator/changelog', label: 'Changelog', icon: ScrollText, color: 'text-purple-400' },
  ];

  // For limited nav pages (landing, apply, login)
  if (showLimitedNav) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile Back Button */}
              {canGoBack && currentPath !== '/' && (
                <Button
                  onClick={handleGoBack}
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-slate-400 hover:text-slate-200 p-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors"
              >
                <Shield className="w-6 h-6" />
                <span className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  TW APPLICATIONS
                </span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {currentPath !== '/apply' && (
                <Button
                  onClick={() => navigate('/apply')}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Apply
                </Button>
              )}
              {currentPath !== '/moderator/login' && (
                <Button
                  onClick={() => navigate('/moderator/login')}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm"
                >
                  {isLoggedIn ? 'Portal' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // For full nav pages (moderator pages)
  if (showFullNav && isLoggedIn) {
    return (
      <>
        {/* Desktop Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 hidden md:block">
          <div className="max-w-6xl mx-auto px-6 py-2">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate('/moderator/portal')}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors"
              >
                <Shield className="w-6 h-6" />
                <span className="font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  TOP WAR PORTAL
                </span>
              </button>
              
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    variant="ghost"
                    size="sm"
                    className={`${
                      currentPath === item.path 
                        ? `${item.color} bg-slate-800` 
                        : 'text-slate-400 hover:text-slate-200'
                    } text-xs`}
                  >
                    <item.icon className="w-4 h-4 mr-1" />
                    {item.label}
                  </Button>
                ))}
                
                <div className="w-px h-6 bg-slate-700 mx-2" />
                
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-400 text-xs"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 md:hidden">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mobile Back Button */}
                {canGoBack && (
                  <Button
                    onClick={handleGoBack}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <button 
                  onClick={() => navigate('/moderator/portal')}
                  className="flex items-center gap-2 text-amber-500"
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-bold text-sm" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    TW PORTAL
                  </span>
                </button>
              </div>
              
              <Button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="bg-slate-900 border-t border-slate-800 px-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    size="sm"
                    className={`justify-start ${
                      currentPath === item.path 
                        ? `${item.color} bg-slate-800` 
                        : 'text-slate-400'
                    } text-xs`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                ))}
              </div>
              <div className="border-t border-slate-800 mt-2 pt-2">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-slate-400 hover:text-red-400 text-xs"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Spacer to prevent content from going under fixed nav */}
        <div className="h-12" />
      </>
    );
  }

  return null;
}
