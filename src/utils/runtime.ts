export const runtimeTimestamp = () => Date.now();

export const runtimeIso = () => new Date().toISOString();

export const runtimeDateOffset = (days: number) =>
  new Date(runtimeTimestamp() + days * 86400000).toISOString();

export const runtimeId = (prefix: string) =>
  `${prefix}-${runtimeTimestamp()}-${Math.random().toString(36).slice(2, 7)}`;
