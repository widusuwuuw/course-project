export interface MetricInfo {
  name: string;
  name_en: string;
  unit: string;
  description: string;
  normal_range?: [number, number];
}