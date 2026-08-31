import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Search, 
  Trash2, 
  ExternalLink, 
  Tv, 
  ShieldCheck, 
  Copy, 
  Check, 
  PlusCircle, 
  Crown, 
  User as UserIcon,
  Calendar,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Tournament, User } from '../types';
import { useNotification } from '../context/NotificationContext';

interface TournamentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelectTournament: (id: string) => void;
  onDeleteTournament: (id: string) => Promise<void>;
  onOpenCreateTournament: () => void;
  onOpenLogin: () => void;
  currentUser: User | null;
  onSwitchToSpectator: (shareCode: string) => void;
}

export const TournamentListModal: React.FC<TournamentListModalProps> = ({
  isOpen,
  onClose,
  tournaments,
  selectedTournamentId,
  onSelectTournament,
  onDeleteTournament,
  onOpenCreateTournament,
  onOpenLogin,
  currentUser,
  onSwitchToSpectator,
}) => {
  const { toast, alertModal } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Tournament | null>(null);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.shareCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.creatorName && t.creatorName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tournaments, searchTerm, statusFilter]);

  const handleCopyLink = (t: Tournament, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?v=${t.shareCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      setDeletingId(deleteConfirmTarget.id);
      await onDeleteTournament(deleteConfirmTarget.id);
      setDeleteConfirmTarget(null);
      toast.success('赛事已成功删除！');
    } catch (err: any) {
      alertModal({
        title: '删除赛事失败',
        message: err.message || '删除赛事失败',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-[#0b0d1b] rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-100">
                  赛事综合管理大厅
                </h3>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    超管全局穿透
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSuperAdmin
                  ? '超级管理员模式：支持查看并管理全平台所有主办方创建的赛事、直接进入中台或一键删除。'
                  : '管理您所创建的所有云顶之弈赛事，支持一键切换与大屏分享。'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filter & New Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索赛事名称 / 分享码 / 创建者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
            >
              <option value="ALL">全部状态 ({tournaments.length})</option>
              <option value="DRAFT">草稿 (DRAFT)</option>
              <option value="IN_PROGRESS">进行中 (IN_PROGRESS)</option>
              <option value="COMPLETED">已完赛 (COMPLETED)</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onClose();
                onOpenLogin();
                return;
              }
              onClose();
              onOpenCreateTournament();
            }}
            className="btn-primary py-1.5 px-3 text-xs shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>新建比赛</span>
          </button>
        </div>

        {/* Tournament List Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50 divide-y divide-slate-800/80">
          {filteredTournaments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-mono">
              没有找到符合条件的比赛
            </div>
          ) : (
            filteredTournaments.map((t) => {
              const isSelected = t.id === selectedTournamentId;
              const isCreator = currentUser && t.tenantId === currentUser.id;
              const canDelete = isSuperAdmin || isCreator;

              return (
                <div
                  key={t.id}
                  className={`p-4 transition-all flex flex-wrap items-center justify-between gap-4 ${
                    isSelected ? 'bg-purple-950/30 border-l-4 border-purple-500' : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Left: Meta Info */}
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-100">{t.title}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 text-[10px] font-bold font-mono">
                          当前选中
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {t.status === 'COMPLETED' ? '已完赛' : t.status === 'IN_PROGRESS' ? '比赛中' : '草稿'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        {t.totalPlayers} 人赛规 ({t.totalPlayers / 8} 房间)
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        创建者: <span className="font-bold text-slate-200">{t.creatorName || (isCreator ? currentUser?.username : '未知主办方')}</span>
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        分享码: <span className="text-amber-400 font-bold">{t.shareCode}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {/* Switch to Admin Workbench */}
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          onClose();
                          onOpenLogin();
                          return;
                        }
                        onSelectTournament(t.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>管理工作台</span>
                    </button>

                    {/* Spectator Big Screen */}
                    <button
                      onClick={() => {
                        onSwitchToSpectator(t.shareCode);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                      title="打开观赛大屏"
                    >
                      <Tv className="w-3.5 h-3.5 text-cyan-400" />
                      <span>观赛大屏</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={(e) => handleCopyLink(t, e)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all"
                      title="复制分享链接"
                    >
                      {copiedId === t.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete Tournament */}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirmTarget(t)}
                        disabled={deletingId === t.id}
                        className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs transition-all"
                        title="删除该赛事"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800 shrink-0">
          <span>共找到 {filteredTournaments.length} 场赛事</span>
          <span>点击“管理工作台”即可即刻切换并管理指定赛事</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <div className="w-full max-w-md glass-panel rounded-2xl border-rose-500/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-100">确认删除赛事？</h4>
                <p className="text-xs text-rose-300 font-mono mt-0.5">高危操作 · 数据不可逆</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400 font-mono">赛事名称: <span className="text-slate-100 font-bold">{deleteConfirmTarget.title}</span></div>
              <div className="text-slate-400 font-mono">创建者: <span className="text-amber-300 font-bold">{deleteConfirmTarget.creatorName || '未知'}</span></div>
              <div className="text-slate-400 font-mono">分享码: <span className="text-slate-200">{deleteConfirmTarget.shareCode}</span></div>
            </div>

            <p className="text-xs text-slate-400">
              删除后，该赛事及其赛段、选手名册与所有小局战报将被归档移除，观赛大屏将无法再访问。
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={deletingId !== null}
                className="btn-secondary text-xs"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-900/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deletingId ? '正在删除...' : '确认彻底删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
