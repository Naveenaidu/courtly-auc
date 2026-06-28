"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";

async function syncToServer() {
  const { players, teams, auction } = useStore.getState();
  await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players, teams, auction }),
  }).catch(() => {});
}

export default function AdminDashboard() {
  const { players, teams, auction, resetAuction, setPhase, seedTournamentData, clearAllData } = useStore();
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const soldPlayers = players.filter((p) => p.status === "sold");
  const unsoldPlayers = players.filter((p) => p.status === "unsold");
  const availablePlayers = players.filter((p) => p.status === "available");
  const totalSpent = teams.reduce((acc, t) => acc + (t.initialPurse - t.remainingPurse), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of the auction</p>
      </div>

      {/* Seed banner */}
      {players.length === 0 && teams.length === 0 && (
        <div className="bg-indigo-900/40 border border-indigo-700/60 rounded-xl p-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-indigo-200">No data yet</div>
            <div className="text-sm text-indigo-400 mt-0.5">
              Load the Battle of Rackets – July 2026 players and teams to get started instantly.
            </div>
          </div>
          <button
            onClick={() => {
              const ok = seedTournamentData();
              setSeedMsg(ok ? "Tournament data loaded!" : "Data already exists.");
              setTimeout(() => setSeedMsg(null), 3000);
            }}
            className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors"
          >
            Load Tournament Data
          </button>
        </div>
      )}
      {seedMsg && (
        <div className="bg-green-900/40 border border-green-700/60 rounded-xl px-5 py-3 mb-6 text-green-300 text-sm">
          {seedMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Players", value: players.length, color: "text-white" },
          { label: "Sold", value: soldPlayers.length, color: "text-green-400" },
          { label: "Available", value: availablePlayers.length, color: "text-yellow-400" },
          { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, color: "text-indigo-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/admin/players"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-500 rounded-xl p-6 transition-colors group"
        >
          <div className="text-3xl mb-3">🏃</div>
          <div className="font-semibold text-lg group-hover:text-indigo-400 transition-colors">
            Manage Players
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {players.length} players across 5 pots
          </div>
        </Link>
        <Link
          href="/admin/teams"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-500 rounded-xl p-6 transition-colors group"
        >
          <div className="text-3xl mb-3">👥</div>
          <div className="font-semibold text-lg group-hover:text-indigo-400 transition-colors">
            Manage Teams
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {teams.length} teams configured
          </div>
        </Link>
        <Link
          href="/admin/auction"
          className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-500 rounded-xl p-6 transition-colors group"
        >
          <div className="text-3xl mb-3">🔨</div>
          <div className="font-semibold text-lg group-hover:text-indigo-400 transition-colors">
            Run Auction
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {auction.phase === "live" ? "Auction in progress" : "Start or manage auction"}
          </div>
        </Link>
      </div>

      {/* Auction status */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Auction Status</h2>
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
        </div>
        <div className="flex gap-3">
          {auction.phase === "setup" && (
            <Link
              href="/admin/auction"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              Start Auction
            </Link>
          )}
          {auction.phase === "live" && (
            <>
              <Link
                href="/admin/auction"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                Go to Auction
              </Link>
              <button
                onClick={() => setPhase("completed")}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                End Auction
              </button>
            </>
          )}
          {(auction.phase === "completed" || soldPlayers.length > 0) && (
            <button
              onClick={() => {
                if (confirm("Reset auction? All sold players will be returned to available.")) {
                  resetAuction();
                  syncToServer();
                }
              }}
              className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              Reset Auction
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-gray-800 border border-red-900/50 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-lg text-red-400 mb-1">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">Permanently clear all players, teams, and auction state, then reload the correct tournament data.</p>
        <button
          onClick={() => {
            if (confirm("This will wipe ALL data and re-seed the Battle of Rackets tournament. Are you sure?")) {
              clearAllData();
              setTimeout(() => {
                seedTournamentData();
                syncToServer();
                setSeedMsg("Data cleared and re-seeded successfully!");
                setTimeout(() => setSeedMsg(null), 4000);
              }, 50);
            }
          }}
          className="px-5 py-2.5 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg text-sm font-semibold transition-colors"
        >
          Clear All Data &amp; Reseed
        </button>
      </div>

      {/* Teams summary */}
      {teams.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Teams Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left pb-3">Team</th>
                  <th className="text-left pb-3">Captain</th>
                  <th className="text-right pb-3">Players</th>
                  <th className="text-right pb-3">Spent</th>
                  <th className="text-right pb-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const captain = players.find((p) => p.id === team.captainId);
                  const spent = team.initialPurse - team.remainingPurse;
                  return (
                    <tr key={team.id} className="border-b border-gray-700/50">
                      <td className="py-3 font-medium">{team.name}</td>
                      <td className="py-3 text-gray-400">{captain?.name ?? "—"}</td>
                      <td className="py-3 text-right">{team.playerIds.length}</td>
                      <td className="py-3 text-right text-red-400">₹{spent.toLocaleString()}</td>
                      <td className="py-3 text-right text-green-400">
                        ₹{team.remainingPurse.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
