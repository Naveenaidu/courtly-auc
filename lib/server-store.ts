import { AppData } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var auctionState: AppData | undefined;
}

export function getServerState(): AppData | null {
  return global.auctionState ?? null;
}

export function setServerState(state: AppData): void {
  global.auctionState = state;
}
