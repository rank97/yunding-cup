import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, AlertTriangle, Crown, Sparkles, Swords, Info } from 'lucide-react';
import { Player } from '../types';
import { useNotification } from '../context/NotificationContext';

interface FastScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchRoundId: string;
  groupName: string;
  roundNumber: number;
  players: Player[];
  existingRecords?: { playerId: string; rank: number }[];
  scoreRuleId?: string;
  onSubmit: (roundId: string, records: { playerId: string; rank: number }[]) => Promise<void>;
  onReset: (roundId: string) => Promise<void>;
}

export const FastScoreModal: React.FC<FastScoreModalProps> = ({
  isOpen,
  onClose,
  matchRoundId,
  groupName,
  roundNumber,
  players,
  existingRecords = [],
  scoreRuleId = '1',
  onSubmit,
  onReset,
}) => {
  const { confirmModal } = useNotification();
  const [ranks, setRanks] = useState<{ [playerId: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 积分规则映射计算 (8分标准 vs 9分加权)
  const getScoreForRank = (rank: number): number => {
    if (scoreRuleId === '2') {
      // 9分加权吃鸡分制
      if (rank === 1) return 9;
      return 9 - rank; // 2->7, 3->6, 4->5, 5->4, 6->3, 7->2, 8->1
    }
    // 官方8分标准
    return 9 - rank; // 1->8, 2->7, 3->6, 4->5, 5->4, 6->3, 7->2, 8->1
  };

  useEffect(() => {
    if (isOpen) {
      const initial: { [playerId: string]: number | null } = {};
      players.forEach((p) => {
        const found = existingRecords.find((r) => r.playerId === p.id);
        initial[p.id] = found ? found.rank : null;
      });
      setRanks(initial);
      setErrorMsg(null);
    }
  }, [isOpen, players, existingRecords]);

  const handleSetRank = (playerId: string, rank: number) => {
    setRanks((prev) => {
      const next = { ...prev };
      // 如果别的选手已经占用了这个名次，清空它的
      Object.keys(next).forEach((k) => {
        if (next[k] === rank && k !== playerId) {
          next[k] = null;
        }
      });
      // 如果点击自己已选的名次则反选，否则选中
      next[playerId] = prev[playerId] === rank ? null : rank;
      return next;
    });
  };

  // 计算当前已分配的名次列表与未分配的名次
  const assignedRanks = Object.values(ranks).filter((r): r is number => r !== null);
  const assignedCount = assignedRanks.length;
  const isComplete = assignedCount === 8 && new Set(assignedRanks).size === 8;

  const missingRanks = [1, 2, 3, 4, 5, 6, 7, 8].filter((r) => !assignedRanks.includes(r));

  const handleSubmit = async () => {
    if (!isComplete) {
      setErrorMsg(`请为全部 8 位选手指定第 1~8 名（尚缺：第 ${missingRanks.join(', ')} 名）`);
      return;
    }

    const payload = Object.entries(ranks).map(([playerId, rank]) => ({
      playerId,
      rank: rank as number,
    }));

    try {
      setLoading(true);
      setErrorMsg(null);
      await onSubmit(matchRoundId, payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '保存战绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 快捷模拟：一键随机分配 1~8 名并直接保存（便于测试与演示）
  const handleRandomAndSave = async () => {
    const shuffledRanks = [1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    const newRanks: { [playerId: string]: number } = {};
    const payload = players.map((p, idx) => {
      newRanks[p.id] = shuffledRanks[idx];
      return {
        playerId: p.id,
        rank: shuffledRanks[idx],
      };
    });

    setRanks(newRanks);

    try {
      setLoading(true);
      setErrorMsg(null);
      await onSubmit(matchRoundId, payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '随机模拟保存战绩失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirmModal({
      title: '确认作废该局成绩',
      message: `确定要作废/重置【${groupName} 第 ${roundNumber} 局】的战绩吗？本局将恢复为未录入状态。`,
      type: 'danger',
      confirmText: '确认作废重赛',
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await onReset(matchRoundId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-950/50 space-y-5 my-6 max-h-[92vh] flex flex-col">
        {/* 1. Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/30 text-white shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-100">
                  单局对局名次录入
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                  {groupName} · 第 {roundNumber} 局
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                  {scoreRuleId === '2' ? '9分加权制' : '8分标准制'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                点击右侧 1~8 按钮指定选手的最终对局排名，系统将自动折算积分
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomAndSave}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 border border-slate-700 hover:border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="一键随机分配 1~8 名并保存（便于测试调试）"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">随机模拟排名</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Top Rank Allocation Status Indicator Bar */}
        <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-all shrink-0 ${
          isComplete
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-950/70 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>全员 8 位选手名次已全部指定完毕，可点击下方保存</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  已录入 <span className="font-mono font-bold text-purple-400">{assignedCount}</span> / 8 人
                  {missingRanks.length > 0 && (
                    <span className="text-slate-400 ml-1.5">
                      ( 待指定：第 <span className="text-amber-300 font-mono font-bold">{missingRanks.join(', ')}</span> 名 )
                    </span>
                  )}
                </span>
              </span>
            )}
          </div>
          <div className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            进度: {Math.round((assignedCount / 8) * 100)}%
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 3. Player Rank Selection Matrix */}
        <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {players.map((player) => {
            const currentRank = ranks[player.id];
            const hasRank = currentRank !== null && currentRank !== undefined;
            const points = hasRank ? getScoreForRank(currentRank) : 0;

            return (
              <div
                key={player.id}
                className={`p-2.5 px-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                  currentRank === 1
                    ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/10'
                    : hasRank && currentRank <= 4
                    ? 'bg-purple-950/30 border-purple-500/50'
                    : hasRank
                    ? 'bg-slate-950/80 border-slate-700/80'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Player Info & Rank Conversion Badge */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank & Score Badge */}
                  <div
                    className={`h-9 px-2.5 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1 shrink-0 transition-all border ${
                      currentRank === 1
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-400/30'
                        : hasRank && currentRank <= 4
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                        : hasRank
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-slate-900/80 text-slate-600 border-slate-800'
                    }`}
                  >
                    {hasRank ? (
                      <>
                        {currentRank === 1 ? (
                          <Crown className="w-3.5 h-3.5 text-slate-950" />
                        ) : (
                          <span className="text-[11px]">第</span>
                        )}
                        <span className="text-sm">{currentRank}</span>
                        <span className="text-[11px]">名</span>
                        <span className={`text-[10px] ml-0.5 px-1 py-0.2 rounded font-mono ${
                          currentRank === 1 ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-black/25 text-purple-200'
                        }`}>
                          +{points}分
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500 text-[11px]">未指定名次</span>
                    )}
                  </div>

                  {/* Player Name & Game ID */}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
                      <span className="truncate">{player.name}</span>
                      {currentRank === 1 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 shrink-0">
                          吃鸡 👑
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      ID: {player.gameId || '—'}
                    </div>
                  </div>
                </div>

                {/* Right: 1~8 Rank Selector Capsule Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start shrink-0">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => {
                    const isSelected = currentRank === r;
                    const isOccupiedByOther = Object.entries(ranks).some(
                      ([pId, val]) => val === r && pId !== player.id
                    );
                    // 当该选手已选了名次，本行其他非选中名次全部变灰
                    const isOtherOptionForThisPlayer = hasRank && !isSelected;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSetRank(player.id, r)}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all relative flex items-center justify-center ${
                          isSelected
                            ? r === 1
                              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50 scale-110 ring-2 ring-amber-300 font-black z-10'
                              : r <= 4
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/50 scale-110 ring-2 ring-purple-400 font-black z-10'
                              : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-110 ring-2 ring-indigo-400 font-black z-10'
                            : isOccupiedByOther
                            ? 'bg-slate-950/90 text-slate-600 border border-slate-900 opacity-25 hover:opacity-80 hover:text-slate-300 hover:border-amber-500/40 line-through cursor-pointer'
                            : isOtherOptionForThisPlayer
                            ? 'bg-slate-950/80 text-slate-600 border border-slate-900/60 opacity-30 hover:opacity-100 hover:text-slate-200 hover:border-slate-700 cursor-pointer'
                            : 'bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/90 hover:border-purple-500 font-bold shadow-sm'
                        }`}
                        title={
                          isSelected
                            ? `当前选中第 ${r} 名 (+${getScoreForRank(r)}分)`
                            : isOccupiedByOther
                            ? `第 ${r} 名已被其他选手占用，点击可重新夺取分配给当前选手`
                            : isOtherOptionForThisPlayer
                            ? `点击切换为第 ${r} 名 (+${getScoreForRank(r)}分)`
                            : `设为第 ${r} 名 (+${getScoreForRank(r)}分)`
                        }
                      >
                        <span>{r}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Footer Actions */}
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800 shrink-0">
          <div>
            {existingRecords.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-3 py-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="作废该局已录入的成绩并重置为未开赛状态"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>作废重置本局</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold transition-all border border-slate-700"
            >
              取消
            </button>

            {/* Redesigned High-Impact Save CTA Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isComplete}
              className={`px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg ${
                isComplete
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40 border border-purple-400/50 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span>正在保存...</span>
              ) : isComplete ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>确认并保存单局战绩 (8人已分配)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500/70" />
                  <span>尚有 {8 - assignedCount} 人未分配名次 ({assignedCount}/8)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
