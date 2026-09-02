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
  Search,
  KeyRound
} from 'lucide-react';
import { User, Tournament } from '../types';

interface NavbarProps {
  currentView: 'spectator' | 'admin' | 'signup';
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
  onOpenChangePassword?: () => void;
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
  onOpenChangePassword,
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

  const currentAdminTournament = (myTournaments || []).find((t) => t.id === adminTournamentId);

  const filteredTournaments = (myTournaments || []).filter((t) =>
    (t.title || '').toLowerCase().includes(tournamentSearch.toLowerCase()) ||
    (t.shareCode || '').toLowerCase().includes(tournamentSearch.toLowerCase())
  );

  const activeShareCode = currentView === 'admin' 
    ? currentAdminTournament?.shareCode
    : spectatorShareCode;

  const handleCopyShareLink = () => {
    if (!activeShareCode) return;
    const url = `${window.location.origin}/?v=${activeShareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-tft-border/40 backdrop-blur-xl bg-[#0b0d1b]/95">
      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3 relative">
        {/* Left: Brand Logo & Context Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group shrink-0 select-none" 
            onClick={() => {
              if (currentView === 'spectator' && onExitSpectatorToGate) {
                onExitSpectatorToGate();
              } else {
                setCurrentView('spectator');
              }
            }}
            title="返回观赛大屏 / 首页"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-purple-600 p-[1px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#0b0d1b] rounded-xl flex items-center justify-center">
                <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
              </div>
            </div>
            <div className="shrink-0">
              <div className="font-extrabold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
                TFT-TourneyOS
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider whitespace-nowrap">
                云顶赛事
              </div>
            </div>
          </div>

          {/* Context Header: Admin Tournament Switcher vs Spectator Info */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {currentView === 'admin' && currentUser ? (
              <>
                {myTournaments && myTournaments.length > 0 && (
                  <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap shrink-0 text-xs sm:text-sm font-sans shadow-sm ${
                        isDropdownOpen
                          ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-700/80 hover:border-amber-500/40'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        currentAdminTournament?.status === 'IN_PROGRESS'
                          ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/60'
                          : currentAdminTournament?.status === 'COMPLETED'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`} />
                      <span className="text-slate-400 font-bold whitespace-nowrap">当前管理:</span>
                      <span className="text-amber-300 font-extrabold max-w-[160px] sm:max-w-[320px] md:max-w-[420px] truncate whitespace-nowrap">
                        {currentAdminTournament?.title || '选择赛事'}
                      </span>
                      {currentAdminTournament && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] sm:text-xs font-mono font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0 whitespace-nowrap">
                          {currentAdminTournament.totalPlayers}人
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-amber-400' : ''
                      }`} />
                    </button>

                    {/* Floating Custom Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 top-[calc(100%+14px)] sm:top-[calc(100%+18px)] w-80 sm:w-96 rounded-2xl bg-[#0c1024] border border-slate-700 shadow-2xl shadow-black z-[100] p-2.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10">
                        {myTournaments.length > 3 && (
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={tournamentSearch}
                              onChange={(e) => setTournamentSearch(e.target.value)}
                              placeholder="搜索赛事名称或观赛码..."
                              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
                              autoFocus
                            />
                          </div>
                        )}

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {filteredTournaments.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400 font-mono">
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
                                      ? 'bg-amber-400/15 border border-amber-400/50 text-amber-200 shadow-sm'
                                      : 'hover:bg-slate-800/90 border border-transparent text-slate-200 hover:border-slate-700'
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
                                      <span className="font-bold text-xs truncate whitespace-nowrap">
                                        {t.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pl-3 whitespace-nowrap">
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
                            className="w-full py-1.5 px-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 hover:text-purple-200 border border-purple-500/40 text-purple-300 font-bold text-center transition-all flex items-center justify-center gap-1.5 text-xs whitespace-nowrap shadow-sm"
                          >
                            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>查看全部赛事大厅 ({myTournaments.length})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onOpenTournamentList}
                  className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-xs font-semibold text-purple-200 transition-all shadow-sm whitespace-nowrap shrink-0"
                  title="查看赛事大厅并进行综合管理"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="whitespace-nowrap">大厅 ({myTournaments.length})</span>
                </button>
              </>
            ) : (
              spectatorShareCode ? (
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm font-sans text-slate-300 shrink-0 whitespace-nowrap shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-sm shadow-cyan-400/60" />
                  <span className="text-slate-400 font-bold whitespace-nowrap">当前观赛:</span>
                  <span className="text-amber-300 font-extrabold max-w-[160px] sm:max-w-[320px] md:max-w-[420px] truncate whitespace-nowrap">
                    {spectatorTournamentTitle || '赛事进行中'}
                  </span>
                  {onExitSpectatorToGate && (
                    <button
                      type="button"
                      onClick={onExitSpectatorToGate}
                      className="text-xs text-purple-400 hover:text-purple-300 font-bold underline shrink-0 whitespace-nowrap ml-1"
                      title="切换其他赛事"
                    >
                      更换
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm font-mono text-slate-400 shrink-0 whitespace-nowrap">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                  <span className="whitespace-nowrap font-bold">观赛大厅</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Center: Main View Switcher Tabs */}
        <div className="flex items-center bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-slate-700/60 shadow-inner shrink-0">
          <button
            onClick={() => setCurrentView('spectator')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-lg text-xs sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              currentView === 'spectator'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">观赛大屏</span>
          </button>
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenLogin();
              } else {
                setCurrentView('admin');
              }
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-lg text-xs sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">管理中台</span>
          </button>
        </div>

        {/* Right: Live Indicator, Share Link, User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* SSE Live Indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-slate-900/60 border border-slate-700/50 shrink-0 whitespace-nowrap">
            <span className="relative flex h-2 w-2 shrink-0">
              {isSseConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSseConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'}`} />
            </span>
            <span className={`text-[10px] sm:text-xs font-mono font-semibold whitespace-nowrap ${isSseConnected ? 'text-emerald-300' : 'text-slate-400'}`}>
              {isSseConnected ? 'LIVE' : '离线'}
            </span>
          </div>

          {/* Share Code Button */}
          {activeShareCode && (
            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/40 text-xs font-medium text-amber-300 transition-all shrink-0 whitespace-nowrap"
              title="复制观赛分享链接"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-mono text-[11px] whitespace-nowrap">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono font-bold text-[11px] whitespace-nowrap">{activeShareCode}</span>
                </>
              )}
            </button>
          )}

          {/* Create Tournament CTA for Organizers */}
          {currentUser && (
            <button
              onClick={onOpenCreateTournament}
              className="flex items-center gap-1 btn-primary py-1 px-2 sm:px-2.5 text-xs shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">新建</span>
            </button>
          )}

          {/* User Auth Info (Never Hidden, Scales Gracefully) */}
          {currentUser ? (
            <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 border-l border-slate-700/60 shrink-0">
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[70px] sm:max-w-[100px] whitespace-nowrap">
                  {currentUser.username}
                </div>
                <div className="text-[9px] sm:text-[10px] text-amber-400 font-mono whitespace-nowrap leading-none">
                  {currentUser.role === 'SUPER_ADMIN' ? '超管' : '主办方'}
                </div>
              </div>

              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={onOpenChangePassword}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-950/40 text-slate-300 hover:text-amber-300 border border-slate-700/60 text-xs font-medium transition-all shrink-0 whitespace-nowrap shadow-sm"
                  title="修改登录密码"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>改密</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 text-xs font-medium transition-all shrink-0 whitespace-nowrap shadow-sm"
                title="退出登录"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>退出</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all shrink-0 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">登录</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
