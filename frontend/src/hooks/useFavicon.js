import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Map routes to their favicon files
const FAVICON_MAP = {
  '/': '/favicons/landing.svg',
  '/apply': '/favicons/apply.svg',
  '/moderator/login': '/favicons/login.svg',
  '/moderator/reset-password': '/favicons/login.svg',
  '/moderator/portal': '/favicons/portal.svg',
  '/moderator/dashboard': '/favicons/dashboard.svg',
  '/moderator/settings': '/favicons/settings.svg',
  '/moderator/server-assignments': '/favicons/servers.svg',
  '/moderator/audit-log': '/favicons/audit.svg',
  '/moderator/polls': '/favicons/polls.svg',
  '/moderator/changelog': '/favicons/changelog.svg',
  '/secret-proposal': '/favicons/proposal.svg',
  '/secret-valentine': '/favicons/valentine.svg',
  '/dev-secrets': '/favicons/developer.svg',
  '/troll-detected': '/favicons/troll.svg',
  '/garuda-tribute': '/favicons/garuda.svg',
};

// Map routes to their page titles
const TITLE_MAP = {
  '/': 'TW Applications',
  '/apply': 'Apply Now | TW Applications',
  '/moderator/login': 'Moderator Login | TW Applications',
  '/moderator/reset-password': 'Reset Password | TW Applications',
  '/moderator/portal': 'Moderator Portal | TW Applications',
  '/moderator/dashboard': 'Dashboard | TW Applications',
  '/moderator/settings': 'Settings | TW Applications',
  '/moderator/server-assignments': 'Server Assignments | TW Applications',
  '/moderator/audit-log': 'Audit Log | TW Applications',
  '/moderator/polls': 'Polls | TW Applications',
  '/moderator/changelog': 'Changelog | TW Applications',
  '/secret-proposal': '💕',
  '/secret-valentine': '💖',
  '/dev-secrets': '🔐 CLASSIFIED',
  '/troll-detected': '🤡 BUSTED',
  '/garuda-tribute': '🦅 Garuda | TW Champion',
};

export default function useFavicon() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    
    // Get favicon for current route, fallback to landing
    const faviconPath = FAVICON_MAP[path] || '/favicons/landing.svg';
    const title = TITLE_MAP[path] || 'TW Applications';
    
    // Update favicon
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = faviconPath;
    
    // Update title
    document.title = title;
  }, [location.pathname]);
}
