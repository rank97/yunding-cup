import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SpectatorDashboard } from './pages/SpectatorDashboard';
import { AdminWorkbench } from './pages/AdminWorkbench';
import { TournamentBuilderModal } from './components/TournamentBuilderModal';
import { LoginModal } from './components/LoginModal';
import { authApi, tournamentApi, publicApi, stageApi } from './services/api';
import { User, Tournament } from './types';
import { getUrlNavState, updateUrlNavState } from './services/urlState';

export const App: React.FC = () => {
  const initialNav = getUrlNavState();
  const [currentView, setCurrentView] = useState<'spectator' | 'admin'>(initialNav.view || 'spectator');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSseConnected, setIsSseConnected] = useState(false);

  // Check login state
  useEffect(() => {
    const token = localStorage.getItem('satoken');
    if (token) {
      authApi.getInfo()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('satoken');
          setCurrentUser(null);
          // 如果未登录且当前在 admin 视图，自动回退到 spectator
          if (initialNav.view === 'admin') {
            setCurrentView('spectator');
            updateUrlNavState({ view: 'spectator' });
          }
        });
    } else if (initialNav.view === 'admin') {
      // 未登录直接访问 ?view=admin 自动弹出登录窗
      setIsLoginOpen(true);
    }
  }, []);

  // Fetch tournaments (支持游客公开列表与管理员全部列表)
  const fetchTournaments = useCallback(async () => {
    try {
      let list: Tournament[] = [];
      const token = localStorage.getItem('satoken');
      if (token) {
        list = await tournamentApi.list();
      } else {
        list = await publicApi.listTournaments();
      }
      setTournaments(list);

      if (list.length > 0) {
        const nav = getUrlNavState();
        if (nav.share) {
          const match = list.find((t) => t.shareCode.toUpperCase() === nav.share?.toUpperCase());
          if (match) {
            setSelectedTournamentId(match.id);
            return;
          }
        }
        if (!selectedTournamentId) {
          setSelectedTournamentId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Fetch tournaments error:', e);
    }
  }, [selectedTournamentId]);

  // 挂载时立即拉取赛事列表
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  // 状态变更时自动同步到 URL 参数
  useEffect(() => {
    if (selectedTournament) {
      updateUrlNavState({
        view: currentView,
        share: selectedTournament.shareCode,
      });
    }
  }, [currentView, selectedTournament]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('satoken');
    setCurrentUser(null);
    setCurrentView('spectator');
    updateUrlNavState({ view: 'spectator' });
  };

  const handleCreateTournament = async (title: string, totalPlayers: number, stages: any[]) => {
    const res = await tournamentApi.create({
      title,
      totalPlayers,
      stages,
    });
    await fetchTournaments();
    setSelectedTournamentId(res.id);
    setCurrentView('admin');
    updateUrlNavState({ view: 'admin', share: res.shareCode });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0b0d1b] text-slate-100 selection:bg-purple-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        tournaments={tournaments}
        selectedTournamentId={selectedTournamentId}
        onSelectTournament={(id) => setSelectedTournamentId(id)}
        onOpenCreateTournament={() => setIsBuilderOpen(true)}
        isSseConnected={isSseConnected}
        shareCode={selectedTournament?.shareCode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'spectator' ? (
          selectedTournament ? (
            <SpectatorDashboard shareCode={selectedTournament.shareCode} />
          ) : (
            <div className="max-w-md mx-auto my-24 p-8 glass-panel rounded-2xl text-center space-y-4">
              <h3 className="font-bold text-lg text-slate-200">欢迎来到 TFT-TourneyOS</h3>
              <p className="text-xs text-slate-400">
                当前尚未创建任何比赛。请登录管理员账号创建第一场比赛，或输入比赛分享码。
              </p>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="btn-primary mx-auto"
              >
                管理员登录 / 初始化
              </button>
            </div>
          )
        ) : (
          <AdminWorkbench
            tournamentId={selectedTournamentId}
            onOpenCreateTournament={() => setIsBuilderOpen(true)}
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

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          fetchTournaments();
        }}
      />
    </div>
  );
};
