import ExcelJS from 'exceljs';
import { MenuData, MenuMajorCategory, MenuSubCategory, Ingredient, MenuItem } from './types/projectTypes';

const INSTRUCTIONS_FONT = { bold: true, color: { argb: 'FF0066CC' } };
const INSTRUCTIONS_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE7F3FF' } };

function addInstructionsRow(sheet: ExcelJS.Worksheet, text: string, mergeRange: string) {
  sheet.insertRow(1, [text]);
  sheet.mergeCells(mergeRange);
  sheet.getRow(1).font = INSTRUCTIONS_FONT;
  sheet.getRow(1).fill = INSTRUCTIONS_FILL;
}

function triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function numVal(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v.toString());
  return isNaN(n) ? null : n;
}

function strVal(cell: ExcelJS.Cell): string {
  return cell.value?.toString().trim() ?? '';
}

export interface IngredientDetail {
  ingredientId: string;
  purchase_unit: string;
  purchase_pack_size: number | null;
  purchase_cost_cents: number | null;
  recipe_unit: string;
  recipe_unit_per_purchase: number | null;
  yield_percent: number | null;
  storage_type: string;
  category: string;
  preferred_supplier: string;
  notes: string;
}

export interface MenuInventoryIngredient {
  id: string;
  name: string;
  purchase_unit: string;
  purchase_pack_size: number | null;
  purchase_cost_cents: number | null;
  recipe_unit: string;
  recipe_unit_per_purchase: number | null;
  yield_percent: number;
  storage_type: string;
  category: string;
  preferred_supplier: string;
  notes: string;
  confidence: string;
}

export interface MenuInventoryItem {
  id: string;
  name: string;
  major_category: string;
  sub_category: string;
  sell_price_cents: number | null;
}

function buildIngredientDetailSheet(workbook: ExcelJS.Workbook, rows: IngredientDetail[]) {
  const sheet = workbook.addWorksheet('Ingredient Detail');
  sheet.columns = [
    { header: 'Ingredient ID', key: 'ingredientId', width: 20 },
    { header: 'Purchase Unit', key: 'purchase_unit', width: 18 },
    { header: 'Purchase Pack Size', key: 'purchase_pack_size', width: 20 },
    { header: 'Purchase Cost ex GST ($)', key: 'purchase_cost', width: 25 },
    { header: 'Recipe Unit', key: 'recipe_unit', width: 15 },
    { header: 'Recipe Units per Purchase Unit', key: 'recipe_unit_per_purchase', width: 30 },
    { header: 'Yield %', key: 'yield_percent', width: 12 },
    { header: 'Storage Type', key: 'storage_type', width: 16 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Preferred Supplier', key: 'preferred_supplier', width: 25 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];
  addInstructionsRow(
    sheet,
    'INSTRUCTIONS: Optional — add full ingredient detail for Menu & Inventory costing. Ingredient ID must match the Ingredients sheet. Viability tool ignores this sheet.',
    'A1:K1'
  );
  for (const row of rows) {
    sheet.addRow({
      ingredientId: row.ingredientId,
      purchase_unit: row.purchase_unit,
      purchase_pack_size: row.purchase_pack_size,
      purchase_cost: row.purchase_cost_cents != null ? row.purchase_cost_cents / 100 : null,
      recipe_unit: row.recipe_unit,
      recipe_unit_per_purchase: row.recipe_unit_per_purchase,
      yield_percent: row.yield_percent,
      storage_type: row.storage_type,
      category: row.category,
      preferred_supplier: row.preferred_supplier,
      notes: row.notes,
    });
  }
}

export async function downloadMenuTemplate() {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Major Categories
  const majorCatSheet = workbook.addWorksheet('Major Categories');
  majorCatSheet.columns = [
    { header: 'Major Category ID', key: 'id', width: 20 },
    { header: 'Major Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  addInstructionsRow(majorCatSheet, 'INSTRUCTIONS: Create major categories (e.g., Food, Drinks). ID must be unique.', 'A1:C1');
  majorCatSheet.addRow({ id: 'major001', name: 'Food', description: 'Food items' });
  majorCatSheet.addRow({ id: 'major002', name: 'Drinks', description: 'Beverages' });

  // Sheet 2: Sub Categories
  const subCatSheet = workbook.addWorksheet('Sub Categories');
  subCatSheet.columns = [
    { header: 'Sub Category ID', key: 'id', width: 20 },
    { header: 'Major Category ID', key: 'majorCategoryId', width: 20 },
    { header: 'Sub Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  addInstructionsRow(subCatSheet, 'INSTRUCTIONS: Create sub categories under major categories. Major Category ID must match a major category.', 'A1:D1');
  subCatSheet.addRow({ id: 'sub001', majorCategoryId: 'major001', name: 'Starters', description: 'Appetizers' });
  subCatSheet.addRow({ id: 'sub002', majorCategoryId: 'major001', name: 'Mains', description: 'Main courses' });
  subCatSheet.addRow({ id: 'sub003', majorCategoryId: 'major002', name: 'Cocktails', description: 'Mixed drinks' });
  subCatSheet.addRow({ id: 'sub004', majorCategoryId: 'major002', name: 'Beer', description: 'Beer selection' });

  // Sheet 3: Ingredients
  const ingredientsSheet = workbook.addWorksheet('Ingredients');
  ingredientsSheet.columns = [
    { header: 'Ingredient ID', key: 'id', width: 20 },
    { header: 'Ingredient Name', key: 'name', width: 30 },
  ];
  addInstructionsRow(ingredientsSheet, 'INSTRUCTIONS: Define your ingredients by name only. ID must be unique.', 'A1:B1');
  ingredientsSheet.addRow({ id: 'ing001', name: 'Beef Patty' });
  ingredientsSheet.addRow({ id: 'ing002', name: 'Burger Bun' });
  ingredientsSheet.addRow({ id: 'ing003', name: 'Lettuce' });
  ingredientsSheet.addRow({ id: 'ing004', name: 'Tomato' });
  ingredientsSheet.addRow({ id: 'ing005', name: 'Cheese Slice' });

  // Sheet 4: Menu Items
  const itemsSheet = workbook.addWorksheet('Menu Items');
  itemsSheet.columns = [
    { header: 'Item ID', key: 'id', width: 20 },
    { header: 'Sub Category ID', key: 'subCategoryId', width: 20 },
    { header: 'Item Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Selling Price ex GST ($)', key: 'price', width: 25 },
  ];
  addInstructionsRow(itemsSheet, 'INSTRUCTIONS: Create menu items. Sub Category ID must match a sub category from Sub Categories sheet.', 'A1:E1');
  itemsSheet.addRow({ id: 'item001', subCategoryId: 'sub001', name: 'Classic Burger', description: 'Beef burger with cheese', price: 12.50 });
  itemsSheet.addRow({ id: 'item002', subCategoryId: 'sub002', name: 'Grilled Steak', description: 'Premium steak', price: 25.00 });

  // Sheet 5: Item Ingredients
  const itemIngredientsSheet = workbook.addWorksheet('Item Ingredients');
  itemIngredientsSheet.columns = [
    { header: 'Item ID', key: 'itemId', width: 20 },
    { header: 'Ingredient ID', key: 'ingredientId', width: 20 },
    { header: 'Cost for this Item ($)', key: 'cost', width: 20 },
  ];
  addInstructionsRow(itemIngredientsSheet, 'INSTRUCTIONS: Map ingredients to items with cost per serving. Item ID and Ingredient ID must match existing records.', 'A1:C1');
  itemIngredientsSheet.addRow({ itemId: 'item001', ingredientId: 'ing001', cost: 2.50 });
  itemIngredientsSheet.addRow({ itemId: 'item001', ingredientId: 'ing002', cost: 0.80 });
  itemIngredientsSheet.addRow({ itemId: 'item001', ingredientId: 'ing005', cost: 0.60 });

  // Sheet 6: Ingredient Detail
  buildIngredientDetailSheet(workbook, [
    { ingredientId: 'ing001', purchase_unit: 'kg', purchase_pack_size: 1, purchase_cost_cents: 1800, recipe_unit: 'g', recipe_unit_per_purchase: 1000, yield_percent: 90, storage_type: 'chilled', category: 'meat', preferred_supplier: '', notes: '180g patty' },
    { ingredientId: 'ing002', purchase_unit: 'each', purchase_pack_size: 1, purchase_cost_cents: 60, recipe_unit: 'each', recipe_unit_per_purchase: 1, yield_percent: 100, storage_type: 'dry', category: 'dry_goods', preferred_supplier: '', notes: '' },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, 'MenuTemplate.xlsx');
}

export async function parseMenuExcel(file: File): Promise<{
  data: MenuData;
  errors: string[];
  ingredientDetails: Map<string, IngredientDetail>;
}> {
  const errors: string[] = [];
  const ingredientDetails = new Map<string, IngredientDetail>();
  const workbook = new ExcelJS.Workbook();

  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    const majorCatSheet = workbook.getWorksheet('Major Categories');
    const subCatSheet = workbook.getWorksheet('Sub Categories');
    const ingredientsSheet = workbook.getWorksheet('Ingredients');
    const itemsSheet = workbook.getWorksheet('Menu Items');
    const itemIngredientsSheet = workbook.getWorksheet('Item Ingredients');

    if (!majorCatSheet || !subCatSheet || !ingredientsSheet || !itemsSheet || !itemIngredientsSheet) {
      errors.push('Excel file is missing required sheets. Please use the provided template.');
      return { data: { majorCategories: [], subCategories: [], ingredients: [], items: [] }, errors, ingredientDetails };
    }

    // Parse major categories
    const majorCategories: MenuMajorCategory[] = [];
    const majorCatIdMap = new Map<string, string>();

    majorCatSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const excelId = strVal(row.getCell(1));
      const name = strVal(row.getCell(2));
      const description = strVal(row.getCell(3));
      if (!name) return;
      const generatedId = `major-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (excelId) majorCatIdMap.set(excelId, generatedId);
      majorCategories.push({ id: generatedId, name, description: description || undefined, sortOrder: majorCategories.length });
    });

    // Parse sub categories
    const subCategories: MenuSubCategory[] = [];
    const subCatIdMap = new Map<string, string>();

    subCatSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const excelId = strVal(row.getCell(1));
      const excelMajorId = strVal(row.getCell(2));
      const name = strVal(row.getCell(3));
      const description = strVal(row.getCell(4));
      if (!name || !excelMajorId) return;
      const majorCategoryId = majorCatIdMap.get(excelMajorId);
      if (!majorCategoryId) {
        errors.push(`Sub Category row ${rowNumber}: Major Category ID "${excelMajorId}" not found`);
        return;
      }
      const generatedId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (excelId) subCatIdMap.set(excelId, generatedId);
      subCategories.push({ id: generatedId, majorCategoryId, name, description: description || undefined, sortOrder: subCategories.length });
    });

    // Parse ingredients
    const ingredients: Ingredient[] = [];
    const ingredientIdMap = new Map<string, string>();

    ingredientsSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const excelId = strVal(row.getCell(1));
      const name = strVal(row.getCell(2));
      if (!name) return;
      const generatedId = `ing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (excelId) ingredientIdMap.set(excelId, generatedId);
      ingredients.push({ id: generatedId, name });
    });

    // Parse menu items
    const items: MenuItem[] = [];
    const itemIdMap = new Map<string, string>();

    itemsSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const excelId = strVal(row.getCell(1));
      const excelSubCatId = strVal(row.getCell(2));
      const name = strVal(row.getCell(3));
      const description = strVal(row.getCell(4));
      const priceValue = row.getCell(5).value;
      if (!name) return;
      const price = typeof priceValue === 'number' ? priceValue : parseFloat(priceValue?.toString() || '0');
      if (isNaN(price) || price < 0) { errors.push(`Menu Items row ${rowNumber}: Invalid price for "${name}"`); return; }
      if (!excelSubCatId) { errors.push(`Menu Items row ${rowNumber}: Missing sub category ID for "${name}"`); return; }
      const subCategoryId = subCatIdMap.get(excelSubCatId);
      if (!subCategoryId) { errors.push(`Menu Items row ${rowNumber}: Sub Category ID "${excelSubCatId}" not found`); return; }
      const generatedId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (excelId) itemIdMap.set(excelId, generatedId);
      items.push({ id: generatedId, subCategoryId, name, description: description || undefined, sellingPriceExGST: price, ingredients: [] });
    });

    // Parse item ingredients
    itemIngredientsSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      const excelItemId = strVal(row.getCell(1));
      const excelIngredientId = strVal(row.getCell(2));
      const costValue = row.getCell(3).value;
      if (!excelItemId || !excelIngredientId) return;
      const itemId = itemIdMap.get(excelItemId);
      const ingredientId = ingredientIdMap.get(excelIngredientId);
      if (!itemId) { errors.push(`Item Ingredients row ${rowNumber}: Item ID "${excelItemId}" not found`); return; }
      if (!ingredientId) { errors.push(`Item Ingredients row ${rowNumber}: Ingredient ID "${excelIngredientId}" not found`); return; }
      const cost = typeof costValue === 'number' ? costValue : parseFloat(costValue?.toString() || '0');
      if (isNaN(cost) || cost < 0) { errors.push(`Item Ingredients row ${rowNumber}: Invalid cost`); return; }
      const item = items.find(i => i.id === itemId);
      if (item) item.ingredients.push({ ingredientId, cost });
    });

    // Parse Ingredient Detail (optional)
    const detailSheet = workbook.getWorksheet('Ingredient Detail');
    if (detailSheet) {
      detailSheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return;
        const excelIngId = strVal(row.getCell(1));
        if (!excelIngId) return;
        const resolvedId = ingredientIdMap.get(excelIngId) ?? excelIngId;
        const purchase_cost_raw = numVal(row.getCell(4));
        ingredientDetails.set(resolvedId, {
          ingredientId: resolvedId,
          purchase_unit: strVal(row.getCell(2)),
          purchase_pack_size: numVal(row.getCell(3)),
          purchase_cost_cents: purchase_cost_raw != null ? Math.round(purchase_cost_raw * 100) : null,
          recipe_unit: strVal(row.getCell(5)),
          recipe_unit_per_purchase: numVal(row.getCell(6)),
          yield_percent: numVal(row.getCell(7)),
          storage_type: strVal(row.getCell(8)),
          category: strVal(row.getCell(9)),
          preferred_supplier: strVal(row.getCell(10)),
          notes: strVal(row.getCell(11)),
        });
      });
    }

    return { data: { majorCategories, subCategories, ingredients, items }, errors, ingredientDetails };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`Failed to parse Excel file: ${msg}`);
    return { data: { majorCategories: [], subCategories: [], ingredients: [], items: [] }, errors, ingredientDetails };
  }
}

export async function downloadMenuTemplateFromMenuData(
  ingredients: MenuInventoryIngredient[],
  menuItems: MenuInventoryItem[],
  filename = 'CurrentMenu.xlsx'
) {
  const workbook = new ExcelJS.Workbook();

  const majorCats = [...new Set(menuItems.map(i => i.major_category).filter(Boolean))];

  const majorCatSheet = workbook.addWorksheet('Major Categories');
  majorCatSheet.columns = [
    { header: 'Major Category ID', key: 'id', width: 20 },
    { header: 'Major Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  addInstructionsRow(majorCatSheet, 'INSTRUCTIONS: Create major categories (e.g., Food, Drinks). ID must be unique.', 'A1:C1');
  majorCats.forEach((cat, idx) => {
    majorCatSheet.addRow({ id: `major${String(idx + 1).padStart(3, '0')}`, name: cat, description: '' });
  });

  const subCatSheet = workbook.addWorksheet('Sub Categories');
  subCatSheet.columns = [
    { header: 'Sub Category ID', key: 'id', width: 20 },
    { header: 'Major Category ID', key: 'majorCategoryId', width: 20 },
    { header: 'Sub Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  addInstructionsRow(subCatSheet, 'INSTRUCTIONS: Create sub categories under major categories.', 'A1:D1');
  const subCatIdxMap = new Map<string, string>();
  let subIdx = 1;
  for (const item of menuItems) {
    const key = `${item.major_category}|${item.sub_category}`;
    if (item.sub_category && !subCatIdxMap.has(key)) {
      const subId = `sub${String(subIdx).padStart(3, '0')}`;
      subCatIdxMap.set(key, subId);
      const majorIdx = majorCats.indexOf(item.major_category);
      const majorId = majorIdx >= 0 ? `major${String(majorIdx + 1).padStart(3, '0')}` : '';
      subCatSheet.addRow({ id: subId, majorCategoryId: majorId, name: item.sub_category, description: '' });
      subIdx++;
    }
  }

  const ingredientsSheet = workbook.addWorksheet('Ingredients');
  ingredientsSheet.columns = [
    { header: 'Ingredient ID', key: 'id', width: 20 },
    { header: 'Ingredient Name', key: 'name', width: 30 },
  ];
  addInstructionsRow(ingredientsSheet, 'INSTRUCTIONS: Define your ingredients by name only. ID must be unique.', 'A1:B1');
  const ingIdMap = new Map<string, string>();
  ingredients.forEach((ing, idx) => {
    const shortId = `ing${String(idx + 1).padStart(3, '0')}`;
    ingIdMap.set(ing.id, shortId);
    ingredientsSheet.addRow({ id: shortId, name: ing.name });
  });

  const itemsSheet = workbook.addWorksheet('Menu Items');
  itemsSheet.columns = [
    { header: 'Item ID', key: 'id', width: 20 },
    { header: 'Sub Category ID', key: 'subCategoryId', width: 20 },
    { header: 'Item Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Selling Price ex GST ($)', key: 'price', width: 25 },
  ];
  addInstructionsRow(itemsSheet, 'INSTRUCTIONS: Create menu items.', 'A1:E1');
  menuItems.forEach((item, idx) => {
    const key = `${item.major_category}|${item.sub_category}`;
    itemsSheet.addRow({
      id: `item${String(idx + 1).padStart(3, '0')}`,
      subCategoryId: subCatIdxMap.get(key) ?? '',
      name: item.name,
      description: '',
      price: item.sell_price_cents != null ? item.sell_price_cents / 100 : '',
    });
  });

  const itemIngredientsSheet = workbook.addWorksheet('Item Ingredients');
  itemIngredientsSheet.columns = [
    { header: 'Item ID', key: 'itemId', width: 20 },
    { header: 'Ingredient ID', key: 'ingredientId', width: 20 },
    { header: 'Cost for this Item ($)', key: 'cost', width: 20 },
  ];
  addInstructionsRow(itemIngredientsSheet, 'INSTRUCTIONS: Map ingredients to items with cost per serving.', 'A1:C1');

  buildIngredientDetailSheet(workbook, ingredients.map(ing => ({
    ingredientId: ingIdMap.get(ing.id) ?? ing.id,
    purchase_unit: ing.purchase_unit,
    purchase_pack_size: ing.purchase_pack_size,
    purchase_cost_cents: ing.purchase_cost_cents,
    recipe_unit: ing.recipe_unit,
    recipe_unit_per_purchase: ing.recipe_unit_per_purchase,
    yield_percent: ing.yield_percent,
    storage_type: ing.storage_type,
    category: ing.category,
    preferred_supplier: ing.preferred_supplier,
    notes: ing.notes,
  })));

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}

export async function exportMenuToExcel(menuData: MenuData, filename: string = 'CurrentMenu.xlsx') {
  const workbook = new ExcelJS.Workbook();

  const majorCatSheet = workbook.addWorksheet('Major Categories');
  majorCatSheet.columns = [
    { header: 'Major Category ID', key: 'id', width: 20 },
    { header: 'Major Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  menuData.majorCategories.forEach(cat => { majorCatSheet.addRow(cat); });

  const subCatSheet = workbook.addWorksheet('Sub Categories');
  subCatSheet.columns = [
    { header: 'Sub Category ID', key: 'id', width: 20 },
    { header: 'Major Category ID', key: 'majorCategoryId', width: 20 },
    { header: 'Sub Category Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  menuData.subCategories.forEach(cat => { subCatSheet.addRow(cat); });

  const ingredientsSheet = workbook.addWorksheet('Ingredients');
  ingredientsSheet.columns = [
    { header: 'Ingredient ID', key: 'id', width: 20 },
    { header: 'Ingredient Name', key: 'name', width: 30 },
  ];
  menuData.ingredients.forEach(ing => { ingredientsSheet.addRow(ing); });

  const itemsSheet = workbook.addWorksheet('Menu Items');
  itemsSheet.columns = [
    { header: 'Item ID', key: 'id', width: 20 },
    { header: 'Sub Category ID', key: 'subCategoryId', width: 20 },
    { header: 'Item Name', key: 'name', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Selling Price ex GST ($)', key: 'sellingPriceExGST', width: 25 },
  ];
  menuData.items.forEach(item => {
    itemsSheet.addRow({ id: item.id, subCategoryId: item.subCategoryId, name: item.name, description: item.description, sellingPriceExGST: item.sellingPriceExGST });
  });

  const itemIngredientsSheet = workbook.addWorksheet('Item Ingredients');
  itemIngredientsSheet.columns = [
    { header: 'Item ID', key: 'itemId', width: 20 },
    { header: 'Ingredient ID', key: 'ingredientId', width: 20 },
    { header: 'Cost for this Item ($)', key: 'cost', width: 20 },
  ];
  menuData.items.forEach(item => {
    item.ingredients.forEach(ing => {
      itemIngredientsSheet.addRow({ itemId: item.id, ingredientId: ing.ingredientId, cost: ing.cost });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}
