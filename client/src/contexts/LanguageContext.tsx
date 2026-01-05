import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh_TW' | 'zh_CN' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh_TW');

  // 简单的翻译字典，实际项目中可以从JSON文件加载
  const translations: Record<string, Record<Language, string>> = {
    'nav.home': { zh_TW: '首頁', zh_CN: '首页', en: 'Home' },
    'nav.about': { zh_TW: '關於我們', zh_CN: '关于我们', en: 'About Us' },
    'nav.projects': { zh_TW: '投資項目', zh_CN: '投资项目', en: 'Projects' },
    'nav.contact': { zh_TW: '聯繫我們', zh_CN: '联系我们', en: 'Contact' },
    'footer.rights': { zh_TW: '版權所有', zh_CN: '版权所有', en: 'All Rights Reserved' },
    'footer.risk': { zh_TW: '投資有風險，入市需謹慎', zh_CN: '投资有风险，入市需谨慎', en: 'Investment involves risk, please be cautious' },
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
