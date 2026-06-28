export interface Player {
  id: string;
  name: string;
  pot: number; // 1-5
  isCaptain: boolean;
  gender: "M" | "F";
  teamId?: string;
  soldPrice?: number;
  status: "available" | "sold" | "unsold";
}

export interface Team {
  id: string;
  name: string;
  captainId?: string;
  initialPurse: number;
  remainingPurse: number;
  playerIds: string[];
}

export interface AuctionState {
  currentPlayerId?: string;
  phase: "setup" | "live" | "completed";
  currentPot?: number;
  potNames?: string[];
}

export interface AppData {
  players: Player[];
  teams: Team[];
  auction: AuctionState;
}
