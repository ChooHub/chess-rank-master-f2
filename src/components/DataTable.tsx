import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpDown, Users, Trophy } from 'lucide-react';
import { TournamentData } from '@/types/tournament';

interface DataTableProps {
  data: TournamentData[];
  columns: string[];
}

export default function DataTable({ data, columns }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column =>
          String(row[column]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        // Handle numeric sorting
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Handle string sorting
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return result;
  }, [data, columns, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return (
      <ArrowUpDown 
        className={`h-4 w-4 text-primary ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform duration-200`} 
      />
    );
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-primary" />
              Tournament Rankings
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {filteredAndSortedData.length} of {data.length} players
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players, rankings, ratings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 bg-background/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                {columns.map((column, index) => (
                  <TableHead 
                    key={column}
                    className="cursor-pointer hover:bg-secondary/50 transition-colors duration-200"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{column}</span>
                      {getSortIcon(column)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((row, index) => (
                <TableRow 
                  key={index}
                  className="hover:bg-secondary/20 transition-colors duration-200"
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={column} className="py-3">
                      {colIndex === 0 && typeof row[column] === 'number' && row[column] <= 3 ? (
                        <Badge 
                          variant="outline" 
                          className={`
                            ${row[column] === 1 ? 'border-tournament-gold text-tournament-gold bg-tournament-gold/10' : ''}
                            ${row[column] === 2 ? 'border-tournament-silver text-tournament-silver bg-tournament-silver/10' : ''}
                            ${row[column] === 3 ? 'border-tournament-bronze text-tournament-bronze bg-tournament-bronze/10' : ''}
                          `}
                        >
                          {row[column]}
                        </Badge>
                      ) : (
                        <span className={colIndex === 0 ? 'font-semibold' : ''}>
                          {String(row[column])}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {filteredAndSortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    No players found matching your search criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}