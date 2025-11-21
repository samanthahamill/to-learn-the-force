export interface AOIType {
  lat: number;
  lon: number;
  alt: number;
  radius: number;
}

export interface IntInfo {
  name: string;
}

export type EXTERNAL_DATA_TYPE = 'IMPORT' | 'UPLOAD';

export interface Emitters {
  name: string;
  type: 'A/A' | 'S/A';
}

interface PlatformBase {
  id: string;
  name: string;
  type: PLATFORM_TYPE;
  maxSpeed: number;
  maxZ: number;
  friendly: boolean;
  color: string; // hex

  reportingFrequency: number; // likely not a number
  readonly: boolean; // backend value
}
export interface Platform extends PlatformBase {
  waypoints: Array<Waypoint>;
}
// A waypoint that utilizes a form-compliant string instead of a date for Datetime
export interface FormPlatform extends PlatformBase {
  waypoints: Array<FormWaypoint>;
}

export type PLATFORM_TYPE = 'GROUND' | 'MARITIME' | 'AIR';
export const PLATFORM_TYPE_OPTIONS: Array<PLATFORM_TYPE> = [
  'AIR',
  'GROUND',
  'MARITIME',
];

export type METADATA = {
  scenarioAuthor: string;
  dateOfCreation: Date;
  details: string;
};

export interface UserInputFormData {
  metadata: METADATA;
  scenarioInput: {
    scenarioName: string;
    startTime: Date;
    endTime: Date;
    aoi: AOIType;
    platforms: Array<Platform>;
  };
  tool?: {
    isTool: boolean;
  };
  external?: {
    dataType: EXTERNAL_DATA_TYPE;
    newStartTime: Date; // the time to modify the original start time to
    import: {
      ogStartTime: Date;
      ogEndTime: Date;
      type1: boolean;
      type2: boolean;
      type3: boolean;
      type4: boolean;
    };
    upload: {
      vesselInfo: Array<VesselInfo>;
      ints: Array<IntInfo>;
    };
  };
}

export interface UserInputType {
  platform: boolean;
  tool: boolean;
}

export interface VesselInfo {
  name: string;
  id: string;
  emitter: Array<Emitters>;
  // TODO add other
}

interface WaypointBase {
  id: string; // for frontend us only - utilized to allow dragging on map feature
  lat: number;
  lon: number;
  z: number; // altitude or depth
  speedKts: number;
  index: number; // backend variable only to ensure proper ordering
}
export interface Waypoint extends WaypointBase {
  datetime: Date;
}
// A waypoint that utilizes a form-compliant string instead of a date for Datetime
export interface FormWaypoint extends WaypointBase {
  datetime: string;
}

export interface ValidatedPlatform {
  name?: string;
  type?: string;
  maxSpeed?: string;
  maxZ?: string;
  friendly?: string;
  color?: string;
  waypoints?: Array<ValidatedWaypoint>;
  reportingFrequency?: string;
}

export interface ValidatedWaypoint {
  lat?: string;
  lon?: string;
  z?: string;
  speedKts?: string;
  datetime?: string;
}
