import React, { useState } from 'react';
import { 
  Trophy, 
  ShieldCheck, 
  Tv, 
  Copy, 
  Check, 
  LogIn, 
  LogOut, 
  Radio, 
  PlusCircle,
  Users
} from 'lucide-react';
import { User, Tournament } from '../types';

interface NavbarProps {
  currentView: 'spectator' | 'admin';
  setCurrentView: (view: 'spectator' | 'admin') => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournament: (id: string) => void;
  onOpenCreateTournament: () => void;
  isSseConnected: boolean;
  shareCode?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  onOpenLogin,
  onLogout,
  tournaments,
  selectedTournamentId,
  onSelectTournament,
  onOpenCreateTournament,
  isSseConnected,
  shareCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    if (!shareCode) return;
    const url = `${window.location.origin}/?share=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-tft-border/40 backdrop-blur-xl">
      <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Tournament Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('spectator')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0b0d1b] rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
                TFT-TourneyOS
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                云顶之弈赛事系统
              </div>
            </div>
          </div>

          {/* Tournament Switcher */}
          {tournaments.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 rounded-lg px-2.5 py-1">
              <span className="text-xs text-slate-400 hidden sm:inline">选择比赛:</span>
              <select
                value={selectedTournamentId}
                onChange={(e) => onSelectTournament(e.target.value)}
                className="bg-transparent text-sm font-semibold text-amber-300 focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.title} ({t.totalPlayers}人)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center: Main View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setCurrentView('spectator')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'spectator'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>观赛大屏</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenLogin();
              } else {
                setCurrentView('admin');
              }
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>管理中台</span>
          </button>
        </div>

        {/* Right: Live Indicator, Share Link, User Profile */}
        <div className="flex items-center gap-3">
          {/* SSE Live Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/50">
            <span className={`w-2 h-2 rounded-full ${isSseConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono text-slate-300">
              {isSseConnected ? 'LIVE 实时推流' : '离线'}
            </span>
          </div>

          {/* Share Code Button */}
          {shareCode && (
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-xs font-medium text-amber-300 transition-all"
              title="复制大屏观赛链接"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : `分享码: ${shareCode}`}</span>
            </button>
          )}

          {/* Create Tournament CTA for Organizers */}
          {currentUser && (
            <button
              onClick={onOpenCreateTournament}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>新建比赛</span>
            </button>
          )}

          {/* User Auth Info */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-200">{currentUser.username}</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {currentUser.role === 'SUPER_ADMIN' ? '超级管理员' : '赛事主办方'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>登录 / 注册</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
