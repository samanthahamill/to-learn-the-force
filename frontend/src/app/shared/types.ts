import { Platform, PlatformTypeEnum } from '../../generated/platform';
import { platformTypeEnumToString } from './utils';

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

export const PLATFORM_TYPE_OPTIONS: Array<string> = [
  platformTypeEnumToString(PlatformTypeEnum.AIR),
  platformTypeEnumToString(PlatformTypeEnum.GROUND),
  platformTypeEnumToString(PlatformTypeEnum.MARITIME),
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

export interface ValidatedPlatform {
  name?: string;
  type?: string;
  maxSpeed?: string;
  maxZ?: string;
  friendly?: string;
  color?: string;
  waypoints?: Array<ValidatedWaypoint | undefined>;
  reportingFrequency?: string;
}

export interface ValidatedWaypoint {
  lat?: string;
  lon?: string;
  z?: string;
  speedKts?: string;
  datetime?: string;
  smaj?: string;
  smin?: string;
  orientation?: string;
}
