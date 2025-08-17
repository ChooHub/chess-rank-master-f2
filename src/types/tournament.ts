export interface TournamentData {
  [key: string]: string | number;
}

export interface Filter {
  filterColumn: string;
  filterType: 'equal' | 'greater' | 'less' | 'contains';
  filterValue: string | number;
}

export interface Category {
  id: string;
  name: string;
  type: 'Open' | 'U18 Boy' | 'U18 Girl' | 'Custom';
  filters: Filter[]; // multiple filter criteria
  allowRepetition: boolean;
  priority: number;
  limit?: number;
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
