import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Crown, Trophy, Users, Settings } from 'lucide-react';
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
    const usedPlayers = new Set<string>();
    
    return categoryList.map(category => {
      let filteredData: TournamentData[] = [];

      // Special handling for Open category: take top N from remaining pool rather than comparing filter columns
      if (category.type === 'Open') {
        // Respect repetition rules: if repetition is not allowed, exclude already used players
        const remaining = allData.filter(row => {
          if (!category.allowRepetition) {
            const playerKey = JSON.stringify(row);
            return !usedPlayers.has(playerKey);
          }
          return true;
        });

        // Apply limit if provided, otherwise take all remaining
        filteredData = category.limit ? remaining.slice(0, category.limit) : remaining;

        // Mark selected players as used when repetition is not allowed
        if (!category.allowRepetition) {
          filteredData.forEach(row => usedPlayers.add(JSON.stringify(row)));
        }
      } else {
        // New filtering logic for non-Open categories using category.filters (AND across filters)
        filteredData = allData.filter(row => {
          if (!category.filters || category.filters.length === 0) return false;

          // Evaluate all filters; all must match (AND)
          // If a filter's value is empty, treat it as a wildcard for that column (match all)
          let matches = true;
          for (const f of category.filters) {
            const columnValue = row[f.filterColumn];
            const filterValue = f.filterValue;

            // empty filter value => do not restrict on this filter
            if (filterValue === '' || filterValue === undefined || filterValue === null) {
              continue;
            }

            switch (f.filterType) {
              case 'equal':
                if (String(columnValue).toLowerCase() !== String(filterValue).toLowerCase()) {
                  matches = false;
                }
                break;
              case 'greater':
                if (!(Number(columnValue) > Number(filterValue))) {
                  matches = false;
                }
                break;
              case 'less':
                if (!(Number(columnValue) < Number(filterValue))) {
                  matches = false;
                }
                break;
              case 'contains':
                if (!String(columnValue).toLowerCase().includes(String(filterValue).toLowerCase())) {
                  matches = false;
                }
                break;
              default:
                matches = false;
            }

            if (!matches) break;
          }

          // Check repetition rules
          if (matches && !category.allowRepetition) {
            const playerKey = JSON.stringify(row);
            if (usedPlayers.has(playerKey)) {
              return false;
            }
            usedPlayers.add(playerKey);
          }

          return matches;
        });

        // Apply limit if specified for non-Open categories as well
        if (category.limit) {
          filteredData = filteredData.slice(0, category.limit);
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
                <Crown className="h-6 w-6 text-primary-foreground" />
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
    </div>
  );
};

export default Index;
