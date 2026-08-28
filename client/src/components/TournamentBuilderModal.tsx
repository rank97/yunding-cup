import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

interface StageDraft {
  name: string;
  roundCount: number;
  directToFinalCount: number;
  eliminateCount: number;
  inheritScores: number;
  stageType?: string;
}

interface TournamentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, totalPlayers: number, stages: StageDraft[]) => Promise<void>;
}

export const TournamentBuilderModal: React.FC<TournamentBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [totalPlayers, setTotalPlayers] = useState(32);
  const [stages, setStages] = useState<StageDraft[]>([
    { name: '初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0 },
    { name: '半决赛', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1 },
    { name: '复活赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 12, inheritScores: 0 },
    { name: '巅峰总决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' },
  ]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 数学闭包实时校验
  useEffect(() => {
    if (totalPlayers % 8 !== 0) {
      setValidationError(`参赛人数 (${totalPlayers}人) 必须是 8 的倍数`);
      return;
    }

    let current = totalPlayers;
    let directTotal = 0;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const isFinal = i === stages.length - 1;

      if (isFinal) {
        if (directTotal + current !== 8) {
          setValidationError(`闭包校验失败: 直通决赛总计 ${directTotal} 人 + 前序最终晋级 ${current} 人 = ${directTotal + current} 人，不等于决赛所需刚好 8 人！`);
          return;
        }
      } else {
        const next = current - (stage.directToFinalCount || 0) - (stage.eliminateCount || 0);
        if (next <= 0) {
          setValidationError(`赛段 [${stage.name || `第${i+1}阶段`}] 晋级人数为 ${next} 人，人数不足以开赛`);
          return;
        }
        if (i < stages.length - 2 && next % 8 !== 0) {
          setValidationError(`赛段 [${stage.name || `第${i+1}阶段`}] 晋级至下一轮的人数 (${next}人) 不是 8 的倍数，无法组成完整 8 人房间`);
          return;
        }
        directTotal += (stage.directToFinalCount || 0);
        current = next;
      }
    }

    setValidationError(null);
  }, [totalPlayers, stages]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetType: '16' | '32' | '64') => {
    if (presetType === '16') {
      setTitle('16人 快速杯赛');
      setTotalPlayers(16);
      setStages([
        { name: '初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0 },
        { name: '巅峰总决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' },
      ]);
    } else if (presetType === '32') {
      setTitle('32人 大师公开赛');
      setTotalPlayers(32);
      setStages([
        { name: '初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0 },
        { name: '半决赛', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1 },
        { name: '复活赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 12, inheritScores: 0 },
        { name: '巅峰总决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' },
      ]);
    } else if (presetType === '64') {
      setTitle('64人 全国公开赛');
      setTotalPlayers(64);
      setStages([
        { name: '海选赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 32, inheritScores: 0 },
        { name: '初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 1 },
        { name: '半决赛', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1 },
        { name: '复活赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 4, inheritScores: 0 },
        { name: '巅峰总决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' },
      ]);
    }
  };

  const handleAddStage = () => {
    const newStages = [...stages];
    // 插入在决赛前
    newStages.splice(newStages.length - 1, 0, {
      name: `突围赛`,
      roundCount: 3,
      directToFinalCount: 0,
      eliminateCount: 0,
      inheritScores: 1,
    });
    setStages(newStages);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 2) return;
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleUpdateStage = (index: number, field: keyof StageDraft, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('请输入比赛名称');
      return;
    }
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(title, totalPlayers, stages);
      onClose();
    } catch (err: any) {
      alert(err.message || '创建赛事失败');
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
              <Layers className="w-5 h-5 text-purple-400" />
              <span>新建云顶之弈赛事 (动态赛程流水线构建)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              支持任意 8 的倍数参赛人数与多阶段自由流转，自动校验人数闭包
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>赛制快捷预设:</span>
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('16')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-xs font-mono font-semibold text-purple-300 border border-purple-500/30"
          >
            16人 (初赛 $\to$ 决赛)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('32')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-xs font-mono font-semibold text-amber-300 border border-amber-500/30"
          >
            32人 (初赛 $\to$ 半决 $\to$ 复活 $\to$ 决赛)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('64')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-xs font-mono font-semibold text-cyan-300 border border-cyan-500/30"
          >
            64人 (海选 $\to$ 初赛 $\to$ 半决 $\to$ 复活 $\to$ 决赛)
          </button>
        </div>

        {/* Basic Config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              赛事标题 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：2026 云顶之弈全国争霸赛"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              参赛总人数 (必须为 8 的倍数) <span className="text-rose-400">*</span>
            </label>
            <select
              value={totalPlayers}
              onChange={(e) => setTotalPlayers(parseInt(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {[8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 128].map((num) => (
                <option key={num} value={num}>
                  {num} 人 ({num / 8} 个房间)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stage Pipeline Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-300">
              赛段流转管线编排 ({stages.length} 个赛段)
            </span>
            <button
              type="button"
              onClick={handleAddStage}
              className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加中间赛段</span>
            </button>
          </div>

          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const isFinal = idx === stages.length - 1;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isFinal 
                      ? 'glass-panel-gold border-amber-500/50' 
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                        isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-100">
                        {stage.name || `阶段 ${idx + 1}`}
                      </span>
                      {isFinal && (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                          👑 20分登顶总决赛 (固定8人)
                        </span>
                      )}
                    </div>

                    {!isFinal && stages.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="删除该赛段"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">阶段名称</label>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => handleUpdateStage(idx, 'name', e.target.value)}
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
                        onChange={(e) => handleUpdateStage(idx, 'roundCount', parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-purple-500"
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
                            onChange={(e) => handleUpdateStage(idx, 'directToFinalCount', parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-rose-400 block mb-1">淘汰人数</label>
                          <input
                            type="number"
                            min="0"
                            value={stage.eliminateCount}
                            onChange={(e) => handleUpdateStage(idx, 'eliminateCount', parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-mono focus:outline-none focus:border-rose-500"
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
                                onChange={(e) => handleUpdateStage(idx, 'inheritScores', e.target.checked ? 1 : 0)}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0"
                              />
                              <span>继承底分</span>
                            </label>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-3 flex items-center pt-4 text-xs text-amber-400/90 font-mono">
                        汇集前置各赛段直通选手与最终突围晋级选手（共 8 人对决）
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Validation Alert */}
        {validationError ? (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>赛程人数流转完全满足 8 人闭包校验，可安全创建！</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
            disabled={loading || !!validationError}
            className={`${!validationError ? 'btn-primary' : 'bg-slate-800 text-slate-500 cursor-not-allowed px-4 py-2 rounded-lg text-sm'}`}
          >
            <span>{loading ? '正在创建...' : '确认创建比赛'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
