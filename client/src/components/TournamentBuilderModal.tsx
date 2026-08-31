import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Layers, ShieldCheck, Trophy, Crown } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface StageDraft {
  name: string;
  roundCount: number | string;
  directToFinalCount: number | string;
  eliminateCount: number | string;
  inheritScores: number;
  stageType?: string;
}

interface TournamentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, totalPlayers: number, stages: StageDraft[]) => Promise<void>;
}

interface TournamentPreset {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  totalPlayers: number;
  description: string;
  titleSuggestion: string;
  stages: StageDraft[];
}

const TOURNAMENT_PRESETS: TournamentPreset[] = [
  {
    id: '8_FINAL',
    name: '8人 巅峰单决战',
    badge: '单轮决胜',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    totalPlayers: 8,
    description: '单桌决胜，20分登顶制加冕冠军，适合好友开黑或水友决胜局',
    titleSuggestion: '8人 巅峰决战杯',
    stages: [
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '16_STANDARD',
    name: '16人 经典双轮杯赛',
    badge: '最常用',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    totalPlayers: 16,
    description: '初赛2组前4晋级 ➔ 8人总决赛20分登顶制，节奏紧凑高效',
    titleSuggestion: '16人 经典快速杯赛',
    stages: [
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0 },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '16_DOUBLE',
    name: '16人 直通突围双败赛',
    badge: '官方双败',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    totalPlayers: 16,
    description: '初赛前2直通决赛(4人) ➔ 8人突围赛前4晋级 ➔ 8人总决赛',
    titleSuggestion: '16人 职业突围公开赛',
    stages: [
      { name: '排位初赛', roundCount: 3, directToFinalCount: 4, eliminateCount: 4, inheritScores: 0 },
      { name: '突围排位赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 4, inheritScores: 1 },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '32_STANDARD',
    name: '32人 大师标准赛',
    badge: '标准大型',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    totalPlayers: 32,
    description: '32进16初赛 ➔ 16进8半决赛(带底分) ➔ 8人总决赛',
    titleSuggestion: '32人 大师冠军争霸赛',
    stages: [
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 0 },
      { name: '半决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 8, inheritScores: 1 },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '32_TOC',
    name: '32人 TOC官方四阶段赛',
    badge: 'TOC职业制',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    totalPlayers: 32,
    description: '32进16 ➔ 胜者组4直通+8突围 ➔ 突围前4 ➔ 8人总决赛',
    titleSuggestion: '32人 TOC 全国选拔赛',
    stages: [
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 0 },
      { name: '胜者半决赛', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1 },
      { name: '败者突围赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 4, inheritScores: 0 },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '64_STANDARD',
    name: '64人 全国公开赛',
    badge: '万人海选',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    totalPlayers: 64,
    description: '64进32海选 ➔ 32进16初赛 ➔ 16进8半决 ➔ 8人总决赛',
    titleSuggestion: '64人 云顶之弈全国公开赛',
    stages: [
      { name: '海选淘汰赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 32, inheritScores: 0 },
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 1 },
      { name: '半决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 8, inheritScores: 1 },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' }
    ]
  }
];

export const TournamentBuilderModal: React.FC<TournamentBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { toast, alertModal } = useNotification();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('16_STANDARD');
  const [title, setTitle] = useState('16人 经典快速杯赛');
  const [totalPlayers, setTotalPlayers] = useState(16);
  const [stages, setStages] = useState<StageDraft[]>([
    { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0 },
    { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, stageType: 'CHECKPOINT_FINAL' },
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

      const direct = stage.directToFinalCount === '' ? 0 : Number(stage.directToFinalCount) || 0;
      const elim = stage.eliminateCount === '' ? 0 : Number(stage.eliminateCount) || 0;

      if (isFinal) {
        if (i === 0) {
          if (current !== 8) {
            setValidationError(`单决赛赛制参赛人数必须刚好为 8 人`);
            return;
          }
        } else if (directTotal + current !== 8) {
          setValidationError(
            `闭包校验失败: 直通决赛总计 ${directTotal} 人 + 前序最终晋级 ${current} 人 = ${directTotal + current} 人，不等于决赛所需刚好 8 人！`
          );
          return;
        }
      } else {
        const next = current - direct - elim;
        if (next <= 0) {
          setValidationError(`赛段 [${stage.name || `第${i + 1}阶段`}] 晋级人数为 ${next} 人，人数不足以开赛`);
          return;
        }
        if (i < stages.length - 2 && next % 8 !== 0) {
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
  }, [totalPlayers, stages]);

  const handleApplyPreset = (preset: TournamentPreset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.titleSuggestion);
    setTotalPlayers(preset.totalPlayers);
    setStages(JSON.parse(JSON.stringify(preset.stages)));
    toast.success(`已应用 [${preset.name}] 赛制预设！`);
  };

  const handleAddStage = () => {
    const newStages = [...stages];
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
      alertModal({
        title: '输入有误',
        message: '请输入比赛名称',
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

    const payloadStages = stages.map((s, idx) => {
      const isFinal = idx === stages.length - 1;
      return {
        name: s.name.trim() || (isFinal ? '巅峰总决赛' : `阶段 ${idx + 1}`),
        roundCount: isFinal ? 8 : (s.roundCount === '' ? 3 : Number(s.roundCount) || 3),
        directToFinalCount: isFinal ? 0 : (s.directToFinalCount === '' ? 0 : Number(s.directToFinalCount) || 0),
        eliminateCount: isFinal ? 0 : (s.eliminateCount === '' ? 0 : Number(s.eliminateCount) || 0),
        inheritScores: idx === 0 ? 0 : s.inheritScores,
        stageType: isFinal ? 'CHECKPOINT_FINAL' : (s.stageType || 'STANDARD'),
      };
    });

    try {
      setLoading(true);
      await onSubmit(title.trim(), totalPlayers, payloadStages);
      toast.success('新赛事创建成功！已自动进入管理工作台。');
      onClose();
    } catch (err: any) {
      alertModal({
        title: '创建赛事失败',
        message: err.message || '创建赛事失败',
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
              <Layers className="w-5 h-5 text-purple-400" />
              <span>新建云顶之弈赛事 (动态赛程流水线构建)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              总决赛固定为 20 分登顶夺冠制（最高打满 8 局），支持任意 8 的倍数参赛人数自由流转
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>官方标准赛制快捷预设 (一键快速配置):</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              6 种经典电竞赛制模板
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {TOURNAMENT_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/50'
                      : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/80 hover:border-purple-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className={`text-xs font-black ${isSelected ? 'text-purple-200' : 'text-slate-100'}`}>
                        {preset.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{preset.totalPlayers} 人 ({preset.totalPlayers / 8} 房间)</span>
                    <span className="text-purple-300 font-bold">{preset.stages.length} 个赛段</span>
                  </div>
                </button>
              );
            })}
          </div>
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
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                          isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-100">
                        {stage.name || `阶段 ${idx + 1}`}
                      </span>
                      {isFinal && (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>20分登顶制总决赛 (最高打满 8 局)</span>
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
                      <label className="text-slate-400 block mb-1">
                        {isFinal ? '比赛局数 (固定上限)' : '比赛局数'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={isFinal ? 8 : (stage.roundCount ?? '')}
                        disabled={isFinal}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : (parseInt(e.target.value) || '');
                          handleUpdateStage(idx, 'roundCount', val);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-purple-500 ${
                          isFinal ? 'opacity-80 text-amber-300 font-bold bg-slate-900 cursor-not-allowed' : ''
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
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStage(idx, 'directToFinalCount', val);
                            }}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-rose-400 block mb-1">淘汰人数</label>
                          <input
                            type="number"
                            min="0"
                            value={stage.eliminateCount ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStage(idx, 'eliminateCount', val);
                            }}
                            placeholder="0"
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
                      <div className="col-span-3 flex items-center pt-2">
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] font-sans leading-relaxed">
                          <span className="font-bold">🏆 20分登顶制：</span>
                          积分达到 20 分获得赛点，随后拿下第 1 名即刻登顶夺冠；打满 8 局无人登顶则总分最高者夺冠。
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
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
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
            onClick={handleSubmit}
            disabled={loading || !!validationError}
            className={`btn-primary ${loading || validationError ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? '正在创建...' : '立即创建赛事'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
