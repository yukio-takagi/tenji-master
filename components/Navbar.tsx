
import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'study', label: '学習', icon: '📖' },
    { id: 'converter', label: '翻訳', icon: '⚡' },
    { id: 'quiz', label: 'クイズ', icon: '🎯' },
    { id: 'tutor', label: 'AIチューター', icon: '🤖' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="hidden md:flex items-center gap-2 mr-auto font-bold text-indigo-600 text-xl">
        <span>⠞⠑⠝⠚⠊</span>
        TenjiMaster
      </div>
      <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 transition-colors ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="text-xl md:text-lg">{tab.icon}</span>
            <span className="text-xs md:text-base font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="w-1 h-1 rounded-full bg-indigo-600 md:hidden"></div>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
