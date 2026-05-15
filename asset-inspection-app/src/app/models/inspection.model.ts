export interface InspectionForm {
  date: string;
  personName: string;
  time: string;
  projectName: string;
  assetName: string;
  remark: string;
  progress: number;
  place: PlaceData | null;
}

export interface PlaceData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  photo: string | null; // base64
  timestamp: string;
}
