import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Users,
  Check,
  Upload,
  Lock,
  Edit3,
  Trash2,
  Plus,
  Search,
  Share2,
  Copy,
  ExternalLink,
  AlertCircle,
  QrCode,
  Save,
  CheckCircle2,
  Gamepad2,
  UserCheck,
  Palette,
  RefreshCw
} from 'lucide-react';
import { Player } from '../types';
import { useNotification } from '../context/NotificationContext';

interface PlayerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  shareCode: string;
  tournamentTitle: string;
  totalPlayers: number;
  isLocked: boolean;
  currentPlayers: Player[];
  onImport: (tournamentId: string, players: any[]) => Promise<void>;
  onAddSinglePlayer: (tournamentId: string, data: { name: string; gameId: string; avatarUrl?: string }) => Promise<void>;
  onUpdateSinglePlayer: (playerId: string, name: string, gameId: string, avatarUrl?: string) => Promise<void>;
  onDeleteSinglePlayer: (playerId: string) => Promise<void>;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=PenguKnight&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=ChibiYasuo&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=StarGuardianAhri&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ProjectMecha&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberAgent&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=MoonSorceress&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=DragonLord&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowNinja&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelMage&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelHero&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=CuteDango&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=FuryHorn&backgroundColor=b6e3f4',
];

const SAMPLE_ESPORTS_NAMES = [
  { name: '红莲', gameId: 'TFT_HongLian' },
  { name: '弃徒', gameId: 'QiTu_Master' },
  { name: '慎独', gameId: 'ShenDu_Rank1' },
  { name: '神超', gameId: 'GodChao_666' },
  { name: '幻灭', gameId: 'HuanMie_TFT' },
  { name: '阿陈', gameId: 'AChen_Ace' },
  { name: '琉璃', gameId: 'LiuLi_Star' },
  { name: '童扬', gameId: 'TongYang_Pro' },
  { name: '冰哥', gameId: 'BingGe_Ice' },
  { name: '卷子', gameId: 'JuanZi_Carry' },
  { name: '爱萝莉', gameId: 'FireLoli_Top' },
  { name: '徐清林', gameId: 'XQL_Tactics' },
  { name: '迅哥', gameId: 'XunGe_Fast' },
  { name: '小钰', gameId: 'XiaoYu_Charm' },
  { name: '黑皮', gameId: 'HeiPi_Dark' },
  { name: '星痕', gameId: 'StarTrace_01' },
  { name: '夜月', gameId: 'NightMoon_99' },
  { name: '疾风', gameId: 'Wind_Blaster' },
  { name: '狂刀', gameId: 'Blade_Master' },
  { name: '无双', gameId: 'WuShuang_God' },
  { name: '流星', gameId: 'Meteor_Fall' },
  { name: '苍穹', gameId: 'CangQiong_Sky' },
  { name: '幽冥', gameId: 'YouMing_Nether' },
  { name: '雷霆', gameId: 'Thunder_Strike' },
  { name: '赤焰', gameId: 'RedFlame_Burn' },
  { name: '霜华', gameId: 'Frost_Frost' },
  { name: '追风', gameId: 'Wind_Chaser' },
  { name: '傲雪', gameId: 'Snow_Pride' },
  { name: '寒霜', gameId: 'Cold_Dew' },
  { name: '断水', gameId: 'Water_Cut' },
  { name: '破空', gameId: 'Void_Breaker' },
  { name: '御龙', gameId: 'Dragon_Rider' },
];

export const PlayerImportModal: React.FC<PlayerImportModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  shareCode,
  tournamentTitle,
  totalPlayers,
  isLocked,
  currentPlayers,
  onImport,
  onAddSinglePlayer,
  onUpdateSinglePlayer,
  onDeleteSinglePlayer,
}) => {
  const { toast, alertModal, confirmModal } = useNotification();
  const [activeTab, setActiveTab] = useState<'roster' | 'batch'>('roster');

  // Single Add State
  const [newName, setNewName] = useState('');
  const [newGameId, setNewGameId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Editing State: playerId -> { name, gameId, avatarUrl }
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGameId, setEditGameId] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);

  // Batch Import State
  const [playersText, setPlayersText] = useState('');
  const [loadingBatch, setLoadingBatch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentPlayers.length > 0) {
        const text = currentPlayers.map((p) => `${p.name}, ${p.gameId || ''}`).join('\n');
        setPlayersText(text);
      } else {
        setPlayersText('');
      }
      setEditingPlayerId(null);
      setShowAvatarPicker(false);
      setNewName('');
      setNewGameId('');
    }
  }, [isOpen, currentPlayers]);

  if (!isOpen) return null;

  const registeredCount = currentPlayers.length;
  const isFull = registeredCount >= totalPlayers;
  const progressPercent = Math.min(100, Math.round((registeredCount / totalPlayers) * 100));
  const signupUrl = `${window.location.origin}/signup/${shareCode}`;

  // Filtered Players
  const filteredPlayers = currentPlayers.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.gameId && p.gameId.toLowerCase().includes(q)) ||
      String(p.initialSeed).includes(q)
    );
  });

  // Handler: Add Single Player
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      toast.warning('赛事已开赛，无法添加新选手');
      return;
    }
    if (isFull) {
      toast.warning(`名册已满 (${registeredCount}/${totalPlayers} 人)，无法继续添加`);
      return;
    }
    if (!newName.trim()) {
      toast.warning('请输入选手姓名');
      return;
    }

    try {
      setIsAdding(true);
      const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      await onAddSinglePlayer(tournamentId, {
        name: newName.trim(),
        gameId: newGameId.trim(),
        avatarUrl: randomAvatar,
      });
      setNewName('');
      setNewGameId('');
      toast.success('选手添加成功！已自动分配电竞动漫头像');
    } catch (err: any) {
      alertModal({
        title: '添加选手失败',
        message: err.message || '添加选手失败',
        type: 'error',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handler: Start Inline Edit
  const handleStartEdit = (p: Player, fallbackAvatar: string) => {
    setEditingPlayerId(p.id);
    setEditName(p.name);
    setEditGameId(p.gameId || '');
    setEditAvatarUrl(p.avatarUrl || fallbackAvatar);
    setShowAvatarPicker(false);
  };

  // Handler: Save Inline Edit
  const handleSaveEdit = async (playerId: string) => {
    if (!editName.trim()) {
      toast.warning('选手姓名不能为空');
      return;
    }
    try {
      setSavingPlayerId(playerId);
      await onUpdateSinglePlayer(playerId, editName.trim(), editGameId.trim(), editAvatarUrl.trim());
      setEditingPlayerId(null);
      setShowAvatarPicker(false);
      toast.success('选手信息及头像已更新');
    } catch (err: any) {
      alertModal({
        title: '更新失败',
        message: err.message || '更新选手信息失败',
        type: 'error',
      });
    } finally {
      setSavingPlayerId(null);
    }
  };

  // Handler: Delete Single Player
  const handleDeletePlayer = async (p: Player) => {
    if (isLocked) {
      toast.warning('赛事已开赛，无法删除选手');
      return;
    }
    const confirmed = await confirmModal({
      title: '确认删除选手',
      message: `确定要从参赛名册中移除选手【${p.name}】(${p.gameId || '无ID'}) 吗？删除后其席位将被释放。`,
      type: 'danger',
      confirmText: '确认移除',
    });
    if (!confirmed) return;

    try {
      await onDeleteSinglePlayer(p.id);
      toast.success(`选手【${p.name}】已成功移除`);
    } catch (err: any) {
      alertModal({
        title: '删除失败',
        message: err.message || '删除选手失败',
        type: 'error',
      });
    }
  };

  // Handler: Batch Import
  const handleConfirmBatchImport = async () => {
    if (isLocked) {
      alertModal({
        title: '全量导入已锁定',
        message: '比赛已开赛，全量覆盖导入已锁定！请在单人修改区域直接编辑选手姓名和游戏 ID。',
        type: 'warning',
      });
      return;
    }

    const lines = playersText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length !== totalPlayers) {
      alertModal({
        title: '选手人数不匹配',
        message: `当前输入选手共 ${lines.length} 人，必须恰好等于赛事设定的 ${totalPlayers} 人！`,
        type: 'warning',
      });
      return;
    }

    const payload = lines.map((line, idx) => {
      const parts = line.split(/[,，\t\s]+/);
      const name = parts[0] || `选手_${idx + 1}`;
      const gameId = parts[1] || `ID_${idx + 1}`;
      const avatarUrl = PRESET_AVATARS[idx % PRESET_AVATARS.length];
      return {
        name,
        gameId,
        avatarUrl,
        initialSeed: idx + 1,
      };
    });

    try {
      setLoadingBatch(true);
      await onImport(tournamentId, payload);
      toast.success('全量选手名册已成功导入！');
      setActiveTab('roster');
    } catch (err: any) {
      alertModal({
        title: '导入选手失败',
        message: err.message || '导入选手名册失败',
        type: 'error',
      });
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleGenerateDemo = () => {
    const list: string[] = [];
    for (let i = 0; i < totalPlayers; i++) {
      const sample = SAMPLE_ESPORTS_NAMES[i % SAMPLE_ESPORTS_NAMES.length];
      const suffix = i >= SAMPLE_ESPORTS_NAMES.length ? `_${Math.floor(i / SAMPLE_ESPORTS_NAMES.length) + 1}` : '';
      list.push(`${sample.name}${suffix}, ${sample.gameId}${suffix}`);
    }
    setPlayersText(list.join('\n'));
    toast.info(`已生成 ${totalPlayers} 人示范名单，请点击下方确认导入`);
  };

  const handleCopySignupLink = () => {
    navigator.clipboard.writeText(signupUrl);
    toast.success('选手在线报名专属链接已复制到剪贴板！');
  };

  const handleCopyShareTemplate = () => {
    const spectatorUrl = `${window.location.origin}/?v=${shareCode}`;
    const text = `🏆【${tournamentTitle}】云顶之弈锦标赛参赛报名开启！\n\n📌 赛事规模：${totalPlayers} 人\n👉 选手报名链接：${signupUrl}\n📺 观赛大屏链接：${spectatorUrl}\n\n名额有限，先到先得！快来报名参赛吧！`;
    navigator.clipboard.writeText(text);
    toast.success('群发招募文案已复制！包含选手报名与观赛大屏链接，可直接粘贴分享！');
  };

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#0e1326] rounded-3xl border border-purple-500/40 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                <span>参赛选手名册与报名管理</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 font-bold">
                  {registeredCount} / {totalPlayers} 人
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持在线分享报名链接、单人录入修改/删除、以及批量导入花名册
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Share Link Capsule Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Progress indicator */}
            <div className="space-y-1 min-w-[140px]">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-300">名额完成度</span>
                <span className="font-mono text-purple-400">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    isFull ? 'bg-gradient-to-r from-purple-500 to-emerald-400' : 'bg-purple-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              {isLocked ? (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  已开赛锁定（仅允许修改姓名/ID）
                </span>
              ) : isFull ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  名册已满员 ({registeredCount}/{totalPlayers})
                </span>
              ) : (
                <span>
                  尚缺 <span className="font-mono font-bold text-amber-400">{totalPlayers - registeredCount}</span> 人满员
                </span>
              )}
            </div>
          </div>

          {/* Share Buttons: One-click Full Template & Quick Link */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyShareTemplate}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 border border-amber-400/40 text-xs text-amber-300 font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="一键复制包含报名链接与观赛大屏链接的完整群发文案"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>分享选手报名通道</span>
            </button>
            <button
              onClick={handleCopySignupLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1 transition-all"
              title="单独复制报名网页链接"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>复制报名链接</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>选手名册明细 ({registeredCount}/{totalPlayers})</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>批量快捷导入 / 示例生成</span>
          </button>
        </div>

        {/* Tab 1: Player Roster & Single Add/Edit/Delete */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Top Toolbar: Quick Add Form + Search Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              {/* Quick Add (Left 8 cols) */}
              <form
                onSubmit={handleAddSingle}
                className="lg:col-span-8 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="选手姓名/称呼 (必填)"
                  value={newName}
                  disabled={isLocked || isFull}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full sm:w-1/3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-medium disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="游戏内 ID (如: 虎牙丶红莲#1234)"
                  value={newGameId}
                  disabled={isLocked || isFull}
                  onChange={(e) => setNewGameId(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLocked || isFull || isAdding || !newName.trim()}
                  className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加选手</span>
                </button>
              </form>

              {/* Search Box (Right 4 cols) */}
              <div className="lg:col-span-4 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="搜索姓名或游戏 ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Players Table / Grid */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredPlayers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Users className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">
                    {searchQuery
                      ? '未找到匹配的选手'
                      : '当前名册暂无选手。可上方添加、分享报名链接或切换批量导入。'}
                  </p>
                </div>
              ) : (
                filteredPlayers.map((p, idx) => {
                  const defaultAvatar = PRESET_AVATARS[idx % PRESET_AVATARS.length];
                  const isEditing = editingPlayerId === p.id;
                  const isSaving = savingPlayerId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 px-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                        isEditing
                          ? 'bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between'
                      }`}
                    >
                      {/* Left: Seed + Avatar + Info or Inline Inputs */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                        {!isEditing && (
                          <div className="relative shrink-0">
                            <img
                              src={p.avatarUrl || defaultAvatar}
                              alt={p.name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-700 bg-slate-900"
                            />
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-purple-600 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow">
                              {p.initialSeed || idx + 1}
                            </span>
                          </div>
                        )}

                        {isEditing ? (
                          <div className="flex flex-col gap-2.5 flex-1 w-full">
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full">
                              {/* Editable Avatar Selector */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div
                                  onClick={() => setShowAvatarPicker((prev) => !prev)}
                                  className="relative cursor-pointer group/av rounded-xl overflow-hidden ring-2 ring-purple-500 hover:ring-amber-400 transition-all shadow-md shrink-0"
                                  title="点击选择动漫头像"
                                >
                                  <img
                                    src={editAvatarUrl || defaultAvatar}
                                    alt="avatar"
                                    className="w-9 h-9 object-cover bg-slate-900 group-hover/av:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity">
                                    <Palette className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-600 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow">
                                    #{p.initialSeed || idx + 1}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const random = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                                    setEditAvatarUrl(random);
                                  }}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 hover:border-purple-500/50 text-xs transition-all flex items-center gap-1 shrink-0"
                                  title="随机换头像"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span className="text-[11px] font-bold">换头像</span>
                                </button>
                              </div>

                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="选手姓名"
                                className="w-full sm:w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-purple-400 text-slate-100 text-xs font-bold focus:outline-none"
                              />
                              <input
                                type="text"
                                value={editGameId}
                                onChange={(e) => setEditGameId(e.target.value)}
                                placeholder="游戏 ID"
                                className="w-full sm:w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-400"
                              />
                            </div>

                            {/* Avatar Quick Picker Panel */}
                            {showAvatarPicker && (
                              <div className="p-2.5 bg-slate-900/98 border border-purple-500/50 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span className="font-bold text-amber-300">点击头像即可直接选定：</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAvatarPicker(false)}
                                    className="text-purple-400 hover:text-purple-300 text-[11px] font-bold"
                                  >
                                    收起 ✕
                                  </button>
                                </div>
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                                  {PRESET_AVATARS.map((url, avIdx) => {
                                    const isSelected = editAvatarUrl === url;
                                    return (
                                      <button
                                        key={avIdx}
                                        type="button"
                                        onClick={() => {
                                          setEditAvatarUrl(url);
                                          setShowAvatarPicker(false);
                                        }}
                                        className={`p-0.5 rounded-xl border transition-all hover:scale-110 ${
                                          isSelected
                                            ? 'border-amber-400 ring-2 ring-amber-400/60 bg-amber-400/20'
                                            : 'border-slate-700 hover:border-purple-400 bg-slate-800/60'
                                        }`}
                                      >
                                        <img
                                          src={url}
                                          alt={`avatar-${avIdx}`}
                                          className="w-7 h-7 rounded-lg object-cover"
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate">
                              ID: {p.gameId || '—'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(p.id)}
                              disabled={isSaving}
                              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md"
                            >
                              <Save className="w-3 h-3" />
                              <span>{isSaving ? '保存中...' : '保存'}</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlayerId(null);
                                setShowAvatarPicker(false);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(p, defaultAvatar)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 transition-all"
                              title="编辑选手姓名、ID与头像"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {!isLocked && (
                              <button
                                onClick={() => handleDeletePlayer(p)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all"
                                title="删除选手"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Batch Import & Auto Demo Generator */}
        {activeTab === 'batch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                批量粘贴选手花名册（支持从 Excel / 微信群复制，格式：<span className="text-purple-400">选手姓名, 游戏ID</span>，每行一位）
              </label>
              <button
                type="button"
                onClick={handleGenerateDemo}
                disabled={isLocked}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>一键生成 {totalPlayers} 人示范名册</span>
              </button>
            </div>

            <textarea
              rows={10}
              value={playersText}
              disabled={isLocked}
              onChange={(e) => setPlayersText(e.target.value)}
              placeholder={`例如：\n红莲, TFT_HongLian\n神超, GodChao_666\n弃徒, QiTu_Master\n...`}
              className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-purple-500 transition-all custom-scrollbar disabled:opacity-50"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                当前已输入：
                <span className="font-mono font-bold text-purple-400 ml-1">
                  {playersText.split('\n').filter((l) => l.trim().length > 0).length}
                </span>{' '}
                / {totalPlayers} 人
              </span>

              <button
                type="button"
                onClick={handleConfirmBatchImport}
                disabled={isLocked || loadingBatch}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>{loadingBatch ? '正在全量导入...' : '确认全量覆盖导入'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition-all"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
