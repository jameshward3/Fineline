export interface ThreadColorOption {
  id: string;
  hex: string;
  companyName: string;
  manufacturerName: string;
  manufacturerCode: string;
  lab: { l: number; a: number; b: number } | null;
}

export interface LocationOption {
  id: string;
  name: string;
  maxWidthInches: number;
  maxHeightInches: number;
}

export interface SetupOption {
  id: string;
  name: string;
  locationId: string | null;
  runCount: number;
  successRate: number | null; // 0-1, share of EXCELLENT/ACCEPTABLE runs
}

export interface ProductOption {
  id: string;
  name: string;
  category: string;
  locations: LocationOption[];
  productionSetups: SetupOption[];
}

export interface MachineOption {
  id: string;
  name: string;
  needles: { needleNumber: number; threadColorId: string | null; hex: string | null; companyName: string | null }[];
}

export interface ClientOption {
  id: string;
  name: string;
}
