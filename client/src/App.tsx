import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SpectatorDashboard } from './pages/SpectatorDashboard';
import { SpectatorCodeGate } from './components/SpectatorCodeGate';
import { AdminWorkbench } from './pages/AdminWorkbench';
import { TournamentBuilderModal } from './components/TournamentBuilderModal';
import { TournamentListModal } from './components/TournamentListModal';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { authApi, tournamentApi, publicApi } from './services/api';
import { User, Tournament } from './types';
import { getUrlNavState, updateUrlNavState } from './services/urlState';

import { ShieldAlert, Trophy, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const initialNav = getUrlNavState();
  const [currentView, setCurrentView] = useState<'spectator' | 'admin'>(initialNav.view || 'spectator');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 1. 公开赛事列表（用于观赛大厅/观赛码选择）与当前大屏观赛分享码（游客与登录用户均可任意观看）
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [spectatorShareCode, setSpectatorShareCode] = useState<string>(initialNav.share || '');
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // 2. 当前登录用户有权限管理的赛事列表与当前管理中的赛事 ID
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [adminTournamentId, setAdminTournamentId] = useState<string>('');

  // 模态框与连接状态
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isTournamentListOpen, setIsTournamentListOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(false);

  // 获取公开赛事列表（供大屏观赛与首页快捷卡片）
  const fetchPublicTournaments = useCallback(async () => {
    try {
      const list = await publicApi.listTournaments();
      setPublicTournaments(list);

      // 智能默认选择：如果未在 URL 中指定观赛码且系统存在比赛，自动载入最新/进行中的公开赛事
      setSpectatorShareCode((prev) => {
        if (prev) return prev;
        const initialShare = getUrlNavState().share;
        if (initialShare) return initialShare;
        if (list.length > 0) {
          const activeT = list.find((t) => t.status === 'IN_PROGRESS') || list[0];
          return activeT.shareCode;
        }
        return '';
      });
    } catch (e) {
      console.error('Fetch public tournaments error:', e);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // 获取当前登录用户可管理的赛事列表
  const fetchMyTournaments = useCallback(async () => {
    const token = localStorage.getItem('satoken');
    if (!token) {
      setMyTournaments([]);
      setAdminTournamentId('');
      return;
    }
    try {
      const list = await tournamentApi.list();
      setMyTournaments(list);
      if (list.length > 0) {
        setAdminTournamentId((prev) => {
          if (prev && list.some((t) => t.id === prev)) {
            return prev;
          }
          return list[0].id;
        });
      } else {
        setAdminTournamentId('');
      }
    } catch (e) {
      console.error('Fetch my tournaments error:', e);
      setMyTournaments([]);
      setAdminTournamentId('');
    }
  }, []);

  // 初始化鉴权
  useEffect(() => {
    const token = localStorage.getItem('satoken');
    if (token) {
      authApi.getInfo()
        .then((user) => {
          setCurrentUser(user);
          fetchMyTournaments();
        })
        .catch(() => {
          localStorage.removeItem('satoken');
          setCurrentUser(null);
          setMyTournaments([]);
          setAdminTournamentId('');
          if (initialNav.view === 'admin') {
            setCurrentView('spectator');
            updateUrlNavState({ view: 'spectator' });
          }
        });
    } else if (initialNav.view === 'admin') {
      setIsLoginOpen(true);
    }
    fetchPublicTournaments();
  }, [fetchMyTournaments, fetchPublicTournaments]);

  const activeShareCode = currentView === 'admin'
    ? myTournaments.find((t) => t.id === adminTournamentId)?.shareCode
    : spectatorShareCode;

  // 全局网络与 SSE 推流连通性动态监测
  useEffect(() => {
    const handleOnline = () => {
      if (!activeShareCode) setIsSseConnected(true);
    };
    const handleOffline = () => setIsSseConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!activeShareCode) {
      setIsSseConnected(navigator.onLine);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let eventSource: EventSource | null = null;
    let retryTimer: any = null;

    const connectSse = () => {
      if (!activeShareCode) return;
      try {
        eventSource = publicApi.createEventSource(activeShareCode);

        eventSource.onopen = () => {
          setIsSseConnected(true);
        };

        eventSource.addEventListener('CONNECT', () => {
          setIsSseConnected(true);
        });

        eventSource.addEventListener('HEARTBEAT', () => {
          setIsSseConnected(true);
        });

        eventSource.onerror = () => {
          setIsSseConnected(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          retryTimer = setTimeout(connectSse, 4000);
        };
      } catch (e) {
        setIsSseConnected(false);
      }
    };

    connectSse();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimer) clearTimeout(retryTimer);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [activeShareCode]);

  // URL 状态实时双向同步（仅维护 share 短码与非初赛 stage 参数，首页无参）
  useEffect(() => {
    const activeShare = currentView === 'admin'
      ? myTournaments.find((t) => t.id === adminTournamentId)?.shareCode
      : spectatorShareCode;
    updateUrlNavState({ share: activeShare || undefined });
  }, [currentView, spectatorShareCode, adminTournamentId, myTournaments]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('satoken');
    setCurrentUser(null);
    setMyTournaments([]);
    setAdminTournamentId('');
    setCurrentView('spectator');
    setSpectatorShareCode('');
    updateUrlNavState({ share: undefined, stage: undefined });
  };

  // 通过观赛码进入观赛大屏（全员可用）
  const handleEnterWithShareCode = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;
    setSpectatorShareCode(cleanCode);
    setCurrentView('spectator');
    updateUrlNavState({ share: cleanCode, stage: undefined });
    return true;
  };

  // 从大屏退出回观赛码输入大厅
  const handleExitSpectatorToGate = () => {
    setSpectatorShareCode('');
    updateUrlNavState({ share: undefined, stage: undefined });
  };

  // 创建新赛事
  const handleCreateTournament = async (title: string, totalPlayers: number, stages: any[]) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    const res = await tournamentApi.create({
      title,
      totalPlayers,
      stages,
    });
    await Promise.all([fetchMyTournaments(), fetchPublicTournaments()]);
    setAdminTournamentId(res.id);
    setCurrentView('admin');
    updateUrlNavState({ share: res.shareCode, stage: undefined });
  };

  // 删除赛事
  const handleDeleteTournament = async (tId: string) => {
    await tournamentApi.delete(tId);
    await Promise.all([fetchMyTournaments(), fetchPublicTournaments()]);
  };

  const spectatorTournamentTitle = publicTournaments.find(
    (t) => t.shareCode.toUpperCase() === spectatorShareCode.toUpperCase()
  )?.title;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0b0d1b] text-slate-100 selection:bg-purple-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'admin' && !currentUser) {
            setIsLoginOpen(true);
            return;
          }
          setCurrentView(view);
        }}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        myTournaments={myTournaments}
        adminTournamentId={adminTournamentId}
        onSelectAdminTournament={(id) => setAdminTournamentId(id)}
        onOpenCreateTournament={() => {
          if (!currentUser) {
            setIsLoginOpen(true);
          } else {
            setIsBuilderOpen(true);
          }
        }}
        onOpenTournamentList={() => setIsTournamentListOpen(true)}
        spectatorShareCode={spectatorShareCode}
        spectatorTournamentTitle={spectatorTournamentTitle}
        onExitSpectatorToGate={handleExitSpectatorToGate}
        isSseConnected={isSseConnected}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isInitialLoading ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-xs font-mono text-slate-400">正在接入赛事全景系统...</span>
          </div>
        ) : currentView === 'spectator' ? (
          spectatorShareCode ? (
            <SpectatorDashboard shareCode={spectatorShareCode} />
          ) : (
            <SpectatorCodeGate
              tournaments={publicTournaments}
              onEnterWithShareCode={handleEnterWithShareCode}
              onOpenLogin={() => setIsLoginOpen(true)}
            />
          )
        ) : !currentUser ? (
          <div className="max-w-md mx-auto my-24 p-8 glass-panel rounded-3xl text-center space-y-5 border-amber-500/30 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xl text-slate-100">请先登录管理账号</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                赛事管理中台仅对超级管理员或赛事主办方开放，普通观众请在“观赛大屏”实时观看比赛。
              </p>
            </div>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="btn-primary mx-auto py-2.5 px-5 text-sm"
            >
              立即登录 / 注册
            </button>
          </div>
        ) : (
          <AdminWorkbench
            tournamentId={adminTournamentId}
            currentUser={currentUser}
            onOpenCreateTournament={() => setIsBuilderOpen(true)}
            onDeleteTournament={handleDeleteTournament}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs font-mono text-slate-500">
        TFT-TourneyOS 云顶之弈多阶段电竞赛事管理中台 © 2026
      </footer>

      {/* Modals */}
      <TournamentBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSubmit={handleCreateTournament}
      />

      <TournamentListModal
        isOpen={isTournamentListOpen}
        onClose={() => setIsTournamentListOpen(false)}
        tournaments={myTournaments}
        selectedTournamentId={adminTournamentId}
        onSelectTournament={(id) => {
          setAdminTournamentId(id);
          setCurrentView('admin');
          updateUrlNavState({ view: 'admin' });
        }}
        onDeleteTournament={handleDeleteTournament}
        onOpenCreateTournament={() => {
          if (!currentUser) {
            setIsLoginOpen(true);
          } else {
            setIsBuilderOpen(true);
          }
        }}
        onOpenLogin={() => setIsLoginOpen(true)}
        currentUser={currentUser}
        onSwitchToSpectator={(shareCode) => {
          setSpectatorShareCode(shareCode);
          setCurrentView('spectator');
          updateUrlNavState({ view: 'spectator', share: shareCode });
        }}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          fetchMyTournaments();
          fetchPublicTournaments();
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
