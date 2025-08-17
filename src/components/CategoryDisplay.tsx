import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users, Medal, Award } from 'lucide-react';
import { Category } from '@/types/tournament';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryDisplayProps {
  categories: Category[];
  columns: string[];
}

/**
 * SortableCategoryCard - wraps a category card to make it draggable within SortableContext.
 */
function SortableCategoryCard({ category, index, columns }: { category: Category; index: number; columns: string[] }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  } as React.CSSProperties;

  const getCategoryIcon = (type: Category['type']) => {
    switch (type) {
      case 'Open':
        return <Trophy className="h-4 w-4" />;
      case 'U18 Boy':
        return <Medal className="h-4 w-4" />;
      case 'U18 Girl':
        return <Award className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (type: Category['type']) => {
    switch (type) {
      case 'Open':
        return 'border-tournament-gold text-tournament-gold bg-tournament-gold/10';
      case 'U18 Boy':
        return 'border-blue-500 text-blue-500 bg-blue-500/10';
      case 'U18 Girl':
        return 'border-pink-500 text-pink-500 bg-pink-500/10';
      default:
        return 'border-primary text-primary bg-primary/10';
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-gradient-card border-border/50 shadow-card animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category.type)}
                {category.name}
                <Badge 
                  variant="outline" 
                  className={getCategoryColor(category.type)}
                >
                  {category.type}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {category.players.length} players
                </span>
                <span className="text-xs">
                  Priority {index + 1} • {category.filters?.map(f => `${f.filterColumn} ${f.filterType} \"${f.filterValue}\"`).join(', ')}
                </span>
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {category.allowRepetition ? 'Allows repetition' : 'Unique players'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {category.players.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No players match the criteria for this category</p>
            </div>
          ) : (
            <div className="rounded-md border border-border/50 bg-background/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    {columns.map((column) => (
                      <TableHead key={column} className="font-semibold">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(category.limit ? category.players.slice(0, category.limit) : category.players).map((player, playerIndex) => (
                    <TableRow 
                      key={playerIndex}
                      className="hover:bg-secondary/20 transition-colors duration-200"
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell key={column} className="py-3">
                          {colIndex === 0 && typeof player[column] === 'number' && player[column] <= 3 ? (
                            <Badge 
                              variant="outline" 
                              className={`
                                ${player[column] === 1 ? 'border-tournament-gold text-tournament-gold bg-tournament-gold/10' : ''}
                                ${player[column] === 2 ? 'border-tournament-silver text-tournament-silver bg-tournament-silver/10' : ''}
                                ${player[column] === 3 ? 'border-tournament-bronze text-tournament-bronze bg-tournament-bronze/10' : ''}
                              `}
                            >
                              {player[column]}
                            </Badge>
                          ) : (
                            <span className={colIndex === 0 ? 'font-semibold' : ''}>
                              {String(player[column])}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoryDisplay({ categories, columns }: CategoryDisplayProps) {
  if (categories.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            No categories created yet. Upload tournament data and create categories to see results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category, index) => (
        <SortableCategoryCard key={category.id} category={category} index={index} columns={columns} />
      ))}
    </div>
  );
}
