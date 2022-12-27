export interface IthoDaalderopAccessoryContext {
  somethingExtra: string;
}

// TODO: are there more options?
// TODO: is this different for other models?
// https://github.com/arjenhiemstra/ithowifi/wiki/Controlling-the-speed-of-a-fan
export type FanInfo = 'auto' | 'low' | 'medium' | 'high' | '1' | '2' | '3';

// Unknown what the values are, my box seems to show "7" when FanInfo is "auto", so i
export type Selection = 'auto' | 'low' | 'medium' | 'high' | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// https://github.com/arjenhiemstra/ithowifi/wiki/Controlling-the-speed-of-a-fan#help-a-speed-command-does-not-work
export type AutoMode = 'auto' | 'medium' | '3';

export interface IthoStatusSanitizedPayload {
  temp: number | null;
  hum: number | null;
  ppmw: number | null;
  'Speed status': number | null;
  'Internal fault': number | null;
  'Frost cycle': number | null;
  'Filter dirty': number | null;
  'AirQuality (%)': number | null;
  'AirQbased on': number | null;
  'CO2level (ppm)': number | null;
  'Indoorhumidity (%)': number | null;
  'Outdoorhumidity (%)': number | null;
  'Exhausttemp (°C)': number | null;
  'SupplyTemp (°C)': number | null;
  'IndoorTemp (°C)': number | null;
  'OutdoorTemp (°C)': number | null;
  SpeedCap: number | null;
  'BypassPos (%)': number | null;
  FanInfo: FanInfo;
  'ExhFanSpeed (%)': number | null;
  'InFanSpeed (%)': number | null;
  'RemainingTime (min)': number | null;
  'PostHeat (%)': number | null;
  'PreHeat (%)': number | null;
  'InFlow (l sec)': number | null;
  'ExhFlow (l sec)': number | null;
  'Ventilation setpoint (%)': number | null;
  'Fan setpoint (rpm)': number | null;
  'Fan speed (rpm)': number | null;
  Error: number | null;
  Selection: Selection;
  'Startup counter': number | null;
  'Total operation (hours)': number | null;
  'Absence (min)': number | null;
  'Highest CO2 concentration (ppm)': number | null;
  'Highest RH concentration (%)': number | null;
  RelativeHumidity: number | null;
  Temperature: number | null;
}

export type IthoStatusPayload = {
  [K in keyof IthoStatusSanitizedPayload]: number | string;
};

export type IthoGetSpeedResponse = number; // example: 45
export type IthoSetSpeedResponse = number; // example: 45

export type IthoStatePayload = string; // example: "45"

export enum VirtualRemoteOptions {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  TIMER1 = 'timer1',
  TIMER2 = 'timer2',
  TIMER3 = 'timer3',
  JOIN = 'join',
  LEAVE = 'leave',
}
