import { TajimaDstStitchEngine } from "./engine";
import type { StitchEngineService } from "./types";

export type { StitchEngineService, StitchGenerationInput, StitchGenerationResult, StitchFileFormat } from "./types";

let instance: StitchEngineService | undefined;

export function getStitchEngineService(): StitchEngineService {
  if (!instance) instance = new TajimaDstStitchEngine();
  return instance;
}
