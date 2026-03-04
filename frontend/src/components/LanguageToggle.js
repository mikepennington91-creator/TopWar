import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="language-toggle">
      <button
        onClick={() => setLanguage(LANGUAGES.EN)}
        className={`w-8 h-6 rounded-sm overflow-hidden border-2 transition-all hover:scale-110 ${
          language === LANGUAGES.EN 
            ? 'border-amber-500 shadow-lg shadow-amber-500/30' 
            : 'border-slate-600 opacity-60 hover:opacity-100'
        }`}
        title="English"
        data-testid="lang-en-btn"
      >
        {/* Great Britain Flag */}
        <svg viewBox="0 0 60 30" className="w-full h-full">
          {/* Blue background */}
          <clipPath id="t">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
          </clipPath>
          <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
          {/* White diagonals */}
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
          {/* Red diagonals (clipped) */}
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#t)"/>
          {/* White cross */}
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
          {/* Red cross */}
          <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
        </svg>
      </button>
      
      <button
        onClick={() => setLanguage(LANGUAGES.JA)}
        className={`w-8 h-6 rounded-sm overflow-hidden border-2 transition-all hover:scale-110 ${
          language === LANGUAGES.JA 
            ? 'border-amber-500 shadow-lg shadow-amber-500/30' 
            : 'border-slate-600 opacity-60 hover:opacity-100'
        }`}
        title="日本語"
        data-testid="lang-ja-btn"
      >
        {/* Japan Flag */}
        <svg viewBox="0 0 60 40" className="w-full h-full">
          {/* White background */}
          <rect width="60" height="40" fill="#fff"/>
          {/* Red circle (sun) */}
          <circle cx="30" cy="20" r="12" fill="#BC002D"/>
        </svg>
      </button>
    </div>
  );
}
