export interface TournamentData {
  [key: string]: string | number;
}

export interface Category {
  id: string;
  name: string;
  type: 'Open' | 'U18 Boy' | 'U18 Girl' | 'Custom';
  filterColumn: string;
  filterType: 'equal' | 'greater' | 'less' | 'contains';
  filterValue: string | number;
  allowRepetition: boolean;
  priority: number;
  players: TournamentData[];
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface ColumnInfo {
  key: string;
  type: 'text' | 'number';
}