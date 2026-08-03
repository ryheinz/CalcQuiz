import React from 'react';
import { Calculator, HelpCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'calculator' | 'quiz';
  onTabChange: (tab: 'calculator' | 'quiz') => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tighter">CalcRoom</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-14 mb-16 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 bg-background/80 backdrop-blur-md border-t border-outline-variant flex justify-around items-center h-16 pb-safe">
        <button
          onClick={() => onTabChange('calculator')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
            activeTab === 'calculator' ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Calculator className={cn("w-6 h-6", activeTab === 'calculator' && "fill-primary/20")} />
          <span className="text-[11px] font-medium">Calculator</span>
        </button>
        <button
          onClick={() => onTabChange('quiz')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
            activeTab === 'quiz' ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <HelpCircle className={cn("w-6 h-6", activeTab === 'quiz' && "fill-primary/20")} />
          <span className="text-[11px] font-medium">Quiz</span>
        </button>
      </nav>
    </div>
  );
}
