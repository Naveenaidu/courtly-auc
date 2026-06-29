"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppData, Player, Team } from "./types";

interface StoreActions {
  // Players
  addPlayer: (player: Omit<Player, "id" | "status">) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;

  // Teams
  addTeam: (team: Omit<Team, "id" | "remainingPurse" | "playerIds">) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  // Auction
  setCurrentPlayer: (playerId: string | undefined) => void;
  setPhase: (phase: AppData["auction"]["phase"]) => void;
  setCurrentPot: (pot: number | undefined) => void;
  setPotNames: (names: string[]) => void;
  assignPlayer: (playerId: string, teamId: string, price: number) => void;
  updateSoldPrice: (playerId: string, newPrice: number) => void;
  markUnsold: (playerId: string) => void;
  unassignPlayer: (playerId: string) => void;
  resetAuction: () => void;

  // Seed
  seedTournamentData: () => boolean; // returns false if data already exists
  clearAllData: () => void;
}

type Store = AppData & StoreActions;

const initialData: AppData = {
  players: [],
  teams: [],
  auction: { phase: "setup" },
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildSeedData(): Pick<AppData, "players" | "teams"> {
  // Team IDs
  const ecId = generateId();
  const hmId = generateId();
  const nnId = generateId();
  const frId = generateId();
  const bsId = generateId();
  const ssId = generateId();

  // Captain IDs
  const abhishekSahuId = generateId();
  const ajayKumarId = generateId();
  const joshuaId = generateId();
  const maniId = generateId();
  const rohitId = generateId();
  const vinayId = generateId();

  const captains: Player[] = [
    { id: abhishekSahuId, name: "Abhishek Sahu",      pot: 1, isCaptain: true, gender: "M", teamId: ecId, soldPrice: 0, status: "sold" },
    { id: ajayKumarId,    name: "Ajay Kumar",          pot: 3, isCaptain: true, gender: "M", teamId: hmId, soldPrice: 0, status: "sold" },
    { id: joshuaId,       name: "Joshua Sugirtharaj",  pot: 1, isCaptain: true, gender: "M", teamId: nnId, soldPrice: 0, status: "sold" },
    { id: maniId,         name: "Mani",                pot: 1, isCaptain: true, gender: "M", teamId: frId, soldPrice: 0, status: "sold" },
    { id: rohitId,        name: "Rohit Prasad",        pot: 3, isCaptain: true, gender: "M", teamId: bsId, soldPrice: 0, status: "sold" },
    { id: vinayId,        name: "Vinay Pandey",        pot: 2, isCaptain: true, gender: "M", teamId: ssId, soldPrice: 0, status: "sold" },
  ];

  const auctionPlayerDefs: Omit<Player, "id" | "teamId" | "soldPrice">[] = [
    // Men — Pot 1
    { name: "Peeyush Pallav",     pot: 1, isCaptain: false, gender: "M", status: "available" },
    { name: "Sharat Mathew",      pot: 1, isCaptain: false, gender: "M", status: "available" },
    { name: "Vivek Lakhera",      pot: 1, isCaptain: false, gender: "M", status: "available" },
    // Men — Pot 2
    { name: "Abhishek Christian", pot: 2, isCaptain: false, gender: "M", status: "available" },
    { name: "Bharath",            pot: 2, isCaptain: false, gender: "M", status: "available" },
    { name: "Jakaria Hussain",    pot: 2, isCaptain: false, gender: "M", status: "available" },
    { name: "Manish Rout",        pot: 2, isCaptain: false, gender: "M", status: "available" },
    { name: "Sai Charan",         pot: 2, isCaptain: false, gender: "M", status: "available" },
    // Men — Pot 3
    { name: "Kishore M",          pot: 3, isCaptain: false, gender: "M", status: "available" },
    { name: "Shangeev A P",       pot: 3, isCaptain: false, gender: "M", status: "available" },
    { name: "Vigneshwaran",       pot: 3, isCaptain: false, gender: "M", status: "available" },
    { name: "Vikas Vemu",         pot: 3, isCaptain: false, gender: "M", status: "available" },
    // Women — Pot 4
    { name: "Harshi Gupta",       pot: 4, isCaptain: false, gender: "F", status: "available" },
    { name: "Phalguni Singh",     pot: 4, isCaptain: false, gender: "F", status: "available" },
    { name: "Priya",              pot: 4, isCaptain: false, gender: "F", status: "available" },
    { name: "Priyanka P",         pot: 4, isCaptain: false, gender: "F", status: "available" },
    { name: "Saranya Suri",       pot: 4, isCaptain: false, gender: "F", status: "available" },
    { name: "Shrabanee Sabat",    pot: 4, isCaptain: false, gender: "F", status: "available" },
    // Women — Pot 5
    { name: "Divya Kotadiya",     pot: 5, isCaptain: false, gender: "F", status: "available" },
    { name: "Illisha Singh",      pot: 5, isCaptain: false, gender: "F", status: "available" },
    { name: "Mansa Kaur",         pot: 5, isCaptain: false, gender: "F", status: "available" },
    { name: "Shruthi Shetty",     pot: 5, isCaptain: false, gender: "F", status: "available" },
    { name: "Trushita Agarwal",   pot: 5, isCaptain: false, gender: "F", status: "available" },
    // Men — Waiting List (Pot 6)
    { name: "Adnan Azeem",        pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Akshansh Jain",      pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Amit Kumar",         pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Army Vamsi",         pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Rahul Sharma",       pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Sanjay Naidu",       pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Satwik Tiwari",      pot: 6, isCaptain: false, gender: "M", status: "available" },
    { name: "Subir Choudhury",    pot: 6, isCaptain: false, gender: "M", status: "available" },
  ];

  const auctionPlayers: Player[] = auctionPlayerDefs.map((p) => ({
    ...p,
    id: generateId(),
  }));

  const players: Player[] = [...captains, ...auctionPlayers];

  const teams: Team[] = [
    { id: ecId, name: "Easy Company (EC)",      captainId: abhishekSahuId, initialPurse: 50000, remainingPurse: 50000, playerIds: [abhishekSahuId] },
    { id: hmId, name: "Hit & Miss",             captainId: ajayKumarId,    initialPurse: 50000, remainingPurse: 50000, playerIds: [ajayKumarId] },
    { id: nnId, name: "Net Ninjas",             captainId: joshuaId,       initialPurse: 50000, remainingPurse: 50000, playerIds: [joshuaId] },
    { id: frId, name: "Falcon Raiders",         captainId: maniId,         initialPurse: 50000, remainingPurse: 50000, playerIds: [maniId] },
    { id: bsId, name: "BAD(S)MASH COMPANY",    captainId: rohitId,        initialPurse: 50000, remainingPurse: 50000, playerIds: [rohitId] },
    { id: ssId, name: "Shuttle Stormers (SS)", captainId: vinayId,        initialPurse: 50000, remainingPurse: 50000, playerIds: [vinayId] },
  ];

  return { players, teams };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

      addPlayer: (player) =>
        set((state) => ({
          players: [
            ...state.players,
            { ...player, id: generateId(), status: "available" },
          ],
        })),

      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
          teams: state.teams.map((t) => ({
            ...t,
            captainId: t.captainId === id ? undefined : t.captainId,
            playerIds: t.playerIds.filter((pid) => pid !== id),
          })),
        })),

      addTeam: (team) =>
        set((state) => ({
          teams: [
            ...state.teams,
            {
              ...team,
              id: generateId(),
              remainingPurse: team.initialPurse,
              playerIds: [],
            },
          ],
        })),

      updateTeam: (id, updates) =>
        set((state) => ({
          teams: state.teams.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTeam: (id) =>
        set((state) => ({
          teams: state.teams.filter((t) => t.id !== id),
          players: state.players.map((p) =>
            p.teamId === id
              ? { ...p, teamId: undefined, soldPrice: undefined, status: "available" }
              : p
          ),
        })),

      setCurrentPlayer: (playerId) =>
        set((state) => ({
          auction: { ...state.auction, currentPlayerId: playerId },
        })),

      setPhase: (phase) =>
        set((state) => ({ auction: { ...state.auction, phase } })),

      setCurrentPot: (pot) =>
        set((state) => ({ auction: { ...state.auction, currentPot: pot } })),

      setPotNames: (names) =>
        set((state) => ({ auction: { ...state.auction, potNames: names } })),

      assignPlayer: (playerId, teamId, price) =>
        set((state) => {
          const team = state.teams.find((t) => t.id === teamId);
          if (!team) return state;
          return {
            players: state.players.map((p) =>
              p.id === playerId
                ? { ...p, teamId, soldPrice: price, status: "sold" as const }
                : p
            ),
            teams: state.teams.map((t) =>
              t.id === teamId
                ? {
                    ...t,
                    remainingPurse: t.remainingPurse - price,
                    playerIds: [...t.playerIds, playerId],
                  }
                : t
            ),
            auction: { ...state.auction, currentPlayerId: undefined },
          };
        }),

      updateSoldPrice: (playerId, newPrice) =>
        set((state) => {
          const player = state.players.find((p) => p.id === playerId);
          if (!player || !player.teamId) return state;
          const diff = newPrice - (player.soldPrice ?? 0);
          return {
            players: state.players.map((p) =>
              p.id === playerId ? { ...p, soldPrice: newPrice } : p
            ),
            teams: state.teams.map((t) =>
              t.id === player.teamId
                ? { ...t, remainingPurse: t.remainingPurse - diff }
                : t
            ),
          };
        }),

      markUnsold: (playerId) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, status: "unsold" as const } : p
          ),
          auction: { ...state.auction, currentPlayerId: undefined },
        })),

      unassignPlayer: (playerId) =>
        set((state) => {
          const player = state.players.find((p) => p.id === playerId);
          if (!player || !player.teamId) return state;
          const refund = player.soldPrice ?? 0;
          return {
            players: state.players.map((p) =>
              p.id === playerId
                ? { ...p, teamId: undefined, soldPrice: undefined, status: "available" as const }
                : p
            ),
            teams: state.teams.map((t) =>
              t.id === player.teamId
                ? {
                    ...t,
                    remainingPurse: t.remainingPurse + refund,
                    playerIds: t.playerIds.filter((id) => id !== playerId),
                  }
                : t
            ),
          };
        }),

      resetAuction: () =>
        set((state) => ({
          players: state.players.map((p) => ({
            ...p,
            teamId: undefined,
            soldPrice: undefined,
            status: "available" as const,
          })),
          teams: state.teams.map((t) => ({
            ...t,
            remainingPurse: t.initialPurse,
            playerIds: [],
          })),
          auction: { phase: "setup" },
        })),

      seedTournamentData: () => {
        const { players, teams } = get();
        if (players.length > 0 || teams.length > 0) return false;
        const seed = buildSeedData();
        set({
          ...seed,
          auction: {
            phase: "setup",
            potNames: ["Pot 1", "Pot 2", "Pot 3", "Pot 4", "Pot 5", "Waiting List"],
          },
        });
        return true;
      },

      clearAllData: () => set({ ...initialData }),
    }),
    {
      name: "courtly-auc-data",
    }
  )
);
