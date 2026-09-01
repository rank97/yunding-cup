import React, { useState, useMemo } from 'react';
import { Crown, Flame, Trophy, Search, Filter, X, AlertCircle, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import { StageLeaderboard } from '../types';
import { useNotification } from '../context/NotificationContext';

interface StageLeaderboardTableProps {
  leaderboard: StageLeaderboard;
  isAdmin?: boolean;
  isLocked?: boolean;
  onUpdatePlayerStatus?: (playerId: string, status: string) => Promise<void>;
  onAutoAssignStatus?: () => Promise<void>;
}

export const StageLeaderboardTable: React.FC<StageLeaderboardTableProps> = ({
  leaderboard,
  isAdmin = false,
  isLocked = false,
  onUpdatePlayerStatus,
  onAutoAssignStatus,
}) => {
  const { rows, roundCount, inheritScores, stageType } = leaderboard;
  const isFinal = stageType === 'CHECKPOINT_FINAL';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // 规则配额要求
  const directRequired = leaderboard.directToFinalCount || 0;
  const elimRequired = leaderboard.eliminateCount || 0;
  const advanceRequired = isFinal ? 0 : Math.max(0, rows.length - directRequired - elimRequired);

  // 检查是否全部对局已完赛并录入比分
  const { completedScoresCount, totalExpectedScores, isAllMatchesFinished } = useMemo(() => {
    if (rows.length === 0 || roundCount === 0) {
      return { completedScoresCount: 0, totalExpectedScores: 0, isAllMatchesFinished: false };
    }
    const totalExpected = rows.length * roundCount;
    const completed = rows.reduce(
      (acc, r) => acc + r.roundScores.filter((s) => s !== null && s !== undefined).length,
      0
    );
    return {
      completedScoresCount: completed,
      totalExpectedScores: totalExpected,
      isAllMatchesFinished: totalExpected > 0 && completed === totalExpected,
    };
  }, [rows, roundCount]);

  // 决赛登顶夺冠状态
  const championRow = useMemo(() => isFinal ? rows.find(r => r.advancementStatus === 'CHAMPION') : undefined, [isFinal, rows]);
  const isCheckmateCrowned = Boolean(championRow);
  const isAllowedToOperate = isAllMatchesFinished || isCheckmateCrowned;

  // 实际分配统计 (只有全部完赛或登顶夺冠时有效统计)
  const actualDirect = useMemo(() => rows.filter((r) => r.advancementStatus === 'DIRECT_FINAL').length, [rows]);
  const actualAdvance = useMemo(() => rows.filter((r) => r.advancementStatus === 'ADVANCED').length, [rows]);
  const actualElim = useMemo(() => rows.filter((r) => r.advancementStatus === 'ELIMINATED').length, [rows]);
  const actualNone = useMemo(() => rows.filter((r) => !r.advancementStatus || r.advancementStatus === 'NONE').length, [rows]);
  const actualChamp = useMemo(() => rows.filter((r) => r.advancementStatus === 'CHAMPION').length, [rows]);

  // 是否全部满足赛段规则
  const isRuleSatisfied = isFinal
    ? actualChamp >= 1
    : actualDirect === directRequired && actualAdvance === advanceRequired && actualElim === elimRequired && actualNone === 0;

  // 获取所有独立组别
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.groupName) set.add(r.groupName);
    });
    return Array.from(set).sort();
  }, [rows]);

  // 客户端实时检索过滤
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchSearch =
        !searchTerm.trim() ||
        row.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (row.gameId && row.gameId.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchGroup = selectedGroup === 'ALL' || row.groupName === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [rows, searchTerm, selectedGroup]);

  const { toast, alertModal } = useNotification();

  const handleStatusChange = async (playerId: string, newStatus: string) => {
    if (!onUpdatePlayerStatus) return;
    if (!isAllowedToOperate) {
      alertModal({
        title: '无法调整状态',
        message: '当前阶段尚有对局未打完，必须在全部完赛（或决赛产生20分登顶冠军）后才能分配晋级状态！',
        type: 'warning',
      });
      return;
    }
    try {
      setUpdatingPlayerId(playerId);
      await onUpdatePlayerStatus(playerId, newStatus);
      toast.success('已更新选手晋级状态');
    } catch (err: any) {
      alertModal({
        title: '更新晋级状态失败',
        message: err.message || '更新选手晋级状态失败',
        type: 'error',
      });
    } finally {
      setUpdatingPlayerId(null);
    }
  };

  const handleAutoAssign = async () => {
    if (!onAutoAssignStatus) return;
    if (!isAllowedToOperate) {
      alertModal({
        title: '无法执行自动分配',
        message: '当前阶段尚有对局未打完，必须在全部完赛（或决赛产生20分登顶冠军）后才能执行排名状态分配！',
        type: 'warning',
      });
      return;
    }
    try {
      setAutoAssigning(true);
      await onAutoAssignStatus();
      toast.success('已按当前总分排名重置分配晋级状态！');
    } catch (err: any) {
      alertModal({
        title: '自动分配失败',
        message: err.message || '自动分配晋级状态失败',
        type: 'error',
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden border-tft-border/60 space-y-0">
      {/* Header & Search Bar */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-base text-slate-100">
            {leaderboard.stageName} - 阶段实时总积分榜
          </h3>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
            leaderboard.scoreRuleId === '2'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
          }`}>
            {leaderboard.scoreRuleId === '2' ? '9-7-6-5-4-3-2-1 吃鸡加权' : '8-7-6-5-4-3-2-1 官方标准'}
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            (共 <span className="text-amber-300 font-bold">{rows.length}</span> 位选手 ｜ 比赛 {roundCount} 局)
          </span>
          {isAllMatchesFinished ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>本赛段全部对局已完赛</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>比赛进行中 (已录入 {completedScoresCount}/{totalExpectedScores} 席战绩)</span>
            </span>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索选手姓名 / 游戏ID..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group Filter */}
          {availableGroups.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">
                  全部组别 ({rows.length})
                </option>
                {availableGroups.map((grp) => (
                  <option key={grp} value={grp} className="bg-slate-900 text-slate-200">
                    {grp} ({rows.filter((r) => r.groupName === grp).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(searchTerm || selectedGroup !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGroup('ALL');
              }}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              清空筛选 ({filteredRows.length}/{rows.length})
            </button>
          )}
        </div>
      </div>

      {/* Admin Advancement Control & Quota Monitor Banner */}
      {isAdmin && !isLocked && !isFinal && (
        isAllMatchesFinished ? (
          <div className="p-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-400 font-sans font-bold flex items-center gap-1.5">
                <span>晋级配额监控:</span>
              </span>

              {/* Direct Count */}
              {directRequired > 0 && (
                <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                  actualDirect === directRequired 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                }`}>
                  <span>👑 直通决赛:</span>
                  <span className="font-extrabold">{actualDirect} / {directRequired} 人</span>
                  {actualDirect === directRequired ? '✓' : '⚠️'}
                </span>
              )}

              {/* Advance Count */}
              <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                actualAdvance === advanceRequired 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
              }`}>
                <span>⬆️ 晋级下一轮:</span>
                <span className="font-extrabold">{actualAdvance} / {advanceRequired} 人</span>
                {actualAdvance === advanceRequired ? '✓' : '⚠️'}
              </span>

              {/* Eliminate Count */}
              {elimRequired > 0 && (
                <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                  actualElim === elimRequired 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                }`}>
                  <span>❌ 淘汰:</span>
                  <span className="font-extrabold">{actualElim} / {elimRequired} 人</span>
                  {actualElim === elimRequired ? '✓' : '⚠️'}
                </span>
              )}

              {/* Undetermined Count */}
              {actualNone > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                  ⏳ 待定: {actualNone} 人
                </span>
              )}

              {/* Overall Satisfied Tag */}
              {isRuleSatisfied ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>已满足赛段锁定规则</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>锁定前请调整人数与规则一致</span>
                </span>
              )}
            </div>

            {/* Quick Auto-Assign / Reset Button */}
            {onAutoAssignStatus && (
              <button
                onClick={handleAutoAssign}
                disabled={autoAssigning}
                className="px-3 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 border border-purple-500/40 text-xs font-sans font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                title="根据当前总积分排名，自动填入各选手的默认 晋级 / 直通 / 淘汰 状态"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-purple-400 ${autoAssigning ? 'animate-spin' : ''}`} />
                <span>按当前排名重置分配</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>当前赛段进行中：尚有对局未完成录入。全部对局打完录入成绩后，系统将自动开启排名分配并支持手动调整状态。</span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-500">
              已录入 {completedScoresCount}/{totalExpectedScores} 席战报
            </span>
          </div>
        )
      )}

      {/* Final Stage Checkpoint / Champion Banner */}
      {isFinal && (
        championRow ? (
          <div className="p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs flex items-center justify-between font-mono animate-in fade-in">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <span className="font-bold text-sm text-amber-300">
                👑 20分登顶夺冠！恭喜选手【{championRow.name}】达成「20分赛点 + 吃鸡登顶」，加冕云顶总冠军！决赛提前终结！
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black shadow-md">
              🏆 冠军诞生
            </span>
          </div>
        ) : (
          <div className="p-3 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                🏆 <strong>20分登顶夺冠赛制：</strong>选手累计达到 20 分进入【赛点/听牌】，在后续对局拿下第 1 名（吃鸡）即刻加冕总冠军并提前终结比赛；上限至多 8 局。
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-[11px] text-amber-300 shrink-0">
              已进行 {Math.max(...rows.map(r => r.roundScores.filter(s => s !== null && s !== undefined).length), 0)} / {roundCount} 局
            </span>
          </div>
        )
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-xs font-mono text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 text-center w-14">名次</th>
              <th className="py-3 px-4">选手名称</th>
              <th className="py-3 px-4">游戏 ID</th>
              <th className="py-3 px-3 text-center">组别</th>
              {inheritScores === 1 && (
                <th className="py-3 px-3 text-center text-indigo-400">底分</th>
              )}
              {Array.from({ length: roundCount }).map((_, idx) => (
                <th key={idx} className="py-3 px-3 text-center font-mono">
                  R{idx + 1}
                </th>
              ))}
              <th className="py-3 px-3 text-center text-amber-400 font-bold">吃鸡数</th>
              <th className="py-3 px-3 text-center text-cyan-400">前四数</th>
              <th className="py-3 px-4 text-right font-black text-amber-300">总积分</th>
              <th className="py-3 px-4 text-center">
                {isAdmin && !isLocked && isAllMatchesFinished ? '晋级状态 (支持手动修改)' : '状态'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={roundCount + (inheritScores === 1 ? 8 : 7)} className="py-12 text-center text-slate-500">
                  {rows.length === 0 ? '暂无积分数据' : '未匹配到符合筛选条件的选手'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => {
                const isTop1 = row.rank === 1;
                const isTop2 = row.rank === 2;
                const isTop3 = row.rank === 3;
                const isChampion = row.advancementStatus === 'CHAMPION';
                const isDirect = row.advancementStatus === 'DIRECT_FINAL';
                const isAdvanced = row.advancementStatus === 'ADVANCED';
                const isEliminated = row.advancementStatus === 'ELIMINATED';
                const isMatchPoint = row.isMatchPoint === 1;
                const isUpdating = updatingPlayerId === row.playerId;

                return (
                  <tr 
                    key={row.playerId}
                    className={`transition-colors ${
                      isChampion
                        ? 'bg-amber-500/15 font-semibold text-amber-100'
                        : isMatchPoint
                        ? 'bg-rose-500/10'
                        : isTop1
                        ? 'bg-amber-500/5'
                        : idx % 2 === 0
                        ? 'bg-slate-900/20'
                        : 'bg-transparent'
                    } hover:bg-slate-800/40`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs shadow-md shadow-amber-400/40">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-bold">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-bold">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400">{row.rank}</span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                        {isMatchPoint && (
                          <span 
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-600/90 text-rose-100 text-[10px] font-mono font-black border border-rose-400/40 shadow-sm shadow-rose-600/40 shrink-0"
                            title="已达 20 分开启赛点，下局吃鸡即可夺冠！"
                          >
                            <Flame className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                            <span>赛点</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Game ID */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {row.gameId || '-'}
                    </td>

                    {/* Group */}
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {row.groupName}
                      </span>
                    </td>

                    {/* Carry-over Score */}
                    {inheritScores === 1 && (
                      <td className="py-3 px-3 text-center font-mono text-xs text-indigo-300">
                        +{row.carryOverScore}
                      </td>
                    )}

                    {/* Round Scores */}
                    {row.roundScores.map((score, rIdx) => (
                      <td key={rIdx} className="py-3 px-3 text-center font-mono text-xs">
                        {score !== null ? (
                          <span className={score === 8 ? 'text-amber-400 font-bold' : score >= 5 ? 'text-cyan-300' : 'text-slate-400'}>
                            {score}
                          </span>
                        ) : (
                          <span className="text-slate-700">-</span>
                        )}
                      </td>
                    ))}

                    {/* 1st Places */}
                    <td className="py-3 px-3 text-center font-mono text-xs font-bold text-amber-400">
                      {row.firstPlaceCount > 0 ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{row.firstPlaceCount}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>

                    {/* Top 4s */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-cyan-400">
                      {row.top4Count}
                    </td>

                    {/* Total Score */}
                    <td className="py-3 px-4 text-right font-mono font-black text-base text-amber-300">
                      {row.totalScore}
                    </td>

                    {/* Status Column */}
                    <td className="py-2.5 px-4 text-center">
                      {isAdmin && !isLocked ? (
                        isAllMatchesFinished ? (
                          <div className="inline-flex items-center gap-1 relative">
                            <select
                              value={row.advancementStatus || 'NONE'}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(row.playerId, e.target.value)}
                              className={`text-xs font-bold font-sans rounded-lg px-2.5 py-1 border transition-all focus:outline-none cursor-pointer ${
                                row.advancementStatus === 'CHAMPION'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : row.advancementStatus === 'DIRECT_FINAL'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : row.advancementStatus === 'ADVANCED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : row.advancementStatus === 'ELIMINATED'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {isFinal ? (
                                <>
                                  <option value="CHAMPION" className="bg-slate-900 text-amber-300 font-bold">
                                    👑 总冠军
                                  </option>
                                  <option value="NONE" className="bg-slate-900 text-slate-400">
                                    - 完赛
                                  </option>
                                </>
                              ) : (
                                <>
                                  <option value="ADVANCED" className="bg-slate-900 text-emerald-300 font-bold">
                                    ⬆️ 晋级
                                  </option>
                                  {directRequired > 0 && (
                                    <option value="DIRECT_FINAL" className="bg-slate-900 text-amber-300 font-bold">
                                      👑 直通决赛
                                    </option>
                                  )}
                                  <option value="ELIMINATED" className="bg-slate-900 text-rose-300">
                                    ❌ 淘汰
                                  </option>
                                  <option value="NONE" className="bg-slate-900 text-slate-400">
                                    ⏳ 待定
                                  </option>
                                </>
                              )}
                            </select>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800 text-xs font-mono" title="需本阶段所有对局全部打完录入成绩后，方可进行晋级状态分配">
                            ⏳ 比赛中
                          </span>
                        )
                      ) : (
                        isChampion ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold">
                            👑 总冠军
                          </span>
                        ) : isDirect ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                            👑 直通决赛
                          </span>
                        ) : isAdvanced ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                            ⬆️ 晋级
                          </span>
                        ) : isEliminated ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs">
                            ❌ 淘汰
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
