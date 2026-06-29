"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";

const TEAM_PALETTE = [
  "#60a5fa", // blue
  "#34d399", // emerald
  "#fbbf24", // amber
  "#f87171", // red
  "#a78bfa", // violet
  "#22d3ee", // cyan
];

export default function HomePage() {
  const { auction, players, teams } = useStore();
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);
  const prevSoldIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/state");
        if (res.ok) {
          const data = await res.json();
          if (data) useStore.setState(data);
        }
      } catch {}
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, []);

  // Detect newly sold players and highlight their team
  useEffect(() => {
    const currentSold = new Set(
      players.filter((p) => p.status === "sold" && !p.isCaptain).map((p) => p.id)
    );

    if (!initialized.current) {
      prevSoldIds.current = currentSold;
      initialized.current = true;
      return;
    }

    const newlySoldId = [...currentSold].find((id) => !prevSoldIds.current.has(id));
    if (newlySoldId) {
      const soldPlayer = players.find((p) => p.id === newlySoldId);
      if (soldPlayer?.teamId) {
        if (highlightTimer.current) clearTimeout(highlightTimer.current);
        setHighlightedTeamId(soldPlayer.teamId);
        highlightTimer.current = setTimeout(() => setHighlightedTeamId(null), 4000);
      }
    }

    prevSoldIds.current = currentSold;
  }, [players]);

  if (auction.phase === "setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🏸</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">BORAuctionly</h1>
          <p className="text-gray-400 text-base md:text-lg">Badminton Player Auction System</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link
            href="/admin"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors text-center"
          >
            Admin Panel
          </Link>
          <Link
            href="/results"
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-center"
          >
            Results
          </Link>
        </div>
      </div>
    );
  }

  const currentPlayer = players.find((p) => p.id === auction.currentPlayerId);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl md:text-2xl">🏸</span>
          <h1 className="text-base md:text-xl font-bold">BORAuctionly</h1>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Link
            href="/results"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            Results
          </Link>
          <Link
            href="/admin/auction"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Main content: stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        {/* Centre: current player */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 py-10 md:py-8">
          {currentPlayer ? (
            <div className="text-center w-full max-w-sm md:max-w-none">
              <div className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-3">
                Now Up for Bid
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl px-8 py-8 md:px-14 md:py-10 shadow-2xl mb-5">
                <div className="text-3xl md:text-5xl font-black mb-3 leading-tight">{currentPlayer.name}</div>
                <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${currentPlayer.gender === "F" ? "bg-pink-700 text-pink-100" : "bg-blue-700 text-blue-100"}`}>
                    {currentPlayer.gender === "F" ? "Female" : "Male"}
                  </span>
                  <span className="text-indigo-200 text-base md:text-lg">Pot {currentPlayer.pot}</span>
                  {currentPlayer.isCaptain && (
                    <span className="bg-yellow-500 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">
                      CAPTAIN
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-400">Bidding in progress...</p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-5xl md:text-6xl mb-4">⏳</div>
              <div className="text-xl md:text-2xl font-semibold">Waiting for next player...</div>
            </div>
          )}
        </div>

        {/* Teams sidebar: full-width below on mobile, fixed-width column on desktop */}
        <div className="w-full md:w-96 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col md:overflow-hidden">
          <div className="px-5 py-3 md:py-4 border-b border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Teams &amp; Purse
            </h2>
          </div>
          <div className="overflow-y-auto p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-3">
            {teams.map((team, idx) => {
              const color = TEAM_PALETTE[idx % TEAM_PALETTE.length];
              const captain = players.find((p) => p.id === team.captainId);
              const soldPlayers = players.filter(
                (p) => p.status === "sold" && p.teamId === team.id && !p.isCaptain
              );
              const pct = team.initialPurse > 0
                ? Math.round((team.remainingPurse / team.initialPurse) * 100)
                : 0;
              const isHighlighted = highlightedTeamId === team.id;

              return (
                <div
                  key={team.id}
                  style={{
                    borderLeftColor: color,
                    boxShadow: isHighlighted
                      ? `0 0 0 2px ${color}, 0 0 24px ${color}55`
                      : undefined,
                  }}
                  className="border-l-4 bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-700 transition-all duration-500"
                >
                  {/* Team name + purse */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm md:text-base font-bold leading-tight" style={{ color }}>
                        {team.name}
                      </div>
                      {captain && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Cap: {captain.name}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-base md:text-lg font-bold" style={{ color }}>
                        ₹{team.remainingPurse.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">remaining</div>
                    </div>
                  </div>

                  {/* Purse bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {team.playerIds.length} players · ₹{team.initialPurse.toLocaleString()} total
                  </div>

                  {/* Sold players */}
                  {soldPlayers.length > 0 && (
                    <div className="border-t border-gray-700 pt-2 flex flex-col gap-1.5">
                      {soldPlayers.map((p) => (
                        <div key={p.id} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white">{p.name}</span>
                          <span className="text-sm font-semibold" style={{ color }}>
                            {p.soldPrice !== undefined ? `₹${p.soldPrice.toLocaleString()}` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
