import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, AlertTriangle, Crown, Sparkles, Dices } from 'lucide-react';
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
  onSubmit,
  onReset,
}) => {
  const { confirmModal } = useNotification();
  const [ranks, setRanks] = useState<{ [playerId: string]: number | null }>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // 检查是否 1~8 名完全分配且无重复
  const assignedRanks = Object.values(ranks).filter((r): r is number => r !== null);
  const isComplete = assignedRanks.length === 8 && new Set(assignedRanks).size === 8;

  const handleSubmit = async () => {
    if (!isComplete) {
      setErrorMsg('请为完整的 8 位选手各自分配 1~8 名（不能有重复或空缺）');
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
      setErrorMsg(err.message || '保存成绩失败');
    } finally {
      setLoading(false);
    }
  };

  // 快捷预设：一键随机分配 1~8 名并直接保存（极速调试）
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
      setErrorMsg(err.message || '随机保存成绩失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirmModal({
      title: '确认作废该局成绩',
      message: `确定要作废/重置【${groupName} 第 ${roundNumber} 局】的战绩吗？本局将被清空并恢复为待录入状态（支持重新比赛与填分）。`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <span>{groupName} - 第 {roundNumber} 局快捷填分器</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 font-mono">
                R{roundNumber}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              点击下方 1~8 按钮为选手打分，自动排重并折算积分
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 一键随机填分并保存按钮 */}
            <button
              type="button"
              onClick={handleRandomAndSave}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/20"
              title="随机生成 1~8 名并直接提交保存，方便测试调试"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>🎲 随机排名并保存</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Player Rank Assignment Matrix */}
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {players.map((player) => {
            const currentRank = ranks[player.id];
            const hasRank = currentRank !== null && currentRank !== undefined;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  currentRank === 1
                    ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                    : hasRank && currentRank <= 4
                    ? 'bg-purple-950/40 border-purple-500/50 shadow-sm'
                    : hasRank
                    ? 'bg-slate-900/90 border-slate-700'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg font-mono font-bold text-sm flex items-center justify-center transition-all ${
                    currentRank === 1 
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/40' 
                      : hasRank 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                      : 'bg-slate-800/80 text-slate-600 border border-slate-700/50'
                  }`}>
                    {currentRank || '-'}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {currentRank === 1 && <Crown className="w-4 h-4 text-amber-400 animate-bounce" />}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ID: {player.gameId || '无'}
                    </div>
                  </div>
                </div>

                {/* 1~8 Rank Selector Buttons */}
                <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => {
                    const isSelected = currentRank === r;
                    const isOccupiedByOther = Object.entries(ranks).some(
                      ([pId, val]) => val === r && pId !== player.id
                    );

                    // 当该选手已选择了某个名次，其他未选中的按钮全部变灰变暗 (Dimmed)
                    const isOtherOptionForThisPlayer = hasRank && !isSelected;

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSetRank(player.id, r)}
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs transition-all ${
                          isSelected
                            ? r === 1
                              ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50 scale-105 ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900'
                              : 'bg-purple-600 text-white shadow-md shadow-purple-600/50 scale-105 ring-2 ring-purple-400 ring-offset-1 ring-offset-slate-900'
                            : isOccupiedByOther
                            ? 'bg-slate-950 text-slate-700 border border-slate-900/60 opacity-30 cursor-not-allowed line-through'
                            : isOtherOptionForThisPlayer
                            ? 'bg-slate-900/60 text-slate-600 border border-slate-800/80 opacity-40 hover:opacity-100 hover:text-slate-300'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                        title={isSelected ? `当前选择第 ${r} 名` : isOccupiedByOther ? `已分配给其他选手` : `设为第 ${r} 名`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>作废/重赛本局</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isComplete}
              className={`${isComplete ? 'btn-primary' : 'bg-slate-800 text-slate-500 cursor-not-allowed px-4 py-2 rounded-lg text-sm'}`}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? '正在保存...' : '保存单局成绩'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
