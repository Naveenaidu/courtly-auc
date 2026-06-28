"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Team } from "@/lib/types";

type FormState = {
  name: string;
  captainId: string;
  initialPurse: string;
};

const defaultForm: FormState = { name: "", captainId: "", initialPurse: "50000" };

export default function TeamsPage() {
  const { players, teams, addTeam, updateTeam, deleteTeam } = useStore();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const captains = players.filter((p) => p.isCaptain);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const purse = parseInt(form.initialPurse) || 50000;
    if (editingId) {
      const team = teams.find((t) => t.id === editingId)!;
      const diff = purse - team.initialPurse;
      updateTeam(editingId, {
        name: form.name.trim(),
        captainId: form.captainId || undefined,
        initialPurse: purse,
        remainingPurse: team.remainingPurse + diff,
      });
      setEditingId(null);
    } else {
      addTeam({
        name: form.name.trim(),
        captainId: form.captainId || undefined,
        initialPurse: purse,
      });
    }
    setForm(defaultForm);
  }

  function startEdit(t: Team) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      captainId: t.captainId ?? "",
      initialPurse: String(t.initialPurse),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(defaultForm);
  }

  // Find which captains are already assigned to other teams
  const assignedCaptainIds = teams
    .filter((t) => t.id !== editingId && t.captainId)
    .map((t) => t.captainId!);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <p className="text-gray-400 mt-1">Configure teams, captains, and purse amounts</p>
      </div>

      {captains.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6 text-yellow-300 text-sm">
          No captains found. Go to Players and mark some players as captains first.
        </div>
      )}

      {/* Add / Edit form */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">{editingId ? "Edit Team" : "Add Team"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-gray-400 mb-1">Team Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Team Alpha"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Captain</label>
            <select
              value={form.captainId}
              onChange={(e) => setForm((f) => ({ ...f, captainId: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">No captain</option>
              {captains.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={assignedCaptainIds.includes(p.id)}
                >
                  {p.name}
                  {assignedCaptainIds.includes(p.id) ? " (assigned)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purse (₹)</label>
            <input
              type="number"
              value={form.initialPurse}
              onChange={(e) => setForm((f) => ({ ...f, initialPurse: e.target.value }))}
              min={0}
              step={1000}
              className="w-36 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
            >
              {editingId ? "Save" : "Add Team"}
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

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No teams yet. Add some above.</div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => {
            const captain = players.find((p) => p.id === team.captainId);
            const teamPlayers = players.filter((p) => team.playerIds.includes(p.id));
            const spent = team.initialPurse - team.remainingPurse;
            const pct =
              team.initialPurse > 0
                ? Math.round((team.remainingPurse / team.initialPurse) * 100)
                : 100;
            return (
              <div key={team.id} className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <div className="text-sm text-gray-400">
                      {captain ? (
                        <span>
                          Captain:{" "}
                          <span className="text-yellow-400 font-medium">{captain.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-500">No captain assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(team)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${team.name}?`)) deleteTeam(team.id);
                      }}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Purse bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Purse</span>
                    <span>
                      <span className="text-green-400 font-semibold">
                        ₹{team.remainingPurse.toLocaleString()}
                      </span>
                      <span className="text-gray-500"> / ₹{team.initialPurse.toLocaleString()}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Spent: ₹{spent.toLocaleString()}
                  </div>
                </div>

                {/* Players */}
                {teamPlayers.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-3">
                      <span>Players ({teamPlayers.length})</span>
                      <span className="text-blue-400">{teamPlayers.filter(p => p.gender === "M").length}M</span>
                      <span className="text-pink-400">{teamPlayers.filter(p => p.gender === "F").length}F</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teamPlayers.map((p) => (
                        <span
                          key={p.id}
                          className="bg-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <span className={`font-bold ${p.gender === "F" ? "text-pink-400" : "text-blue-400"}`}>{p.gender}</span>
                          {p.name}
                          {p.soldPrice !== undefined && p.soldPrice > 0 && (
                            <span className="text-indigo-400 ml-1">
                              ₹{p.soldPrice.toLocaleString()}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
