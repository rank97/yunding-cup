export interface User {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ORGANIZER';
  createdAt: string;
}

export interface ScoreRule {
  id: string;
  tenantId: string;
  ruleName: string;
  isSystemDefault: number;
  scoreMapping: string;
}

export interface Tournament {
  id: string;
  tenantId: string;
  title: string;
  totalPlayers: number;
  shareCode: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  currentStageId?: string;
  createdAt: string;
}

export interface Stage {
  id: string;
  tournamentId: string;
  name: string;
  stageOrder: number;
  stageType: 'STANDARD' | 'CHECKPOINT_FINAL';
  roundCount: number;
  directToFinalCount: number;
  eliminateCount: number;
  inheritScores: number; // 0 or 1
  maxRoundLimit?: number;
  scoreRuleId?: string;
  status: 'PENDING' | 'GROUPED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
}

export interface Player {
  id: string;
  tournamentId: string;
  name: string;
  gameId: string;
  avatarUrl?: string;
  initialSeed: number;
}

export interface PlayerSlot {
  playerId?: string;
  name?: string;
  gameId?: string;
  avatarUrl?: string;
  seedIndex: number;
  currentScore?: number;
  firstPlaces?: number;
  top4s?: number;
  isMatchPoint?: number;
  advancementStatus?: 'NONE' | 'ADVANCED' | 'DIRECT_FINAL' | 'ELIMINATED' | 'CHAMPION';
  isPlaceholder: boolean;
  placeholderDesc?: string;
}

export interface GroupNode {
  groupId: string;
  groupName: string;
  slots: PlayerSlot[];
}

export interface StageColumn {
  stageId: string;
  name: string;
  stageOrder: number;
  stageType: 'STANDARD' | 'CHECKPOINT_FINAL';
  roundCount: number;
  inputPlayers?: number;
  directToFinalCount: number;
  eliminateCount: number;
  inheritScores: number;
  status: 'PENDING' | 'GROUPED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';
  groups: GroupNode[];
}

export interface ChampionThrone {
  isDetermined: boolean;
  championPlayerId?: string;
  championName?: string;
  championGameId?: string;
  championAvatarUrl?: string;
  totalScore?: number;
  winningRound?: number;
  matchPointCandidateNames?: string[];
}

export interface TournamentOverview {
  id: string;
  title: string;
  totalPlayers: number;
  shareCode: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  currentStageId?: string;
  currentStageName?: string;
  columns: StageColumn[];
  championThrone: ChampionThrone;
}

export interface LeaderboardRow {
  rank: number;
  playerId: string;
  name: string;
  gameId: string;
  avatarUrl?: string;
  groupName: string;
  carryOverScore: number;
  roundScores: (number | null)[];
  firstPlaceCount: number;
  top4Count: number;
  stageScore: number;
  totalScore: number;
  advancementStatus?: 'NONE' | 'ADVANCED' | 'DIRECT_FINAL' | 'ELIMINATED' | 'CHAMPION';
  isMatchPoint?: number;
}

export interface StageLeaderboard {
  stageId: string;
  stageName: string;
  stageOrder: number;
  stageType: string;
  roundCount: number;
  directToFinalCount: number;
  eliminateCount: number;
  inheritScores: number;
  status: string;
  rows: LeaderboardRow[];
}

export interface PlayerRankItem {
  rank: number;
  playerId: string;
  name: string;
  gameId: string;
  avatarUrl?: string;
  score: number;
  isMatchPoint?: boolean;
}

export interface RoundCard {
  matchRoundId: string;
  roundNumber: number;
  status: 'PENDING' | 'PLAYING' | 'FINISHED';
  rankings: PlayerRankItem[];
}

export interface GroupRow {
  groupId: string;
  groupName: string;
  rounds: RoundCard[];
}

export interface GroupDetails {
  stageId: string;
  groups: GroupRow[];
}
