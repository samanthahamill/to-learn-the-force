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

export interface Platform {
  id: string;
  name: string;
  type: PLATFORM_TYPE;
  maxSpeed: number;
  maxDepth: number;
  maxAlt: number;

  waypoints: Array<Waypoint>;
  reportingFrequency: number; // likely not a number
  readonly: boolean; // backend value
}

export type PLATFORM_TYPE = 'GROUND' | 'MARITIME' | 'AIR';

export interface UserInputFormData {
  scenario: {
    baseInfo: {
      scenarioName: string;
      scenarioAuthor: string;
      dateOfCreation: Date;
      details: string;
    };
    scenarioInput: {
      aoi: AOIType;
      platforms: Array<Platform>;
    };
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

export interface Waypoint {
  lat: number;
  lon: number;
  alt: number;
  speedKts: number;
  datetime: Date; // should there be a start/end time? Possibly a different type
  index: number; // backend variable only to ensure proper ordering
}
