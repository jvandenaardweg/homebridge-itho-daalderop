export enum ActualMode {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  AUTO = 24,
}

// TODO: check if this is right, found it on github
export interface IthoStatusPayload {
  temp: number;
  hum: number;
  ppmw: number;
  ReqFanspeed: number;
  Balance: number;
  supply_fan_requested: number;
  supply_fan_actual: number;
  exhaust_fan_requested: number;
  exhaust_fan_actual: number;
  supplyTemp: number;
  exhaustTemp: number;
  status: number;
  RoomTemp: number;
  OutdoorTemp: number;
  Valve_position: number;
  Bypass_position: number;
  Summercounter: number;
  Summerday: number;
  FrostTimer: number;
  BoilTimer: number;
  StartCounter: number;
  CurPosition: number;
  VKKswitch: number;
  GroundHeatExchangerSwitch: number;
  AirCounter: number;
  Global_fault_code: number;
  Actual_Mode: ActualMode;
  pir_fan_speed_level: number;
  Highest_received_CO2_value: number;
  Highest_received_RH_value: number;
  Air_Quality: number;
  Remaining_override_timer: number;
  Fallback_speed_timer: number;
  Exhaust_Constant_Ca0: number;
}

// TODO: check if this is right, found it on github
// export const mockIthoStatusPayload = {
//   temp: 22.5,
//   hum: 48.6,
//   ppmw: 8322,
//   'Speed status': 30,
//   'Internal fault': 0,
//   'Frost cycle': 0,
//   'Filter dirty': 0,
//   'AirQuality (%)': 'not available',
//   'AirQbased on': 0,
//   'CO2level (ppm)': 'not available',
//   'Indoorhumidity (%)': 48,
//   'Outdoorhumidity (%)': 'not available',
//   'Exhausttemp (\u00b0C)': 'not available',
//   'SupplyTemp (\u00b0C)': 'not available',
//   'IndoorTemp (\u00b0C)': 'not available',
//   'OutdoorTemp (\u00b0C)': 'not available',
//   SpeedCap: 63488,
//   'BypassPos (%)': 'not available',
//   FanInfo: 'auto',
//   'ExhFanSpeed (%)': 30,
//   'InFanSpeed (%)': 0,
//   'RemainingTime (min)': 0,
//   'PostHeat (%)': 'not available',
//   'PreHeat (%)': 'not available',
//   'InFlow (l sec)': 'not available',
//   'ExhFlow (l sec)': 'not available',
//   'Ventilation setpoint (%)': 30,
//   'Fan setpoint (rpm)': 900,
//   'Fan speed (rpm)': 901,
//   Error: 0,
//   Selection: 7,
//   'Startup counter': 44,
//   'Total operation (hours)': 16480,
//   'Absence (min)': 0,
//   'Highest CO2 concentration (ppm)': 'not available',
//   'Highest RH concentration (%)': 48,
//   RelativeHumidity: 48.56,
//   Temperature: 22.46,
// } as unknown as IthoStatusPayload;

// TODO: check if this is right, found it on github
export const mockIthoStatusPayloadSanitized: IthoStatusPayload = {
  temp: 0,
  hum: 0,
  ppmw: 0,
  ReqFanspeed: 6552.6,
  Balance: 0,
  supply_fan_requested: 2205,
  supply_fan_actual: 2219,
  exhaust_fan_requested: 1472,
  exhaust_fan_actual: 1474,
  supplyTemp: 17.39,
  exhaustTemp: 14.05,
  status: 0,
  RoomTemp: 17.39,
  OutdoorTemp: 14.05,
  Valve_position: 0,
  Bypass_position: 0,
  Summercounter: 0,
  Summerday: 0,
  FrostTimer: 0,
  BoilTimer: 177,
  StartCounter: 120,
  CurPosition: 0,
  VKKswitch: 0,
  GroundHeatExchangerSwitch: 0,
  AirCounter: 2552,
  Global_fault_code: 0,
  Actual_Mode: 2,
  pir_fan_speed_level: 65535,
  Highest_received_CO2_value: 704,
  Highest_received_RH_value: 239,
  Air_Quality: 100,
  Remaining_override_timer: 0,
  Fallback_speed_timer: 1714,
  Exhaust_Constant_Ca0: 2,
};

export type IthoStatePayload = string; // example: "45"

export const mockIthoStatePayload = '45';
