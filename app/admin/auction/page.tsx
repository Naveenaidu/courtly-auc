"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Player } from "@/lib/types";

async function syncToServer() {
  const { players, teams, auction } = useStore.getState();
  await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players, teams, auction }),
  }).catch(() => {});
}

const DEFAULT_POT_NAMES = ["Pot 1", "Pot 2", "Pot 3", "Pot 4", "Pot 5", "Waiting List"];

export default function AuctionPage() {
  const {
    players,
    teams,
    auction,
    setCurrentPlayer,
    setPhase,
    assignPlayer,
    updateSoldPrice,
    markUnsold,
    setCurrentPot,
    setPotNames,
  } = useStore();

  const [bidPrice, setBidPrice] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [activePot, setActivePot] = useState<number>(auction.currentPot ?? 1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");

  const potNames = auction.potNames ?? DEFAULT_POT_NAMES;

  const currentPlayer = players.find((p) => p.id === auction.currentPlayerId);

  // Players available in the selected pot, filtered by search
  const potPlayers = players.filter(
    (p) => p.pot === activePot && p.status === "available" &&
      (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function handleAddPot() {
    const name = prompt(`Name for the new pot:`, `Pot ${potNames.length + 1}`);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setPotNames([...potNames, trimmed]);
  }

  function handleEditPot(idx: number) {
    const current = potNames[idx];
    const name = prompt(`Rename "${current}" to:`, current);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === current) return;
    setPotNames(potNames.map((n, i) => (i === idx ? trimmed : n)));
  }

  function handleDeletePot(idx: number) {
    const name = potNames[idx];
    if (!confirm(`Remove the "${name}" pot? Players assigned to it won't be deleted.`)) return;
    const updated = potNames.filter((_, i) => i !== idx);
    setPotNames(updated);
    if (activePot === idx + 1) setActivePot(1);
    else if (activePot > idx + 1) setActivePot(activePot - 1);
  }

  function putUpForBid(player: Player) {
    setCurrentPlayer(player.id);
    setCurrentPot(activePot);
    if (auction.phase !== "live") setPhase("live");
    setBidPrice("");
    setSelectedTeamId("");
    syncToServer();
  }

  function handleAssign() {
    if (!currentPlayer || !selectedTeamId) return;
    const price = parseInt(bidPrice) || 0;
    assignPlayer(currentPlayer.id, selectedTeamId, price);
    setBidPrice("");
    setSelectedTeamId("");
    syncToServer();
  }

  function handleUnsold() {
    if (!currentPlayer) return;
    if (confirm(`Mark ${currentPlayer.name} as unsold?`)) {
      markUnsold(currentPlayer.id);
      setBidPrice("");
      setSelectedTeamId("");
      syncToServer();
    }
  }

  function handleSavePrice(playerId: string) {
    const parsed = parseInt(editingPriceValue);
    if (!isNaN(parsed) && parsed >= 0) {
      updateSoldPrice(playerId, parsed);
      syncToServer();
    }
    setEditingPriceId(null);
  }

  const soldCount = players.filter((p) => p.status === "sold").length;
  const availableCount = players.filter((p) => p.status === "available").length;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auction Control</h1>
          <p className="text-gray-400 mt-1">
            {soldCount} sold · {availableCount} remaining
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              auction.phase === "live"
                ? "bg-green-900 text-green-400"
                : auction.phase === "completed"
                ? "bg-blue-900 text-blue-400"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {auction.phase}
          </span>
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Public View ↗
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Player picker */}
        <div className="xl:col-span-2 space-y-4">
          {/* Current player card */}
          {currentPlayer ? (
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 border border-indigo-700">
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-2">
                Currently Up for Bid
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl font-bold mb-1">{currentPlayer.name}</div>
                  <div className="text-indigo-300 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentPlayer.gender === "F" ? "bg-pink-800 text-pink-200" : "bg-blue-800 text-blue-200"}`}>
                      {currentPlayer.gender === "F" ? "Female" : "Male"}
                    </span>
                    <span>Pot {currentPlayer.pot}</span>
                    {currentPlayer.isCaptain && (
                      <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        CAPTAIN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assign section */}
              <div className="mt-5 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-indigo-300 mb-1">
                    Final Bid (₹)
                  </label>
                  <input
                    type="number"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-32 bg-indigo-950/60 border border-indigo-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-indigo-300 mb-1">
                    Winning Team
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-indigo-950/60 border border-indigo-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
                  >
                    <option value="">Select team...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (₹{t.remainingPurse.toLocaleString()} left)
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTeam && bidPrice && (
                  <div className="text-sm text-indigo-200">
                    Remaining after:{" "}
                    <span
                      className={
                        selectedTeam.remainingPurse - parseInt(bidPrice) < 0
                          ? "text-red-400 font-bold"
                          : "text-green-400 font-bold"
                      }
                    >
                      ₹{(selectedTeam.remainingPurse - (parseInt(bidPrice) || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAssign}
                    disabled={!selectedTeamId}
                    className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
                  >
                    Assign to Team
                  </button>
                  <button
                    onClick={handleUnsold}
                    className="px-5 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Unsold
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 border border-dashed border-gray-700 text-center text-gray-500">
              Select a player below to put them up for bid
            </div>
          )}

          {/* Pot selector */}
          <div>
            <div className="flex gap-2 mb-3 flex-wrap items-center">
              {potNames.map((name, idx) => {
                const pot = idx + 1;
                const count = players.filter(
                  (p) => p.pot === pot && p.status === "available"
                ).length;
                const isActive = activePot === pot;
                return (
                  <div
                    key={pot}
                    className={`flex items-center rounded-full text-sm font-medium transition-colors ${
                      isActive ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    <button
                      onClick={() => { setActivePot(pot); setSearchQuery(""); }}
                      className="pl-4 pr-2 py-1.5"
                    >
                      {name} ({count})
                    </button>
                    <button
                      onClick={() => handleEditPot(idx)}
                      title="Rename pot"
                      className={`px-1 py-1.5 text-xs transition-colors ${isActive ? "text-indigo-200 hover:text-white" : "text-gray-600 hover:text-gray-300"}`}
                    >
                      ✏
                    </button>
                    {potNames.length > 1 && (
                      <button
                        onClick={() => handleDeletePot(idx)}
                        title="Delete pot"
                        className={`pr-2 pl-0.5 py-1.5 text-xs transition-colors ${isActive ? "text-indigo-200 hover:text-red-300" : "text-gray-600 hover:text-red-400"}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAddPot}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-dashed border-gray-600"
              >
                + Pot
              </button>
            </div>

            {/* Search */}
            <div className="mb-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors pl-9"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {potPlayers.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-800 rounded-xl">
                {searchQuery
                  ? `No players match "${searchQuery}" in Pot ${activePot}`
                  : `No available players in Pot ${activePot}`}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {potPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => putUpForBid(p)}
                    className={`bg-gray-800 hover:bg-gray-700 border rounded-xl p-4 text-left transition-colors ${
                      auction.currentPlayerId === p.id
                        ? "border-indigo-500 bg-indigo-900/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <div className="font-semibold mb-1">{p.name}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${p.gender === "F" ? "bg-pink-900/60 text-pink-300" : "bg-blue-900/60 text-blue-300"}`}>
                        {p.gender}
                      </span>
                      <span className="text-xs text-gray-400">Pot {p.pot}</span>
                      {p.isCaptain && (
                        <span className="text-xs bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">
                          CAP
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Teams panel */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-300">Teams</h2>
          {teams.map((team) => {
            const captain = players.find((p) => p.id === team.captainId);
            const teamPlayers = players.filter(
              (p) => p.status === "sold" && p.teamId === team.id
            );
            const pct =
              team.initialPurse > 0
                ? Math.round((team.remainingPurse / team.initialPurse) * 100)
                : 0;
            return (
              <div
                key={team.id}
                className={`bg-gray-800 rounded-xl p-4 border transition-colors ${
                  selectedTeamId === team.id
                    ? "border-indigo-500"
                    : "border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{team.name}</div>
                    {captain && (
                      <div className="text-xs text-yellow-400">{captain.name}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400 text-sm">
                      ₹{team.remainingPurse.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {teamPlayers.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {teamPlayers.map((p) => (
                      <div key={p.id} className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="flex-1 truncate">
                          {p.name}
                          {p.isCaptain && (
                            <span className="ml-1 text-yellow-500">★</span>
                          )}
                        </span>
                        {editingPriceId === p.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePrice(p.id);
                                if (e.key === "Escape") setEditingPriceId(null);
                              }}
                              className="w-20 bg-gray-700 border border-indigo-500 rounded px-1.5 py-0.5 text-white focus:outline-none"
                              min={0}
                            />
                            <button
                              onClick={() => handleSavePrice(p.id)}
                              className="text-green-400 hover:text-green-300 font-bold"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="text-gray-500 hover:text-gray-300"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-indigo-400">
                              {p.soldPrice !== undefined ? `₹${p.soldPrice.toLocaleString()}` : "—"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceId(p.id);
                                setEditingPriceValue(String(p.soldPrice ?? 0));
                              }}
                              className="text-gray-600 hover:text-gray-300 transition-colors"
                              title="Edit price"
                            >
                              ✏
                            </button>
                          </div>
                        )}
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
  );
}
