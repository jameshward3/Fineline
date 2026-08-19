"use client";

import { useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { findNearestThread } from "@/lib/color";
import type { WizardState, ColorMappingRow } from "../types";
import type { ThreadColorOption } from "../reference-types";

export function StepThreadMapping({
  state,
  patch,
  threadColors,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  threadColors: ThreadColorOption[];
}) {
  useEffect(() => {
    if (threadColors.length === 0) return;
    const needsMatch = state.colorMappings.some((m) => m.threadColorId === null && m.mergedInto === null);
    if (!needsMatch) return;

    const updated = state.colorMappings.map((m) => {
      if (m.threadColorId !== null || m.mergedInto !== null) return m;
      const match = findNearestThread(m.artworkColorHex, threadColors);
      if (!match) return m;
      return {
        ...m,
        threadColorId: match.thread.id,
        threadLabel: `${match.thread.companyName} — ${match.thread.manufacturerName} ${match.thread.manufacturerCode}`,
        colorDeltaE: match.deltaE,
      };
    });
    patch({ colorMappings: updated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadColors, state.colorMappings]);

  const activeRows = state.colorMappings.filter((m) => m.mergedInto === null);

  function updateRow(sequence: number, update: Partial<ColorMappingRow>) {
    patch({
      colorMappings: state.colorMappings.map((m) => (m.sequence === sequence ? { ...m, ...update } : m)),
    });
  }

  function moveRow(sequence: number, direction: -1 | 1) {
    const idx = activeRows.findIndex((r) => r.sequence === sequence);
    const swapWith = activeRows[idx + direction];
    if (!swapWith) return;
    const current = activeRows[idx];
    patch({
      colorMappings: state.colorMappings.map((m) => {
        if (m.sequence === current.sequence) return { ...m, sequence: swapWith.sequence };
        if (m.sequence === swapWith.sequence) return { ...m, sequence: current.sequence };
        return m;
      }),
    });
  }

  function mergeInto(fromSequence: number, intoSequence: number) {
    if (fromSequence === intoSequence) return;
    patch({
      colorMappings: state.colorMappings.map((m) =>
        m.sequence === fromSequence ? { ...m, mergedInto: intoSequence } : m
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Map to Company Thread Palette</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Each production color has been auto-matched to the closest stocked thread. Review and adjust.
        </p>
      </div>

      <Panel>
        <PanelHeader title={`${activeRows.length} Production Colors`} subtitle={`${activeRows.length} Color Changes`} />
        <div className="space-y-2">
          {activeRows
            .sort((a, b) => a.sequence - b.sequence)
            .map((row, i) => {
              const thread = threadColors.find((t) => t.id === row.threadColorId);
              return (
                <div
                  key={row.sequence}
                  className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 rounded-md border border-border bg-surface-inset p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveRow(row.sequence, -1)}
                      disabled={i === 0}
                      className="text-ink-faint hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveRow(row.sequence, 1)}
                      disabled={i === activeRows.length - 1}
                      className="text-ink-faint hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-black/20" style={{ background: row.artworkColorHex }} />
                    <div className="text-xs">
                      <p className="text-ink-faint">Artwork</p>
                      <p className="font-mono text-ink">{row.artworkColorHex}</p>
                    </div>
                  </div>

                  <span className="text-ink-faint text-xs">→</span>

                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded border border-black/20 flex-none"
                      style={{ background: thread?.hex ?? "transparent" }}
                    />
                    <div className="min-w-0 flex-1">
                      <select
                        value={row.threadColorId ?? ""}
                        onChange={(e) => {
                          const t = threadColors.find((tc) => tc.id === e.target.value);
                          updateRow(row.sequence, {
                            threadColorId: t?.id ?? null,
                            threadLabel: t ? `${t.companyName} — ${t.manufacturerName} ${t.manufacturerCode}` : null,
                            colorDeltaE: null,
                          });
                        }}
                        className="w-full text-xs bg-transparent border-none text-ink focus:outline-none truncate"
                      >
                        <option value="">Unmapped</option>
                        {threadColors.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.companyName} — {t.manufacturerName} {t.manufacturerCode}
                          </option>
                        ))}
                      </select>
                      {row.colorDeltaE != null && (
                        <p className="text-[10px] text-ink-faint">ΔE {row.colorDeltaE.toFixed(1)}</p>
                      )}
                    </div>
                  </div>

                  <select
                    value=""
                    onChange={(e) => e.target.value && mergeInto(row.sequence, Number(e.target.value))}
                    className="text-[11px] bg-surface border border-border rounded-md px-1.5 py-1 text-ink-muted"
                    title="Merge with another color"
                  >
                    <option value="">Merge…</option>
                    {activeRows
                      .filter((r) => r.sequence !== row.sequence)
                      .map((r) => (
                        <option key={r.sequence} value={r.sequence}>
                          Merge into #{r.sequence}
                        </option>
                      ))}
                  </select>
                </div>
              );
            })}
        </div>
      </Panel>
    </div>
  );
}
