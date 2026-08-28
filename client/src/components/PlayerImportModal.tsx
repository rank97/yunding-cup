import React, { useState, useEffect } from 'react';
import { X, Sparkles, Users, Check, Upload, Lock, Edit3, Save, AlertCircle } from 'lucide-react';
import { Player } from '../types';

interface PlayerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  totalPlayers: number;
  isLocked: boolean;
  currentPlayers: Player[];
  onImport: (tournamentId: string, players: any[]) => Promise<void>;
  onUpdateSinglePlayer: (playerId: string, name: string, gameId: string) => Promise<void>;
}

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
  totalPlayers,
  isLocked,
  currentPlayers,
  onImport,
  onUpdateSinglePlayer,
}) => {
  const [playersText, setPlayersText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editablePlayers, setEditablePlayers] = useState<{ [id: string]: { name: string; gameId: string } }>({});
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (currentPlayers.length > 0) {
        const text = currentPlayers.map((p) => `${p.name}, ${p.gameId || ''}`).join('\n');
        setPlayersText(text);

        const initialEdit: { [id: string]: { name: string; gameId: string } } = {};
        currentPlayers.forEach((p) => {
          initialEdit[p.id] = { name: p.name, gameId: p.gameId || '' };
        });
        setEditablePlayers(initialEdit);
      } else {
        setPlayersText('');
      }
    }
  }, [isOpen, currentPlayers]);

  if (!isOpen) return null;

  const handleGenerateDemoPlayers = () => {
    const list: string[] = [];
    for (let i = 0; i < totalPlayers; i++) {
      const sample = SAMPLE_ESPORTS_NAMES[i % SAMPLE_ESPORTS_NAMES.length];
      const suffix = i >= SAMPLE_ESPORTS_NAMES.length ? `_${Math.floor(i / SAMPLE_ESPORTS_NAMES.length) + 1}` : '';
      list.push(`${sample.name}${suffix}, ${sample.gameId}${suffix}`);
    }
    setPlayersText(list.join('\n'));
  };

  const handleConfirmImport = async () => {
    if (isLocked) {
      alert('比赛已开赛，全量覆盖导入已锁定！请在单人修改区域直接编辑选手信息。');
      return;
    }

    const lines = playersText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length !== totalPlayers) {
      alert(`当前输入选手共 ${lines.length} 人，必须恰好等于赛事设定的 ${totalPlayers} 人！`);
      return;
    }

    const payload = lines.map((line, idx) => {
      const parts = line.split(/[,，\t\s]+/);
      const name = parts[0] || `选手_${idx + 1}`;
      const gameId = parts[1] || `ID_${idx + 1}`;
      return {
        name,
        gameId,
        initialSeed: idx + 1,
      };
    });

    try {
      setLoading(true);
      await onImport(tournamentId, payload);
      onClose();
    } catch (err: any) {
      alert(err.message || '导入选手失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSingle = async (pId: string) => {
    const edit = editablePlayers[pId];
    if (!edit || !edit.name.trim()) {
      alert('选手姓名不能为空');
      return;
    }
    try {
      setSavingPlayerId(pId);
      await onUpdateSinglePlayer(pId, edit.name, edit.gameId);
      setSavedSuccessId(pId);
      setTimeout(() => setSavedSuccessId(null), 2000);
    } catch (err: any) {
      alert(err.message || '修改选手失败');
    } finally {
      setSavingPlayerId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border-purple-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>{isLocked ? '选手名册管理 (单人信息修正)' : '录入/批量导入参赛选手花名册'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              目标参赛总人数: <span className="text-amber-300 font-mono font-bold">{totalPlayers}</span> 人
              {isLocked && <span className="text-rose-400 font-bold ml-2">(🔒 比赛已开赛，全量重置已锁定)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Warning Banner */}
        {isLocked ? (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
            <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <div className="font-bold">比赛已开赛（分组/成绩已锁定生效）</div>
              <div className="text-slate-400 mt-0.5">
                为保证已有历史积分与房间对局数据不丢失，系统已禁止全量重置花名册。你可以在下方直接修改单名选手的姓名或游戏 ID，实时保存无损同步。
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              格式：每行一人，如 <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">张三, TFT_ZhangSan</code>
            </span>
            <button
              type="button"
              onClick={handleGenerateDemoPlayers}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>一键生成 {totalPlayers} 位电竞选手数据</span>
            </button>
          </div>
        )}

        {/* Locked View: Editable Player Table */}
        {isLocked ? (
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {currentPlayers.map((p, idx) => {
              const edit = editablePlayers[p.id] || { name: p.name, gameId: p.gameId || '' };
              const isSaving = savingPlayerId === p.id;
              const isSaved = savedSuccessId === p.id;

              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <div>
                      <input
                        type="text"
                        value={edit.name}
                        onChange={(e) =>
                          setEditablePlayers((prev) => ({
                            ...prev,
                            [p.id]: { ...prev[p.id], name: e.target.value },
                          }))
                        }
                        placeholder="选手姓名"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={edit.gameId}
                        onChange={(e) =>
                          setEditablePlayers((prev) => ({
                            ...prev,
                            [p.id]: { ...prev[p.id], gameId: e.target.value },
                          }))
                        }
                        placeholder="游戏 ID"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveSingle(p.id)}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 border border-purple-500/40'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>已保存</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? '保存中' : '保存'}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Unlocked View: Batch Textarea */
          <>
            <textarea
              rows={10}
              value={playersText}
              onChange={(e) => setPlayersText(e.target.value)}
              placeholder={`红莲, TFT_HongLian\n弃徒, QiTu_Master\n慎独, ShenDu_Rank1\n神超, GodChao_666\n...`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-xs font-mono text-slate-400">
                已输入:{' '}
                <span
                  className={
                    playersText.split('\n').filter((l) => l.trim().length > 0).length === totalPlayers
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {playersText.split('\n').filter((l) => l.trim().length > 0).length}
                </span>{' '}
                / {totalPlayers} 人
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={
                    loading ||
                    playersText.split('\n').filter((l) => l.trim().length > 0).length !== totalPlayers
                  }
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4" />
                  <span>{loading ? '正在导入...' : '确认导入名单'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {isLocked && (
          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-primary">
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
