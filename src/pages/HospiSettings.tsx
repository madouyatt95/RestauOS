import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Building2, Store, Warehouse, BedDouble, ReceiptText, ShieldCheck, ChefHat, Truck, Users, CreditCard, Plus, Edit2, Trash2, X, Search } from 'lucide-react';
import { useHospiStore, type POSType, type WarehouseType } from '../stores/hospiStore';
import { useBusinessRulesStore } from '../stores/businessRulesStore';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function HospiSettings() {
  const {
    companies,
    sites,
    posList,
    warehouses,
    products,
    posProductPrices,
    stockLevels,
    recipes,
    recipeItems,
    productionBatches,
    suppliers,
    purchaseOrders,
    purchaseOrderLines,
    supplierReceipts,
    rooms,
    guests,
    stays,
    folios,
    folioLines,
    customerAccounts,
    customerLedgerEntries,
    addPOS,
    updatePOS,
    deletePOS,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addProduct,
    updateProduct,
    deleteProduct,
    upsertPOSProductPrice,
    deletePOSProductPrice,
    upsertRecipe,
    addRecipeItem,
    recordProduction,
    getCustomerAccountBalance,
    settleCustomerAccount,
  } = useHospiStore();
  const { auditLogs } = useBusinessRulesStore();
  const [configPanel, setConfigPanel] = useState<'pos' | 'warehouse' | 'product' | 'price' | 'recipe'>('pos');
  const [editingPOSId, setEditingPOSId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsSiteId, setSettingsSiteId] = useState('all');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'inactive' | 'stockable' | 'recipes'>('all');
  const [newPOS, setNewPOS] = useState({
    siteId: sites[0]?.id || 'site-dakar',
    name: '',
    type: 'restaurant' as POSType,
    warehouseId: warehouses[0]?.id || '',
    paymentMethods: 'especes,wave,orange_money,carte,room_charge',
    printers: '',
    terminals: '',
    taxProfile: 'TVA 18%',
  });
  const [newWarehouse, setNewWarehouse] = useState({
    siteId: sites[0]?.id || 'site-dakar',
    name: '',
    type: 'restaurant' as WarehouseType,
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'ingredient',
    unit: 'kg',
    stockable: true,
    primaryWarehouseId: warehouses[0]?.id || '',
    secondaryWarehouseId: '',
    fallbackPolicy: 'use_secondary' as 'use_secondary' | 'block_sale',
    averageCost: '',
    lotNumber: '',
    expiresAt: '',
    initialQuantity: '',
    alertThreshold: '',
  });
  const [priceForm, setPriceForm] = useState({
    posId: posList[0]?.id || '',
    productId: products[0]?.id || '',
    salePrice: '',
    taxRate: '18',
  });
  const [recipeForm, setRecipeForm] = useState({
    productId: products.find(product => !product.is_stockable)?.id || products[0]?.id || '',
    ingredientId: products.find(product => product.is_stockable)?.id || '',
    quantity: '',
    unit: 'kg',
  });
  const [productionForm, setProductionForm] = useState({
    productId: products[0]?.id || '',
    warehouseId: warehouses[0]?.id || '',
    quantity: '',
  });
  const normalizedSearch = settingsSearch.trim().toLowerCase();
  const matchesSearch = (values: Array<string | undefined>) => !normalizedSearch || values.some(value => value?.toLowerCase().includes(normalizedSearch));
  const visiblePOS = useMemo(() => posList.filter(pos => {
    const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
    return (settingsSiteId === 'all' || pos.site_id === settingsSiteId)
      && matchesSearch([pos.name, pos.type, warehouse?.name, pos.tax_profile]);
  }), [normalizedSearch, posList, settingsSiteId, warehouses]);
  const visibleWarehouses = useMemo(() => warehouses.filter(warehouse =>
    (settingsSiteId === 'all' || warehouse.site_id === settingsSiteId)
    && matchesSearch([warehouse.name, warehouse.type])
  ), [normalizedSearch, settingsSiteId, warehouses]);
  const visibleProducts = useMemo(() => products.filter(product => {
    const productStock = stockLevels
      .filter(level => level.product_id === product.id)
      .reduce((sum, level) => sum + level.quantity, 0);
    const productHasRecipe = recipes.some(recipe => recipe.product_id === product.id);
    const filterMatch = productFilter === 'all'
      || (productFilter === 'active' && product.is_active)
      || (productFilter === 'inactive' && !product.is_active)
      || (productFilter === 'stockable' && product.is_stockable && productStock > 0)
      || (productFilter === 'recipes' && productHasRecipe);
    return filterMatch && matchesSearch([product.name, product.sku, product.category_id, product.unit]);
  }), [normalizedSearch, productFilter, products, recipes, stockLevels]);

  const handleCreatePOS = () => {
    if (!newPOS.name || !newPOS.warehouseId) return;
    const payload = {
      site_id: newPOS.siteId,
      name: newPOS.name,
      type: newPOS.type,
      default_warehouse_id: newPOS.warehouseId,
      is_active: true,
      payment_methods: newPOS.paymentMethods.split(',').map(item => item.trim()).filter(Boolean),
      printer_names: newPOS.printers.split(',').map(item => item.trim()).filter(Boolean),
      terminal_names: newPOS.terminals.split(',').map(item => item.trim()).filter(Boolean),
      tax_profile: newPOS.taxProfile,
    };
    if (editingPOSId) {
      updatePOS(editingPOSId, payload);
      setEditingPOSId(null);
    } else {
      addPOS(payload);
    }
    setNewPOS(prev => ({ ...prev, name: '', printers: '', terminals: '' }));
  };

  const handleCreateWarehouse = () => {
    if (!newWarehouse.name) return;
    const payload = {
      site_id: newWarehouse.siteId,
      name: newWarehouse.name,
      type: newWarehouse.type,
      is_active: true,
    };
    if (editingWarehouseId) {
      updateWarehouse(editingWarehouseId, payload);
      setEditingWarehouseId(null);
    } else {
      addWarehouse(payload);
    }
    setNewWarehouse(prev => ({ ...prev, name: '' }));
  };

  const startEditPOS = (posId: string) => {
    const pos = posList.find(item => item.id === posId);
    if (!pos) return;
    setConfigPanel('pos');
    setEditingPOSId(pos.id);
    setNewPOS({
      siteId: pos.site_id,
      name: pos.name,
      type: pos.type,
      warehouseId: pos.default_warehouse_id,
      paymentMethods: pos.payment_methods.join(','),
      printers: pos.printer_names?.join(',') || '',
      terminals: pos.terminal_names?.join(',') || '',
      taxProfile: pos.tax_profile || 'TVA 18%',
    });
  };

  const startEditWarehouse = (warehouseId: string) => {
    const warehouse = warehouses.find(item => item.id === warehouseId);
    if (!warehouse) return;
    setConfigPanel('warehouse');
    setEditingWarehouseId(warehouse.id);
    setNewWarehouse({
      siteId: warehouse.site_id,
      name: warehouse.name,
      type: warehouse.type,
    });
  };

  const cancelEdit = () => {
    setEditingPOSId(null);
    setEditingWarehouseId(null);
    setEditingProductId(null);
    setEditingPriceId(null);
    setNewPOS(prev => ({ ...prev, name: '', printers: '', terminals: '' }));
    setNewWarehouse(prev => ({ ...prev, name: '' }));
    resetProductForm();
    resetPriceForm();
  };

  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.sku) return;
    const payload = {
      company_id: companies[0]?.id || 'comp-sartal-demo',
      name: newProduct.name,
      sku: newProduct.sku,
      category_id: newProduct.category,
      unit: newProduct.unit,
      is_stockable: newProduct.stockable,
      is_active: true,
      primary_warehouse_id: newProduct.primaryWarehouseId || undefined,
      secondary_warehouse_id: newProduct.secondaryWarehouseId || undefined,
      fallback_policy: newProduct.fallbackPolicy,
      average_purchase_price: Number(newProduct.averageCost) || 0,
      lot_number: newProduct.lotNumber || undefined,
      expires_at: newProduct.expiresAt ? new Date(newProduct.expiresAt).toISOString() : undefined,
    };
    if (editingProductId) {
      updateProduct(editingProductId, payload);
      setEditingProductId(null);
    } else {
      addProduct({
        ...payload,
        initial_warehouse_id: newProduct.primaryWarehouseId || undefined,
        initial_quantity: Number(newProduct.initialQuantity) || 0,
        alert_threshold: Number(newProduct.alertThreshold) || 0,
      });
    }
    setNewProduct(prev => ({ ...prev, name: '', sku: '', averageCost: '', lotNumber: '', expiresAt: '', initialQuantity: '', alertThreshold: '' }));
  };

  const startEditProduct = (productId: string) => {
    const product = products.find(item => item.id === productId);
    if (!product) return;
    setConfigPanel('product');
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      sku: product.sku,
      category: product.category_id,
      unit: product.unit,
      stockable: product.is_stockable,
      primaryWarehouseId: product.primary_warehouse_id || warehouses[0]?.id || '',
      secondaryWarehouseId: product.secondary_warehouse_id || '',
      fallbackPolicy: product.fallback_policy || 'use_secondary',
      averageCost: String(product.average_purchase_price || ''),
      lotNumber: product.lot_number || '',
      expiresAt: product.expires_at ? product.expires_at.slice(0, 10) : '',
      initialQuantity: '',
      alertThreshold: '',
    });
  };

  const startEditPrice = (priceId: string) => {
    const price = posProductPrices.find(item => item.id === priceId);
    if (!price) return;
    setConfigPanel('price');
    setEditingPriceId(price.id);
    setPriceForm({
      posId: price.pos_id,
      productId: price.product_id,
      salePrice: String(price.sale_price),
      taxRate: String(price.tax_rate),
    });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProduct(prev => ({ ...prev, name: '', sku: '', averageCost: '', lotNumber: '', expiresAt: '', initialQuantity: '', alertThreshold: '' }));
  };

  const resetPriceForm = () => {
    setEditingPriceId(null);
    setPriceForm(prev => ({ ...prev, salePrice: '' }));
  };

  const handleSavePrice = () => {
    if (!priceForm.posId || !priceForm.productId || !priceForm.salePrice) return;
    upsertPOSProductPrice({
      pos_id: priceForm.posId,
      product_id: priceForm.productId,
      sale_price: Number(priceForm.salePrice),
      tax_rate: Number(priceForm.taxRate) || 0,
      is_available: true,
    });
    setEditingPriceId(null);
    setPriceForm(prev => ({ ...prev, salePrice: '' }));
  };

  const handleAddRecipeLine = () => {
    if (!recipeForm.productId || !recipeForm.ingredientId || !recipeForm.quantity) return;
    const product = products.find(item => item.id === recipeForm.productId);
    const recipe = upsertRecipe(recipeForm.productId, product ? `Recette ${product.name}` : undefined);
    addRecipeItem({
      recipe_id: recipe.id,
      ingredient_product_id: recipeForm.ingredientId,
      quantity: Number(recipeForm.quantity),
      unit: recipeForm.unit,
    });
    setRecipeForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleRecordProduction = () => {
    if (!productionForm.productId || !productionForm.warehouseId || !productionForm.quantity) return;
    recordProduction(productionForm.productId, productionForm.warehouseId, Number(productionForm.quantity), 'Admin');
    setProductionForm(prev => ({ ...prev, quantity: '' }));
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="mb-6">
        <h1 className="text-white font-black text-2xl">Administration Hospi</h1>
        <p className="text-text-secondary text-xs uppercase tracking-widest font-bold mt-1">RestauOS Hospitality ERP</p>
      </div>

      <div className="glass-card-lg p-5 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-orange/10 text-orange flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-white font-black text-sm">{companies[0]?.name}</h2>
            <p className="text-text-tertiary text-xs">{sites.length} site(s) • {companies[0]?.currency}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">POS</p>
            <p className="text-white font-black">{posList.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p>
            <p className="text-white font-black">{warehouses.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Chambres</p>
            <p className="text-white font-black">{rooms.length}</p>
          </div>
        </div>
      </div>

      <section className="glass-card-lg p-4 mb-5">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={settingsSearch}
            onChange={event => setSettingsSearch(event.target.value)}
            placeholder="Rechercher POS, dépôt, produit, SKU..."
            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-11 pr-4 text-white text-sm outline-none placeholder:text-text-tertiary"
          />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
          <select
            value={settingsSiteId}
            onChange={event => setSettingsSiteId(event.target.value)}
            className="h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none"
          >
            <option value="all">Tous les sites</option>
            {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setSettingsSearch(''); setSettingsSiteId('all'); setProductFilter('all'); }}
            className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-xs font-black"
          >
            Reset
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {([
            ['all', 'Tous'],
            ['active', 'Actifs'],
            ['stockable', 'Avec stock'],
            ['recipes', 'Recettes'],
            ['inactive', 'Inactifs'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setProductFilter(key)}
              className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${productFilter === key ? 'bg-blue text-white' : 'bg-white/5 text-text-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">POS visibles</p>
            <p className="text-white font-black">{visiblePOS.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p>
            <p className="text-white font-black">{visibleWarehouses.length}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-text-tertiary text-[9px] font-black uppercase">Produits</p>
            <p className="text-white font-black">{visibleProducts.length}</p>
          </div>
        </div>
      </section>

      <section className="glass-card-lg p-5 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-white font-black text-sm flex items-center gap-2"><Plus size={16} className="text-orange" /> Configuration rapide</h3>
            <p className="text-text-secondary text-xs mt-1">Créer les éléments clés sans modifier le code.</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            ['pos', 'POS'],
            ['warehouse', 'Dépôt'],
            ['product', 'Produit'],
            ['price', 'Prix POS'],
            ['recipe', 'Recette'],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setConfigPanel(key as any)}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${configPanel === key ? 'bg-orange text-white' : 'bg-white/5 text-text-secondary'}`}>
              {label}
            </button>
          ))}
        </div>

        {configPanel === 'pos' && (
          <div className="space-y-3">
            <input value={newPOS.name} onChange={e => setNewPOS(p => ({ ...p, name: e.target.value }))} placeholder="Nom du point de vente"
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newPOS.siteId} onChange={e => setNewPOS(p => ({ ...p, siteId: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
              <select value={newPOS.type} onChange={e => setNewPOS(p => ({ ...p, type: e.target.value as POSType }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {['restaurant', 'bar', 'nightclub', 'casino', 'room_service', 'spa', 'boutique', 'other'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <select value={newPOS.warehouseId} onChange={e => setNewPOS(p => ({ ...p, warehouseId: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {warehouses.filter(warehouse => warehouse.site_id === newPOS.siteId).map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <input value={newPOS.paymentMethods} onChange={e => setNewPOS(p => ({ ...p, paymentMethods: e.target.value }))} placeholder="Moyens de paiement"
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={newPOS.printers} onChange={e => setNewPOS(p => ({ ...p, printers: e.target.value }))} placeholder="Imprimantes"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <input value={newPOS.terminals} onChange={e => setNewPOS(p => ({ ...p, terminals: e.target.value }))} placeholder="Terminaux"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={handleCreatePOS} className="py-3 rounded-2xl bg-orange text-white font-black text-sm">
                {editingPOSId ? 'Enregistrer le POS' : 'Créer le POS'}
              </button>
              {editingPOSId && (
                <button type="button" onClick={cancelEdit} className="w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {configPanel === 'warehouse' && (
          <div className="space-y-3">
            <input value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))} placeholder="Nom du dépôt"
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newWarehouse.siteId} onChange={e => setNewWarehouse(p => ({ ...p, siteId: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
              <select value={newWarehouse.type} onChange={e => setNewWarehouse(p => ({ ...p, type: e.target.value as WarehouseType }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {['restaurant', 'bar', 'kitchen', 'cold_room', 'central', 'casino', 'boutique', 'other'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={handleCreateWarehouse} className="py-3 rounded-2xl bg-green text-white font-black text-sm">
                {editingWarehouseId ? 'Enregistrer le dépôt' : 'Créer le dépôt'}
              </button>
              {editingWarehouseId && (
                <button type="button" onClick={cancelEdit} className="w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {configPanel === 'product' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="Nom produit / ingrédient"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} placeholder="SKU"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} placeholder="Catégorie"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <select value={newProduct.unit} onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {['kg', 'g', 'L', 'ml', 'unité', 'bouteille', 'portion'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={newProduct.primaryWarehouseId} onChange={e => setNewProduct(p => ({ ...p, primaryWarehouseId: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
              <select value={newProduct.secondaryWarehouseId} onChange={e => setNewProduct(p => ({ ...p, secondaryWarehouseId: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                <option value="">Aucun dépôt secondaire</option>
                {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" value={newProduct.averageCost} onChange={e => setNewProduct(p => ({ ...p, averageCost: e.target.value }))} placeholder="Prix achat moyen"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <input type="number" value={newProduct.initialQuantity} onChange={e => setNewProduct(p => ({ ...p, initialQuantity: e.target.value }))} placeholder="Stock initial"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <input type="number" value={newProduct.alertThreshold} onChange={e => setNewProduct(p => ({ ...p, alertThreshold: e.target.value }))} placeholder="Seuil"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={handleCreateProduct} className="py-3 rounded-2xl bg-blue text-white font-black text-sm">
                {editingProductId ? 'Enregistrer le produit' : 'Créer le produit'}
              </button>
              {editingProductId && (
                <button type="button" onClick={cancelEdit} className="w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {configPanel === 'price' && (
          <div className="space-y-3">
            <select value={priceForm.posId} onChange={e => setPriceForm(p => ({ ...p, posId: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {posList.map(pos => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
            </select>
            <select value={priceForm.productId} onChange={e => setPriceForm(p => ({ ...p, productId: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={priceForm.salePrice} onChange={e => setPriceForm(p => ({ ...p, salePrice: e.target.value }))} placeholder="Prix de vente"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
              <input type="number" value={priceForm.taxRate} onChange={e => setPriceForm(p => ({ ...p, taxRate: e.target.value }))} placeholder="TVA"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={handleSavePrice} className="py-3 rounded-2xl bg-violet text-white font-black text-sm">
                {editingPriceId ? 'Enregistrer le prix' : 'Enregistrer le prix POS'}
              </button>
              {editingPriceId && (
                <button type="button" onClick={cancelEdit} className="w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {configPanel === 'recipe' && (
          <div className="space-y-3">
            <select value={recipeForm.productId} onChange={e => setRecipeForm(p => ({ ...p, productId: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {products.filter(product => !product.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={recipeForm.ingredientId} onChange={e => {
                const ingredient = products.find(product => product.id === e.target.value);
                setRecipeForm(p => ({ ...p, ingredientId: e.target.value, unit: ingredient?.unit || p.unit }));
              }}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {products.filter(product => product.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
              <input type="number" value={recipeForm.quantity} onChange={e => setRecipeForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantité"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <select value={recipeForm.unit} onChange={e => setRecipeForm(p => ({ ...p, unit: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {['kg', 'g', 'L', 'ml', 'unité', 'bouteille', 'portion'].map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
            <button type="button" onClick={handleAddRecipeLine} className="w-full py-3 rounded-2xl bg-orange text-white font-black text-sm">Ajouter à la recette</button>
          </div>
        )}
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Building2 size={16} className="text-orange" /> Sites</h3>
        <div className="space-y-3">
          {sites.map(site => {
            const siteWarehouses = warehouses.filter(warehouse => warehouse.site_id === site.id);
            const sitePOS = posList.filter(pos => pos.site_id === site.id);
            return (
              <div key={site.id} className="glass-card p-4">
                <p className="text-white font-black text-sm">{site.name}</p>
                <p className="text-text-tertiary text-[10px]">{site.city} • {site.address}</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">POS</p>
                    <p className="text-white font-black">{sitePOS.length}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p>
                    <p className="text-white font-black">{siteWarehouses.length}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Store size={16} className="text-blue" /> Points de vente</h3>
        <div className="space-y-3">
          {visiblePOS.map(pos => {
            const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
            const prices = posProductPrices.filter(price => price.pos_id === pos.id);
            return (
              <motion.div key={pos.id} layout className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-sm">{pos.name}</p>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{pos.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green/10 text-green">{pos.is_active ? 'Actif' : 'Inactif'}</span>
                    <button type="button" onClick={() => startEditPOS(pos.id)} className="w-8 h-8 rounded-xl bg-white/5 text-blue flex items-center justify-center">
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePOS(pos.id)}
                      className="w-8 h-8 rounded-xl bg-red/10 text-red flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-text-secondary text-xs mb-3">Dépôt de sortie : <span className="text-white font-bold">{warehouse?.name}</span></p>
                <div className="space-y-2">
                  {prices.map(price => {
                    const product = products.find(item => item.id === price.product_id);
                    return (
                      <div key={price.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <span className="text-text-secondary text-xs truncate">{product?.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-orange font-black text-xs">{fmt(price.sale_price)} F</span>
                          <button type="button" onClick={() => startEditPrice(price.id)} className="w-7 h-7 rounded-lg bg-white/5 text-blue flex items-center justify-center">
                            <Edit2 size={12} />
                          </button>
                          <button type="button" onClick={() => deletePOSProductPrice(price.id)} className="w-7 h-7 rounded-lg bg-red/10 text-red flex items-center justify-center">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          {visiblePOS.length === 0 && <p className="text-text-tertiary text-sm text-center py-8">Aucun point de vente ne correspond aux filtres.</p>}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><ReceiptText size={16} className="text-violet" /> Catalogue produits</h3>
        <div className="space-y-3">
          {visibleProducts.map(product => {
            const productPrices = posProductPrices.filter(price => price.product_id === product.id);
            const productStock = stockLevels
              .filter(level => level.product_id === product.id)
              .reduce((sum, level) => sum + level.quantity, 0);
            return (
              <motion.div key={product.id} layout className={`glass-card p-4 ${!product.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm truncate">{product.name}</p>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{product.sku} • {product.category_id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => startEditProduct(product.id)} className="w-8 h-8 rounded-xl bg-white/5 text-blue flex items-center justify-center">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => deleteProduct(product.id)} className="w-8 h-8 rounded-xl bg-red/10 text-red flex items-center justify-center">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Unité</p>
                    <p className="text-white font-black text-xs">{product.unit}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Stock</p>
                    <p className="text-white font-black text-xs">{fmt(productStock)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Tarifs POS</p>
                    <p className="text-white font-black text-xs">{productPrices.length}</p>
                  </div>
                </div>
                {!product.is_active && <p className="text-red text-[10px] font-black uppercase tracking-widest mt-3">Produit désactivé</p>}
              </motion.div>
            );
          })}
          {visibleProducts.length === 0 && <p className="text-text-tertiary text-sm text-center py-8">Aucun produit ne correspond aux filtres.</p>}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Warehouse size={16} className="text-green" /> Dépôts & stocks</h3>
        <div className="space-y-3">
          {visibleWarehouses.map(warehouse => {
            const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
            return (
              <div key={warehouse.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-white font-black text-sm">{warehouse.name}</p>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{warehouse.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEditWarehouse(warehouse.id)} className="w-8 h-8 rounded-xl bg-white/5 text-blue flex items-center justify-center">
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWarehouse(warehouse.id)}
                      className="w-8 h-8 rounded-xl bg-red/10 text-red flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {levels.map(level => {
                  const product = products.find(item => item.id === level.product_id);
                  return (
                    <div key={level.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{product?.name}</span>
                      <span className="text-white font-bold">{level.quantity} {level.unit}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {visibleWarehouses.length === 0 && <p className="text-text-tertiary text-sm text-center py-8">Aucun dépôt ne correspond aux filtres.</p>}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><ChefHat size={16} className="text-orange" /> Recettes & production</h3>
        <div className="glass-card p-4 mb-3">
          <p className="text-white font-black text-sm mb-3">Déclarer une production</p>
          <div className="space-y-3">
            <select value={productionForm.productId} onChange={e => setProductionForm(p => ({ ...p, productId: e.target.value }))}
              className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
              {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select value={productionForm.warehouseId} onChange={e => setProductionForm(p => ({ ...p, warehouseId: e.target.value }))}
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
              <input type="number" value={productionForm.quantity} onChange={e => setProductionForm(p => ({ ...p, quantity: e.target.value }))} placeholder="Quantité produite"
                className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
            </div>
            <button type="button" onClick={handleRecordProduction} className="w-full py-3 rounded-2xl bg-green text-white font-black text-sm">Enregistrer la production</button>
          </div>
        </div>
        <div className="space-y-3">
          {recipes.map(recipe => {
            const product = products.find(item => item.id === recipe.product_id);
            const items = recipeItems.filter(item => item.recipe_id === recipe.id);
            return (
              <div key={recipe.id} className="glass-card p-4">
                <p className="text-white font-black text-sm mb-2">{product?.name || recipe.name}</p>
                <div className="space-y-1">
                  {items.map(item => {
                    const ingredient = products.find(productItem => productItem.id === item.ingredient_product_id);
                    return (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-text-secondary">{ingredient?.name}</span>
                        <span className="text-white font-bold">{item.quantity} {item.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {productionBatches.slice(0, 3).map(batch => {
            const product = products.find(item => item.id === batch.product_id);
            const warehouse = warehouses.find(item => item.id === batch.warehouse_id);
            return (
              <div key={batch.id} className="glass-card p-4 flex justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">{product?.name}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {new Date(batch.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-green font-black text-sm">+{batch.quantity}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Truck size={16} className="text-blue" /> Achats fournisseurs</h3>
        <div className="space-y-3">
          {purchaseOrders.map(order => {
            const supplier = suppliers.find(item => item.id === order.supplier_id);
            const warehouse = warehouses.find(item => item.id === order.warehouse_id);
            const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
            const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
            return (
              <div key={order.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-sm">{supplier?.name}</p>
                    <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {fmt(total)} F</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                    {order.status}
                  </span>
                </div>
                {lines.map(line => {
                  const product = products.find(item => item.id === line.product_id);
                  return (
                    <div key={line.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{product?.name}</span>
                      <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {supplierReceipts.slice(0, 3).map(receipt => {
            const order = purchaseOrders.find(item => item.id === receipt.purchase_order_id);
            const supplier = order ? suppliers.find(item => item.id === order.supplier_id) : undefined;
            const warehouse = warehouses.find(item => item.id === receipt.warehouse_id);
            return (
              <div key={receipt.id} className="glass-card p-4 flex justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">Réception {supplier?.name}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {new Date(receipt.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-green font-black text-sm">{fmt(receipt.total_cost)} F</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><BedDouble size={16} className="text-cyan-400" /> PMS simplifié</h3>
        <div className="space-y-3">
          {rooms.map(room => {
            const stay = stays.find(item => item.room_id === room.id && item.status === 'checked_in');
            const guest = stay ? guests.find(item => item.id === stay.guest_id) : undefined;
            const folio = stay ? folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
            const lines = folio ? folioLines.filter(line => line.folio_id === folio.id) : [];
            return (
              <div key={room.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-black text-sm">Chambre {room.room_number}</p>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${room.status === 'occupied' ? 'bg-blue/10 text-blue' : 'bg-green/10 text-green'}`}>{room.status}</span>
                </div>
                {guest && <p className="text-text-secondary text-xs">{guest.first_name} {guest.last_name}</p>}
                {folio && (
                  <div className="mt-3 rounded-xl bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-tertiary text-[10px] font-black uppercase flex items-center gap-1"><ReceiptText size={12} /> Folio ouvert</span>
                      <span className="text-white font-black text-sm">{fmt(folio.total_amount)} F</span>
                    </div>
                    {lines.map(line => (
                      <div key={line.id} className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">{line.description}</span>
                        <span className="text-cyan-300 font-bold">{fmt(line.amount)} F</span>
                      </div>
                    ))}
                    {lines.length === 0 && <p className="text-text-tertiary text-[10px]">Aucune consommation imputée.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><Users size={16} className="text-green" /> Comptes clients</h3>
        <div className="space-y-3">
          {customerAccounts.map(account => {
            const guest = account.hotel_guest_id ? guests.find(item => item.id === account.hotel_guest_id) : undefined;
            const entries = customerLedgerEntries.filter(entry => entry.account_id === account.id);
            const balance = getCustomerAccountBalance(account.id);
            const availableCredit = account.credit_limit - balance;
            return (
              <div key={account.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-white font-black text-sm">{account.display_name}</p>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">
                      {account.type} {guest ? `• Chambre liée` : '• Compte direct'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${balance > account.credit_limit ? 'bg-red/10 text-red' : 'bg-green/10 text-green'}`}>
                    {account.is_active ? 'Actif' : 'Bloqué'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Solde</p>
                    <p className="text-white font-black text-sm">{fmt(balance)} F</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Limite</p>
                    <p className="text-white font-black text-sm">{fmt(account.credit_limit)} F</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-text-tertiary text-[9px] font-black uppercase">Disponible</p>
                    <p className={`font-black text-sm ${availableCredit < 0 ? 'text-red' : 'text-green'}`}>{fmt(availableCredit)} F</p>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {entries.slice(0, 3).map(entry => (
                    <div key={entry.id} className="flex justify-between text-[10px]">
                      <span className="text-text-secondary">{entry.description}</span>
                      <span className={entry.debit > 0 ? 'text-orange font-bold' : 'text-green font-bold'}>
                        {entry.debit > 0 ? '+' : '-'}{fmt(entry.debit || entry.credit)} F
                      </span>
                    </div>
                  ))}
                  {entries.length === 0 && <p className="text-text-tertiary text-[10px]">Aucun mouvement client pour le moment.</p>}
                </div>

                {balance > 0 && (
                  <button
                    type="button"
                    onClick={() => settleCustomerAccount(account.id, balance, 'especes', 'Admin')}
                    className="w-full h-10 rounded-xl bg-green/10 text-green font-black text-xs flex items-center justify-center gap-2"
                  >
                    <CreditCard size={14} />
                    Encaisser le solde
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-white font-black text-sm mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-orange" /> Journal d’audit</h3>
        <div className="space-y-3">
          {auditLogs.slice(0, 10).map(log => (
            <div key={log.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-black text-sm">
                    {log.action === 'discount' ? 'Remise' :
                      log.action === 'cancel_order' ? 'Annulation ticket' :
                      log.action === 'stock_transfer' ? 'Transfert stock' :
                      log.action === 'inventory_adjustment' ? 'Inventaire' :
                      log.action === 'stock_loss' ? 'Perte stock' :
                      log.action === 'cash_close' ? 'Clôture caisse' :
                      log.action}
                  </p>
                  <p className="text-text-tertiary text-[10px]">{log.actorName} • {log.actorRole}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${log.managerApprovalRequired ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                  {log.managerApprovalRequired ? 'Manager' : 'Autorisé'}
                </span>
              </div>
              <p className="text-text-secondary text-xs">{log.reason}</p>
              <div className="flex justify-between text-[10px] text-text-tertiary mt-2">
                <span>{log.targetType} #{log.targetId.slice(-4)}</span>
                <span>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="glass-card p-6 text-center text-text-tertiary text-sm">
              Aucune action sensible journalisée pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
