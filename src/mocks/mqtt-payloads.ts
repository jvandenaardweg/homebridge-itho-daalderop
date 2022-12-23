// TODO: check if this is right, found it on github
export interface IthoStatusPayload {
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
  'Exhausttemp (\u00b0C)': number | null;
  'SupplyTemp (\u00b0C)': number | null;
  'IndoorTemp (\u00b0C)': number | null;
  'OutdoorTemp (\u00b0C)': number | null;
  SpeedCap: number | null;
  'BypassPos (%)': number | null;
  FanInfo: string | null;
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
  Selection: number | null;
  'Startup counter': number | null;
  'Total operation (hours)': number | null;
  'Absence (min)': number | null;
  'Highest CO2 concentration (ppm)': number | null;
  'Highest RH concentration (%)': number | null;
  RelativeHumidity: number | null;
  Temperature: number | null;
}

// TODO: check if this is right, found it on github
export const mockIthoStatusPayload = {
  temp: 22.5,
  hum: 48.6,
  ppmw: 8322,
  'Speed status': 30,
  'Internal fault': 0,
  'Frost cycle': 0,
  'Filter dirty': 0,
  'AirQuality (%)': 'not available',
  'AirQbased on': 0,
  'CO2level (ppm)': 'not available',
  'Indoorhumidity (%)': 48,
  'Outdoorhumidity (%)': 'not available',
  'Exhausttemp (\u00b0C)': 'not available',
  'SupplyTemp (\u00b0C)': 'not available',
  'IndoorTemp (\u00b0C)': 'not available',
  'OutdoorTemp (\u00b0C)': 'not available',
  SpeedCap: 63488,
  'BypassPos (%)': 'not available',
  FanInfo: 'auto',
  'ExhFanSpeed (%)': 30,
  'InFanSpeed (%)': 0,
  'RemainingTime (min)': 0,
  'PostHeat (%)': 'not available',
  'PreHeat (%)': 'not available',
  'InFlow (l sec)': 'not available',
  'ExhFlow (l sec)': 'not available',
  'Ventilation setpoint (%)': 30,
  'Fan setpoint (rpm)': 900,
  'Fan speed (rpm)': 901,
  Error: 0,
  Selection: 7,
  'Startup counter': 44,
  'Total operation (hours)': 16480,
  'Absence (min)': 0,
  'Highest CO2 concentration (ppm)': 'not available',
  'Highest RH concentration (%)': 48,
  RelativeHumidity: 48.56,
  Temperature: 22.46,
} as unknown as IthoStatusPayload;

// TODO: check if this is right, found it on github
export const mockIthoStatusPayloadSanitized: IthoStatusPayload = {
  temp: 22.5,
  hum: 48.6,
  ppmw: 8322,
  'Speed status': 30,
  'Internal fault': 0,
  'Frost cycle': 0,
  'Filter dirty': 0,
  'AirQuality (%)': null,
  'AirQbased on': 0,
  'CO2level (ppm)': null,
  'Indoorhumidity (%)': 48,
  'Outdoorhumidity (%)': null,
  'Exhausttemp (\u00b0C)': null,
  'SupplyTemp (\u00b0C)': null,
  'IndoorTemp (\u00b0C)': null,
  'OutdoorTemp (\u00b0C)': null,
  SpeedCap: 63488,
  'BypassPos (%)': null,
  FanInfo: 'auto',
  'ExhFanSpeed (%)': 30,
  'InFanSpeed (%)': 0,
  'RemainingTime (min)': 0,
  'PostHeat (%)': null,
  'PreHeat (%)': null,
  'InFlow (l sec)': null,
  'ExhFlow (l sec)': null,
  'Ventilation setpoint (%)': 30,
  'Fan setpoint (rpm)': 900,
  'Fan speed (rpm)': 901,
  Error: 0,
  Selection: 7,
  'Startup counter': 44,
  'Total operation (hours)': 16480,
  'Absence (min)': 0,
  'Highest CO2 concentration (ppm)': null,
  'Highest RH concentration (%)': 48,
  RelativeHumidity: 48.56,
  Temperature: 22.46,
};

export type IthoStatePayload = string; // example: "45"

export const mockIthoStatePayload = '45';
