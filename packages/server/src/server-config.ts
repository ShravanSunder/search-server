export interface ServerConfig {
  readonly port: number;
  readonly host: string;
  readonly chromaHost: string;
  readonly chromaPort: number;
}

export function loadConfig(): ServerConfig {
  return {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST ?? "0.0.0.0",
    chromaHost: process.env.CHROMA_HOST ?? "localhost",
    chromaPort: Number(process.env.CHROMA_PORT) || 8000,
  };
}
