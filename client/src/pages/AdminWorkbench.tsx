import React, { useState, useEffect, useCallback } from 'react';
import { 
  tournamentApi, 
  stageApi, 
  matchApi, 
  publicApi 
} from '../services/api';
import { 
  Tournament, 
  Stage, 
  Player, 
  StageLeaderboard, 
  GroupDetails 
} from '../types';
import { StageLeaderboardTable } from '../components/StageLeaderboardTable';
import { GroupRoundCards } from '../components/GroupRoundCards';
import { FastScoreModal } from '../components/FastScoreModal';
import { PlayerImportModal } from '../components/PlayerImportModal';
import { PlayerSwapModal } from '../components/PlayerSwapModal';
import { TournamentEditModal } from '../components/TournamentEditModal';
import { useNotification } from '../context/NotificationContext';
import { 
  Users, 
  Shuffle, 
  Lock, 
  Unlock, 
  Share2, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Trophy,
  Layers,
  ChevronRight,
  ArrowLeftRight,
  Settings,
  Trash2
} from 'lucide-react';

import { getUrlNavState, updateUrlNavState } from '../services/urlState';

interface AdminWorkbenchProps {
  tournamentId: string;
  currentUser?: User | null;
  onOpenCreateTournament: () => void;
  onDeleteTournament?: (id: string) => Promise<void>;
}

export const AdminWorkbench: React.FC<AdminWorkbenchProps> = ({
  tournamentId,
  currentUser,
  onOpenCreateTournament,
  onDeleteTournament,
}) => {
  const { toast, confirmModal, alertModal } = useNotification();
  const initialNav = getUrlNavState();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeStageId, setActiveStageId] = useState<string>(initialNav.stage || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<StageLeaderboard | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isEditTournamentOpen, setIsEditTournamentOpen] = useState(false);
  const [activeRoundData, setActiveRoundData] = useState<{
    roundId: string;
    groupName: string;
    roundNumber: number;
    players: Player[];
    records: { playerId: string; rank: number }[];
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) {
      setTournament(null);
      setStages([]);
      setPlayers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [res, pList] = await Promise.all([
        tournamentApi.getDetail(tournamentId),
        stageApi.listPlayers(tournamentId),
      ]);

      // 防御越权：非超管若尝试访问他人赛事直接置空
      if (currentUser && currentUser.role !== 'SUPER_ADMIN' && res.tournament.tenantId !== currentUser.id) {
        setTournament(null);
        setStages([]);
        setPlayers([]);
        setLoading(false);
        return;
      }

      setTournament(res.tournament);
      setStages(res.stages || []);
      setPlayers(pList || []);

      if (res.stages && res.stages.length > 0) {
        let targetStageId = '';
        const cur = res.stages.find((s: Stage) => s.id === res.tournament.currentStageId) || res.stages[0];
        targetStageId = cur?.id || '';
        setActiveStageId((prev) => {
          if (prev && res.stages.some((s: Stage) => s.id === prev)) {
            return prev;
          }
          return targetStageId;
        });
      }
      return res.tournament;
    } catch (e) {
      console.error('Fetch tournament admin error:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tournamentId, currentUser]);

  const fetchStageData = useCallback(async (shareCode: string, stageId: string) => {
    if (!shareCode || !stageId) return;
    try {
      const [lb, gd] = await Promise.all([
        publicApi.getLeaderboard(shareCode, stageId),
        publicApi.getGroupDetails(shareCode, stageId),
      ]);
      setLeaderboard(lb);
      setGroupDetails(gd);
    } catch (e) {
      console.error('Fetch stage admin error:', e);
    }
  }, []);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  useEffect(() => {
    if (tournament && activeStageId && tournament.shareCode) {
      fetchStageData(tournament.shareCode, activeStageId);
    }
  }, [tournament?.shareCode, activeStageId, fetchStageData]);

  // 挂载后台 SSE 实时推流监听，录分或锁定时自动秒级刷新
  useEffect(() => {
    if (!tournament?.shareCode) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = publicApi.createEventSource(tournament.shareCode);

      eventSource.addEventListener('SCORE_UPDATED', () => {
        fetchTournamentData();
        if (activeStageId) fetchStageData(tournament.shareCode, activeStageId);
      });

      eventSource.addEventListener('ROUND_RESET', () => {
        fetchTournamentData();
        if (activeStageId) fetchStageData(tournament.shareCode, activeStageId);
      });

      eventSource.addEventListener('STAGE_GROUPED', () => {
        fetchTournamentData();
        if (activeStageId) fetchStageData(tournament.shareCode, activeStageId);
      });

      eventSource.addEventListener('STAGE_LOCKED', () => {
        fetchTournamentData();
        if (activeStageId) fetchStageData(tournament.shareCode, activeStageId);
      });

      eventSource.addEventListener('STAGE_UNLOCKED', () => {
        fetchTournamentData();
        if (activeStageId) fetchStageData(tournament.shareCode, activeStageId);
      });
    } catch (e) {
      console.error('SSE connect admin error:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [tournament?.shareCode, activeStageId, fetchTournamentData, fetchStageData]);

  const currentStage = stages.find((s) => s.id === activeStageId);

  // Grouping Actions
  const handleGrouping = async (mode: 'SNAKE' | 'RANDOM') => {
    if (!activeStageId) return;
    const modeName = mode === 'SNAKE' ? '蛇形分组' : '随机打散分组';
    const confirmed = await confirmModal({
      title: `确认执行 [${modeName}]`,
      message: `确定要对当前赛段 [${currentStage?.name || '当前赛段'}] 执行 ${modeName} 吗？系统将自动生成房间席位与对局房间。`,
      type: 'purple',
      confirmText: '立即执行分组',
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await stageApi.executeGrouping(activeStageId, mode);
      await fetchTournamentData();
      if (tournament) fetchStageData(tournament.shareCode, activeStageId);
      toast.success(`${modeName}成功！`);
    } catch (err: any) {
      alertModal({
        title: '分组失败',
        message: err.message || '执行分组失败，请检查选手人数及规则配置',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Lock Stage
  const handleLockStage = async () => {
    if (!activeStageId) return;
    const isFinal = currentStage?.stageType === 'CHECKPOINT_FINAL';
    const confirmed = await confirmModal({
      title: isFinal ? '确认锁定总决赛' : '确认锁定赛段',
      message: isFinal 
        ? '锁定总决赛后将确定最终排名与冠亚季军荣誉，全赛程完赛！确定锁定吗？'
        : '锁定当前赛段后，将自动结算排名并生成晋级下一赛段的名单。确定锁定吗？',
      type: 'warning',
      confirmText: '确认锁定赛段',
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await stageApi.lockStage(activeStageId);
      await fetchTournamentData();
      if (tournament) fetchStageData(tournament.shareCode, activeStageId);
      toast.success('赛段已成功锁定！晋级名单已生成。');
    } catch (err: any) {
      alertModal({
        title: '锁定赛段失败',
        message: err.message || '锁定赛段失败',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Unlock Stage
  const handleUnlockStage = async () => {
    if (!activeStageId) return;
    const confirmed = await confirmModal({
      title: '确认解锁赛段',
      message: '确定要解锁当前赛段吗？解锁后将允许重新修改各对局战报，下游赛段若已生成名单将被重置。',
      type: 'warning',
      confirmText: '确认解锁',
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await stageApi.unlockStage(activeStageId);
      await fetchTournamentData();
      if (tournament) fetchStageData(tournament.shareCode, activeStageId);
      toast.success('赛段已解锁，可重新调整比分。');
    } catch (err: any) {
      alertModal({
        title: '解锁失败',
        message: err.message || '解锁失败',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Score Modal
  const handleOpenScoreModal = async (roundId: string, groupName: string, roundNumber: number) => {
    if (!activeStageId) return;
    try {
      const stageDetail = await stageApi.getDetail(activeStageId);
      const groupItem = stageDetail.groups.find((g: any) => g.group.groupName === groupName);
      if (!groupItem) return;

      const groupPlayers = groupItem.players.map((p: any) => p.player);
      const roundObj = groupItem.rounds.find((r: any) => r.id === roundId);
      
      // 查找已有成绩
      let existing: { playerId: string; rank: number }[] = [];
      if (groupDetails) {
        const gRow = groupDetails.groups.find((g) => g.groupName === groupName);
        const rCard = gRow?.rounds.find((r) => r.matchRoundId === roundId);
        if (rCard && rCard.rankings) {
          existing = rCard.rankings.map((rk) => ({
            playerId: rk.playerId,
            rank: rk.rank,
          }));
        }
      }

      setActiveRoundData({
        roundId,
        groupName,
        roundNumber,
        players: groupPlayers,
        records: existing,
      });
      setIsScoreModalOpen(true);
    } catch (e: any) {
      alertModal({
        title: '获取对局选手失败',
        message: e.message || '获取对局选手列表失败',
        type: 'error',
      });
    }
  };

  const handleScoreSubmit = async (roundId: string, records: { playerId: string; rank: number }[]) => {
    await matchApi.submitRound(roundId, records);
    const updated = await fetchTournamentData();
    const sc = updated?.shareCode || tournament?.shareCode;
    if (sc && activeStageId) {
      await fetchStageData(sc, activeStageId);
    }
    toast.success('小局战绩已成功保存！');
  };

  const handleScoreReset = async (roundId: string) => {
    await matchApi.resetRound(roundId);
    const updated = await fetchTournamentData();
    const sc = updated?.shareCode || tournament?.shareCode;
    if (sc && activeStageId) {
      await fetchStageData(sc, activeStageId);
    }
    toast.info('小局战绩已重置为待录入状态');
  };

  const handlePlayersImport = async (tId: string, pList: any[]) => {
    await stageApi.importPlayers(tId, pList);
    await fetchTournamentData();
    if (tournament && activeStageId) {
      await fetchStageData(tournament.shareCode, activeStageId);
    }
    toast.success('选手名册已成功导入！');
  };

  const handleUpdateSinglePlayer = async (pId: string, name: string, gameId: string) => {
    await stageApi.updatePlayer(pId, { name, gameId });
    await fetchTournamentData();
    if (tournament && activeStageId) {
      await fetchStageData(tournament.shareCode, activeStageId);
    }
    toast.success('选手信息已更新！');
  };

  const handleSwapPlayers = async (sId: string, p1Id: string, p2Id: string) => {
    await stageApi.swapPlayers(sId, p1Id, p2Id);
    await fetchTournamentData();
    if (tournament && activeStageId) {
      await fetchStageData(tournament.shareCode, activeStageId);
    }
    toast.success('选手席位互换成功！');
  };

  const handleClearGrouping = async () => {
    if (!activeStageId) return;
    const confirmed = await confirmModal({
      title: '确认清除赛段分组',
      message: `确定要清除赛段 [${currentStage?.name}] 的分组房间吗？清除后当前赛段将恢复为未分组状态，之后可自由修改赛规局数与晋级名额。`,
      type: 'danger',
      confirmText: '确认清除分组',
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await stageApi.clearGrouping(activeStageId);
      await fetchTournamentData();
      if (tournament && activeStageId) {
        await fetchStageData(tournament.shareCode, activeStageId);
      }
      toast.success('赛段分组已清除！');
    } catch (err: any) {
      alertModal({
        title: '清除分组失败',
        message: err.message || '清除分组失败',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlayerStatus = async (pId: string, status: string) => {
    if (!activeStageId) return;
    await stageApi.updatePlayerAdvancement(activeStageId, pId, status);
    const updated = await fetchTournamentData();
    const sc = updated?.shareCode || tournament?.shareCode;
    if (sc && activeStageId) {
      await fetchStageData(sc, activeStageId);
    }
  };

  const handleAutoAssignStatus = async () => {
    if (!activeStageId) return;
    await stageApi.autoAssignAdvancement(activeStageId);
    const updated = await fetchTournamentData();
    const sc = updated?.shareCode || tournament?.shareCode;
    if (sc && activeStageId) {
      await fetchStageData(sc, activeStageId);
    }
  };

  const handleUpdateTournament = async (tId: string, data: any) => {
    await tournamentApi.update(tId, data);
    const updated = await fetchTournamentData();
    const sc = updated?.shareCode || tournament?.shareCode;
    if (sc && activeStageId) {
      await fetchStageData(sc, activeStageId);
    }
  };

  if (loading && !tournament) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">正在载入管理工作台数据...</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 glass-panel rounded-3xl text-center space-y-5 border-purple-500/30 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-purple-600 p-[1px] mx-auto shadow-lg shadow-purple-500/20">
          <div className="w-full h-full bg-[#0b0d1b] rounded-2xl flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-xl text-slate-100">欢迎进入赛事管理工作台</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            您当前名下尚未创建任何赛事。点击下方按钮即可一键配置 16 / 32 / 64 人云顶杯赛，并自动生成多赛段流转管线。
          </p>
        </div>
        <button
          onClick={onOpenCreateTournament}
          className="btn-primary mx-auto py-2.5 px-5 text-sm shadow-xl shadow-purple-900/40"
        >
          <PlusCircle className="w-4 h-4" />
          <span>立即创建第一场比赛</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1700px] mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Tournament Meta & Global Actions */}
      <div className="p-5 rounded-2xl glass-panel border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-purple-600 p-[1px]">
            <div className="w-full h-full bg-[#0b0d1b] rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-100">{tournament.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-mono">
                {tournament.totalPlayers} 人赛规
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              公开观赛分享码: <span className="text-amber-300 font-bold">{tournament.shareCode}</span> ｜ 
              选手已录入: <span className={players.length === tournament.totalPlayers ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {players.length} / {tournament.totalPlayers}
              </span> 人
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditTournamentOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>编辑赛事与赛程</span>
          </button>

          <button
            onClick={() => setIsPlayerModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>{players.length === 0 ? '录入选手名册' : '修改选手名单'}</span>
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/?v=${tournament.shareCode}`;
              navigator.clipboard.writeText(url);
              toast.success('观赛大屏链接已成功复制到剪贴板！');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>复制观赛大屏链接</span>
          </button>

          {onDeleteTournament && (
            <button
              onClick={async () => {
                const confirmed = await confirmModal({
                  title: '高危操作：确认删除赛事',
                  message: `确定要彻底删除赛事 [${tournament.title}] 吗？删除后该赛事的所有赛段配置、选手名册及全部小局比分将被彻底清除，大屏将无法再访问！`,
                  type: 'danger',
                  confirmText: '确认彻底删除',
                });
                if (!confirmed) return;

                try {
                  await onDeleteTournament(tournament.id);
                  toast.success('赛事已彻底删除');
                } catch (err: any) {
                  alertModal({
                    title: '删除赛事失败',
                    message: err.message || '删除赛事失败',
                    type: 'error',
                  });
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="删除当前比赛"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>删除赛事</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Navigation Pipeline Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {stages.map((stg) => {
          const isSelected = stg.id === activeStageId;
          const isFinal = stg.stageType === 'CHECKPOINT_FINAL';

          return (
            <button
              key={stg.id}
              onClick={() => setActiveStageId(stg.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-2.5 ${
                isSelected
                  ? isFinal
                    ? 'glass-panel-gold text-amber-200 border-amber-400 shadow-xl'
                    : 'bg-purple-600 text-white border border-purple-400 shadow-xl shadow-purple-900/40'
                  : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <span>{stg.stageOrder}. {stg.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                stg.status === 'LOCKED'
                  ? 'bg-emerald-500/30 text-emerald-300 font-bold'
                  : stg.status === 'IN_PROGRESS' || stg.status === 'GROUPED'
                  ? 'bg-cyan-500/30 text-cyan-300 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {stg.status === 'LOCKED' ? '已锁定' : stg.status === 'IN_PROGRESS' ? '进行中' : stg.status === 'GROUPED' ? '已分组' : '待开赛'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Stage Control Hub */}
      {currentStage && (
        <div className="p-4 rounded-2xl glass-panel border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-200">
              当前控制赛段: <span className="text-amber-300">{currentStage.name}</span>
            </span>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800">
                赛制: {currentStage.roundCount} 局
              </span>
              {currentStage.directToFinalCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  直通决赛: {currentStage.directToFinalCount} 人
                </span>
              )}
              {currentStage.eliminateCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                  淘汰: {currentStage.eliminateCount} 人
                </span>
              )}
            </div>
          </div>

          {/* Grouping & Stage Lifecycle Controls */}
          <div className="flex items-center gap-2.5">
            {currentStage.status !== 'LOCKED' ? (
              <>
                <button
                  onClick={() => handleGrouping('SNAKE')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>执行蛇形分组</span>
                </button>
                <button
                  onClick={() => handleGrouping('RANDOM')}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>随机打散分组</span>
                </button>
                {currentStage.status === 'GROUPED' && (
                  <button
                    onClick={handleClearGrouping}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    title="清除当前赛段的分组与房间，恢复为待分组状态"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>清除分组</span>
                  </button>
                )}
                {groupDetails && groupDetails.groups.length > 0 && (
                  <button
                    onClick={() => setIsSwapModalOpen(true)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    title="在未开赛且无积分时微调互换两名选手的组别"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>微调换人</span>
                  </button>
                )}
                <button
                  onClick={handleLockStage}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>锁定赛段并晋级</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleUnlockStage}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>解锁赛段 (回滚状态)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage Total Leaderboard */}
      {leaderboard && (
        <StageLeaderboardTable
          leaderboard={leaderboard}
          isAdmin={true}
          isLocked={currentStage?.status === 'LOCKED'}
          onUpdatePlayerStatus={handleUpdatePlayerStatus}
          onAutoAssignStatus={handleAutoAssignStatus}
        />
      )}

      {/* Match Cards Matrix with Referee Quick Entry */}
      {groupDetails && (
        <GroupRoundCards
          groupDetails={groupDetails}
          isAdmin={true}
          isLocked={currentStage?.status === 'LOCKED' || tournament?.status === 'COMPLETED'}
          onOpenScoreModal={handleOpenScoreModal}
        />
      )}

      {/* Tournament Edit Modal */}
      <TournamentEditModal
        isOpen={isEditTournamentOpen}
        onClose={() => setIsEditTournamentOpen(false)}
        tournament={tournament}
        stages={stages}
        onUpdate={handleUpdateTournament}
      />

      {/* Player Import / Edit Modal */}
      <PlayerImportModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        tournamentId={tournament.id}
        totalPlayers={tournament.totalPlayers}
        isLocked={tournament.status !== 'DRAFT' || stages.some((s) => s.status !== 'PENDING')}
        currentPlayers={players}
        onImport={handlePlayersImport}
        onUpdateSinglePlayer={handleUpdateSinglePlayer}
      />

      {/* Player Swap Fine-Tuning Modal */}
      <PlayerSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        stageId={activeStageId}
        stageName={currentStage?.name || ''}
        onSwap={handleSwapPlayers}
      />

      {/* Fast Score Modal */}
      {activeRoundData && (
        <FastScoreModal
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setActiveRoundData(null);
          }}
          matchRoundId={activeRoundData.roundId}
          groupName={activeRoundData.groupName}
          roundNumber={activeRoundData.roundNumber}
          players={activeRoundData.players}
          existingRecords={activeRoundData.records}
          scoreRuleId={currentStage?.scoreRuleId || '1'}
          onSubmit={handleScoreSubmit}
          onReset={handleScoreReset}
        />
      )}
    </div>
  );
};
