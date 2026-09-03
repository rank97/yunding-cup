import React, { useState, useEffect, useCallback } from 'react';
import { 
  publicApi 
} from '../services/api';
import { 
  TournamentOverview, 
  StageLeaderboard, 
  GroupDetails 
} from '../types';
import { DynamicMindMap } from '../components/DynamicMindMap';
import { StageLeaderboardTable } from '../components/StageLeaderboardTable';
import { GroupRoundCards } from '../components/GroupRoundCards';
import { LayoutGrid, TableProperties, Sparkles, RefreshCw, Zap, Maximize, Minimize } from 'lucide-react';

import { getUrlNavState, updateUrlNavState } from '../services/urlState';

interface SpectatorDashboardProps {
  shareCode: string;
}

export const SpectatorDashboard: React.FC<SpectatorDashboardProps> = ({ shareCode }) => {
  const [activeTab, setActiveTab] = useState<'mindmap' | 'details'>('mindmap');
  const [overview, setOverview] = useState<TournamentOverview | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<StageLeaderboard | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // 载入大盘全景数据（策略 A：智能聚焦当前比赛赛段）
  const fetchOverview = useCallback(async () => {
    if (!shareCode) return;
    try {
      const data = await publicApi.getOverview(shareCode);
      setOverview(data);

      let targetStageId = '';
      if (data.currentStageId && data.columns.some((c) => c.stageId === data.currentStageId)) {
        targetStageId = data.currentStageId;
      } else if (data.championThrone) {
        targetStageId = data.columns[data.columns.length - 1]?.stageId || data.columns[0]?.stageId || '';
      } else {
        targetStageId = data.columns[0]?.stageId || '';
      }

      setActiveStageId((prev) => {
        if (prev && data.columns.some((c) => c.stageId === prev)) {
          return prev;
        }
        return targetStageId;
      });
    } catch (err: any) {
      console.error('Fetch overview error:', err);
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  // 载入指定赛段榜单与各组战报
  const fetchStageData = useCallback(async (stageId: string) => {
    if (!shareCode || !stageId) return;
    try {
      const [lb, gd] = await Promise.all([
        publicApi.getLeaderboard(shareCode, stageId),
        publicApi.getGroupDetails(shareCode, stageId),
      ]);
      setLeaderboard(lb);
      setGroupDetails(gd);
    } catch (err: any) {
      console.error('Fetch stage data error:', err);
    }
  }, [shareCode]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeStageId) {
      fetchStageData(activeStageId);
    }
  }, [activeStageId, fetchStageData]);

  // 建立 SSE 实时推流监听
  useEffect(() => {
    if (!shareCode) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = publicApi.createEventSource(shareCode);

      eventSource.addEventListener('SCORE_UPDATED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_GROUPED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_LOCKED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('STAGE_UNLOCKED', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });

      eventSource.addEventListener('ROUND_RESET', () => {
        fetchOverview();
        if (activeStageId) fetchStageData(activeStageId);
      });
    } catch (e) {
      console.error('SSE connect failed', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [shareCode, activeStageId, fetchOverview, fetchStageData]);

  if (loading && !overview) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">正在载入赛事全景大屏数据...</span>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-panel rounded-2xl text-center space-y-3">
        <Zap className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="font-bold text-slate-200">未找到相关赛事</h3>
        <p className="text-xs text-slate-400">请检查比赛分享码是否正确</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[2560px] 2xl:max-w-[3200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* View Switcher Sub-Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mindmap'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>全景赛程流水导图</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'details'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>阶段排行榜与战报</span>
          </button>
        </div>

        {/* Right: Fullscreen Esports Broadcast Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shadow-sm hover:border-purple-500/50"
            title="开启/退出浏览器全屏沉浸大屏转播模式"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-amber-400" />
                <span>退出全屏</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-purple-400" />
                <span>全屏大屏模式</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Left-to-Right Dynamic Overview Mindmap */}
      {activeTab === 'mindmap' && (
        <DynamicMindMap
          overview={overview}
          onSelectStage={(stageId) => {
            setActiveStageId(stageId);
            setActiveTab('details');
          }}
        />
      )}

      {/* TAB 2: Stage Leaderboard & Horizontal Round Cards */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Stage Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {overview.columns.map((col) => {
              const isSelected = col.stageId === activeStageId;
              const isFinal = col.stageType === 'CHECKPOINT_FINAL';

              return (
                <button
                  key={col.stageId}
                  onClick={() => setActiveStageId(col.stageId)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? isFinal
                        ? 'glass-panel-gold text-amber-200 border-amber-400/80 shadow-lg'
                        : 'bg-purple-600 text-white border border-purple-400 shadow-lg shadow-purple-900/40'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  <span>{col.stageOrder}. {col.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    col.status === 'LOCKED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : col.status === 'IN_PROGRESS' || col.status === 'GROUPED'
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {col.status === 'LOCKED' ? '已完赛' : col.status === 'IN_PROGRESS' ? '进行中' : '待开赛'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Leaderboard Table */}
          {leaderboard && <StageLeaderboardTable leaderboard={leaderboard} />}

          {/* Group-by-Group Horizontal Round Cards */}
          {groupDetails && (
            <GroupRoundCards
              groupDetails={groupDetails}
              isAdmin={false}
            />
          )}
        </div>
      )}
    </div>
  );
};
