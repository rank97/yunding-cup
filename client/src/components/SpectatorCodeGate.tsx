import React, { useState } from 'react';
import { 
  Trophy, 
  Tv, 
  Search, 
  ArrowRight, 
  LogIn, 
  Sparkles, 
  Radio, 
  AlertCircle,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Tournament } from '../types';

interface SpectatorCodeGateProps {
  tournaments: Tournament[];
  onEnterWithShareCode: (shareCode: string) => boolean;
  onOpenLogin: () => void;
}

export const SpectatorCodeGate: React.FC<SpectatorCodeGateProps> = ({
  tournaments,
  onEnterWithShareCode,
  onOpenLogin,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      setErrorMsg('请输入 8 位比赛分享码');
      return;
    }

    const success = onEnterWithShareCode(code);
    if (!success) {
      setErrorMsg(`未找到分享码为 [${code}] 的比赛，请确认后重试`);
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/20 via-cyan-500/15 to-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl space-y-8 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-purple-500 to-cyan-400 p-[2px] shadow-2xl shadow-purple-500/30">
              <div className="w-full h-full bg-[#0b0d1b] rounded-3xl flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce duration-1000" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold tracking-wider">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>TFT-TourneyOS 全景实时观赛大屏</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-300 via-purple-200 to-cyan-300 bg-clip-text text-transparent">
              云顶之弈多阶段电竞赛事
            </h1>
            <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              输入主办方分享的 8 位赛事观赛码，即刻接入全景积分榜、多阶段流转树与 20 分登顶决赛实况。
            </p>
          </div>
        </div>

        {/* Central Code Entry Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-purple-500/30 shadow-2xl space-y-5 bg-slate-900/60 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="输入 8 位观赛码 (如: VZ7LMX62)"
                className="w-full px-5 py-4 rounded-2xl bg-slate-950/80 border-2 border-purple-500/50 text-amber-300 font-mono text-center text-xl sm:text-2xl font-extrabold tracking-[0.25em] placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-purple-500/20 transition-all uppercase shadow-inner"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-center gap-2 font-mono animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!inputCode.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                inputCode.trim()
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-600/30 cursor-pointer transform hover:scale-[1.01]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>立即进入观赛大屏</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo / Public Matches Picker */}
          {tournaments.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-left">
              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>正在进行的公开赛事（点击快速接入）：</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {tournaments.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onEnterWithShareCode(t.shareCode)}
                    className="p-3 rounded-xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-xs flex items-center justify-between text-slate-300 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
                      <span className="font-bold text-slate-100 group-hover:text-amber-300">{t.title}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 font-mono text-[10px]">
                        {t.totalPlayers}人赛
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] group-hover:text-cyan-300 flex items-center gap-1">
                      码: <span className="text-amber-400 font-bold">{t.shareCode}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Admin Entry */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span>我是赛事主办方或裁判？</span>
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-4 flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>登录管理中台</span>
          </button>
        </div>
      </div>
    </div>
  );
};
