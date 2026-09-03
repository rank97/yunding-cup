import React from 'react';
import { Crown, Edit3, RotateCcw, CheckCircle2, Clock, Lock } from 'lucide-react';
import { GroupDetails, GroupRow, RoundCard, PlayerRankItem } from '../types';

interface GroupRoundCardsProps {
  groupDetails: GroupDetails;
  isAdmin?: boolean;
  isLocked?: boolean;
  onOpenScoreModal?: (roundId: string, groupName: string, roundNumber: number) => void;
}

export const GroupRoundCards: React.FC<GroupRoundCardsProps> = ({
  groupDetails,
  isAdmin = false,
  isLocked = false,
  onOpenScoreModal,
}) => {
  const { groups } = groupDetails;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div 
          key={group.groupId}
          className="glass-panel rounded-2xl p-5 border-tft-border/50 space-y-3.5"
        >
          {/* Group Row Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-lg bg-purple-600/30 text-purple-300 font-mono font-bold text-sm border border-purple-500/30">
                {group.groupName} 对局战报矩阵
              </span>
              <span className="text-xs text-slate-400 font-mono">
                (共 {group.rounds.length} 局对局，向右滑动查看各局详情)
              </span>
            </div>
          </div>

          {/* Horizontally Scrollable Cards Container */}
          <div className="overflow-x-auto pb-3 pt-1">
            <div className="flex items-start gap-4 min-w-max">
              {group.rounds.map((round) => {
                const isFinished = round.status === 'FINISHED';

                return (
                  <div
                    key={round.matchRoundId}
                    className={`w-72 rounded-xl p-4 border transition-all duration-200 ${
                      isFinished
                        ? 'bg-slate-900/80 border-slate-700/60 shadow-lg hover:border-purple-500/50'
                        : isLocked
                        ? 'bg-slate-950/40 border-dashed border-slate-800 opacity-60'
                        : 'bg-slate-900/40 border-dashed border-slate-700/80 opacity-90'
                    }`}
                  >
                    {/* Round Card Top */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-100">
                          第 {round.roundNumber} 局 (R{round.roundNumber})
                        </span>
                        {isFinished ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            已完赛
                          </span>
                        ) : isLocked ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono flex items-center gap-0.5 border border-amber-500/20">
                            🏆 提前夺冠结赛
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            待录入
                          </span>
                        )}
                      </div>

                      {/* Admin Quick Entry Button */}
                      {isAdmin && onOpenScoreModal && (
                        isLocked ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-500 text-[10px] font-mono flex items-center gap-1 border border-slate-700/40">
                            <Lock className="w-3 h-3" />
                            已锁定
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenScoreModal(round.matchRoundId, group.groupName, round.roundNumber)}
                            className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-medium border border-purple-500/30 transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isFinished ? '修改' : '录入'}</span>
                          </button>
                        )
                      )}
                    </div>

                    {/* Rankings 1st ~ 8th List */}
                    {isFinished && round.rankings.length > 0 ? (
                      <div className="space-y-1">
                        {round.rankings.map((item, idx) => {
                          const isFirst = item.rank === 1;
                          const isTop4 = item.rank <= 4;
                          const isDivider = item.rank === 4;

                          return (
                            <React.Fragment key={item.playerId || idx}>
                              <div
                                className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all ${
                                  isFirst
                                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold shadow-sm'
                                    : isTop4
                                    ? 'bg-slate-800/40 text-slate-200'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                  <span className={`w-4 font-mono font-bold text-xs shrink-0 ${isFirst ? 'text-amber-400' : isTop4 ? 'text-cyan-400' : 'text-slate-500'}`}>
                                    {item.rank}
                                  </span>
                                  {item.avatarUrl && (
                                    <img
                                      src={item.avatarUrl}
                                      alt=""
                                      className="w-5 h-5 rounded-md object-cover border border-slate-700 bg-slate-950 shrink-0"
                                    />
                                  )}
                                  <span className="font-bold text-sm text-slate-100 truncate" title={item.name}>
                                    {item.name}
                                  </span>
                                  {item.gameId && (
                                    <span className="text-xs font-mono text-slate-400 truncate" title={item.gameId}>
                                      ({item.gameId})
                                    </span>
                                  )}
                                  {isFirst && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </div>

                                <div className="flex items-center gap-2 font-mono shrink-0">
                                  <span className={`font-bold text-sm ${isFirst ? 'text-amber-300' : isTop4 ? 'text-cyan-300' : 'text-slate-400'}`}>
                                    {item.score}分
                                  </span>
                                </div>
                              </div>

                              {/* Subtle Golden/Purple divider after Top 4 */}
                              {isDivider && (
                                <div className="my-1.5 flex items-center justify-center gap-2">
                                  <div className="h-[1px] bg-slate-700/60 flex-1" />
                                  <span className="text-[9px] font-mono text-slate-500 tracking-wider">▲ 前四胜者分界线 ▼</span>
                                  <div className="h-[1px] bg-slate-700/60 flex-1" />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                        <Clock className="w-5 h-5 mx-auto text-slate-600" />
                        <div>暂无比赛成绩</div>
                        {isAdmin && (
                          <div className="text-[11px] text-purple-400 mt-1 cursor-pointer" onClick={() => onOpenScoreModal?.(round.matchRoundId, group.groupName, round.roundNumber)}>
                            点击右上角录入比分
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
