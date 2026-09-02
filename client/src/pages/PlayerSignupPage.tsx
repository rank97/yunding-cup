import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Gamepad2,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
  ArrowRight
} from 'lucide-react';
import { publicApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Player, Tournament, Stage } from '../types';
import { getUrlNavState, updateUrlNavState } from '../services/urlState';

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

interface PlayerSignupPageProps {
  shareCode?: string;
  onNavigateToSpectate?: (shareCode: string) => void;
  onNavigateHome?: () => void;
}

export const PlayerSignupPage: React.FC<PlayerSignupPageProps> = ({
  shareCode: propShareCode,
  onNavigateToSpectate,
  onNavigateHome,
}) => {
  const shareCode = propShareCode || getUrlNavState().signupShareCode || getUrlNavState().share || '';
  const { toast, alertModal } = useNotification();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<{
    tournament: Tournament;
    stages: Stage[];
    players: Player[];
    totalPlayers: number;
    registeredCount: number;
    remainingSlots: number;
    isOpen: boolean;
    isFull: boolean;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredPlayer, setRegisteredPlayer] = useState<Player | null>(null);

  const fetchSignupData = async () => {
    if (!shareCode) return;
    try {
      const res = await publicApi.getSignupInfo(shareCode.toUpperCase());
      setData(res);
    } catch (err: any) {
      alertModal({
        title: '获取赛事信息失败',
        message: err.message || '未找到该赛事或观赛码无效',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignupData();
  }, [shareCode]);

  // SSE Realtime auto update
  useEffect(() => {
    if (!shareCode) return;
    const es = publicApi.createEventSource(shareCode.toUpperCase());

    es.addEventListener('PLAYER_REGISTERED', () => {
      fetchSignupData();
      toast.info('有新选手成功报名！名额已实时刷新');
    });

    es.addEventListener('PLAYER_ADDED', () => fetchSignupData());
    es.addEventListener('PLAYER_DELETED', () => fetchSignupData());
    es.addEventListener('PLAYER_UPDATED', () => fetchSignupData());
    es.addEventListener('TOURNAMENT_UPDATED', () => fetchSignupData());

    return () => {
      es.close();
    };
  }, [shareCode]);

  const handleSubmitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('请输入选手昵称或真实姓名');
      return;
    }
    if (!gameId.trim()) {
      toast.warning('请输入游戏内 ID（如: 虎牙丶红莲#1234）');
      return;
    }

    try {
      setSubmitting(true);
      const avatarUrl = customAvatar.trim() || selectedAvatar;
      const newPlayer = await publicApi.publicSignup(shareCode!.toUpperCase(), {
        name: name.trim(),
        gameId: gameId.trim(),
        avatarUrl,
      });

      setRegisteredPlayer(newPlayer);
      setIsSuccess(true);
      toast.success('🎉 报名成功！已成功录入参赛名单！');
      fetchSignupData();
    } catch (err: any) {
      alertModal({
        title: '报名未成功',
        message: err.message || '报名失败，请稍后重试',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('报名网页链接已复制到剪贴板！');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">正在载入赛事报名通道...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center space-y-4 border-slate-800">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-slate-100">无法访问该赛事报名页</h2>
          <p className="text-xs text-slate-400">请确认赛事观赛码（ShareCode: {shareCode}）是否正确，或联系主办方。</p>
          <button
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
              else {
                updateUrlNavState({ view: 'spectator' });
                window.location.href = '/';
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white"
          >
            返回平台首页
          </button>
        </div>
      </div>
    );
  }

  const { tournament, stages, players, totalPlayers, registeredCount, remainingSlots, isOpen, isFull } = data;
  const progressPercent = Math.min(100, Math.round((registeredCount / totalPlayers) * 100));

  const handleGoToSpectate = () => {
    if (onNavigateToSpectate) {
      onNavigateToSpectate(tournament.shareCode);
    } else {
      updateUrlNavState({ view: 'spectator', share: tournament.shareCode });
      window.location.href = `/?v=${tournament.shareCode}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#060814] text-slate-100 selection:bg-purple-500 selection:text-white pb-16">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Top Mini Nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateHome ? onNavigateHome() : (window.location.href = '/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-purple-600 p-[1px]">
              <div className="w-full h-full bg-[#0b0d1b] rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-purple-200 to-indigo-200">
              TFT TourneyOS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>分享报名页</span>
            </button>
            <button
              onClick={handleGoToSpectate}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs text-purple-300 flex items-center gap-1.5 transition-all font-medium"
            >
              <span>观赛大屏</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Tournament Card */}
        <div className="relative overflow-hidden rounded-3xl glass-panel border-purple-500/30 p-4 sm:p-6 md:p-8 shadow-2xl bg-gradient-to-br from-[#0e122b]/90 via-[#0a0d20]/80 to-[#070914]/90">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <span>官方赛事报名通道</span>
              </span>
              <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-bold bg-slate-800/90 text-slate-300 border border-slate-700/80 whitespace-nowrap">
                总席位: {totalPlayers} 人
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-100 tracking-tight break-words">
                {tournament.title}
              </h1>
            </div>

            {/* Stages Pipeline Capsule preview */}
            {stages && stages.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>赛程阶段路线图：</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {stages.map((stg, sIdx) => {
                    const isFinal = sIdx === stages.length - 1;
                    return (
                      <React.Fragment key={stg.id}>
                        <div
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                            isFinal
                              ? 'bg-amber-500/15 border-amber-400/50 text-amber-300 shadow-sm'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono text-purple-300">
                            {sIdx + 1}
                          </span>
                          <span>{stg.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({isFinal ? '20分登顶' : `${stg.roundCount}局`})
                          </span>
                        </div>
                        {sIdx < stages.length - 1 && (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registration Progress Bar - Fully Responsive */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Users className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>报名进度：</span>
                  <span className="font-mono text-purple-400 font-black text-sm">{registeredCount}</span>
                  <span className="text-slate-400 font-mono">/ {totalPlayers} 人</span>
                </div>
                {isOpen ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap font-medium">
                    开放报名中 · 剩余 {remainingSlots} 席
                  </span>
                ) : isFull ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 whitespace-nowrap font-medium">
                    名额已满
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap font-medium">
                    报名已截止
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 sm:h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                    isFull
                      ? 'bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Signup Form + Registered List (7:3 Ratio, Equal Height & Taller) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-stretch">
          {/* Left Column: Form / Success Card (7 / 10 = 70%, Equal Height) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            {isSuccess && registeredPlayer ? (
              <div className="glass-panel rounded-3xl p-6 md:p-8 border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-slate-950/90 to-[#070914] shadow-2xl flex-1 flex flex-col justify-center items-center text-center space-y-6 min-h-[640px] animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-2xl font-black text-slate-100">🎉 恭喜！您已成功报名参赛</h3>
                  <p className="text-xs text-slate-400">您的选手信息已正式录入赛事席位，请保持关注主办方开赛通知与大屏赛况。</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-left space-y-2 w-full max-w-md shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={registeredPlayer.avatarUrl || PRESET_AVATARS[0]}
                      alt="avatar"
                      className="w-14 h-14 rounded-2xl object-cover border border-emerald-400/60 bg-slate-950"
                    />
                    <div>
                      <div className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                        <span>{registeredPlayer.name}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          席位 #{registeredPlayer.initialSeed}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        游戏 ID: <span className="text-amber-300 font-semibold">{registeredPlayer.gameId || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={handleGoToSpectate}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <span>前往赛事观赛大屏</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setName('');
                      setGameId('');
                    }}
                    className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs transition-all"
                  >
                    再报一位选手
                  </button>
                </div>
              </div>
            ) : isOpen ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-8 md:p-10 border-purple-500/30 bg-slate-950/70 shadow-2xl flex-1 flex flex-col justify-between min-h-[640px] space-y-6">
                <div>
                  <div className="border-b border-slate-800 pb-4">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
                      <Gamepad2 className="w-6 h-6 text-purple-400" />
                      <span>填写选手报名信息</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      请填写真实游戏内昵称与常用选手比赛称呼，用于智能分桌与实时排行榜
                    </p>
                  </div>

                  <form id="signup-form" onSubmit={handleSubmitSignup} className="space-y-5 pt-5">
                    {/* Player Name */}
                    <div className="space-y-2">
                      <label className="block text-sm sm:text-base font-extrabold text-slate-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-purple-400" />
                        <span>选手称呼 / 比赛昵称</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="例如: 红莲 / 神超 / 卷子"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-sm sm:text-base focus:outline-none focus:border-purple-500 font-medium placeholder:text-slate-500 transition-all shadow-inner"
                      />
                    </div>

                    {/* Game ID */}
                    <div className="space-y-2">
                      <label className="block text-sm sm:text-base font-extrabold text-slate-200 flex items-center gap-1.5">
                        <Gamepad2 className="w-4 h-4 text-amber-400" />
                        <span>游戏内完整昵称 (含#编号)</span>
                        <span className="text-rose-400 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="例如: 虎牙丶红莲#1234 或 TFT_Master"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-sm sm:text-base focus:outline-none focus:border-amber-500 font-medium placeholder:text-slate-500 transition-all shadow-inner"
                      />
                    </div>

                    {/* Preset Avatar Picker */}
                    <div className="space-y-2.5">
                      <label className="block text-sm sm:text-base font-extrabold text-slate-200">
                        选择专属电竞头像 (预设动漫/小小英雄)
                      </label>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                        {PRESET_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(av);
                              setCustomAvatar('');
                            }}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all shrink-0 relative bg-slate-900 ${
                              selectedAvatar === av && !customAvatar
                                ? 'border-purple-400 ring-4 ring-purple-400/40 scale-105 shadow-lg shadow-purple-500/30'
                                : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                            }`}
                          >
                            <img src={av} alt="avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Avatar URL (Optional) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs sm:text-sm font-bold text-slate-400">
                        或输入自定义头像图片 URL (可选)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/my-avatar.png"
                        value={customAvatar}
                        onChange={(e) => setCustomAvatar(e.target.value)}
                        className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
                      />
                    </div>
                  </form>
                </div>

                {/* Submit CTA Pinned at bottom */}
                <div className="pt-2">
                  <button
                    type="submit"
                    form="signup-form"
                    disabled={submitting}
                    className="w-full py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-2xl shadow-purple-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>正在提交报名...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300" />
                        <span>确认提交报名 · 锁定参赛席位</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 border-slate-800 text-center flex-1 flex flex-col justify-center items-center space-y-4 bg-slate-950/60 min-h-[640px]">
                <ShieldCheck className="w-14 h-14 text-slate-500 mx-auto" />
                <h3 className="text-xl font-bold text-slate-200">
                  {isFull ? '参赛名额已报满' : '该赛事报名通道已关闭'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isFull
                    ? `本次赛事规模 ${totalPlayers} 人已全部录满。您可以前往观赛大屏实时关注比赛进程与战绩榜。`
                    : '当前赛事已正式开赛或已进入赛段流转，不再接受新选手在线报名。'}
                </p>
                <button
                  onClick={handleGoToSpectate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 mt-2"
                >
                  <span>进入观赛大屏</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Real-time Registered Players List (3 / 10 = 30%, Equal Height & Taller) */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className="glass-panel rounded-3xl p-4 border-purple-500/20 bg-slate-950/70 shadow-xl flex-1 flex flex-col justify-between min-h-[640px] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 text-purple-400 shrink-0" />
                  <h3 className="font-extrabold text-sm text-slate-200 truncate">
                    已报名选手
                  </h3>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-bold shrink-0">
                  {registeredCount} / {totalPlayers}
                </span>
              </div>

              {players.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
                  <Users className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-xs">暂无选手报名，抢先成为 1 号种子！</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col space-y-2 overflow-y-auto pr-1 custom-scrollbar max-h-[560px]">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2.5 px-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/40 transition-all flex items-center justify-between gap-2.5 shrink-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={p.avatarUrl || PRESET_AVATARS[idx % PRESET_AVATARS.length]}
                            alt={p.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700 bg-slate-950"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-100 truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate">
                            ID: {p.gameId || '—'}
                          </div>
                        </div>
                      </div>

                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-800/40 text-purple-300 font-bold shrink-0">
                        #{p.initialSeed || idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Footer Info in Right Card */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center shrink-0">
                实时自动推流刷新 · 满员自动截止
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
