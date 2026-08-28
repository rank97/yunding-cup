import React, { useState, useEffect } from 'react';
import { X, Settings, Check, AlertTriangle, Lock, Sparkles, Layers } from 'lucide-react';
import { Tournament, Stage } from '../types';

interface TournamentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  stages: Stage[];
  onUpdate: (id: string, data: any) => Promise<void>;
}

interface EditableStageDraft {
  id: string;
  name: string;
  roundCount: number;
  directToFinalCount: number;
  eliminateCount: number;
  inheritScores: number;
  stageType: string;
  status: string;
  isLocked: boolean;
}

export const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  isOpen,
  onClose,
  tournament,
  stages,
  onUpdate,
}) => {
  const [title, setTitle] = useState('');
  const [draftStages, setDraftStages] = useState<EditableStageDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tournament && stages) {
      setTitle(tournament.title);
      setDraftStages(
        stages.map((s, idx) => ({
          id: s.id,
          name: s.name,
          roundCount: s.roundCount,
          directToFinalCount: s.directToFinalCount || 0,
          eliminateCount: s.eliminateCount || 0,
          inheritScores: idx === 0 ? 0 : (s.inheritScores || 0),
          stageType: s.stageType || 'STANDARD',
          status: s.status,
          isLocked: s.status === 'LOCKED',
        }))
      );
    }
  }, [isOpen, tournament, stages]);

  // 数学闭包实时校验
  useEffect(() => {
    if (!isOpen || draftStages.length === 0) return;

    let current = tournament.totalPlayers;
    let directTotal = 0;

    for (let i = 0; i < draftStages.length; i++) {
      const stage = draftStages[i];
      const isFinal = i === draftStages.length - 1;

      if (isFinal) {
        if (directTotal + current !== 8) {
          setValidationError(
            `闭包校验失败: 直通决赛总计 ${directTotal} 人 + 前序阶段晋级 ${current} 人 = ${directTotal + current} 人，不等于决赛所需恰好 8 人！`
          );
          return;
        }
      } else {
        const next = current - (stage.directToFinalCount || 0) - (stage.eliminateCount || 0);
        if (next <= 0) {
          setValidationError(`赛段 [${stage.name || `第${i + 1}阶段`}] 晋级人数为 ${next} 人，人数不足以开赛`);
          return;
        }
        if (i < draftStages.length - 2 && next % 8 !== 0) {
          setValidationError(
            `赛段 [${stage.name || `第${i + 1}阶段`}] 晋级至下一轮的人数 (${next}人) 不是 8 的倍数，无法组成完整 8 人房间`
          );
          return;
        }
        directTotal += stage.directToFinalCount || 0;
        current = next;
      }
    }

    setValidationError(null);
  }, [isOpen, title, draftStages, tournament]);

  if (!isOpen) return null;

  const handleUpdateStageField = (idx: number, field: keyof EditableStageDraft, value: any) => {
    setDraftStages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('赛事名称不能为空');
      return;
    }
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload = {
      title: title.trim(),
      stages: draftStages.map((s, idx) => ({
        id: s.id,
        name: s.name,
        roundCount: s.roundCount,
        directToFinalCount: s.directToFinalCount,
        eliminateCount: s.eliminateCount,
        inheritScores: idx === 0 ? 0 : s.inheritScores,
        stageType: s.stageType,
      })),
    };

    try {
      setLoading(true);
      await onUpdate(tournament.id, payload);
      onClose();
    } catch (err: any) {
      alert(err.message || '更新赛事信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>赛事基本信息与未开赛程修改</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              已完赛锁定的赛程不可修改；未打比赛的赛段允许动态微调赛制并实时校验闭包
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basic Meta Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              赛事标题 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              参赛总人数 (不可变更)
            </label>
            <div className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-sm font-bold flex items-center justify-between">
              <span>{tournament.totalPlayers} 人 ({tournament.totalPlayers / 8} 个房间)</span>
              <span className="text-xs text-slate-500 font-normal">分享码: {tournament.shareCode}</span>
            </div>
          </div>
        </div>

        {/* Stages Pipeline List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>赛段流转流水线 ({draftStages.length} 个赛段)</span>
            </span>
          </div>

          <div className="space-y-3">
            {draftStages.map((stage, idx) => {
              const isFinal = idx === draftStages.length - 1;
              const isLocked = stage.isLocked;

              return (
                <div
                  key={stage.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                      : isFinal
                      ? 'glass-panel-gold border-amber-500/50'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                          isLocked
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : isFinal
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-100">
                        {stage.name || `阶段 ${idx + 1}`}
                      </span>
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-400" />
                          已完赛锁定 (不可更改赛制)
                        </span>
                      ) : isFinal ? (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                          👑 20分登顶总决赛 (固定8人)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                          可编辑赛段
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">阶段名称</label>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => handleUpdateStageField(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">比赛局数</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={stage.roundCount}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateStageField(idx, 'roundCount', parseInt(e.target.value) || 1)
                        }
                        className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-purple-500 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    {!isFinal ? (
                      <>
                        <div>
                          <label className="text-amber-400 block mb-1">直通决赛人数</label>
                          <input
                            type="number"
                            min="0"
                            value={stage.directToFinalCount}
                            disabled={isLocked}
                            onChange={(e) =>
                              handleUpdateStageField(idx, 'directToFinalCount', parseInt(e.target.value) || 0)
                            }
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-amber-500 ${
                              isLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-rose-400 block mb-1">淘汰人数</label>
                          <input
                            type="number"
                            min="0"
                            value={stage.eliminateCount}
                            disabled={isLocked}
                            onChange={(e) =>
                              handleUpdateStageField(idx, 'eliminateCount', parseInt(e.target.value) || 0)
                            }
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-mono focus:outline-none focus:border-rose-500 ${
                              isLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          {idx === 0 ? (
                            <span className="text-[11px] text-slate-500 font-mono">首赛段 (无前置底分)</span>
                          ) : (
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                              <input
                                type="checkbox"
                                checked={stage.inheritScores === 1}
                                disabled={isLocked}
                                onChange={(e) =>
                                  handleUpdateStageField(idx, 'inheritScores', e.target.checked ? 1 : 0)
                                }
                                className={`w-4 h-4 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0 ${
                                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              />
                              <span>继承底分</span>
                            </label>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-3 flex items-center pt-4 text-xs font-mono text-amber-300/80">
                        前序所有直通者 + 最后一轮突围晋级者 汇聚决赛
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Alert */}
        {validationError ? (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>数学闭包校验通过：全赛程流转人数闭环且恒定为 8 的倍数，决赛恰好 8 人。</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !!validationError}
            className={`btn-primary ${loading || validationError ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Check className="w-4 h-4" />
            <span>{loading ? '正在保存...' : '保存赛事修改'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
