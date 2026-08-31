import React, { useState, useEffect } from 'react';
import { X, Settings, Check, AlertTriangle, Lock, Sparkles, Layers, ShieldAlert, Crown } from 'lucide-react';
import { Tournament, Stage } from '../types';
import { useNotification } from '../context/NotificationContext';

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
  roundCount: number | string;
  directToFinalCount: number | string;
  eliminateCount: number | string;
  inheritScores: number;
  stageType: string;
  status: string;
  isLocked: boolean;
  isGrouped: boolean;
}

export const TournamentEditModal: React.FC<TournamentEditModalProps> = ({
  isOpen,
  onClose,
  tournament,
  stages,
  onUpdate,
}) => {
  const { toast, alertModal } = useNotification();
  const [title, setTitle] = useState('');
  const [draftStages, setDraftStages] = useState<EditableStageDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tournament && stages) {
      setTitle(tournament.title);
      setDraftStages(
        stages.map((s, idx) => {
          const isFinal = idx === stages.length - 1;
          const isGrouped = s.status === 'GROUPED' || s.status === 'IN_PROGRESS' || s.status === 'LOCKED';
          return {
            id: s.id,
            name: s.name,
            roundCount: isFinal ? 8 : (s.roundCount ?? 3),
            directToFinalCount: isFinal ? 0 : (s.directToFinalCount || 0),
            eliminateCount: isFinal ? 0 : (s.eliminateCount || 0),
            inheritScores: idx === 0 ? 0 : (s.inheritScores || 0),
            stageType: isFinal ? 'CHECKPOINT_FINAL' : (s.stageType || 'STANDARD'),
            status: s.status,
            isLocked: s.status === 'LOCKED',
            isGrouped,
          };
        })
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

      const direct = stage.directToFinalCount === '' ? 0 : Number(stage.directToFinalCount) || 0;
      const elim = stage.eliminateCount === '' ? 0 : Number(stage.eliminateCount) || 0;

      if (isFinal) {
        if (directTotal + current !== 8) {
          setValidationError(
            `闭包校验失败: 直通决赛总计 ${directTotal} 人 + 前序阶段晋级 ${current} 人 = ${directTotal + current} 人，不等于决赛所需恰好 8 人！`
          );
          return;
        }
      } else {
        const next = current - direct - elim;
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
        directTotal += direct;
        current = next;
      }
    }

    setValidationError(null);
  }, [isOpen, title, draftStages, tournament]);

  const handleUpdateStageField = (idx: number, field: keyof EditableStageDraft, value: any) => {
    setDraftStages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alertModal({
        title: '输入有误',
        message: '赛事名称不能为空',
        type: 'warning',
      });
      return;
    }
    if (validationError) {
      alertModal({
        title: '赛程规则校验未通过',
        message: validationError,
        type: 'warning',
      });
      return;
    }

    const payload = {
      title: title.trim(),
      stages: draftStages.map((s, idx) => {
        const isFinal = idx === draftStages.length - 1;
        return {
          id: s.id,
          name: s.name.trim() || (isFinal ? '巅峰总决赛' : `阶段 ${idx + 1}`),
          roundCount: isFinal ? 8 : (s.roundCount === '' ? 3 : Number(s.roundCount) || 3),
          directToFinalCount: isFinal ? 0 : (s.directToFinalCount === '' ? 0 : Number(s.directToFinalCount) || 0),
          eliminateCount: isFinal ? 0 : (s.eliminateCount === '' ? 0 : Number(s.eliminateCount) || 0),
          inheritScores: idx === 0 ? 0 : s.inheritScores,
          stageType: isFinal ? 'CHECKPOINT_FINAL' : s.stageType,
        };
      }),
    };

    try {
      setLoading(true);
      await onUpdate(tournament.id, payload);
      toast.success('赛事与赛程配置已成功更新！');
      onClose();
    } catch (err: any) {
      alertModal({
        title: '更新赛事失败',
        message: err.message || '更新赛事信息失败',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>赛事基本信息与赛段修改</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              已生成分组或已完赛的赛段不可修改晋级规则（需先清除分组）；总决赛固定为 20 分登顶制（最高 8 局）
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
              const isGrouped = stage.isGrouped;
              const disableRules = isLocked || isGrouped;

              return (
                <div
                  key={stage.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                      : isGrouped
                      ? 'bg-slate-950/50 border-amber-500/30'
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
                      ) : isGrouped ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          已生成分组 (不可修改赛制，需在工作台【清除分组】后修改)
                        </span>
                      ) : isFinal ? (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>20分登顶总决赛 (固定8人，最高8局)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                          未开赛 (可修改赛制规则)
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
                      <label className="text-slate-400 block mb-1">
                        {isFinal ? '比赛局数 (固定上限)' : '比赛局数'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={isFinal ? 8 : (stage.roundCount ?? '')}
                        disabled={disableRules || isFinal}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || '');
                          handleUpdateStageField(idx, 'roundCount', val);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-purple-500 ${
                          disableRules || isFinal ? 'opacity-60 cursor-not-allowed text-amber-300 font-bold' : ''
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
                            value={stage.directToFinalCount ?? ''}
                            disabled={disableRules}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStageField(idx, 'directToFinalCount', val);
                            }}
                            placeholder="0"
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-amber-500 ${
                              disableRules ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-rose-400 block mb-1">淘汰人数</label>
                          <input
                            type="number"
                            min="0"
                            value={stage.eliminateCount ?? ''}
                            disabled={disableRules}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStageField(idx, 'eliminateCount', val);
                            }}
                            placeholder="0"
                            className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-mono focus:outline-none focus:border-rose-500 ${
                              disableRules ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          {idx === 0 ? (
                            <span className="text-[11px] text-slate-500 font-mono">首赛段 (无前置底分)</span>
                          ) : (
                            <label className={`flex items-center gap-1.5 text-slate-300 ${disableRules ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={stage.inheritScores === 1}
                                disabled={disableRules}
                                onChange={(e) =>
                                  handleUpdateStageField(idx, 'inheritScores', e.target.checked ? 1 : 0)
                                }
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                              />
                              <span>继承底分</span>
                            </label>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-3 flex items-center pt-2">
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] font-sans leading-relaxed">
                          <span className="font-bold">🏆 20分登顶夺冠制：</span>
                          累积达到 20 分获得赛点，随后拿下第 1 名即刻登顶夺冠；打满 8 局无人登顶则总分最高者夺冠。
                        </div>
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
