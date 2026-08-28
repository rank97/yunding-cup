import React, { useState, useMemo } from 'react';
import { Crown, Flame, Trophy, Search, Filter, X } from 'lucide-react';
import { StageLeaderboard } from '../types';

interface StageLeaderboardTableProps {
  leaderboard: StageLeaderboard;
}

export const StageLeaderboardTable: React.FC<StageLeaderboardTableProps> = ({ leaderboard }) => {
  const { rows, roundCount, inheritScores, stageType } = leaderboard;
  const isFinal = stageType === 'CHECKPOINT_FINAL';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');

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

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden border-tft-border/60 space-y-0">
      {/* Header & Search Bar */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-base text-slate-100">
            {leaderboard.stageName} - 阶段实时总积分榜
          </h3>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            (共 <span className="text-amber-300 font-bold">{rows.length}</span> 位选手 ｜ 比赛 {roundCount} 局)
          </span>
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

      {/* Table Content */}
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
              <th className="py-3 px-4 text-center">状态</th>
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
                      <div className="flex items-center gap-1.5">
                        <span>{row.name}</span>
                        {isMatchPoint && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-black animate-pulse flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />
                            赛点
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
                      {row.firstPlaceCount > 0 ? `👑 ${row.firstPlaceCount}` : '0'}
                    </td>

                    {/* Top 4s */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-cyan-400">
                      {row.top4Count}
                    </td>

                    {/* Total Score */}
                    <td className="py-3 px-4 text-right font-mono font-black text-base text-amber-300">
                      {row.totalScore}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {isChampion ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold">
                          👑 总冠军
                        </span>
                      ) : isDirect ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          👑 直通决赛
                        </span>
                      ) : isAdvanced ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                          ⬆️ 晋级
                        </span>
                      ) : isEliminated ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs">
                          ❌ 淘汰
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
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
