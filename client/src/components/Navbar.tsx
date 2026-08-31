import React, { useState, useRef, useEffect } from 'react';
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
  Users,
  Layers,
  ChevronDown,
  Search
} from 'lucide-react';
import { User, Tournament } from '../types';

interface NavbarProps {
  currentView: 'spectator' | 'admin';
  setCurrentView: (view: 'spectator' | 'admin') => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  myTournaments: Tournament[];
  adminTournamentId: string;
  onSelectAdminTournament: (id: string) => void;
  onOpenCreateTournament: () => void;
  onOpenTournamentList: () => void;
  spectatorShareCode?: string;
  spectatorTournamentTitle?: string;
  onExitSpectatorToGate?: () => void;
  isSseConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  onOpenLogin,
  onLogout,
  myTournaments,
  adminTournamentId,
  onSelectAdminTournament,
  onOpenCreateTournament,
  onOpenTournamentList,
  spectatorShareCode,
  spectatorTournamentTitle,
  onExitSpectatorToGate,
  isSseConnected,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tournamentSearch, setTournamentSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentAdminTournament = myTournaments.find((t) => t.id === adminTournamentId);

  const filteredTournaments = myTournaments.filter((t) =>
    t.title.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
    t.shareCode.toLowerCase().includes(tournamentSearch.toLowerCase())
  );

  const activeShareCode = currentView === 'admin' 
    ? myTournaments.find((t) => t.id === adminTournamentId)?.shareCode
    : spectatorShareCode;

  const handleCopyShareLink = () => {
    if (!activeShareCode) return;
    const url = `${window.location.origin}/?v=${activeShareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-tft-border/40 backdrop-blur-xl">
      <div className="max-w-[1700px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Context Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={() => {
              if (currentView === 'spectator' && onExitSpectatorToGate) {
                onExitSpectatorToGate();
              } else {
                setCurrentView('spectator');
              }
            }}
            title="返回观赛大屏 / 首页"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
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

          {/* Context Header: Admin Tournament Switcher vs Spectator Info */}
          <div className="flex items-center gap-2">
            {currentView === 'admin' && currentUser ? (
              <>
                {myTournaments.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                        isDropdownOpen
                          ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-700/60 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="text-xs text-slate-400 font-medium hidden sm:inline">管理赛事:</span>
                      
                      <div className="flex items-center gap-1.5 max-w-[140px] sm:max-w-[200px] md:max-w-[280px]">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          currentAdminTournament?.status === 'IN_PROGRESS'
                            ? 'bg-emerald-400 animate-pulse'
                            : currentAdminTournament?.status === 'COMPLETED'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`} />
                        <span className="text-xs sm:text-sm font-bold text-amber-300 truncate">
                          {currentAdminTournament?.title || '请选择赛事'}
                        </span>
                        {currentAdminTournament && (
                          <span className="hidden lg:inline px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0">
                            {currentAdminTournament.totalPlayers}人
                          </span>
                        )}
                      </div>

                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-amber-400' : ''
                      }`} />
                    </button>

                    {/* Floating Custom Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                        {myTournaments.length > 3 && (
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={tournamentSearch}
                              onChange={(e) => setTournamentSearch(e.target.value)}
                              placeholder="搜索赛事名称或观赛码..."
                              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                              autoFocus
                            />
                          </div>
                        )}

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {filteredTournaments.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-500 font-mono">
                              未找到匹配的赛事
                            </div>
                          ) : (
                            filteredTournaments.map((t) => {
                              const isSelected = t.id === adminTournamentId;
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    onSelectAdminTournament(t.id);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                                    isSelected
                                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-sm'
                                      : 'hover:bg-slate-800/80 border border-transparent text-slate-300'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        t.status === 'IN_PROGRESS'
                                          ? 'bg-emerald-400'
                                          : t.status === 'COMPLETED'
                                          ? 'bg-amber-400'
                                          : 'bg-slate-500'
                                      }`} />
                                      <span className="font-bold text-xs truncate">
                                        {t.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-3">
                                      <span>{t.totalPlayers} 人赛</span>
                                      <span>•</span>
                                      <span>码: <span className="text-amber-400/90 font-bold">{t.shareCode}</span></span>
                                      <span>•</span>
                                      <span className={
                                        t.status === 'IN_PROGRESS'
                                          ? 'text-emerald-400'
                                          : t.status === 'COMPLETED'
                                          ? 'text-amber-300'
                                          : 'text-slate-500'
                                      }>
                                        {t.status === 'IN_PROGRESS' ? '进行中' : t.status === 'COMPLETED' ? '已完赛' : '草稿'}
                                      </span>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="pt-1.5 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onOpenTournamentList();
                            }}
                            className="w-full py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-purple-950/40 hover:text-purple-300 border border-slate-700/50 text-slate-400 font-medium text-center transition-all flex items-center justify-center gap-1.5 text-xs"
                          >
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            <span>查看全部赛事大厅 ({myTournaments.length})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onOpenTournamentList}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all shadow-sm"
                  title="查看赛事大厅并进行综合管理"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">赛事大厅 ({myTournaments.length})</span>
                </button>
              </>
            ) : (
              spectatorShareCode ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs font-mono text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-slate-400 hidden sm:inline">观赛中:</span>
                  <span className="text-amber-300 font-bold max-w-[120px] sm:max-w-[200px] truncate">
                    {spectatorTournamentTitle || spectatorShareCode}
                  </span>
                  {onExitSpectatorToGate && (
                    <button
                      type="button"
                      onClick={onExitSpectatorToGate}
                      className="ml-1 text-[11px] text-purple-400 hover:text-purple-300 font-bold underline"
                      title="输入其他观赛码"
                    >
                      更换
                    </button>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>观赛码接入大厅</span>
                </div>
              )
            )}
          </div>
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
            <span className="relative flex h-2 w-2">
              {isSseConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSseConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'}`} />
            </span>
            <span className={`text-xs font-mono font-semibold ${isSseConnected ? 'text-emerald-300' : 'text-slate-400'}`}>
              {isSseConnected ? 'LIVE 实时推流' : '离线'}
            </span>
          </div>

          {/* Share Code Button */}
          {activeShareCode && (
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-xs font-medium text-amber-300 transition-all"
              title="复制观赛分享链接"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-mono text-[11px]">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold text-[11px]">{activeShareCode}</span>
                </>
              )}
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
