import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Trophy, Target } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category, Filter } from '@/types/tournament';

import { cn } from '@/lib/utils';

interface CategoryManagerProps {
  categories: Category[];
  columns: string[];
  onAddCategory: (category: Omit<Category, 'id' | 'priority' | 'players'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (reordered: Category[]) => void;
}

const getFilterTypeLabel = (type: Filter['filterType']) => {
  const labels = {
    equal: 'Equal to',
    greater: 'Greater than',
    less: 'Less than',
    contains: 'Contains'
  } as const;
  return labels[type];
};

/**
 * SortableCategory - small wrapper component to make a category draggable
 */
function SortableCategory({
  category,
  index,
  onDelete,
  onEdit
}: {
  category: Category;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (category: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
                  {category.filters?.map(f => `${f.filterColumn} ${getFilterTypeLabel(f.filterType)} "${f.filterValue}"`).join(', ')}
                </span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{category.players.length} players{category.limit ? ` (limit: ${category.limit})` : ''}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.debug('SortableCategory: Edit clicked', category.id);
                  onEdit(category);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onPointerDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.debug('SortableCategory: Remove clicked', category.id);
                  onDelete(category.id);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoryManager({ 
  categories, 
  columns, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory,
  onReorderCategories
}: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Custom' as Category['type'],
    filters: [] as Filter[],
    allowRepetition: false,
    limit: undefined as number | undefined
  });
  const [editId, setEditId] = useState<string | null>(null);

  const predefinedCategories = [
    { type: 'Open', name: 'Open Category', description: 'All players eligible' },
    { type: 'U18 Boy', name: 'Under 18 Boys', description: 'Male players under 18' },
    { type: 'U18 Girl', name: 'Under 18 Girls', description: 'Female players under 18' },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      const reordered = arrayMove(categories, oldIndex, newIndex)
        .map((cat, index) => ({ ...cat, priority: index }));
      // pass reordered array to parent so it can set order and re-run filters
      onReorderCategories(reordered);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Require name and at least one filter for non-Open categories (value can be blank => wildcard)
    if (!formData.name || (formData.type !== 'Open' && formData.filters.length === 0)) {
      return;
    }
    // ensure all filters have a selected column; empty filterValue is allowed and treated as wildcard
    const invalidFilter = formData.filters.some(f => !f.filterColumn);
    if (invalidFilter) return;
  
    if (editId) {
      // update existing category
      onUpdateCategory(editId, {
        name: formData.name,
        type: formData.type,
        filters: formData.filters,
        allowRepetition: formData.allowRepetition,
        limit: formData.limit
      });
    } else {
      // create new category
      onAddCategory({
        name: formData.name,
        type: formData.type,
        filters: formData.filters,
        allowRepetition: formData.allowRepetition,
        limit: formData.limit
      });
    }
  
    setFormData({
      name: '',
      type: 'Custom',
      filters: [],
      allowRepetition: false,
      limit: undefined
    });
    setEditId(null);
    setShowForm(false);
  };

  const handlePredefinedCategory = (category: typeof predefinedCategories[0]) => {
    setFormData({
      ...formData,
      name: category.name,
      type: category.type as Category['type']
    });
    setEditId(null);
    setShowForm(true);
  };

  const getFilterTypeLabel = (type: Filter['filterType']) => {
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{editId ? 'Edit Category' : 'Create New Category'}</CardTitle>
                  {editId && (
                    <div className="text-sm text-accent">
                      Editing: {editId}
                    </div>
                  )}
                </div>
                <CardDescription>
                  Define filtering rules for this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Open A"
                        className="bg-background/50"
                      />
                      <Label>Filters</Label>
                      <div className="space-y-2">
                        {formData.filters.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-1/3">
                              <Select
                                value={f.filterColumn}
                                onValueChange={(value) => {
                                  const newFilters = [...formData.filters];
                                  newFilters[idx] = { ...newFilters[idx], filterColumn: value };
                                  setFormData({ ...formData, filters: newFilters });
                                }}
                              >
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Column" />
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

                            <div className="w-1/4">
                              <Select
                                value={f.filterType}
                                onValueChange={(value: Filter['filterType']) => {
                                  const newFilters = [...formData.filters];
                                  newFilters[idx] = { ...newFilters[idx], filterType: value };
                                  setFormData({ ...formData, filters: newFilters });
                                }}
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

                            <div className="flex-1">
                              <Input
                                value={String(f.filterValue ?? '')}
                                onChange={(e) => {
                                  const newFilters = [...formData.filters];
                                  newFilters[idx] = { ...newFilters[idx], filterValue: e.target.value };
                                  setFormData({ ...formData, filters: newFilters });
                                }}
                                placeholder="Value"
                                className="bg-background/50"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                const newFilters = formData.filters.filter((_, i) => i !== idx);
                                setFormData({ ...formData, filters: newFilters });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}

                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                filters: [...formData.filters, { filterColumn: '', filterType: 'equal', filterValue: '' }]
                              })
                            }
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Filter
                          </Button>
                        </div>
                      </div>
                    </div>
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
                      {editId ? 'Save Changes' : 'Create Category'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setShowForm(false); setEditId(null); }}
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {categories.map((category, index) => (
                      <SortableCategory
                        key={category.id}
                        category={category}
                        index={index}
                        onDelete={onDeleteCategory}
                        onEdit={(cat) => {
                          console.debug('CategoryManager: onEdit received', cat.id);
                          // prefill form for editing
                          setFormData({
                            name: cat.name,
                            type: cat.type,
                            filters: cat.filters || [],
                            allowRepetition: !!cat.allowRepetition,
                            limit: cat.limit
                          });
                          setEditId(cat.id);
                          setShowForm(true);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
