export interface ISection {
  head: string;
  name: string[];
}

export interface IAthleticsData {
  [key: string]: ISection[];
}
