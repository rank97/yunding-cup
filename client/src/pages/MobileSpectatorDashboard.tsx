import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Flame, 
  Crown, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Users, 
  Award,
  Sparkles
} from 'lucide-react';
import { publicApi } from '../services/api';
import { 
  TournamentOverview, 
  StageLeaderboard, 
  GroupDetails, 
  LeaderboardRow, 
  User 
} from '../types';
import { useNotification } from '../context/NotificationContext';
import confetti from 'canvas-confetti';

interface MobileSpectatorDashboardProps {
  shareCode: string;
  onExitToGate: () => void;
  isSseConnected: boolean;
}

export const MobileSpectatorDashboard: React.FC<MobileSpectatorDashboardProps> = ({
  shareCode,
  onExitToGate,
  isSseConnected,
}) => {
  const { toast } = useNotification();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rounds' | 'flow'>('leaderboard');
  const [overview, setOverview] = useState<TournamentOverview | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<StageLeaderboard | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // 载入大盘全景数据
  const fetchOverview = useCallback(async () => {
    if (!shareCode) return;
    try {
      const data = await publicApi.getOverview(shareCode);
      setOverview(data);

      let targetStageId = '';
      if (data.currentStageId && data.columns.some((c) => c.stageId === data.currentStageId)) {
        targetStageId = data.currentStageId;
      } else if (data.championThrone && data.championThrone.isDetermined) {
        targetStageId = data.columns[data.columns.length - 1]?.stageId || data.columns[0]?.stageId || '';
      } else {
        targetStageId = data.columns[0]?.stageId || '';
      }

      setActiveStageId((prev) => {
        if (prev && data.columns.some((c) => c.stageId === prev)) {
          return prev;
        }
        return targetStageId;
      });
    } catch (err: any) {
      console.error('Mobile fetch overview error:', err);
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  // 载入指定赛段榜单与各组战报
  const fetchStageData = useCallback(async (stageId: string) => {
    if (!shareCode || !stageId) return;
    try {
      const [lb, gd] = await Promise.all([
        publicApi.getLeaderboard(shareCode, stageId),
        publicApi.getGroupDetails(shareCode, stageId),
      ]);
      setLeaderboard(lb);
      setGroupDetails(gd);

      if (gd && gd.groups.length > 0) {
        setSelectedGroupId((prev) => {
          if (prev && gd.groups.some((g) => g.groupId === prev)) {
            return prev;
          }
          return gd.groups[0].groupId;
        });
      }
    } catch (err: any) {
      console.error('Mobile fetch stage data error:', err);
    }
  }, [shareCode]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeStageId) {
      fetchStageData(activeStageId);
    }
  }, [activeStageId, fetchStageData]);

  // SSE 实时推流监听
  useEffect(() => {
    if (!shareCode) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = publicApi.createEventSource(shareCode);

      eventSource.addEventListener('SCORE_UPDATED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_GROUPED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_LOCKED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_UNLOCKED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('ROUND_RESET', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });
    } catch (e) {
      console.error('Mobile SSE connect failed', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [shareCode, activeStageId, fetchOverview, fetchStageData]);

  // 复制观赛链接
  const handleCopy = () => {
    const url = `${window.location.origin}/?v=${shareCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('观赛链接已复制到剪贴板！');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !overview) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#0b0d1b] text-slate-100 p-6 text-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">正在接入赛事大屏移动端...</span>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#0b0d1b] text-slate-100 p-6 text-center">
        <Trophy className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">未找到相关赛事</h3>
        <p className="text-xs text-slate-400">请核对您输入的观赛码是否正确</p>
        <button
          onClick={onExitToGate}
          className="btn-primary py-2 px-6 text-xs mt-2"
        >
          返回观赛大厅
        </button>
      </div>
    );
  }

  const currentColumn = overview.columns.find((c) => c.stageId === activeStageId) || overview.columns[0];
  const activeGroup = groupDetails?.groups.find((g) => g.groupId === selectedGroupId) || groupDetails?.groups[0];

  return (
    <div className="min-h-[100dvh] bg-[#0b0d1b] text-slate-100 flex flex-col font-sans pb-10">
      {/* 1. Mobile Esports Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0e1122]/95 backdrop-blur-xl border-b border-purple-900/30 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Tournament Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 p-[1px] shrink-0">
              <div className="w-full h-full bg-[#0b0d1b] rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm text-slate-100 truncate">
                  {overview.title}
                </h1>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  overview.status === 'COMPLETED'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse'
                }`} />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span>{overview.totalPlayers}人赛</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{overview.shareCode}</span>
                <button
                  type="button"
                  onClick={onExitToGate}
                  className="text-purple-400 hover:text-purple-300 underline font-semibold ml-0.5"
                >
                  更换
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions (Copy only) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono flex items-center gap-1"
              title="复制观赛分享链接"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-mono">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] text-amber-300 font-mono">复制</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Stage Carousel Capsule Bar */}
      <div className="bg-[#0e1122]/60 border-b border-slate-800/60 px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          {overview.columns.map((col) => {
            const isSelected = col.stageId === activeStageId;
            const isFinal = col.stageType === 'CHECKPOINT_FINAL';

            return (
              <button
                key={col.stageId}
                onClick={() => setActiveStageId(col.stageId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? isFinal
                      ? 'glass-panel-gold text-amber-200 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                }`}
              >
                <span>{col.stageOrder}. {col.name}</span>
                <span className={`px-1 py-0.2 text-[9px] rounded ${
                  col.status === 'LOCKED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : col.status === 'IN_PROGRESS' || col.status === 'GROUPED'
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {col.status === 'LOCKED' ? '完赛' : col.status === 'IN_PROGRESS' ? '进行中' : '待赛'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mobile View Switcher (3 Tabs) */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-3 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-bold text-center">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>阶段积分榜</span>
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'rounds'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>对局战报</span>
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'flow'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>赛程晋级树</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Contents */}
      <main className="px-3 pt-3 flex-1">
        {/* TAB 1: 阶段积分榜 (Mobile-First Leaderboard Cards) */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-2.5">
            {/* Stage Rule Pill */}
            {currentColumn && (
              <div className="px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span>阶段: <span className="text-slate-200 font-bold">{currentColumn.name}</span> ({currentColumn.roundCount} 局)</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded border ${
                    currentColumn.scoreRuleId === '2'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}>
                    {currentColumn.scoreRuleId === '2' ? '9分加权' : '8分标准'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {currentColumn.directToFinalCount > 0 && (
                    <span className="text-amber-300">直通 {currentColumn.directToFinalCount}人</span>
                  )}
                  {currentColumn.eliminateCount > 0 && (
                    <span className="text-rose-400">淘汰 {currentColumn.eliminateCount}人</span>
                  )}
                </div>
              </div>
            )}

            {/* Player List */}
            {(!leaderboard || leaderboard.rows.length === 0) ? (
              <div className="py-16 text-center text-xs text-slate-500 font-mono">
                暂无本赛段积分数据
              </div>
            ) : (
              leaderboard.rows.map((row: LeaderboardRow) => {
                const isTop1 = row.rank === 1;
                const isTop2 = row.rank === 2;
                const isTop3 = row.rank === 3;
                const isChampion = row.advancementStatus === 'CHAMPION';
                const isMatchPoint = row.isMatchPoint === 1;
                const isDirect = row.advancementStatus === 'DIRECT_FINAL';
                const isAdvanced = row.advancementStatus === 'ADVANCED';
                const isEliminated = row.advancementStatus === 'ELIMINATED';
                const isExpanded = expandedPlayerId === row.playerId;

                return (
                  <div
                    key={row.playerId}
                    onClick={() => setExpandedPlayerId(isExpanded ? null : row.playerId)}
                    className={`rounded-2xl border p-3 transition-all ${
                      isChampion
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/30'
                        : isMatchPoint
                        ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/20'
                        : isTop1
                        ? 'bg-slate-900/90 border-amber-500/40 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Rank & Player info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="shrink-0 font-mono font-black text-center w-7 flex items-center justify-center">
                          {isTop1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center shadow-md shadow-amber-400/40">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-black flex items-center justify-center">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-black flex items-center justify-center">
                              3
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {row.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        {row.avatarUrl ? (
                          <img
                            src={row.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-xs text-purple-300 font-bold shrink-0">
                            {row.name.charAt(0)}
                          </div>
                        )}

                        {/* Player name, game ID, and badges */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-100 truncate">
                              {row.name}
                            </span>
                            {isMatchPoint && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-600 text-rose-100 text-[9px] font-mono font-black flex items-center gap-0.5 animate-pulse shrink-0">
                                <Flame className="w-2.5 h-2.5" />
                                赛点
                              </span>
                            )}
                            {isChampion && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-mono font-black flex items-center gap-0.5 shrink-0">
                                <Crown className="w-2.5 h-2.5" />
                                冠军
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span>ID: {row.gameId || '-'}</span>
                            <span>•</span>
                            <span className="text-slate-400 font-semibold">{row.groupName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scores & Expand arrow */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-base font-black font-mono text-amber-300">
                            {row.totalScore}
                            <span className="text-[10px] font-normal text-slate-400 ml-0.5">分</span>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 text-[9px] font-mono text-slate-400">
                            <span className="text-amber-400/90 font-bold">{row.firstPlaceCount}鸡</span>
                            <span>•</span>
                            <span className="text-cyan-300">{row.top4Count}前四</span>
                          </div>
                        </div>

                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-purple-400' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded Detail: Round-by-Round Breakdown */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                        <div className="text-[10px] font-mono text-slate-400">小局战绩得分分布:</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.carryOverScore > 0 && (
                            <span className="px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-[10px] font-mono text-indigo-300">
                              底分: +{row.carryOverScore}
                            </span>
                          )}
                          {row.roundScores.map((score, rIdx) => (
                            <span
                              key={rIdx}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                                score === 8
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : score !== null && score >= 4
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : score !== null
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-slate-950 text-slate-600 border-slate-800'
                              }`}
                            >
                              R{rIdx + 1}: {score !== null ? `+${score}` : '-'}
                            </span>
                          ))}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                          <span className="text-slate-400">当前赛段晋级状态:</span>
                          <span className={`font-bold ${
                            isChampion ? 'text-amber-400' : isDirect ? 'text-amber-300' : isAdvanced ? 'text-emerald-400' : isEliminated ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {isChampion ? '🏆 夺得总冠军' : isDirect ? '🌟 直通总决赛' : isAdvanced ? '⬆️ 晋级下一赛段' : isEliminated ? '❌ 遗憾淘汰' : '待定'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: 对局战报 (Match Rounds & Group Cards) */}
        {activeTab === 'rounds' && (
          <div className="space-y-3">
            {/* Group Selector Pills */}
            {groupDetails && groupDetails.groups.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {groupDetails.groups.map((grp) => (
                  <button
                    key={grp.groupId}
                    onClick={() => setSelectedGroupId(grp.groupId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      grp.groupId === activeGroup?.groupId
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {grp.groupName}
                  </button>
                ))}
              </div>
            )}

            {/* Rounds List for selected Group */}
            {(!activeGroup || activeGroup.rounds.length === 0) ? (
              <div className="py-16 text-center text-xs text-slate-500 font-mono">
                暂无对局房间数据
              </div>
            ) : (
              activeGroup.rounds.map((round) => {
                const isFinished = round.status === 'FINISHED';

                return (
                  <div
                    key={round.matchRoundId}
                    className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                      isFinished
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-slate-950/60 border-dashed border-slate-800'
                    }`}
                  >
                    {/* Round Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-100 font-mono">
                          第 {round.roundNumber} 局 (R{round.roundNumber})
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isFinished
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isFinished ? '已完赛' : '待录入'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {activeGroup.groupName}
                      </span>
                    </div>

                    {/* Rankings List */}
                    <div className="space-y-1.5">
                      {round.rankings.map((p) => {
                        const is1st = p.rank === 1;
                        const is2nd = p.rank === 2;
                        const is3rd = p.rank === 3;
                        const is4th = p.rank === 4;

                        return (
                          <div
                            key={p.playerId}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                              is1st
                                ? 'bg-amber-500/15 border border-amber-500/30 font-bold'
                                : is2nd || is3rd || is4th
                                ? 'bg-slate-800/50'
                                : 'bg-slate-950/40 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`font-mono font-black text-xs w-4 text-center ${
                                is1st ? 'text-amber-400' : is2nd || is3rd || is4th ? 'text-cyan-300' : 'text-slate-500'
                              }`}>
                                {p.rank}
                              </span>
                              <span className="font-semibold truncate text-slate-200">
                                {p.name}
                              </span>
                              {p.isMatchPoint && (
                                <span className="px-1 py-0.2 rounded bg-rose-600 text-rose-100 text-[8px] font-mono font-bold">
                                  赛点
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-black text-amber-300 shrink-0">
                              +{p.score}分
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: 赛程晋级树 (Vertical Stepper Flow) */}
        {activeTab === 'flow' && (
          <div className="space-y-4">
            {/* Champion Throne Card (If tournament finished) */}
            {overview.championThrone && overview.championThrone.isDetermined && (
              <div className="rounded-2xl glass-panel-gold border-2 border-amber-400 p-5 text-center space-y-2.5 shadow-xl shadow-amber-500/20 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/40 animate-bounce">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] text-amber-300 font-mono font-bold uppercase tracking-wider">
                    🏆 20分登顶·全球总冠军 🏆
                  </span>
                  <h3 className="text-xl font-black text-amber-200 mt-0.5">
                    {overview.championThrone.championName}
                  </h3>
                  <p className="text-xs text-amber-300/80 font-mono">
                    游戏 ID: {overview.championThrone.championGameId || '-'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })}
                  className="btn-gold py-1.5 px-4 text-xs mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>庆祝夺冠礼花</span>
                </button>
              </div>
            )}

            {/* Stages Stepper */}
            <div className="space-y-3">
              {overview.columns.map((col, idx) => {
                const isFinal = col.stageType === 'CHECKPOINT_FINAL';
                const isLocked = col.status === 'LOCKED' || col.status === 'COMPLETED';
                const isRunning = col.status === 'IN_PROGRESS' || col.status === 'GROUPED';

                return (
                  <div
                    key={col.stageId}
                    className={`rounded-2xl border p-4 transition-all ${
                      isFinal
                        ? 'glass-panel-gold border-amber-500/50'
                        : isRunning
                        ? 'glass-panel border-purple-500/60 shadow-lg shadow-purple-950/30'
                        : 'glass-panel border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                          isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'
                        }`}>
                          {col.stageOrder}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-100">
                          {col.name}
                        </h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isLocked
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : isRunning
                          ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isLocked ? '已完赛' : isRunning ? '激烈进行中' : '待开赛'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">赛制局数</div>
                        <div className="text-xs font-bold text-slate-200 mt-0.5">{col.roundCount} 局</div>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">直通 / 晋级</div>
                        <div className="text-xs font-bold text-emerald-400 mt-0.5">
                          {col.directToFinalCount > 0 ? `${col.directToFinalCount}直通` : '标准晋级'}
                        </div>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">淘汰人数</div>
                        <div className="text-xs font-bold text-rose-400 mt-0.5">{col.eliminateCount} 人</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
