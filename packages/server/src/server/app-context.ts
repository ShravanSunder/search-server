import type { ChromaClientService } from "../services/chroma-client.service.js";

export interface AppVariables {
  chromaClient: ChromaClientService;
}

export interface AppEnv {
  Variables: AppVariables;
}
