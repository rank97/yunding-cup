import React, { useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Sparkles, 
  ArrowRight, 
  Users, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Zap,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TournamentOverview, StageColumn, GroupNode, PlayerSlot } from '../types';

interface DynamicMindMapProps {
  overview: TournamentOverview;
  onSelectStage?: (stageId: string) => void;
}

export const DynamicMindMap: React.FC<DynamicMindMapProps> = ({
  overview,
  onSelectStage,
}) => {
  const { columns, championThrone } = overview;

  useEffect(() => {
    if (championThrone?.isDetermined) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#7c3aed', '#10b981']
      });
    }
  }, [championThrone?.isDetermined]);

  return (
    <div className="w-full">
      {/* Overview Top Status Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border-tft-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{overview.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                overview.status === 'COMPLETED' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : overview.status === 'IN_PROGRESS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                  : 'bg-slate-700/50 text-slate-300'
              }`}>
                {overview.status === 'COMPLETED' ? '🏆 赛事已圆满收官' : overview.status === 'IN_PROGRESS' ? '🔥 比赛激烈进行中' : '待开赛'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              总规模: <span className="text-amber-400 font-mono font-bold">{overview.totalPlayers}</span> 人 ｜ 
              当前进行阶段: <span className="text-purple-300 font-semibold">{overview.currentStageName || '筹备中'}</span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span>直通决赛通道</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>常规晋级路线</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>淘汰路线</span>
          </div>
        </div>
      </div>

      {/* Dynamic Left-to-Right Pipeline Columns */}
      <div className="overflow-x-auto pb-8 pt-2">
        <div className="flex items-start gap-8 min-w-max px-2">
          {columns.map((col, index) => {
            const isFinal = col.stageType === 'CHECKPOINT_FINAL' || index === columns.length - 1;
            const isRunning = col.status === 'IN_PROGRESS' || col.status === 'GROUPED';
            const isLocked = col.status === 'LOCKED' || col.status === 'COMPLETED';

            return (
              <div key={col.stageId} className="flex items-start gap-6">
                {/* Stage Column Card Container */}
                <div 
                  className={`w-80 rounded-2xl transition-all duration-300 ${
                    isFinal 
                      ? 'glass-panel-gold border-amber-500/50 shadow-2xl shadow-amber-950/40' 
                      : isRunning
                      ? 'glass-panel border-purple-500/60 shadow-xl shadow-purple-950/30 ring-1 ring-purple-500/40'
                      : isLocked
                      ? 'glass-panel border-emerald-500/40'
                      : 'glass-panel opacity-85 border-slate-700/50'
                  }`}
                >
                  {/* Stage Header */}
                  <div className={`p-4 border-b ${isFinal ? 'border-amber-500/30 bg-amber-950/20' : 'border-slate-800 bg-slate-900/40'} rounded-t-2xl`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center ${
                          isFinal ? 'bg-amber-400 text-slate-950' : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                        }`}>
                          {col.stageOrder}
                        </span>
                        <h3 className={`font-extrabold text-base ${isFinal ? 'text-amber-300' : 'text-slate-100'}`}>
                          {col.name}
                        </h3>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        isLocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isRunning
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isLocked ? '已锁定完赛' : isRunning ? '进行中' : '未开始'}
                      </span>
                    </div>

                    {/* Stage Meta Badges */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                        {col.roundCount} 局赛制
                      </span>
                      {col.directToFinalCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          直通 {col.directToFinalCount} 人
                        </span>
                      )}
                      {col.eliminateCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          淘汰 {col.eliminateCount} 人
                        </span>
                      )}
                      {col.inheritScores === 1 && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          继承底分
                        </span>
                      )}
                      {isFinal && (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold">
                          20分登顶制
                        </span>
                      )}
                    </div>

                    {/* View Details Click */}
                    {onSelectStage && (
                      <button
                        onClick={() => onSelectStage(col.stageId)}
                        className="mt-3 w-full py-1 rounded-lg bg-slate-800/60 hover:bg-purple-600/30 text-xs text-purple-300 font-medium border border-purple-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        <span>查看该赛段积分榜与战报</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Group Stack */}
                  <div className="p-3 space-y-3.5 max-h-[700px] overflow-y-auto">
                    {col.groups.map((group) => (
                      <div 
                        key={group.groupId}
                        className={`rounded-xl p-3 border transition-all ${
                          isFinal 
                            ? 'bg-slate-900/80 border-amber-500/30' 
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                            isFinal ? 'bg-amber-400/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {group.groupName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">8 位选手</span>
                        </div>

                        {/* 8 Player Slots */}
                        <div className="space-y-1.5">
                          {group.slots.map((slot, sIdx) => {
                            if (slot.isPlaceholder) {
                              return (
                                <div 
                                  key={sIdx}
                                  className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-700/60 bg-slate-900/30 flex items-center justify-between text-xs text-slate-500"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-slate-600" />
                                    <span className="text-[11px] truncate max-w-[170px]">{slot.placeholderDesc || '虚位以待'}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-600">#{slot.seedIndex}</span>
                                </div>
                              );
                            }

                            const isChampion = slot.advancementStatus === 'CHAMPION';
                            const isDirect = slot.advancementStatus === 'DIRECT_FINAL';
                            const isAdvanced = slot.advancementStatus === 'ADVANCED';
                            const isEliminated = slot.advancementStatus === 'ELIMINATED';
                            const isMatchPoint = slot.isMatchPoint === 1;

                            return (
                              <div
                                key={slot.playerId || sIdx}
                                className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                                  isChampion
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-md shadow-amber-500/20'
                                    : isMatchPoint
                                    ? 'bg-rose-500/15 border-rose-500 text-rose-200 font-bold animate-pulse'
                                    : isDirect
                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                                    : isAdvanced
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                                    : isEliminated
                                    ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                                    : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono text-[10px] text-slate-400 w-3.5">
                                    {slot.seedIndex}
                                  </span>
                                  <span className="font-semibold truncate max-w-[110px]" title={slot.name}>
                                    {slot.name}
                                  </span>
                                  {slot.gameId && (
                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[70px]">
                                      ({slot.gameId})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  {slot.firstPlaces !== undefined && slot.firstPlaces > 0 && (
                                    <span className="text-amber-400 font-bold flex items-center" title={`登顶吃鸡 ${slot.firstPlaces} 次`}>
                                      👑{slot.firstPlaces}
                                    </span>
                                  )}
                                  {slot.currentScore !== undefined && (
                                    <span className="font-bold text-amber-300">
                                      {slot.currentScore}分
                                    </span>
                                  )}
                                  {isMatchPoint && (
                                    <span className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-bold">
                                      赛点
                                    </span>
                                  )}
                                  {isDirect && (
                                    <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px]">
                                      直通
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flow Connector Arrow to Next Column */}
                <div className="self-center flex flex-col items-center justify-center gap-1 text-slate-600">
                  <div className="w-8 h-[2px] bg-gradient-to-r from-purple-500/60 to-cyan-500/60 rounded" />
                  <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
            );
          })}

          {/* Far Right: GRAND CHAMPION THRONE (总冠军黄金王座) */}
          <div className="w-84 rounded-2xl glass-panel-gold border-2 border-amber-400 p-6 shadow-2xl shadow-amber-500/30 flex flex-col items-center text-center relative overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-[2px] shadow-xl shadow-amber-500/40 mb-3 animate-bounce">
              <div className="w-full h-full bg-[#0b0d1b] rounded-2xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h3 className="font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-100 tracking-wider">
              🏆 赛事总冠军王座 👑
            </h3>
            <p className="text-[11px] text-amber-400/80 font-mono mt-0.5">
              TFT TOURNAMENT GRAND CHAMPION
            </p>

            <div className="w-full h-[1px] bg-amber-500/30 my-4" />

            {championThrone?.isDetermined ? (
              <div className="w-full space-y-3">
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-amber-500/20 to-amber-900/40 border border-amber-400/60 shadow-lg">
                  <div className="text-xs text-amber-300 font-mono">👑 登顶封王</div>
                  <div className="text-xl font-black text-amber-200 mt-1">
                    {championThrone.championName}
                  </div>
                  <div className="text-xs text-amber-400/80 font-mono">
                    ID: {championThrone.championGameId || '召唤师'}
                  </div>
                  <div className="mt-2 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/40 inline-block">
                    总积分: {championThrone.totalScore} 分 ｜ 决胜局登顶夺冠
                  </div>
                </div>

                <button
                  onClick={() => confetti({ particleCount: 80, spread: 80 })}
                  className="btn-gold w-full py-2 text-xs font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>触发冠军金色彩带</span>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-3 text-slate-400">
                <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-slate-900/60">
                  <Clock className="w-6 h-6 text-amber-400/60 mx-auto mb-2 animate-spin" />
                  <div className="text-xs font-bold text-amber-300">⏳ 虚位以待</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    总决赛 20 分登顶后即刻加冕
                  </div>
                </div>

                {/* Match Point Candidates Alert */}
                {championThrone?.matchPointCandidateNames && championThrone.matchPointCandidateNames.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-left">
                    <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>已就绪赛点斩杀选手:</span>
                    </div>
                    <div className="text-xs font-bold text-rose-100 mt-1 flex flex-wrap gap-1">
                      {championThrone.matchPointCandidateNames.map((name, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/30">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
