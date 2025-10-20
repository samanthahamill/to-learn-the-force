export interface UserInputType {
  platform: boolean;
  tool: boolean;
}

export interface UserInputFormData {
  platform: {
    isPlatform: boolean;
  };
  tool: {
    isTool: boolean;
  };
  external: {
    startTime: Date;
    endTime: Date;
    type1: boolean;
    type2: boolean;
    type3: boolean;
    type4: boolean;
  };
}
