export enum SkuType {
  BASE = 'BASE',
  PRIME = 'PRIME',
  PREMIUM = 'PREMIUM'
}

export interface Device {
  id: string;
  name: string;
  sku: SkuType;
  os: string;
  model: string;
  sn: string;
  agentVer: string;
  deviceId: string;
  status: 'Connected' | 'Disconnected';
  group: string;
}

export type ViewMode = 'DASHBOARD' | 'DEVICES' | 'VEO_STUDIO';

export interface SkuTarget {
  type: 'SINGLE' | 'MULTI' | 'GROUP' | 'MULTI_GROUP';
  label: string; // Name of device or group, or generic "X devices"
  count: number;
  currentSku?: SkuType; // Only present if single device or consistent across selection
}