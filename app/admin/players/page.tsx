"use client";

import { useState } from "react";
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

type FormState = {
  name: string;
  pot: number;
  isCaptain: boolean;
  gender: "M" | "F";
};

const defaultForm: FormState = { name: "", pot: 1, isCaptain: false, gender: "M" };

export default function PlayersPage() {
  const { players, auction, addPlayer, updatePlayer, deletePlayer, unassignPlayer } = useStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePot, setActivePot] = useState<number | "all">("all");

  const potNames = auction.potNames ?? DEFAULT_POT_NAMES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updatePlayer(editingId, { name: form.name.trim(), pot: form.pot, isCaptain: form.isCaptain, gender: form.gender });
      setEditingId(null);
    } else {
      addPlayer({ name: form.name.trim(), pot: form.pot, isCaptain: form.isCaptain, gender: form.gender });
    }
    setForm(defaultForm);
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setForm({ name: p.name, pot: p.pot, isCaptain: p.isCaptain, gender: p.gender });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  const filtered =
    activePot === "all" ? players : players.filter((p) => p.pot === activePot);

  const statusBadge = (status: Player["status"]) => {
    if (status === "sold") return "bg-green-900 text-green-400";
    if (status === "unsold") return "bg-red-900 text-red-400";
    return "bg-gray-700 text-gray-300";
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="text-gray-400 mt-1">Add and manage players across pots</p>
      </div>

      {/* Add / Edit form */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">{editingId ? "Edit Player" : "Add Player"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Player name"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "M" | "F" }))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="M">Male (M)</option>
              <option value="F">Female (F)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pot</label>
            <select
              value={form.pot}
              onChange={(e) => setForm((f) => ({ ...f, pot: Number(e.target.value) }))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {potNames.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="isCaptain"
              checked={form.isCaptain}
              onChange={(e) => setForm((f) => ({ ...f, isCaptain: e.target.checked }))}
              className="w-4 h-4 accent-indigo-500"
            />
            <label htmlFor="isCaptain" className="text-sm text-gray-300">
              Captain
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? "Save" : "Add Player"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Pot filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActivePot("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePot === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          All ({players.length})
        </button>
        {potNames.map((name, idx) => {
          const pot = idx + 1;
          const count = players.filter((p) => p.pot === pot).length;
          return (
            <button
              key={pot}
              onClick={() => setActivePot(pot)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activePot === pot
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {name} ({count})
            </button>
          );
        })}
      </div>

      {/* Players table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          No players yet. Add some above.
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3">Pot</th>
                <th className="px-5 py-3">Captain</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sold Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-700/50"
                >
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.gender === "F" ? "bg-pink-900/60 text-pink-300" : "bg-blue-900/60 text-blue-300"}`}>
                      {p.gender}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={p.pot}
                      onChange={(e) => updatePlayer(p.id, { pot: Number(e.target.value) })}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {potNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    {p.isCaptain ? (
                      <span className="text-yellow-400 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {p.soldPrice !== undefined ? `₹${p.soldPrice.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    {p.status === "sold" && !p.isCaptain && (
                      <button
                        onClick={() => {
                          if (confirm(`Return ${p.name} to available? This will undo their team assignment and refund the purse.`)) {
                            unassignPlayer(p.id);
                            syncToServer();
                          }
                        }}
                        className="px-3 py-1 bg-yellow-900/50 hover:bg-yellow-900 text-yellow-400 rounded text-xs font-medium transition-colors"
                      >
                        Unsold
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${p.name}?`)) deletePlayer(p.id);
                      }}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
