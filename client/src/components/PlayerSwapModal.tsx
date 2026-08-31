import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Users, Check, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { stageApi } from '../services/api';

interface PlayerSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  stageName: string;
  onSwap: (stageId: string, player1Id: string, player2Id: string) => Promise<void>;
}

interface PlayerOption {
  playerId: string;
  name: string;
  gameId: string;
  groupName: string;
  seedIndex: number;
  hasPlayed: boolean;
}

export const PlayerSwapModal: React.FC<PlayerSwapModalProps> = ({
  isOpen,
  onClose,
  stageId,
  stageName,
  onSwap,
}) => {
  const [player1Id, setPlayer1Id] = useState<string>('');
  const [player2Id, setPlayer2Id] = useState<string>('');
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 载入当前赛段真实分组与选手数据
  useEffect(() => {
    if (!isOpen || !stageId) return;

    let mounted = true;
    setFetchLoading(true);
    setErrorMsg(null);
    setPlayer1Id('');
    setPlayer2Id('');

    stageApi.getDetail(stageId)
      .then((detail: any) => {
        if (!mounted) return;
        const groups = detail.groups || [];
        const list: PlayerOption[] = [];

        groups.forEach((gObj: any) => {
          const gName = gObj.group?.groupName || '未命名组';
          const players = gObj.players || [];
          players.forEach((pObj: any) => {
            if (pObj.player) {
              list.push({
                playerId: pObj.player.id,
                name: pObj.player.name,
                gameId: pObj.player.gameId || '无',
                groupName: gName,
                seedIndex: pObj.seedIndex || 1,
                hasPlayed: !!pObj.hasPlayed,
              });
            }
          });
        });

        setPlayerOptions(list);
      })
      .catch((err: any) => {
        if (mounted) setErrorMsg(err.message || '获取赛段选手分组失败');
      })
      .finally(() => {
        if (mounted) setFetchLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, stageId]);

  if (!isOpen) return null;

  const p1 = playerOptions.find((p) => p.playerId === player1Id);
  const p2 = playerOptions.find((p) => p.playerId === player2Id);

  const canSwap = p1 && p2 && !p1.hasPlayed && !p2.hasPlayed && p1.playerId !== p2.playerId;

  const handleConfirmSwap = async () => {
    if (!player1Id || !player2Id) {
      setErrorMsg('请选择需要互换组别的两位选手');
      return;
    }
    if (player1Id === player2Id) {
      setErrorMsg('互换的两位选手不能为同一个人');
      return;
    }
    if (p1?.hasPlayed) {
      setErrorMsg(`选手 [${p1.name}] 在当前赛段已有对局战绩，无法微调换人！`);
      return;
    }
    if (p2?.hasPlayed) {
      setErrorMsg(`选手 [${p2.name}] 在当前赛段已有对局战绩，无法微调换人！`);
      return;
    }

    try {
      setSubmitLoading(true);
      setErrorMsg(null);
      await onSwap(stageId, player1Id, player2Id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '选手分组互换失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-amber-400" />
              <span>{stageName} - 选手分组微调互换</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              只要互换的两位选手均未打过比赛（无战绩记录），即可随时跨组微调互换
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rule Notice */}
        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
          <div>
            <span className="font-bold">微调换人规则：</span>只要互换的两位选手在当前赛段<span className="text-amber-300 font-bold">均未打过比赛（无单局战绩记录）</span>，即可随时跨组微调互换；已开赛录入成绩的选手将被锁定组别。
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {fetchLoading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs font-mono">正在载入选手组别名单...</span>
          </div>
        ) : playerOptions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs font-mono">
            当前赛段尚未执行分组，请先点击“执行蛇形分组”或“随机打散分组”后再进行微调。
          </div>
        ) : (
          <>
            {/* Swap Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Player 1 Picker */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-slate-300">
                  选手 A (交换方)
                </label>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- 请选择选手 A --</option>
                  {playerOptions.map((p) => (
                    <option
                      key={p.playerId}
                      value={p.playerId}
                      disabled={p.playerId === player2Id || p.hasPlayed}
                      className={p.hasPlayed ? 'text-slate-600' : 'text-slate-100'}
                    >
                      {p.hasPlayed ? '⛔ [已打比赛]' : '✓ [未开赛]'} [{p.groupName}] {p.name} ({p.gameId})
                    </option>
                  ))}
                </select>

                {p1 && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{p1.name}</span>
                        {p1.hasPlayed ? (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                            已产生对局记录
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                            可换人
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">ID: {p1.gameId}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 text-xs font-bold font-mono">
                      {p1.groupName}
                    </span>
                  </div>
                )}
              </div>

              {/* Player 2 Picker */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-slate-300">
                  选手 B (被交换方)
                </label>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="">-- 请选择选手 B --</option>
                  {playerOptions.map((p) => (
                    <option
                      key={p.playerId}
                      value={p.playerId}
                      disabled={p.playerId === player1Id || p.hasPlayed}
                      className={p.hasPlayed ? 'text-slate-600' : 'text-slate-100'}
                    >
                      {p.hasPlayed ? '⛔ [已打比赛]' : '✓ [未开赛]'} [{p.groupName}] {p.name} ({p.gameId})
                    </option>
                  ))}
                </select>

                {p2 && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{p2.name}</span>
                        {p2.hasPlayed ? (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                            已产生对局记录
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                            可换人
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">ID: {p2.gameId}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                      {p2.groupName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Preview Badge */}
            {p1 && p2 && (
              <div className={`p-3 rounded-xl border flex items-center justify-center gap-3 text-xs font-semibold animate-in fade-in ${
                canSwap ? 'bg-purple-950/40 border-purple-500/40 text-slate-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <span className="text-purple-300 font-bold">{p1.name}</span>
                <span className="text-slate-500 font-mono">({p1.groupName} $\to$ {p2.groupName})</span>
                <ArrowLeftRight className={`w-4 h-4 ${canSwap ? 'text-amber-400 animate-pulse' : 'text-rose-400'}`} />
                <span className="text-amber-300 font-bold">{p2.name}</span>
                <span className="text-slate-500 font-mono">({p2.groupName} $\to$ {p1.groupName})</span>
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            互换后选手将仅互换组别房间与初始席位
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmSwap}
              disabled={submitLoading || !canSwap}
              className={`${
                !canSwap
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed px-4 py-2 rounded-lg text-xs font-bold'
                  : 'btn-primary text-xs'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{submitLoading ? '正在互换...' : '确认互换组别'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
