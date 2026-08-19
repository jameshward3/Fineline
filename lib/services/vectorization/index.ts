import { ImagetracerVectorizationService } from "./imagetracer-adapter";
import type { VectorizationService } from "./types";

export type { VectorLayer, VectorizationService } from "./types";

let instance: VectorizationService | undefined;

export function getVectorizationService(): VectorizationService {
  if (!instance) {
    instance = new ImagetracerVectorizationService();
  }
  return instance;
}
