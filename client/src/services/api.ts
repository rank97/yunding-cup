import axios from 'axios';
import {
  Tournament,
  TournamentOverview,
  StageLeaderboard,
  GroupDetails,
  Player,
  User
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('satoken');
  if (token) {
    config.headers['satoken'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res.data;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络异常';
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const authApi = {
  login: (data: any): Promise<{ token: string; user: User }> => api.post('/auth/login', data),
  register: (data: any): Promise<User> => api.post('/auth/register', data),
  getInfo: (): Promise<User> => api.get('/auth/info'),
  updatePassword: (data: { oldPassword: string; newPassword: string }): Promise<void> => api.put('/auth/password', data),
  logout: (): Promise<void> => api.post('/auth/logout'),
};

// Tournaments
export const tournamentApi = {
  create: (data: any): Promise<Tournament> => api.post('/tournaments', data),
  update: (id: string, data: any): Promise<Tournament> => api.put(`/tournaments/${id}`, data),
  list: (): Promise<Tournament[]> => api.get('/tournaments'),
  getDetail: (id: string): Promise<{ tournament: Tournament; stages: any[] }> => api.get(`/tournaments/${id}`),
  updateStages: (id: string, stages: any[]): Promise<void> => api.put(`/tournaments/${id}/stages`, stages),
  delete: (id: string): Promise<void> => api.delete(`/tournaments/${id}`),
};

// Stages & Players
export const stageApi = {
  importPlayers: (tournamentId: string, players: any[]): Promise<void> =>
    api.post(`/tournaments/${tournamentId}/players/batch`, { players }),
  listPlayers: (tournamentId: string): Promise<Player[]> => api.get(`/tournaments/${tournamentId}/players`),
  updatePlayer: (playerId: string, data: { name?: string; gameId?: string; avatarUrl?: string }): Promise<Player> =>
    api.put(`/players/${playerId}`, data),
  getDetail: (stageId: string): Promise<any> => api.get(`/stages/${stageId}`),
  executeGrouping: (stageId: string, mode: 'SNAKE' | 'RANDOM'): Promise<void> =>
    api.post(`/stages/${stageId}/grouping`, { mode }),
  swapPlayers: (stageId: string, player1Id: string, player2Id: string): Promise<void> =>
    api.post(`/stages/${stageId}/swap-players`, { player1Id, player2Id }),
  clearGrouping: (stageId: string): Promise<void> => api.post(`/stages/${stageId}/clear-grouping`),
  lockStage: (stageId: string): Promise<void> => api.post(`/stages/${stageId}/lock`),
  unlockStage: (stageId: string): Promise<void> => api.post(`/stages/${stageId}/unlock`),
  updatePlayerAdvancement: (stageId: string, playerId: string, advancementStatus: string): Promise<void> =>
    api.put(`/stages/${stageId}/players/${playerId}/advancement`, { advancementStatus }),
  autoAssignAdvancement: (stageId: string): Promise<void> =>
    api.post(`/stages/${stageId}/advancement/auto-assign`),
};

// Matches
export const matchApi = {
  submitRound: (roundId: string, records: { playerId: string; rank: number }[]): Promise<void> =>
    api.post(`/match-rounds/${roundId}/records`, { records }),
  resetRound: (roundId: string): Promise<void> => api.delete(`/match-rounds/${roundId}/records`),
};

// Public Spectator
export const publicApi = {
  listTournaments: (): Promise<Tournament[]> => api.get('/public/tournaments'),
  listScoreRules: (): Promise<ScoreRule[]> => api.get('/public/score-rules'),
  getOverview: (shareCode: string): Promise<TournamentOverview> =>
    api.get(`/public/tournaments/${shareCode}/overview`),
  getLeaderboard: (shareCode: string, stageId: string): Promise<StageLeaderboard> =>
    api.get(`/public/tournaments/${shareCode}/stages/${stageId}/leaderboard`),
  getStageLeaderboard: (shareCode: string, stageId: string): Promise<StageLeaderboard> =>
    api.get(`/public/tournaments/${shareCode}/stages/${stageId}/leaderboard`),
  getGroupDetails: (shareCode: string, stageId: string): Promise<GroupDetails> =>
    api.get(`/public/tournaments/${shareCode}/stages/${stageId}/group-details`),
  createEventSource: (shareCode: string): EventSource => {
    return new EventSource(`/api/v1/public/tournaments/${shareCode}/stream`);
  },
};
