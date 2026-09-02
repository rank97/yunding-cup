import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Check, AlertTriangle, Lock, Sparkles, Layers, ShieldAlert, Crown, Trophy, Users, Pencil } from 'lucide-react';
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
  scoreRuleId: string;
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
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

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
            scoreRuleId: isFinal ? '1' : (s.scoreRuleId || '1'),
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
    if (!isOpen || !tournament || draftStages.length === 0) return;

    let current = tournament.totalPlayers || 0;
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      alertModal({
        title: '赛事名称不能为空',
        message: '请输入赛事标题',
        type: 'warning',
      });
      return;
    }
    if (validationError) {
      alertModal({
        title: '规则校验未通过',
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
          inheritScores: idx === 0 ? 0 : (isFinal ? 0 : s.inheritScores),
          scoreRuleId: isFinal ? '1' : (s.scoreRuleId || '1'),
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

  if (!isOpen || !tournament) return null;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#0e1326] rounded-2xl border border-purple-500/40 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              <span>赛事基本信息与赛段修改</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              已生成分组或已完赛的赛段不可修改晋级规则（需先清除分组）；总决赛固定为 20 分登顶制（8分标准，最高 8 局）
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>赛事标题</span>
                <span className="text-rose-400">*</span>
              </label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500 font-medium h-[38px]" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>参赛总规模 (已锁定)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                  {tournament.totalPlayers} 人
                </span>
              </div>
              <input type="text" disabled value={`${tournament.totalPlayers} 人`} className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-sm cursor-not-allowed font-mono h-[38px]" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300">赛段规则明细配置 ({draftStages.length} 个赛段)</span>
            <span className="text-[11px] text-slate-500">各赛段总人数必须保持 8 的整数倍流转</span>
          </div>

          <div className="space-y-3">
            {draftStages.map((stage, idx) => {
              const isFinal = idx === draftStages.length - 1;
              const disableRules = stage.isGrouped;
              const ruleId = stage.scoreRuleId || '1';
              return (
                <div key={stage.id || idx} className={`p-4 rounded-2xl border transition-all ${isFinal ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/50' : stage.isGrouped ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px] max-w-sm">
                      <span className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-sm ${isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'}`}>{idx + 1}</span>
                      {editingStageIndex === idx ? (
                        <input autoFocus type="text" value={stage.name} onChange={(e) => handleUpdateStageField(idx, 'name', e.target.value)} onBlur={() => setEditingStageIndex(null)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingStageIndex(null); }} className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500 text-slate-100 font-black text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
                      ) : (
                        <button type="button" onClick={() => setEditingStageIndex(idx)} className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800/80 transition-all text-left">
                          <span className="font-black text-sm text-slate-100 group-hover:text-purple-300">{stage.name || `阶段 ${idx + 1}`}</span>
                          <Pencil className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                      {!isFinal ? (
                        <>
                          {/* Slot 1: 底分继承 */}
                          <div className="w-[120px] shrink-0">
                            {idx > 0 ? (
                              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700/80 text-[11px] font-mono w-full">
                                <button
                                  type="button"
                                  disabled={disableRules}
                                  onClick={() => handleUpdateStageField(idx, 'inheritScores', 0)}
                                  className={`flex-1 py-0.5 rounded-md font-bold transition-all text-center ${
                                    stage.inheritScores === 0 ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                  } ${disableRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  清零
                                </button>
                                <button
                                  type="button"
                                  disabled={disableRules}
                                  onClick={() => handleUpdateStageField(idx, 'inheritScores', 1)}
                                  className={`flex-1 py-0.5 rounded-md font-bold transition-all text-center ${
                                    stage.inheritScores === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                  } ${disableRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  继承
                                </button>
                              </div>
                            ) : (
                              <div className="px-2 py-0.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400 font-mono text-center flex items-center justify-center gap-1 h-[26px]">
                                首赛段
                              </div>
                            )}
                          </div>

                          {/* Slot 2: 积分规则 */}
                          <div className="w-[128px] shrink-0">
                            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700/80 text-[11px] font-mono w-full">
                              <button
                                type="button"
                                disabled={disableRules}
                                onClick={() => handleUpdateStageField(idx, 'scoreRuleId', '1')}
                                className={`flex-1 py-0.5 rounded-md font-bold transition-all text-center ${
                                  ruleId === '1' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                } ${disableRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title="8分标准制：8-7-6-5-4-3-2-1"
                              >
                                8分制
                              </button>
                              <button
                                type="button"
                                disabled={disableRules}
                                onClick={() => handleUpdateStageField(idx, 'scoreRuleId', '2')}
                                className={`flex-1 py-0.5 rounded-md font-bold transition-all text-center ${
                                  ruleId === '2' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                } ${disableRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title="9分加权制：9-7-6-5-4-3-2-1"
                              >
                                9分制
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* 决赛黄金登顶徽章 */
                        <div className="w-[256px] shrink-0 flex justify-end">
                          <span className="w-full justify-center px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-black flex items-center gap-1.5 border border-amber-400/40 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>20分登顶总决赛 (8分标准)</span>
                          </span>
                        </div>
                      )}

                      {/* Slot 3: 状态/锁定徽章区 */}
                      <div className="shrink-0 flex justify-end">
                        {disableRules ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] flex items-center gap-1 border border-slate-700">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>已开赛</span>
                          </span>
                        ) : !isFinal ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                            未开赛
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Stage Form / Info Banner (左右结构胶囊表单) */}
                  {isFinal ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-center gap-2.5">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-extrabold text-amber-300">20分登顶制夺冠规则：</span>
                        <span>选手累积分达到 20 分开启赛点，并在开启赛点后拿下任一单局第 1 名即可登顶夺冠（最多进行 8 局决胜）。</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {/* 1. 比赛局数 (左右结构) */}
                      <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-purple-500/70 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
                        <label className="text-slate-400 font-medium whitespace-nowrap">比赛局数</label>
                        <div className="flex items-center gap-1.5 ml-2">
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={stage.roundCount ?? ''}
                            disabled={disableRules}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || '');
                              handleUpdateStageField(idx, 'roundCount', val);
                            }}
                            className={`w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-100 font-mono text-center focus:outline-none focus:border-purple-500 font-bold ${
                              disableRules ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-slate-500 text-[11px] font-mono">局</span>
                        </div>
                      </div>

                      {/* 2. 直通决赛人数 (左右结构) */}
                      <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                        <label className="text-amber-400 font-medium whitespace-nowrap">直通决赛</label>
                        <div className="flex items-center gap-1.5 ml-2">
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
                            className={`w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 font-mono text-center focus:outline-none focus:border-amber-500 font-bold ${
                              disableRules ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-amber-500/70 text-[11px] font-mono">人</span>
                        </div>
                      </div>

                      {/* 3. 淘汰人数 (左右结构) */}
                      <div className="flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-rose-500/70 focus-within:ring-1 focus-within:ring-rose-500/30 transition-all">
                        <label className="text-rose-400 font-medium whitespace-nowrap">淘汰人数</label>
                        <div className="flex items-center gap-1.5 ml-2">
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
                            className={`w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-rose-300 font-mono text-center focus:outline-none focus:border-rose-500 font-bold ${
                              disableRules ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-rose-500/70 text-[11px] font-mono">人</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Status */}
        {validationError ? (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">规则校验未通过：</span>
              <span>{validationError}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>赛程流转闭包数学合法：各赛段房间均能满员 8 人，决赛恰好 8 人。</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!validationError}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg ${
              loading || !!validationError
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
            }`}
          >
            {loading ? (
              <span>正在保存...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>保存并应用修改</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
