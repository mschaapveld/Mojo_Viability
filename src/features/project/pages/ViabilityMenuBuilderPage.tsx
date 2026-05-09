import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Download, Upload, DollarSign, Package, Menu as MenuIcon, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectData, MenuMajorCategory, MenuSubCategory, Ingredient, MenuItem, MenuItemIngredient } from '@/lib/types/projectTypes';
import { downloadMenuTemplate, parseMenuExcel, exportMenuToExcel } from '@/lib/menuUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ViabilityMenuBuilderProps {
  project: ProjectData;
  onUpdate: (updates: Partial<ProjectData>) => void;
}

export function ViabilityMenuBuilder({ project, onUpdate }: ViabilityMenuBuilderProps) {
  const rawMenuData = (project.menuData || {}) as Partial<typeof project.menuData> & Record<string, unknown>;
  const menuData: { majorCategories: MenuMajorCategory[]; subCategories: MenuSubCategory[]; ingredients: Ingredient[]; items: MenuItem[] } = {
    majorCategories: Array.isArray(rawMenuData.majorCategories) ? rawMenuData.majorCategories as MenuMajorCategory[] : [],
    subCategories: Array.isArray(rawMenuData.subCategories) ? rawMenuData.subCategories as MenuSubCategory[] : [],
    ingredients: Array.isArray(rawMenuData.ingredients) ? rawMenuData.ingredients as Ingredient[] : [],
    items: Array.isArray(rawMenuData.items) ? rawMenuData.items as MenuItem[] : [],
  };

  const [activeTab, setActiveTab] = useState<'categories' | 'ingredients' | 'items' | 'showMenu'>('categories');

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const [editingMajorCat, setEditingMajorCat] = useState<MenuMajorCategory | null>(null);
  const [newMajorCatName, setNewMajorCatName] = useState('');
  const [newMajorCatDesc, setNewMajorCatDesc] = useState('');

  const [editingSubCat, setEditingSubCat] = useState<MenuSubCategory | null>(null);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [newSubCatDesc, setNewSubCatDesc] = useState('');
  const [newSubCatMajor, setNewSubCatMajor] = useState('');

  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [newIngredientName, setNewIngredientName] = useState('');

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemSubCat, setNewItemSubCat] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemIngredients, setNewItemIngredients] = useState<MenuItemIngredient[]>([]);
  const [newIngredientInput, setNewIngredientInput] = useState('');
  const [newIngredientCostInput, setNewIngredientCostInput] = useState('');

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const normalizeIngredientName = (name: string): string => name.trim().toLowerCase();

  const findOrCreateIngredient = (name: string): string => {
    const normalized = normalizeIngredientName(name);
    const existing = menuData.ingredients.find(i => normalizeIngredientName(i.name) === normalized);

    if (existing) {
      return existing.id;
    }

    const newIng: Ingredient = {
      id: generateId(),
      name: name.trim(),
    };

    const updated = {
      menuData: {
        ...menuData,
        ingredients: [...menuData.ingredients, newIng],
      },
    };
    onUpdate(updated);
    return newIng.id;
  };

  const calculateItemCost = (ingredients: MenuItemIngredient[]): number => {
    return ingredients.reduce((total, ing) => total + ing.cost, 0);
  };

  const calculateItemMargin = (price: number, cost: number): { profit: number; margin: number; cogsPercent: number } => {
    const profit = price - cost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const cogsPercent = price > 0 ? (cost / price) * 100 : 0;
    return { profit, margin, cogsPercent };
  };

  // Major Category handlers
  const handleAddMajorCategory = () => {
    if (!newMajorCatName.trim()) {
      toast.error('Category name is required');
      return;
    }

    const newCat: MenuMajorCategory = {
      id: generateId(),
      name: newMajorCatName.trim(),
      description: newMajorCatDesc.trim() || undefined,
      sortOrder: menuData.majorCategories.length,
    };

    onUpdate({
      menuData: {
        ...menuData,
        majorCategories: [...menuData.majorCategories, newCat],
      },
    });

    setNewMajorCatName('');
    setNewMajorCatDesc('');
    toast.success('Major category added');
  };

  const handleUpdateMajorCategory = () => {
    if (!editingMajorCat || !newMajorCatName.trim()) return;

    onUpdate({
      menuData: {
        ...menuData,
        majorCategories: menuData.majorCategories.map(c =>
          c.id === editingMajorCat.id
            ? { ...c, name: newMajorCatName.trim(), description: newMajorCatDesc.trim() || undefined }
            : c
        ),
      },
    });

    setEditingMajorCat(null);
    setNewMajorCatName('');
    setNewMajorCatDesc('');
    toast.success('Major category updated');
  };

  const handleDeleteMajorCategory = (categoryId: string) => {
    const hasSubCats = menuData.subCategories.some(sc => sc.majorCategoryId === categoryId);
    if (hasSubCats) {
      toast.error('Cannot delete category with sub-categories');
      return;
    }

    onUpdate({
      menuData: {
        ...menuData,
        majorCategories: menuData.majorCategories.filter(c => c.id !== categoryId),
      },
    });

    toast.success('Major category deleted');
  };

  // Sub Category handlers
  const handleAddSubCategory = () => {
    if (!newSubCatName.trim()) {
      toast.error('Sub-category name is required');
      return;
    }

    if (!newSubCatMajor) {
      toast.error('Please select a major category');
      return;
    }

    const newCat: MenuSubCategory = {
      id: generateId(),
      majorCategoryId: newSubCatMajor,
      name: newSubCatName.trim(),
      description: newSubCatDesc.trim() || undefined,
      sortOrder: menuData.subCategories.filter(sc => sc.majorCategoryId === newSubCatMajor).length,
    };

    onUpdate({
      menuData: {
        ...menuData,
        subCategories: [...menuData.subCategories, newCat],
      },
    });

    setNewSubCatName('');
    setNewSubCatDesc('');
    setNewSubCatMajor('');
    toast.success('Sub-category added');
  };

  const handleUpdateSubCategory = () => {
    if (!editingSubCat || !newSubCatName.trim()) return;

    onUpdate({
      menuData: {
        ...menuData,
        subCategories: menuData.subCategories.map(c =>
          c.id === editingSubCat.id
            ? { ...c, name: newSubCatName.trim(), description: newSubCatDesc.trim() || undefined }
            : c
        ),
      },
    });

    setEditingSubCat(null);
    setNewSubCatName('');
    setNewSubCatDesc('');
    setNewSubCatMajor('');
    toast.success('Sub-category updated');
  };

  const handleDeleteSubCategory = (categoryId: string) => {
    const hasItems = menuData.items.some(item => item.subCategoryId === categoryId);
    if (hasItems) {
      toast.error('Cannot delete sub-category with items');
      return;
    }

    onUpdate({
      menuData: {
        ...menuData,
        subCategories: menuData.subCategories.filter(c => c.id !== categoryId),
      },
    });

    toast.success('Sub-category deleted');
  };

  const startEditMajorCategory = (category: MenuMajorCategory) => {
    setEditingMajorCat(category);
    setNewMajorCatName(category.name);
    setNewMajorCatDesc(category.description || '');
  };

  const startEditSubCategory = (category: MenuSubCategory) => {
    setEditingSubCat(category);
    setNewSubCatName(category.name);
    setNewSubCatDesc(category.description || '');
    setNewSubCatMajor(category.majorCategoryId);
  };

  // Ingredient handlers
  const handleAddIngredient = () => {
    if (!newIngredientName.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    const normalized = normalizeIngredientName(newIngredientName);
    const exists = menuData.ingredients.some(i => normalizeIngredientName(i.name) === normalized);

    if (exists) {
      toast.error('Ingredient already exists');
      return;
    }

    const newIng: Ingredient = {
      id: generateId(),
      name: newIngredientName.trim(),
    };

    onUpdate({
      menuData: {
        ...menuData,
        ingredients: [...menuData.ingredients, newIng],
      },
    });

    setNewIngredientName('');
    toast.success('Ingredient added');
  };

  const handleUpdateIngredient = () => {
    if (!editingIngredient || !newIngredientName.trim()) return;

    const normalized = normalizeIngredientName(newIngredientName);
    const exists = menuData.ingredients.some(i => i.id !== editingIngredient.id && normalizeIngredientName(i.name) === normalized);

    if (exists) {
      toast.error('Ingredient already exists');
      return;
    }

    onUpdate({
      menuData: {
        ...menuData,
        ingredients: menuData.ingredients.map(i =>
          i.id === editingIngredient.id
            ? { ...i, name: newIngredientName.trim() }
            : i
        ),
      },
    });

    setEditingIngredient(null);
    setNewIngredientName('');
    toast.success('Ingredient updated');
  };

  const handleDeleteIngredient = (ingredientId: string) => {
    const isUsed = menuData.items.some(item =>
      item.ingredients.some(ing => ing.ingredientId === ingredientId)
    );

    if (isUsed) {
      toast.error('Cannot delete ingredient in use');
      return;
    }

    onUpdate({
      menuData: {
        ...menuData,
        ingredients: menuData.ingredients.filter(i => i.id !== ingredientId),
      },
    });

    toast.success('Ingredient deleted');
  };

  const startEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setNewIngredientName(ingredient.name);
  };

  // Menu Item handlers
  const handleAddItemIngredient = () => {
    if (!newIngredientInput.trim()) {
      toast.error('Ingredient name is required');
      return;
    }

    const cost = parseFloat(newIngredientCostInput);
    if (isNaN(cost) || cost < 0) {
      toast.error('Valid cost is required');
      return;
    }

    const ingredientId = findOrCreateIngredient(newIngredientInput);

    if (newItemIngredients.some(ing => ing.ingredientId === ingredientId)) {
      toast.error('Ingredient already added to this item');
      return;
    }

    setNewItemIngredients([...newItemIngredients, { ingredientId, cost }]);
    setNewIngredientInput('');
    setNewIngredientCostInput('');
    toast.success('Ingredient added to item');
  };

  const handleRemoveItemIngredient = (index: number) => {
    setNewItemIngredients(newItemIngredients.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!newItemSubCat) {
      toast.error('Please select a sub-category');
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Valid price is required');
      return;
    }

    const newItem: MenuItem = {
      id: generateId(),
      subCategoryId: newItemSubCat,
      name: newItemName.trim(),
      description: newItemDesc.trim() || undefined,
      sellingPriceExGST: price,
      ingredients: newItemIngredients,
    };

    onUpdate({
      menuData: {
        ...menuData,
        items: [...menuData.items, newItem],
      },
    });

    setNewItemName('');
    setNewItemDesc('');
    setNewItemSubCat('');
    setNewItemPrice('');
    setNewItemIngredients([]);
    toast.success('Menu item added');
  };

  const handleUpdateItem = () => {
    if (!editingItem || !newItemName.trim()) return;

    if (!newItemSubCat) {
      toast.error('Please select a sub-category');
      return;
    }

    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Valid price is required');
      return;
    }

    onUpdate({
      menuData: {
        ...menuData,
        items: menuData.items.map(i =>
          i.id === editingItem.id
            ? {
                ...i,
                name: newItemName.trim(),
                description: newItemDesc.trim() || undefined,
                subCategoryId: newItemSubCat,
                sellingPriceExGST: price,
                ingredients: newItemIngredients,
              }
            : i
        ),
      },
    });

    setEditingItem(null);
    setNewItemName('');
    setNewItemDesc('');
    setNewItemSubCat('');
    setNewItemPrice('');
    setNewItemIngredients([]);
    toast.success('Menu item updated');
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      menuData: {
        ...menuData,
        items: menuData.items.filter(i => i.id !== itemId),
      },
    });

    toast.success('Menu item deleted');
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description || '');
    setNewItemSubCat(item.subCategoryId);
    setNewItemPrice(item.sellingPriceExGST.toString());
    setNewItemIngredients([...item.ingredients]);
  };

  // Upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadFile(e.target.files[0]);
      setUploadErrors([]);
    }
  };

  const handleUploadConfirm = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      const { data, errors } = await parseMenuExcel(uploadFile);

      if (errors.length > 0) {
        setUploadErrors(errors);
        return;
      }

      const updatedMenuData = replaceExisting ? data : {
        majorCategories: [...menuData.majorCategories, ...data.majorCategories],
        subCategories: [...menuData.subCategories, ...data.subCategories],
        ingredients: [...menuData.ingredients, ...data.ingredients],
        items: [...menuData.items, ...data.items],
      };

      onUpdate({ menuData: updatedMenuData });
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadErrors([]);
      toast.success('Menu imported successfully');
    } catch (error) {
      toast.error('Failed to import menu');
    }
  };

  const getSubCategoryName = (id: string) => {
    return menuData.subCategories.find(sc => sc.id === id)?.name || 'Unknown';
  };

  const getMajorCategoryName = (id: string) => {
    return menuData.majorCategories.find(mc => mc.id === id)?.name || 'Unknown';
  };

  const getIngredientName = (id: string) => {
    return menuData.ingredients.find(i => i.id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-2xl">Step 7. Menu Builder & Coster</CardTitle>
          <CardDescription>
            Manage your menu with pricing and costing.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => downloadMenuTemplate()} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Menu
            </Button>
            <Button onClick={() => exportMenuToExcel(menuData)} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="categories">
            <MenuIcon className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="ingredients">
            <Package className="w-4 h-4 mr-2" />
            Ingredients
          </TabsTrigger>
          <TabsTrigger value="items">
            <DollarSign className="w-4 h-4 mr-2" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="showMenu">
            <Eye className="w-4 h-4 mr-2" />
            Show Menu
          </TabsTrigger>
        </TabsList>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Major Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Major Categories</CardTitle>
                <CardDescription>Create Food, Drinks, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="major-name">Name</Label>
                    <Input
                      id="major-name"
                      placeholder="e.g., Food"
                      value={editingMajorCat ? newMajorCatName : newMajorCatName}
                      onChange={(e) => setNewMajorCatName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="major-desc">Description</Label>
                    <Textarea
                      id="major-desc"
                      placeholder="Optional description"
                      rows={2}
                      value={newMajorCatDesc}
                      onChange={(e) => setNewMajorCatDesc(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={editingMajorCat ? handleUpdateMajorCategory : handleAddMajorCategory}
                    className="w-full bg-brand hover:bg-brand/90 text-brand-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingMajorCat ? 'Update' : 'Add'} Major Category
                  </Button>
                  {editingMajorCat && (
                    <Button
                      onClick={() => {
                        setEditingMajorCat(null);
                        setNewMajorCatName('');
                        setNewMajorCatDesc('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {menuData.majorCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-xs text-gray-600">{cat.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditMajorCategory(cat)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMajorCategory(cat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sub Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sub-Categories</CardTitle>
                <CardDescription>Starters, Mains, Cocktails, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="major-select">Major Category</Label>
                    <Select value={editingSubCat ? newSubCatMajor : newSubCatMajor} onValueChange={setNewSubCatMajor}>
                      <SelectTrigger id="major-select">
                        <SelectValue placeholder="Select major category" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuData.majorCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sub-name">Sub-Category Name</Label>
                    <Input
                      id="sub-name"
                      placeholder="e.g., Starters"
                      value={newSubCatName}
                      onChange={(e) => setNewSubCatName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub-desc">Description</Label>
                    <Textarea
                      id="sub-desc"
                      placeholder="Optional description"
                      rows={2}
                      value={newSubCatDesc}
                      onChange={(e) => setNewSubCatDesc(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={editingSubCat ? handleUpdateSubCategory : handleAddSubCategory}
                    className="w-full bg-brand hover:bg-brand/90 text-brand-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingSubCat ? 'Update' : 'Add'} Sub-Category
                  </Button>
                  {editingSubCat && (
                    <Button
                      onClick={() => {
                        setEditingSubCat(null);
                        setNewSubCatName('');
                        setNewSubCatDesc('');
                        setNewSubCatMajor('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {menuData.subCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-xs text-gray-600">{getMajorCategoryName(cat.majorCategoryId)}</p>
                        {cat.description && <p className="text-xs text-gray-600">{cat.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditSubCategory(cat)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSubCategory(cat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INGREDIENTS TAB */}
        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient List</CardTitle>
              <CardDescription>Manage reusable ingredients (names only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-w-sm mx-auto">
                <div>
                  <Label htmlFor="ing-name" className="flex justify-center mb-2">Ingredient Name</Label>
                  <Input
                    id="ing-name"
                    placeholder="e.g., Cheddar Cheese"
                    value={newIngredientName}
                    onChange={(e) => setNewIngredientName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={editingIngredient ? handleUpdateIngredient : handleAddIngredient}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIngredient ? 'Update' : 'Add'} Ingredient
                </Button>
                {editingIngredient && (
                  <Button
                    onClick={() => {
                      setEditingIngredient(null);
                      setNewIngredientName('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Ingredients ({menuData.ingredients.length})</h3>
                <div className="grid gap-2">
                  {menuData.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{ing.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditIngredient(ing)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteIngredient(ing.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MENU ITEMS TAB */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Add items with ingredients and costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-w-2xl mx-auto p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-semibold text-center">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      placeholder="e.g., Caesar Salad"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-price">Selling Price (ex GST)</Label>
                    <Input
                      id="item-price"
                      type="number"
                      placeholder="0.00"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="item-desc">Description</Label>
                  <Textarea
                    id="item-desc"
                    placeholder="Optional description"
                    rows={2}
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="item-subcat">Sub-Category</Label>
                  <Select value={newItemSubCat} onValueChange={setNewItemSubCat}>
                    <SelectTrigger id="item-subcat">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuData.subCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {getMajorCategoryName(cat.majorCategoryId)} - {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Ingredients</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="item-ing">Ingredient (auto-add)</Label>
                      <Input
                        id="item-ing"
                        placeholder="Type ingredient name"
                        value={newIngredientInput}
                        onChange={(e) => setNewIngredientInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddItemIngredient();
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-ing-cost">Cost for Item ($)</Label>
                      <Input
                        id="item-ing-cost"
                        type="number"
                        placeholder="0.00"
                        value={newIngredientCostInput}
                        onChange={(e) => setNewIngredientCostInput(e.target.value)}
                        step="0.01"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddItemIngredient();
                        }}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddItemIngredient} size="sm" variant="secondary" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ingredient
                  </Button>

                  {newItemIngredients.length > 0 && (
                    <div className="space-y-2 bg-white p-3 rounded border">
                      {newItemIngredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm">
                            {getIngredientName(ing.ingredientId)} - ${ing.cost.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItemIngredient(idx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="text-sm font-semibold pt-2 border-t">
                        Total Cost: ${calculateItemCost(newItemIngredients).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={editingItem ? handleUpdateItem : handleAddItem}
                    className="flex-1"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  {editingItem && (
                    <Button
                      onClick={() => {
                        setEditingItem(null);
                        setNewItemName('');
                        setNewItemDesc('');
                        setNewItemSubCat('');
                        setNewItemPrice('');
                        setNewItemIngredients([]);
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items ({menuData.items.length})</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Sub-Category</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">COGS %</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuData.items.map((item) => {
                        const cost = calculateItemCost(item.ingredients);
                        const { profit, cogsPercent } = calculateItemMargin(item.sellingPriceExGST, cost);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-sm">{getSubCategoryName(item.subCategoryId)}</TableCell>
                            <TableCell className="text-right">${item.sellingPriceExGST.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${profit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{cogsPercent.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditItem(item)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHOW MENU TAB */}
        <TabsContent value="showMenu">
          <Card>
            <CardHeader>
              <CardTitle>Show Menu</CardTitle>
              <CardDescription>View your menu grouped by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {menuData.majorCategories.map((majorCat) => {
                  const subCatsForMajor = menuData.subCategories.filter(sc => sc.majorCategoryId === majorCat.id);
                  if (subCatsForMajor.length === 0) return null;

                  return (
                    <div key={majorCat.id} className="space-y-4">
                      <h2 className="text-2xl font-bold">{majorCat.name}</h2>

                      {subCatsForMajor.map((subCat) => {
                        const itemsForSub = menuData.items
                          .filter(item => item.subCategoryId === subCat.id)
                          .sort((a, b) => a.name.localeCompare(b.name));

                        if (itemsForSub.length === 0) return null;

                        return (
                          <div key={subCat.id} className="space-y-3 pl-4">
                            <h3 className="text-lg font-semibold text-gray-700">{subCat.name}</h3>
                            <div className="overflow-x-auto">
                              <Table className="text-sm">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Selling Price</TableHead>
                                    <TableHead className="text-right">Cost Price</TableHead>
                                    <TableHead className="text-right">Gross Margin</TableHead>
                                    <TableHead className="text-right">COGS %</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {itemsForSub.map((item) => {
                                    const cost = calculateItemCost(item.ingredients);
                                    const { profit, cogsPercent } = calculateItemMargin(item.sellingPriceExGST, cost);
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">${item.sellingPriceExGST.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${cost.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${profit.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{cogsPercent.toFixed(1)}%</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* UPLOAD DIALOG */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Menu from Excel</DialogTitle>
            <DialogDescription>
              Select an Excel file using the template format
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="replace"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
              />
              <label htmlFor="replace" className="text-sm">
                Replace existing data (uncheck to merge)
              </label>
            </div>

            {uploadErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {uploadErrors.map((err, i) => (
                      <li key={i} className="text-sm">{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadConfirm}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
