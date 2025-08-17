import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Trophy, Target } from 'lucide-react';
import { Category, TournamentData } from '@/types/tournament';

import { cn } from '@/lib/utils';

interface CategoryManagerProps {
  categories: Category[];
  columns: string[];
  onAddCategory: (category: Omit<Category, 'id' | 'priority' | 'players'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export default function CategoryManager({ 
  categories, 
  columns, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory 
}: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Custom' as Category['type'],
    filterColumn: '',
    filterType: 'equal' as Category['filterType'],
    filterValue: '',
    allowRepetition: false,
    limit: undefined as number | undefined
  });

  const predefinedCategories = [
    { type: 'Open', name: 'Open Category', description: 'All players eligible' },
    { type: 'U18 Boy', name: 'Under 18 Boys', description: 'Male players under 18' },
    { type: 'U18 Girl', name: 'Under 18 Girls', description: 'Female players under 18' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.filterColumn || !formData.filterValue) {
      return;
    }

    onAddCategory({
      name: formData.name,
      type: formData.type,
      filterColumn: formData.filterColumn,
      filterType: formData.filterType,
      filterValue: formData.filterValue,
      allowRepetition: formData.allowRepetition,
      limit: formData.limit
    });

    setFormData({
      name: '',
      type: 'Custom',
      filterColumn: '',
      filterType: 'equal',
      filterValue: '',
      allowRepetition: false,
      limit: undefined
    });
    setShowForm(false);
  };

  const handlePredefinedCategory = (category: typeof predefinedCategories[0]) => {
    setFormData({
      ...formData,
      name: category.name,
      type: category.type as Category['type']
    });
    setShowForm(true);
  };

  const getFilterTypeLabel = (type: Category['filterType']) => {
    const labels = {
      equal: 'Equal to',
      greater: 'Greater than',
      less: 'Less than',
      contains: 'Contains'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            Category Management
          </CardTitle>
          <CardDescription>
            Create and manage tournament categories with custom filtering rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Category Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predefinedCategories.map((category) => (
              <Card 
                key={category.type} 
                className="cursor-pointer hover:bg-secondary/20 transition-all duration-200 border-border/50"
                onClick={() => handlePredefinedCategory(category)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Custom Category Button */}
          <div className="flex justify-center">
            <Button
              variant="tournament"
              size="lg"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Custom Category
            </Button>
          </div>

          {/* Category Form */}
          {showForm && (
            <Card className="border-primary/20 bg-secondary/10 animate-slide-up">
              <CardHeader>
                <CardTitle className="text-lg">Create New Category</CardTitle>
                <CardDescription>
                  Define filtering rules for this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Under 16 Players"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryType">Category Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: Category['type']) => 
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="U18 Boy">U18 Boy</SelectItem>
                          <SelectItem value="U18 Girl">U18 Girl</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filterColumn">Filter by Column</Label>
                      <Select
                        value={formData.filterColumn}
                        onValueChange={(value) => 
                          setFormData({ ...formData, filterColumn: value })
                        }
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select column to filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filterType">Filter Type</Label>
                      <Select
                        value={formData.filterType}
                        onValueChange={(value: Category['filterType']) => 
                          setFormData({ ...formData, filterType: value })
                        }
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal to</SelectItem>
                          <SelectItem value="greater">Greater than</SelectItem>
                          <SelectItem value="less">Less than</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filterValue">Filter Value</Label>
                    <Input
                      id="filterValue"
                      value={formData.filterValue}
                      onChange={(e) => setFormData({ ...formData, filterValue: e.target.value })}
                      placeholder="Enter value to filter by"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Player Limit (optional)</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      value={formData.limit || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        limit: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      placeholder="No limit"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowRepetition"
                      checked={formData.allowRepetition}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allowRepetition: checked })
                      }
                    />
                    <Label htmlFor="allowRepetition" className="text-sm">
                      Allow players from other categories
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" variant="tournament">
                      Create Category
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Existing Categories */}
      {categories.length > 0 && (
        <Card className="bg-gradient-card border-border/50 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Active Categories
            </CardTitle>
            <CardDescription>
              Manage your tournament categories and their priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category, index) => (
                <Card key={category.id} className="border-border/30 bg-background/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Priority {index + 1}
                          </Badge>
                          <h3 className="font-semibold">{category.name}</h3>
                          <Badge variant="secondary">{category.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {category.filterColumn} {getFilterTypeLabel(category.filterType)} "{category.filterValue}"
                          </span>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{category.players.length} players{category.limit ? ` (limit: ${category.limit})` : ''}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteCategory(category.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
