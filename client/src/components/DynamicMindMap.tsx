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
  HelpCircle,
  Gamepad2
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
        <div className="flex items-center gap-4 text-xs font-medium text-slate-300 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 ring-1 ring-amber-300/40" />
            <span>直通决赛通道</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 ring-1 ring-emerald-300/40" />
            <span>常规晋级路线</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 ring-1 ring-rose-400/40" />
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
                {/* Stage Column Card Container - 拓宽至 420px/460px/500px 提升大屏可读性 */}
                <div 
                  className={`w-[420px] xl:w-[460px] 2xl:w-[500px] shrink-0 rounded-2xl transition-all duration-300 ${
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
                      <span className={`px-2 py-0.5 rounded border ${
                        col.scoreRuleId === '2'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                      }`}>
                        {col.scoreRuleId === '2' ? '9分加权制' : '8分标准制'}
                      </span>
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
                        className="mt-3 w-full py-1.5 rounded-lg bg-slate-800/60 hover:bg-purple-600/30 text-xs text-purple-300 font-medium border border-purple-500/20 transition-all flex items-center justify-center gap-1"
                      >
                        <span>查看该赛段积分榜与各组战报</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Group Stack - 提升大屏下的纵向利用率 */}
                  <div className="p-3.5 space-y-4 max-h-[700px] 2xl:max-h-[880px] overflow-y-auto">
                    {col.groups.map((group) => (
                      <div 
                        key={group.groupId}
                        className={`rounded-xl p-3.5 border transition-all ${
                          isFinal 
                            ? 'bg-slate-900/80 border-amber-500/30' 
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                              isFinal ? 'bg-amber-400/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {group.groupName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">8 位选手</span>
                          </div>

                          {/* 每一列固定标题：仅总决赛显示赛点列 */}
                          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 font-semibold">
                            {isFinal && <span className="w-14 text-center">赛点</span>}
                            <span className="w-14 text-right pr-1">积分</span>
                          </div>
                        </div>

                        {/* 8 Player Slots - 严格按总积分高低实时排序 */}
                        <div className="space-y-2">
                          {[...group.slots]
                            .sort((a, b) => {
                              if (a.isPlaceholder) return 1;
                              if (b.isPlaceholder) return -1;
                              const aChamp = a.advancementStatus === 'CHAMPION';
                              const bChamp = b.advancementStatus === 'CHAMPION';
                              if (aChamp && !bChamp) return -1;
                              if (!aChamp && bChamp) return 1;

                              const scoreDiff = (b.currentScore ?? 0) - (a.currentScore ?? 0);
                              if (scoreDiff !== 0) return scoreDiff;

                              const fpDiff = (b.firstPlaces ?? 0) - (a.firstPlaces ?? 0);
                              if (fpDiff !== 0) return fpDiff;

                              const top4Diff = (b.top4s ?? 0) - (a.top4s ?? 0);
                              if (top4Diff !== 0) return top4Diff;

                              return (a.seedIndex ?? 0) - (b.seedIndex ?? 0);
                            })
                            .map((slot, sIdx) => {
                            if (slot.isPlaceholder) {
                              return (
                                <div 
                                  key={sIdx}
                                  className="px-3.5 py-2.5 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 flex items-center justify-between text-xs text-slate-500"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                                    <span className="text-sm font-medium text-slate-400">{slot.placeholderDesc || '虚位以待'}</span>
                                  </div>
                                  <span className="text-xs font-mono text-slate-500 font-bold">#{slot.seedIndex}</span>
                                </div>
                              );
                            }

                            const isChampion = slot.advancementStatus === 'CHAMPION';
                            const isDirect = slot.advancementStatus === 'DIRECT_FINAL';
                            const isAdvanced = slot.advancementStatus === 'ADVANCED';
                            const isEliminated = slot.advancementStatus === 'ELIMINATED';
                            const isMatchPoint = isFinal && slot.isMatchPoint === 1;

                            return (
                              <div
                                key={slot.playerId || sIdx}
                                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                  isChampion
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-md shadow-amber-500/20'
                                    : isMatchPoint
                                    ? 'bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 border-orange-400/90 text-slate-100 font-bold shadow-md shadow-orange-950/40 ring-1 ring-orange-400/50'
                                    : isDirect
                                    ? 'bg-amber-500/15 border-amber-400/90 text-amber-100 font-semibold shadow-sm shadow-amber-950/30'
                                    : isAdvanced
                                    ? 'bg-emerald-500/15 border-emerald-400/90 text-emerald-100 font-semibold shadow-sm shadow-emerald-950/30'
                                    : isEliminated
                                    ? 'bg-rose-950/25 border-rose-500/50 text-slate-300 hover:bg-rose-950/40'
                                    : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                  <span className={`font-mono text-xs w-5 shrink-0 font-black ${
                                    sIdx === 0
                                      ? 'text-amber-400'
                                      : sIdx === 1
                                      ? 'text-slate-200'
                                      : sIdx === 2
                                      ? 'text-amber-600'
                                      : 'text-slate-400'
                                  }`}>
                                    #{sIdx + 1}
                                  </span>
                                  {slot.avatarUrl && (
                                    <img
                                      src={slot.avatarUrl}
                                      alt=""
                                      className="w-7 h-7 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                                    />
                                  )}
                                  <span className="font-black text-slate-100 text-sm sm:text-base tracking-wide truncate" title={slot.name}>
                                    {slot.name}
                                  </span>
                                  {slot.gameId && (
                                    <span className="text-xs text-slate-300 font-mono font-medium truncate shrink-0 max-w-[140px]" title={slot.gameId}>
                                      ({slot.gameId})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                  {/* 1. 赛点专属列 (仅总决赛拥有 20分赛点制) */}
                                  {isFinal && (
                                    <div className="w-14 flex justify-center">
                                      {isMatchPoint ? (
                                        <span 
                                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-600/90 text-rose-100 text-[11px] font-mono font-black border border-rose-400/40 shadow-sm shadow-rose-600/40"
                                          title="已达 20 分开启赛点，下局吃鸡即可夺冠！"
                                        >
                                          <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                                          <span>赛点</span>
                                        </span>
                                      ) : (
                                        <span className="text-transparent select-none">-</span>
                                      )}
                                    </div>
                                  )}

                                  {/* 2. 当前积分专属列 (固定宽 w-14) */}
                                  <div className="w-14 text-right pr-1">
                                    {slot.currentScore !== undefined ? (
                                      <span className="font-black font-mono text-sm text-amber-300">
                                        {slot.currentScore}分
                                      </span>
                                    ) : (
                                      <span className="text-slate-600 text-xs font-mono">-</span>
                                    )}
                                  </div>
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

          {/* Far Right: GRAND CHAMPION THRONE (总冠军黄金王座) - 现代化纯净电竞展台 */}
          <div className="w-[480px] xl:w-[540px] 2xl:w-[580px] shrink-0 rounded-3xl glass-panel-gold border-2 border-amber-400/80 p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/40 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#191408] via-[#0e1124] to-[#070914] min-h-[560px]">
            {/* Ambient Aura Background */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

            {/* 1. Top Throne Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-400/20 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-400/80 uppercase tracking-widest">
                    CHAMPIONSHIP PODIUM
                  </div>
                  <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 tracking-tight">
                    赛事总冠军王座
                  </h3>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                championThrone?.isDetermined
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-sm shadow-amber-400/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
              }`}>
                {championThrone?.isDetermined ? '👑 巅峰加冕' : '🔥 决胜争夺中'}
              </span>
            </div>

            {/* 2. Main Centerpiece: Champion Crowned vs Waiting */}
            {championThrone?.isDetermined ? (
              <div className="relative z-10 my-auto py-6 flex flex-col items-center text-center space-y-4">
                {/* Crown & Glowing Avatar */}
                <div className="relative inline-block mt-2">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                    <Crown className="w-8 h-8 text-amber-400 animate-bounce drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" />
                  </div>
                  <div className="absolute inset-0 bg-amber-400/30 blur-2xl rounded-3xl" />
                  {championThrone.championAvatarUrl ? (
                    <img
                      src={championThrone.championAvatarUrl}
                      alt=""
                      className="relative w-28 h-28 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl shadow-amber-500/40 bg-slate-950 mx-auto"
                    />
                  ) : (
                    <div className="relative w-28 h-28 rounded-3xl bg-amber-950/80 border-4 border-amber-400 shadow-2xl shadow-amber-500/40 flex items-center justify-center text-3xl font-black text-amber-300 mx-auto">
                      {championThrone.championName?.charAt(0) || '👑'}
                    </div>
                  )}
                </div>

                {/* Champion Typography */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>登顶封神 · 全国总冠军</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 tracking-tight drop-shadow-md pt-1">
                    {championThrone.championName}
                  </div>
                  {championThrone.championGameId && (
                    <div className="text-sm font-mono font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-amber-400" />
                      <span>游戏 ID: {championThrone.championGameId}</span>
                    </div>
                  )}
                </div>

                {/* Honors & Stats Pills */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-center shadow-sm">
                    <div className="text-[10px] text-amber-400/80 font-mono">夺冠总积分</div>
                    <div className="text-lg font-mono font-black text-amber-200">{championThrone.totalScore} 分</div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-center shadow-sm">
                    <div className="text-[10px] text-amber-400/80 font-mono">决胜方式</div>
                    <div className="text-lg font-mono font-black text-amber-200">20分登顶吃鸡</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 my-auto py-6 flex flex-col items-center text-center space-y-4">
                {/* Floating Golden Trophy Pedestal */}
                <div className="relative my-2">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-amber-400/20 via-amber-500/10 to-transparent border-2 border-amber-400/40 flex items-center justify-center shadow-xl shadow-amber-500/10 relative mx-auto">
                    <Trophy className="w-12 h-12 text-amber-400 animate-pulse" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-amber-400/30 blur-md rounded-full" />
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-2xl font-black text-amber-100 tracking-tight">
                    决胜巅峰 · 虚位以待
                  </h4>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">
                    总决赛首位达 20 分开启赛点，并在后续对局中完成登顶吃鸡者，将在此加冕全国总冠军！
                  </p>
                </div>
              </div>
            )}

            {/* 3. Bottom Action / Status Area */}
            <div className="relative z-10 pt-4 border-t border-amber-500/20">
              {championThrone?.isDetermined ? (
                <button
                  onClick={() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } })}
                  className="btn-gold w-full py-3 rounded-2xl text-sm font-black shadow-xl shadow-amber-950/50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>放飞总冠军庆典礼花 🎉</span>
                </button>
              ) : championThrone?.matchPointCandidateNames && championThrone.matchPointCandidateNames.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-amber-950/40 border border-amber-500/30 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>已开启 20分赛点选手 (吃鸡即加冕):</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400/80 font-bold">
                      {championThrone.matchPointCandidateNames.length} 人就绪
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {championThrone.matchPointCandidateNames.map((name, i) => (
                      <div 
                        key={i} 
                        className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100 shadow-sm"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-3 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400/80 animate-spin" />
                  <span>总决赛激烈争夺中 · 暂未产生 20分赛点选手</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
