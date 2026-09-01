import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Trophy, 
  Crown, 
  Users,
  Pencil
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export interface StageDraft {
  name: string;
  roundCount: number | string;
  directToFinalCount: number | string;
  eliminateCount: number | string;
  inheritScores: number;
  scoreRuleId?: string;
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

const PLAYER_COUNT_OPTIONS = [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 128];

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
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
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
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0, scoreRuleId: '1' },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
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
      { name: '排位初赛', roundCount: 3, directToFinalCount: 4, eliminateCount: 4, inheritScores: 0, scoreRuleId: '1' },
      { name: '突围排位赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 4, inheritScores: 1, scoreRuleId: '1' },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
    ]
  },
  {
    id: '32_MOON_CUP',
    name: '32人 月亮杯专属赛制',
    badge: '月亮杯专属',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    totalPlayers: 32,
    description: '32进24初赛 ➔ 24人半决赛(4直通+4淘汰) ➔ 16人复活赛(前4进决赛) ➔ 8人巅峰决战',
    titleSuggestion: '2026 第一届云顶之弈月亮杯全国大师赛',
    stages: [
      { name: '初赛 (32进24)', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0, scoreRuleId: '1' },
      { name: '半决赛 (24进4直通)', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1, scoreRuleId: '1' },
      { name: '突围复活赛 (16进4)', roundCount: 5, directToFinalCount: 0, eliminateCount: 12, inheritScores: 1, scoreRuleId: '1' },
      { name: '巅峰总决赛 (20分登顶)', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
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
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 0, scoreRuleId: '1' },
      { name: '胜者半决赛', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1, scoreRuleId: '1' },
      { name: '败者突围赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 4, inheritScores: 1, scoreRuleId: '1' },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
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
      { name: '海选淘汰赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 32, inheritScores: 0, scoreRuleId: '1' },
      { name: '小组初赛', roundCount: 3, directToFinalCount: 0, eliminateCount: 16, inheritScores: 1, scoreRuleId: '1' },
      { name: '半决赛', roundCount: 5, directToFinalCount: 0, eliminateCount: 8, inheritScores: 1, scoreRuleId: '1' },
      { name: '巅峰总决赛', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
    ]
  }
];

export const TournamentBuilderModal: React.FC<TournamentBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { toast, alertModal } = useNotification();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('32_MOON_CUP');
  const [title, setTitle] = useState('2026 第一届云顶之弈月亮杯全国大师赛');
  const [totalPlayers, setTotalPlayers] = useState(32);
  const [stages, setStages] = useState<StageDraft[]>([
    { name: '初赛 (32进24)', roundCount: 3, directToFinalCount: 0, eliminateCount: 8, inheritScores: 0, scoreRuleId: '1' },
    { name: '半决赛 (24进4直通)', roundCount: 5, directToFinalCount: 4, eliminateCount: 4, inheritScores: 1, scoreRuleId: '1' },
    { name: '突围复活赛 (16进4)', roundCount: 5, directToFinalCount: 0, eliminateCount: 12, inheritScores: 1, scoreRuleId: '1' },
    { name: '巅峰总决赛 (20分登顶)', roundCount: 8, directToFinalCount: 0, eliminateCount: 0, inheritScores: 0, scoreRuleId: '1', stageType: 'CHECKPOINT_FINAL' }
  ]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

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
      name: `突围排位赛`,
      roundCount: 3,
      directToFinalCount: 0,
      eliminateCount: 0,
      inheritScores: 1,
      scoreRuleId: '1',
    });
    setStages(newStages);
    setSelectedPresetId('');
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 2) return;
    setStages(stages.filter((_, i) => i !== index));
    setSelectedPresetId('');
  };

  const handleUpdateStage = (index: number, field: keyof StageDraft, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
    setSelectedPresetId('');
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
        inheritScores: idx === 0 ? 0 : (isFinal ? 0 : s.inheritScores),
        scoreRuleId: isFinal ? '1' : (s.scoreRuleId || '1'),
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
        message: err.message || '系统繁忙，请重试',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/50 p-6 space-y-6 my-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>新建电竞赛事流水</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-mono border border-purple-500/40">
                  TOC 赛事引擎
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                支持 8~128 人多阶段自由流转，自动校验各赛段满员 8 人数学闭包
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Preset Templates Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>快速套用官方赛制预设模板</span>
            </span>
            <span className="text-[11px] text-slate-500">点击卡片即可一键加载赛程流转</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        {/* 3. Basic Meta Section: 赛事标题与参赛总人数并列在同一行 */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: 赛事标题 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>赛事标题</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：2026 第一届云顶之弈月亮杯全国大师赛"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium h-[38px]"
              />
            </div>

            {/* Right: 参赛总人数 (横向滑动选择) */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>参赛总人数 (滑动选择)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
                  {totalPlayers} 人 ({totalPlayers / 8} 房)
                </span>
              </div>

              {/* Horizontal Scrollable Capsule Slider */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar no-scrollbar h-[38px] px-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                {PLAYER_COUNT_OPTIONS.map((num) => {
                  const isActive = totalPlayers === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalPlayers(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-900/50 ring-1 ring-purple-400/80'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{num}人</span>
                      <span className={`text-[9px] ${isActive ? 'text-purple-200' : 'text-slate-500'}`}>
                        ({num / 8}房)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Stage Pipeline Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-300">
                赛段流转管线编排
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                共 {stages.length} 个赛段
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddStage}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加赛段</span>
            </button>
          </div>

          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const isFinal = idx === stages.length - 1;
              const ruleId = stage.scoreRuleId || '1';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isFinal
                      ? 'glass-panel-gold border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/80 border-slate-800/90 shadow-sm'
                  }`}
                >
                  {/* Stage Card Header: Index, Inline Stage Name Input, Aligned Score & Inherit Buttons, Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-800/80">
                    {/* Left: Index badge + Click-to-Edit Stage Name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px] max-w-sm">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-sm ${
                          isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {editingStageIndex === idx ? (
                        <input
                          autoFocus
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleUpdateStage(idx, 'name', e.target.value)}
                          onBlur={() => setEditingStageIndex(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingStageIndex(null);
                            }
                          }}
                          placeholder={`阶段 ${idx + 1} 名称`}
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500 text-slate-100 font-black text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingStageIndex(idx)}
                          className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all text-left"
                          title="点击修改赛段名称"
                        >
                          <span className="font-black text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                            {stage.name || `阶段 ${idx + 1}`}
                          </span>
                          <Pencil className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all shrink-0" />
                        </button>
                      )}
                    </div>

                    {/* Right: Aligned Inherit Score & Score Rules Buttons + Actions (Fixed-Slot Columns) */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                      {!isFinal ? (
                        <>
                          {/* Slot 1 (Left): 底分继承切换组 或 首赛段等宽占位 (固定宽 136px) */}
                          <div className="w-[136px] shrink-0">
                            {idx > 0 ? (
                              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700/80 text-[11px] font-mono w-full">
                                <div className="relative group flex-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStage(idx, 'inheritScores', 0)}
                                    className={`w-full py-0.5 rounded-md font-bold transition-all text-center ${
                                      stage.inheritScores === 0
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    清零起跑
                                  </button>
                                  {/* Tooltip */}
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none whitespace-nowrap">
                                    <div className="bg-slate-900 border border-slate-700 text-slate-100 text-[11px] px-3 py-2 rounded-xl shadow-2xl shadow-black/90 font-mono text-center">
                                      <div className="text-slate-300 font-extrabold mb-0.5">清零重新起跑 (0 底分)</div>
                                      <div className="text-slate-400 text-[10px]">所有晋级选手在本赛段积分从 0 开始重新计算</div>
                                    </div>
                                    <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 transform rotate-45 -mt-1.5" />
                                  </div>
                                </div>

                                <div className="relative group flex-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStage(idx, 'inheritScores', 1)}
                                    className={`w-full py-0.5 rounded-md font-bold transition-all text-center ${
                                      stage.inheritScores === 1
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    继承底分
                                  </button>
                                  {/* Tooltip */}
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none whitespace-nowrap">
                                    <div className="bg-slate-900 border border-indigo-500/50 text-slate-100 text-[11px] px-3 py-2 rounded-xl shadow-2xl shadow-black/90 font-mono text-center">
                                      <div className="text-indigo-300 font-extrabold mb-0.5">继承上一轮累积分数</div>
                                      <div className="text-slate-300 text-[10px]">选手将携带上一赛段的总分作为初始底分继续累加</div>
                                    </div>
                                    <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-indigo-500/50 transform rotate-45 -mt-1.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* 首赛段隐形占位块，确保右侧积分规则完全对齐 */
                              <div className="w-full hidden sm:block" />
                            )}
                          </div>

                          {/* Slot 2 (Right): 积分规则切换组 (固定宽 136px) */}
                          <div className="w-[136px] shrink-0">
                            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700/80 text-[11px] font-mono w-full">
                              <div className="relative group flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(idx, 'scoreRuleId', '1')}
                                  className={`w-full py-0.5 rounded-md font-bold transition-all text-center ${
                                    ruleId === '1'
                                      ? 'bg-purple-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  8分标准
                                </button>
                                {/* Tooltip */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none whitespace-nowrap">
                                  <div className="bg-slate-900 border border-purple-500/50 text-slate-100 text-[11px] px-3 py-2 rounded-xl shadow-2xl shadow-black/90 font-mono text-center">
                                    <div className="text-purple-300 font-extrabold mb-1">官方标准积分 (8-7-6-5-4-3-2-1)</div>
                                    <div className="text-slate-300 text-[10px] space-x-1">
                                      <span>第1~8名:</span>
                                      <span className="text-amber-300 font-bold">8分</span>,
                                      <span className="text-slate-300">7分</span>,
                                      <span className="text-slate-300">6分</span>,
                                      <span className="text-slate-300">5分</span>,
                                      <span className="text-slate-300">4分</span>,
                                      <span className="text-slate-300">3分</span>,
                                      <span className="text-slate-300">2分</span>,
                                      <span className="text-slate-300">1分</span>
                                    </div>
                                  </div>
                                  <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-purple-500/50 transform rotate-45 -mt-1.5" />
                                </div>
                              </div>

                              <div className="relative group flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStage(idx, 'scoreRuleId', '2')}
                                  className={`w-full py-0.5 rounded-md font-bold transition-all text-center ${
                                    ruleId === '2'
                                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  9分加权
                                </button>
                                {/* Tooltip */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none whitespace-nowrap">
                                  <div className="bg-slate-900 border border-amber-500/50 text-slate-100 text-[11px] px-3 py-2 rounded-xl shadow-2xl shadow-black/90 font-mono text-center">
                                    <div className="text-amber-300 font-extrabold mb-1">吃鸡加权积分 (9-7-6-5-4-3-2-1)</div>
                                    <div className="text-slate-300 text-[10px] space-x-1">
                                      <span>第1~8名:</span>
                                      <span className="text-amber-400 font-black">9分 (+1)</span>,
                                      <span className="text-slate-300">7分</span>,
                                      <span className="text-slate-300">6分</span>,
                                      <span className="text-slate-300">5分</span>,
                                      <span className="text-slate-300">4分</span>,
                                      <span className="text-slate-300">3分</span>,
                                      <span className="text-slate-300">2分</span>,
                                      <span className="text-slate-300">1分</span>
                                    </div>
                                  </div>
                                  <div className="w-2.5 h-2.5 bg-slate-900 border-r border-b border-amber-500/50 transform rotate-45 -mt-1.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* 决赛黄金登顶徽章 (跨越两栏 136 + 136 + 8 = 280px) */
                        <div className="w-[280px] shrink-0 flex justify-end">
                          <span className="w-full justify-center px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-black flex items-center gap-1.5 border border-amber-400/40 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>20分登顶制总决赛 (8分标准)</span>
                          </span>
                        </div>
                      )}

                      {/* Slot 3: 删除操作区 (固定宽度 28px) */}
                      <div className="w-7 shrink-0 flex justify-center">
                        {!isFinal && stages.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                            title="删除该赛段"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || '');
                              handleUpdateStage(idx, 'roundCount', val);
                            }}
                            className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-100 font-mono text-center focus:outline-none focus:border-purple-500 font-bold"
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
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStage(idx, 'directToFinalCount', val);
                            }}
                            placeholder="0"
                            className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 font-mono text-center focus:outline-none focus:border-amber-500 font-bold"
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
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 0);
                              handleUpdateStage(idx, 'eliminateCount', val);
                            }}
                            placeholder="0"
                            className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-rose-300 font-mono text-center focus:outline-none focus:border-rose-500 font-bold"
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

        {/* 5. Validation Status Box */}
        {validationError ? (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">数学闭包校验未通过：</span>
              <span>{validationError}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>赛程流转闭包数学合法：各赛段房间均能满员 8 人，总决赛恰好 8 人。</span>
          </div>
        )}

        {/* 6. Footer Actions */}
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
              <span>正在创建...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>确认并创建赛事</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
