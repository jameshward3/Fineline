import { quantizeColors } from "@/lib/services/image-processing/quantize";
import { removeSmallIslands, removeSpeckle, smoothEdges } from "@/lib/services/image-processing/cleanup";
import { alphaMask, labelComponents } from "@/lib/services/image-processing/connected-components";
import { findDetailWarnings } from "@/lib/services/image-processing/size";
import { findNearestThread, deltaE76, hexToLab } from "@/lib/color";
import type { AiAssistantService, AssistantContext, AssistantSuggestion } from "./types";
import type { ColorMappingRow } from "@/components/wizard/types";

/**
 * Rule-based production assistant. No model call — every "suggestion" is a
 * deterministic transform over the current wizard state, so what it
 * proposes is always exactly what Accept will apply. This keeps the human
 * approval step meaningful: nothing here can surprise the user.
 */
export class RuleBasedAiAssistant implements AiAssistantService {
  interpret(prompt: string, ctx: AssistantContext): AssistantSuggestion | null {
    const text = prompt.toLowerCase();

    const sizeMatch = text.match(/(\d+(?:\.\d+)?)[\s-]*("|in\b|inch)/);
    if (sizeMatch) {
      const width = parseFloat(sizeMatch[1]);
      const aspect =
        ctx.state.naturalWidth && ctx.state.naturalHeight ? ctx.state.naturalWidth / ctx.state.naturalHeight : 1;
      const height = +(width / aspect).toFixed(2);
      return {
        summary: `Set physical size to ${width.toFixed(2)}" wide (height follows the locked aspect ratio).`,
        changeDescriptions: [`Width → ${width.toFixed(2)}"`, `Height → ${height.toFixed(2)}"`],
        apply: () => ({ widthInches: width, heightInches: height }),
      };
    }

    const colorMatch = text.match(/(\d+)\s*(stocked\s*)?colors?/);
    if (colorMatch && (text.includes("reduce") || text.includes("colors"))) {
      const target = Math.max(1, Math.min(15, parseInt(colorMatch[1], 10)));
      const buffer = ctx.state.workingBuffer;
      if (!buffer) return null;
      return {
        summary: `Reduce artwork to ${target} production color${target === 1 ? "" : "s"}.`,
        changeDescriptions: [`Target color count → ${target}`, "Re-runs color quantization on the current artwork"],
        apply: () => {
          const result = quantizeColors(buffer, target);
          return {
            targetColorCount: target,
            palette: result.palette,
            colorMappings: result.palette.map((p, i) => ({
              sequence: i + 1,
              artworkColorHex: p.hex,
              threadColorId: null,
              threadLabel: null,
              needleNumber: null,
              colorDeltaE: null,
              mergedInto: null,
            })),
          };
        },
      };
    }

    if (text.includes("remove") && (text.includes("detail") || text.includes("clean") || text.includes("embroider"))) {
      const source = ctx.state.cleanedBuffer ?? ctx.state.workingBuffer;
      if (!source) return null;
      return {
        summary: "Clean up small details unlikely to embroider reliably.",
        changeDescriptions: [
          "Removes islands under ~12px²",
          "Applies morphological speckle removal",
          "Smooths jagged/anti-aliased edges",
        ],
        apply: () => {
          let buf = removeSmallIslands(source, 12).buffer;
          buf = removeSpeckle(buf, 1);
          buf = smoothEdges(buf, 1, 128);
          const mask = alphaMask(buf);
          const { components } = labelComponents(mask, buf.width, buf.height);
          const warnings = findDetailWarnings(components, buf.width, ctx.state.widthInches);
          return { cleanedBuffer: buf, componentCount: components.length, detailWarnings: warnings };
        },
      };
    }

    const machineMatch = text.match(/machine\s*(\S+)/);
    if (machineMatch && (text.includes("loaded") || text.includes("machine"))) {
      const machine = ctx.machines.find((m) => m.name.toLowerCase().includes(machineMatch[1])) ?? ctx.machines[0];
      if (!machine || ctx.state.colorMappings.length === 0) return null;
      const loaded = machine.needles.filter((n) => n.threadColorId && n.hex);

      return {
        summary: `Remap production colors to threads already loaded on ${machine.name}.`,
        changeDescriptions: ctx.state.colorMappings
          .filter((m) => m.mergedInto === null)
          .map((m) => {
            const targetLab = hexToLab(m.artworkColorHex);
            let best = loaded[0];
            let bestDist = Infinity;
            for (const n of loaded) {
              const d = deltaE76(targetLab, hexToLab(n.hex!));
              if (d < bestDist) {
                bestDist = d;
                best = n;
              }
            }
            return best ? `#${m.sequence} → ${best.companyName} (needle ${best.needleNumber})` : `#${m.sequence} → no loaded thread found`;
          }),
        apply: (): { colorMappings: ColorMappingRow[] } => ({
          colorMappings: ctx.state.colorMappings.map((m) => {
            if (m.mergedInto !== null) return m;
            const targetLab = hexToLab(m.artworkColorHex);
            let best = loaded[0];
            let bestDist = Infinity;
            for (const n of loaded) {
              const d = deltaE76(targetLab, hexToLab(n.hex!));
              if (d < bestDist) {
                bestDist = d;
                best = n;
              }
            }
            if (!best) return m;
            return {
              ...m,
              threadColorId: best.threadColorId,
              threadLabel: best.companyName,
              needleNumber: best.needleNumber,
              colorDeltaE: bestDist,
            };
          }),
        }),
      };
    }

    if (text.includes("thread") || text.includes("map")) {
      const buffer = ctx.state.palette;
      if (buffer.length === 0 || ctx.threadColors.length === 0) return null;
      return {
        summary: "Re-match every production color to the closest stocked thread.",
        changeDescriptions: ["Runs nearest-thread matching in LAB color space for every unmapped or mapped color"],
        apply: () => ({
          colorMappings: ctx.state.colorMappings.map((m) => {
            const match = findNearestThread(m.artworkColorHex, ctx.threadColors);
            if (!match) return m;
            return {
              ...m,
              threadColorId: match.thread.id,
              threadLabel: `${match.thread.companyName} — ${match.thread.manufacturerName} ${match.thread.manufacturerCode}`,
              colorDeltaE: match.deltaE,
            };
          }),
        }),
      };
    }

    return null;
  }
}
