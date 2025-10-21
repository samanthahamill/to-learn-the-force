export interface IntInfo {
  name: string;
}

export type EXTERNAL_DATA_TYPE = 'IMPORT' | 'UPLOAD';

export interface Emitters {
  name: string;
  type: 'A/A' | 'S/A';
}

export interface Platform {
  name: string;
  id: string;
  readonly: boolean;
  speed: number;
  depth: number;
}

export interface UserInputFormData {
  scenarioInfo: {
    scenarioName: string;
    scenarioAuthor: string;
    dateOfCreation: Date;
    details: string;
    platforms: Array<Platform>;
  };
  tool: {
    isTool: boolean;
  };
  external: {
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
