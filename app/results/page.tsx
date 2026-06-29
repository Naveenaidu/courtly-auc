"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Player } from "@/lib/types";

type SortKey = "name" | "team" | "pot" | "price";
type SortDir = "asc" | "desc";

export default function ResultsPage() {
  const { players, teams } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>("team");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredPlayers = players
    .filter((p) => {
      if (filterTeam !== "all" && p.teamId !== filterTeam) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "pot") cmp = a.pot - b.pot;
      else if (sortKey === "price") cmp = (a.soldPrice ?? 0) - (b.soldPrice ?? 0);
      else if (sortKey === "team") {
        const ta = teams.find((t) => t.id === a.teamId)?.name ?? "zzz";
        const tb = teams.find((t) => t.id === b.teamId)?.name ?? "zzz";
        cmp = ta.localeCompare(tb);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const soldPlayers = players.filter((p) => p.status === "sold");
  const totalSpent = soldPlayers.reduce((acc, p) => acc + (p.soldPrice ?? 0), 0);

  function SortHeader({
    label,
    k,
  }: {
    label: string;
    k: SortKey;
  }) {
    const active = sortKey === k;
    return (
      <th
        className="px-3 md:px-5 py-3 text-left cursor-pointer select-none hover:text-white transition-colors"
        onClick={() => toggleSort(k)}
      >
        <span className={active ? "text-white" : "text-gray-400"}>
          {label}
          {active && (
            <span className="ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-xl">🏸</span>
          <h1 className="font-bold text-base md:text-lg">Auction Results</h1>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Link
            href="/"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            Live View
          </Link>
          <Link
            href="/admin"
            className="px-3 md:px-4 py-1.5 md:py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs md:text-sm font-medium transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Players", value: players.length },
            { label: "Sold", value: soldPlayers.length },
            { label: "Unsold", value: players.filter((p) => p.status === "unsold").length },
            { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-5">
              <div className="text-sm text-gray-400 mb-1">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Teams purse summary */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Teams Purse Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const captain = players.find((p) => p.id === team.captainId);
              const teamSoldPlayers = players.filter(
                (p) => p.teamId === team.id && p.status === "sold"
              );
              const spent = team.initialPurse - team.remainingPurse;
              return (
                <div key={team.id} className="bg-gray-750 bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="font-semibold">{team.name}</div>
                      {captain && (
                        <div className="text-xs text-yellow-400">{captain.name}</div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-green-400 font-bold">
                        ₹{team.remainingPurse.toLocaleString()}
                      </div>
                      <div className="text-gray-500 text-xs">remaining</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${
                          team.initialPurse > 0
                            ? Math.round((team.remainingPurse / team.initialPurse) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {teamSoldPlayers.length} players · Spent ₹{spent.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="sold">Sold</option>
            <option value="available">Available</option>
            <option value="unsold">Unsold</option>
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="flex-1 sm:flex-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="">Unassigned</option>
          </select>
        </div>

        {/* Players table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <SortHeader label="Player" k="name" />
                  <SortHeader label="Pot" k="pot" />
                  <SortHeader label="Team" k="team" />
                  <SortHeader label="Price" k="price" />
                  <th className="px-3 md:px-5 py-3 text-left text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((p) => {
                  const team = teams.find((t) => t.id === p.teamId);
                  return (
                    <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                      <td className="px-3 md:px-5 py-3 font-medium">
                        {p.name}
                        {p.isCaptain && (
                          <span className="ml-2 text-xs bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded">
                            CAP
                          </span>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-gray-400">Pot {p.pot}</td>
                      <td className="px-3 md:px-5 py-3">{team?.name ?? <span className="text-gray-500">—</span>}</td>
                      <td className="px-3 md:px-5 py-3">
                        {p.soldPrice !== undefined ? (
                          <span className="text-indigo-400 font-semibold">
                            ₹{p.soldPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            p.status === "sold"
                              ? "bg-green-900 text-green-400"
                              : p.status === "unsold"
                              ? "bg-red-900 text-red-400"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPlayers.length === 0 && (
            <div className="text-center py-12 text-gray-500">No players match the filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
