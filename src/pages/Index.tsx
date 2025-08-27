import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trophy, Users, Settings } from 'lucide-react';
import { TournamentData, Category } from '@/types/tournament';
import FileUpload from '@/components/FileUpload';
import DataTable from '@/components/DataTable';
import CategoryManager from '@/components/CategoryManager';
import CategoryDisplay from '@/components/CategoryDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDataUpload = useCallback((data: TournamentData[], cols: string[]) => {
    setTournamentData(data);
    setColumns(cols);
  }, []);

  const applyFilters = useCallback((allData: TournamentData[], categoryList: Category[]) => {
    // Track players used globally across all categories to prevent repetition
    const globalUsedPlayers = new Set<string>();
    
    return categoryList.map(category => {
      let filteredData: TournamentData[] = [];

      // Special handling for Open category: take top N from remaining pool rather than comparing filter columns
      if (category.type === 'Open') {
        // Respect repetition rules: if repetition is not allowed, exclude already used players
        const remaining = allData.filter(row => {
          if (!category.allowRepetition) {
            const playerKey = JSON.stringify(row);
            return !globalUsedPlayers.has(playerKey);
          }
          return true;
        });

        // Apply limit if provided, otherwise take all remaining
        filteredData = category.limit ? remaining.slice(0, category.limit) : remaining;

        // Mark selected players as used when repetition is not allowed
        if (!category.allowRepetition) {
          filteredData.forEach(row => globalUsedPlayers.add(JSON.stringify(row)));
        }
      } else {
        // New filtering logic for non-Open categories using category.filters
        // FIXED: Separate filtering logic from repetition logic to handle different filter criteria correctly
        
        // First, get all players that match the filter criteria
        const matchingPlayers = allData.filter(row => {
          if (!category.filters || category.filters.length === 0) return false;

          // FIXED: Use OR logic - if ANY filter matches, include the player
          // This allows categories like "Best lady equal to U18g/U15g/U12g" to work correctly
          let matchesAnyFilter = false;
          
          for (const f of category.filters) {
            const columnValue = row[f.filterColumn];
            const filterValue = f.filterValue;

            // empty filter value => do not restrict on this filter
            if (filterValue === '' || filterValue === undefined || filterValue === null) {
              continue;
            }

            let currentFilterMatches = false;
            switch (f.filterType) {
              case 'equal':
                if (String(columnValue).toLowerCase() === String(filterValue).toLowerCase()) {
                  currentFilterMatches = true;
                }
                break;
              case 'greater':
                if (Number(columnValue) > Number(filterValue)) {
                  currentFilterMatches = true;
                }
                break;
              case 'less':
                if (Number(columnValue) < Number(filterValue)) {
                  currentFilterMatches = true;
                }
                break;
              case 'contains':
                if (String(columnValue).toLowerCase().includes(String(filterValue).toLowerCase())) {
                  currentFilterMatches = true;
                }
                break;
              default:
                currentFilterMatches = false;
            }

            // If any filter matches, we can include this player
            if (currentFilterMatches) {
              matchesAnyFilter = true;
              break; // No need to check other filters since we found a match
            }
          }

          return matchesAnyFilter;
        });

        // FIXED: Apply repetition rules more intelligently
        // Only exclude players who are already used AND this category doesn't allow repetition
        if (category.allowRepetition) {
          // If repetition is allowed, take all matching players regardless of global usage
          filteredData = matchingPlayers;
        } else {
          // If repetition is not allowed, exclude players already used in previous categories
          // But only mark them as used AFTER we've selected the final players for this category
          const availablePlayers = matchingPlayers.filter(row => {
            const playerKey = JSON.stringify(row);
            return !globalUsedPlayers.has(playerKey);
          });
          
          // Apply limit first, then mark as used
          filteredData = category.limit ? availablePlayers.slice(0, category.limit) : availablePlayers;
          
          // Mark selected players as used
          filteredData.forEach(row => globalUsedPlayers.add(JSON.stringify(row)));
        }
      }

      return {
        ...category,
        players: filteredData
      };
    });
  }, []);

  const handleAddCategory = useCallback((categoryData: Omit<Category, 'id' | 'priority' | 'players'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      priority: categories.length,
      players: []
    };

    const updatedCategories = [...categories, newCategory];
    const categoriesWithData = applyFilters(tournamentData, updatedCategories);
    setCategories(categoriesWithData);
  }, [categories, tournamentData, applyFilters]);

  const handleUpdateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const updatedCategories = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );
    const categoriesWithData = applyFilters(tournamentData, updatedCategories);
    setCategories(categoriesWithData);
  }, [categories, tournamentData, applyFilters]);

  const handleDeleteCategory = useCallback((id: string) => {
    const filteredCategories = categories.filter(cat => cat.id !== id);
    const categoriesWithData = applyFilters(tournamentData, filteredCategories);
    setCategories(categoriesWithData);
  }, [categories, tournamentData, applyFilters]);

  const handleReorderCategories = useCallback((reordered: Category[]) => {
    const categoriesWithData = applyFilters(tournamentData, reordered);
    setCategories(categoriesWithData);
  }, [tournamentData, applyFilters]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex)
        .map((cat, index) => ({ ...cat, priority: index }));
      
      const categoriesWithData = applyFilters(tournamentData, reorderedCategories);
      setCategories(categoriesWithData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <img src="/chess_logo.png" alt="Chess logo" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Tournament Manager
                </h1>
                <p className="text-sm text-muted-foreground">
                  Professional chess tournament results management
                </p>
              </div>
            </div>
            {tournamentData.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{tournamentData.length} players</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>{categories.length} categories</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {tournamentData.length === 0 ? (
          /* Welcome Screen */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-primary mb-4">
                <Trophy className="h-12 w-12 text-primary-foreground" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Chess Tournament Results Manager
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Upload your tournament Excel file and create dynamic categories with advanced filtering. 
                Perfect for tournament organizers who need professional results management.
              </p>
            </div>
            <FileUpload onDataUpload={handleDataUpload} />
          </div>
        ) : (
          /* Main Application */
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/30">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map(cat => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <CategoryDisplay categories={categories} columns={columns} />
                </SortableContext>
              </DndContext>
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager
                categories={categories}
                columns={columns}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onReorderCategories={handleReorderCategories}
              />
            </TabsContent>

            <TabsContent value="data">
              <DataTable data={tournamentData} columns={columns} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <footer className="border-t border-border/50 bg-card/10 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Created by Ambert Chan
        </div>
      </footer>
    </div>
  );
};

export default Index;
