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
}
