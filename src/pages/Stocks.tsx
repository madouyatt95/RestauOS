import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockStore } from '../stores/stockStore';
import { useHospiStore } from '../stores/hospiStore';
import { useAuthStore } from '../stores/authStore';
import { useBusinessRulesStore } from '../stores/businessRulesStore';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Package, Settings, Warehouse, Truck, Activity, CreditCard, X, Store, ReceiptText, Download, ShieldCheck, ClipboardCheck, Printer, ChefHat, Scale, Boxes, RefreshCcw, Ban, CircleDollarSign, BookmarkCheck, Gift } from 'lucide-react';

const purchaseStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  ordered: 'Commandée',
  partially_received: 'Réception partielle',
  received: 'Réceptionnée',
  cancelled: 'Annulée',
};

const stockMovementLabels: Record<string, string> = {
  sale: 'Vente POS',
  recipe_consumption: 'Recette',
  production: 'Production',
  purchase: 'Réception fournisseur',
  transfer_out: 'Transfert sorti',
  transfer_in: 'Transfert reçu',
  inventory_adjustment: 'Correction inventaire',
  loss: 'Perte',
  reservation: 'Réservation',
  internal_consumption: 'Conso interne',
};

type StockTab = 'pilotage' | 'moteur' | 'reappro' | 'depots' | 'achats' | 'inventaire-guide' | 'mouvements' | 'pertes' | 'inventaire' | 'entrees' | 'sorties';
type StockStatusFilter = 'all' | 'ok' | 'alert' | 'rupture';

export default function Stocks() {
  const { items, movements, addMovement, addItem } = useStockStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    sites,
    posList,
    warehouses,
    products,
    stockLevels,
    stockMovements,
    stockLots,
    recipes,
    recipeItems,
    productionBatches,
    productVariants,
    unitConversions,
    stockReservations,
    internalConsumptions,
    stockPolicy,
    suppliers,
    purchaseOrders,
    purchaseOrderLines,
    supplierReceipts,
    transferStock,
    adjustInventory,
    recordLoss,
    addPurchaseOrder,
    updatePurchaseOrder,
    receivePurchaseOrderLines,
    receivePurchaseOrder,
    updateStockThreshold,
    getPriceForProduct
  } = useHospiStore();
  const { canPerform, requiresManagerApproval, recordAudit } = useBusinessRulesStore();
  const [tab, setTab] = useState<StockTab>('pilotage');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showMove, setShowMove] = useState<{ type: 'entree' | 'sortie'; itemId: string } | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || 'site-dakar');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('all');
  const [movementFilter, setMovementFilter] = useState('all');
  const [movementFrom, setMovementFrom] = useState('');
  const [movementTo, setMovementTo] = useState('');
  const [inventoryWarehouseId, setInventoryWarehouseId] = useState(warehouses[0]?.id || '');
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, string>>({});
  const [stockNotice, setStockNotice] = useState<string | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editingPurchaseOrderId, setEditingPurchaseOrderId] = useState<string | null>(null);
  const [receivingPurchaseOrderId, setReceivingPurchaseOrderId] = useState<string | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, string>>({});
  const [thresholdEdits, setThresholdEdits] = useState<Record<string, string>>({});
  const [moveQty, setMoveQty] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'kg', minStock: '', category: '' });
  const [transferForm, setTransferForm] = useState({ productId: 'prod-coca-33', fromWarehouseId: 'wh-central', toWarehouseId: 'wh-restaurant', quantity: '', reason: 'Réassort dépôt' });
  const [adjustForm, setAdjustForm] = useState({ productId: 'prod-coca-33', warehouseId: 'wh-restaurant', countedQuantity: '', reason: 'Inventaire physique' });
  const [lossForm, setLossForm] = useState({ productId: 'ing-steak', warehouseId: 'wh-dakar-viandes', quantity: '', reason: 'Erreur cuisine' });
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: suppliers[0]?.id || '',
    warehouseId: warehouses[0]?.id || '',
    expectedAt: '',
    lines: [
      { productId: products[0]?.id || '', quantity: '1', unitCost: String(products[0]?.average_purchase_price || 0), lotNumber: '', expiresAt: '' },
    ],
  });

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMoves = movements.filter(m =>
    tab === 'entrees' ? m.type === 'entree' : tab === 'sorties' ? m.type === 'sortie' : true
  );
  const siteWarehouses = warehouses.filter(warehouse => warehouse.site_id === selectedSiteId);
  const selectedSite = sites.find(site => site.id === selectedSiteId) || sites[0];
  const siteStockLevels = stockLevels.filter(level => {
    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
    return warehouse?.site_id === selectedSiteId;
  });
  const lowHospiStocks = siteStockLevels.filter(level => level.quantity <= level.alert_threshold);
  const pendingPurchaseOrders = purchaseOrders.filter(order => order.status !== 'received' && order.status !== 'cancelled');
  const siteStockMovements = stockMovements.filter(move => warehouses.find(warehouse => warehouse.id === move.warehouse_id)?.site_id === selectedSiteId);
  const todayMovements = siteStockMovements.filter(move => new Date(move.created_at).toDateString() === new Date().toDateString());
  const stockValue = siteStockLevels.reduce((sum, level) => {
    const product = products.find(item => item.id === level.product_id);
    return sum + level.quantity * (product?.average_purchase_price || 0);
  }, 0);
  const stockProducts = useMemo(() => products
    .map(product => {
      const levels = siteStockLevels.filter(level => level.product_id === product.id);
      const total = levels.reduce((sum, level) => sum + level.quantity, 0);
      const low = levels.some(level => level.quantity <= level.alert_threshold);
      const locations = levels
        .map(level => warehouses.find(warehouse => warehouse.id === level.warehouse_id)?.name)
        .filter(Boolean) as string[];
      return { product, levels, total, low, locations };
    })
    .filter(row => row.levels.length > 0)
    .filter(row => warehouseFilter === 'all' || row.levels.some(level => level.warehouse_id === warehouseFilter))
    .filter(row => familyFilter === 'all' || row.product.category_id === familyFilter)
    .filter(row => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'rupture') return row.levels.some(level => level.quantity <= 0);
      if (statusFilter === 'alert') return row.low;
      return !row.low;
    })
    .filter(row => !search.trim() || [row.product.name, row.product.sku, row.product.category_id, row.locations.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase())),
    [products, search, siteStockLevels, warehouses, warehouseFilter, familyFilter, statusFilter]
  );
  const families = Array.from(new Set(products.map(product => product.category_id))).filter(Boolean);
  const filteredSiteStockMovements = siteStockMovements
    .filter(move => movementFilter === 'all' || move.movement_type === movementFilter)
    .filter(move => !movementFrom || new Date(move.created_at) >= new Date(movementFrom))
    .filter(move => !movementTo || new Date(move.created_at) <= new Date(`${movementTo}T23:59:59`));
  const replenishmentRows = lowHospiStocks.map(level => {
    const product = products.find(item => item.id === level.product_id);
    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
    const preferredSupplier = suppliers.find(item => product?.supplier_ids?.includes(item.id)) || suppliers[0];
    const suggestedQuantity = Math.max(level.alert_threshold * 2 - level.quantity, level.alert_threshold || 1);
    return { level, product, warehouse, preferredSupplier, suggestedQuantity };
  }).filter(row => row.product && row.warehouse);
  const selectedWarehouse = selectedWarehouseId ? warehouses.find(warehouse => warehouse.id === selectedWarehouseId) : undefined;
  const selectedWarehouseLevels = selectedWarehouse ? stockLevels.filter(level => level.warehouse_id === selectedWarehouse.id) : [];
  const selectedWarehouseValue = selectedWarehouseLevels.reduce((sum, level) => {
    const product = products.find(item => item.id === level.product_id);
    return sum + level.quantity * (product?.average_purchase_price || 0);
  }, 0);
  const selectedWarehousePOS = selectedWarehouse ? posList.filter(pos => pos.default_warehouse_id === selectedWarehouse.id) : [];
  const selectedWarehouseMovements = selectedWarehouse ? stockMovements.filter(move => move.warehouse_id === selectedWarehouse.id).slice(0, 8) : [];
  const guidedInventoryLevels = stockLevels.filter(level => level.warehouse_id === inventoryWarehouseId);
  const unlinkedWarehouses = siteWarehouses.filter(warehouse => !posList.some(pos => pos.default_warehouse_id === warehouse.id));
  const posStockGaps = posList.flatMap(pos => products
    .filter(product => getPriceForProduct(product.id, pos.id)?.is_available)
    .filter(product => product.is_stockable && !stockLevels.some(level => level.product_id === product.id && level.warehouse_id === pos.default_warehouse_id))
    .map(product => ({ pos, product }))
  );
  const smartAlerts = [
    ...unlinkedWarehouses.map(warehouse => ({
      id: `warehouse-${warehouse.id}`,
      title: `${warehouse.name} n'est lié à aucun POS`,
      detail: 'Ce dépôt existe mais aucune vente ne le déstocke automatiquement.',
      tone: 'orange',
    })),
    ...posStockGaps.slice(0, 5).map(item => ({
      id: `gap-${item.pos.id}-${item.product.id}`,
      title: `${item.product.name} vendu sans stock local`,
      detail: `${item.pos.name} vend ce produit mais son dépôt n'a aucune ligne de stock.`,
      tone: 'red',
    })),
  ];
  const selectedStockProduct = selectedProductId ? products.find(product => product.id === selectedProductId) : undefined;
  const selectedProductLevels = selectedStockProduct
    ? stockLevels.filter(level => level.product_id === selectedStockProduct.id)
    : [];
  const selectedProductMovements = selectedStockProduct
    ? stockMovements.filter(move => move.product_id === selectedStockProduct.id).slice(0, 8)
    : [];
  const selectedProductPOS = selectedStockProduct
    ? posList.filter(pos => {
      const price = getPriceForProduct(selectedStockProduct.id, pos.id);
      return price?.is_available;
    })
    : [];
  const selectedProductValue = selectedProductLevels.reduce((sum, level) => sum + level.quantity * (selectedStockProduct?.average_purchase_price || 0), 0);
  const selectedProductLots = selectedStockProduct
    ? stockLots.filter(lot => lot.product_id === selectedStockProduct.id && lot.quantity > 0)
      .sort((a, b) => new Date(a.expires_at || a.received_at).getTime() - new Date(b.expires_at || b.received_at).getTime())
    : [];
  const recipeProducts = products.filter(product => recipes.some(recipe => recipe.product_id === product.id));
  const autoTransferSuggestions = replenishmentRows.flatMap(row => {
    if (!row.product || !row.warehouse) return [];
    const donor = stockLevels
      .filter(level => level.product_id === row.product?.id && level.warehouse_id !== row.warehouse?.id && level.quantity > row.suggestedQuantity)
      .map(level => ({ level, warehouse: warehouses.find(item => item.id === level.warehouse_id) }))
      .find(item => item.warehouse);
    return donor ? [{ ...row, donor }] : [];
  });
  const theoreticalGaps = siteStockLevels
    .map(level => {
      const product = products.find(item => item.id === level.product_id);
      const reserved = stockReservations
        .filter(item => item.product_id === level.product_id && item.warehouse_id === level.warehouse_id && item.status === 'reserved')
        .reduce((sum, item) => sum + item.quantity, 0);
      return { level, product, available: level.quantity - reserved, reserved };
    })
    .filter(item => item.reserved > 0 || item.level.quantity <= item.level.alert_threshold);
  const getRecipeCost = (productId: string) => {
    const recipe = recipes.find(item => item.product_id === productId);
    if (!recipe) return products.find(item => item.id === productId)?.average_purchase_price || 0;
    return recipeItems
      .filter(item => item.recipe_id === recipe.id)
      .reduce((sum, item) => {
        const ingredient = products.find(product => product.id === item.ingredient_product_id);
        return sum + item.quantity * (ingredient?.average_purchase_price || 0);
      }, 0);
  };
  const stockEngineCards = [
    { title: 'Recettes', value: `${recipeProducts.length} recette(s)`, detail: 'Les plats déstockent leurs ingrédients, pas seulement le plat vendu.', icon: ChefHat, tone: 'orange', action: () => navigate('/settings') },
    { title: 'Variantes', value: `${productVariants.length} variante(s)`, detail: 'Suppléments, doubles doses et options peuvent changer prix et consommation.', icon: ReceiptText, tone: 'blue', action: () => navigate('/settings') },
    { title: 'Conversions', value: `${unitConversions.length} règle(s)`, detail: 'Carton, sac, bidon ou kg sont convertis vers l’unité réellement vendue.', icon: Scale, tone: 'green', action: () => navigate('/settings') },
    { title: 'Préparations', value: `${productionBatches.length || 1} production(s)`, detail: 'Sauces, jus maison et préparations peuvent devenir du stock disponible.', icon: Boxes, tone: 'purple', action: () => navigate('/settings') },
    { title: 'Transferts auto', value: `${autoTransferSuggestions.length} suggestion(s)`, detail: 'Le système repère les dépôts donneurs quand un autre dépôt manque.', icon: RefreshCcw, tone: 'blue', action: () => setShowTransfer(true) },
    { title: 'Réservations', value: `${stockReservations.filter(item => item.status === 'reserved').length} active(s)`, detail: 'Room service, banquet ou préparation peuvent réserver avant consommation.', icon: BookmarkCheck, tone: 'orange', action: () => setTab('mouvements') },
    { title: 'Stock négatif', value: stockPolicy.allow_negative_stock ? 'Autorisé' : 'Bloqué', detail: 'Paramètre métier pour empêcher une vente impossible sur le terrain.', icon: Ban, tone: stockPolicy.allow_negative_stock ? 'orange' : 'green', action: () => navigate('/settings') },
    { title: 'Coût réel', value: `${recipeProducts.length} calcul(s)`, detail: 'Les coûts d’achat alimentent coût recette, marge brute et alertes.', icon: CircleDollarSign, tone: 'green', action: () => setTab('pilotage') },
    { title: 'Inventaires tournants', value: `${families.length} famille(s)`, detail: 'Contrôler boissons aujourd’hui, cuisine demain, spa vendredi.', icon: ClipboardCheck, tone: 'purple', action: () => setTab('inventaire-guide') },
    { title: 'Théorique / réel', value: `${theoreticalGaps.length} écart(s)`, detail: 'Compare le stock système, le réservé, le disponible et les seuils.', icon: Activity, tone: 'orange', action: () => setTab('inventaire-guide') },
    { title: 'Conso internes', value: `${internalConsumptions.length} trace(s)`, detail: 'Personnel, offert, VIP, direction, casino, room service et mini-bar sont tracés.', icon: Gift, tone: 'blue', action: () => setTab('pertes') },
    { title: 'Règles par POS', value: `${posList.length} POS`, detail: 'Prix, TVA, dépôt, caisse, imprimante, rapport Z et serveur restent liés au POS.', icon: Store, tone: 'green', action: () => navigate('/settings') },
  ];
  const canManageStock = user?.role === 'Admin' || user?.role === 'Gérant';
  const canTransferStock = canManageStock || canPerform(user, 'stock_transfer', 1);
  const canAdjustStock = canManageStock || canPerform(user, 'inventory_adjustment', 1);
  const canDeclareLoss = canManageStock || canPerform(user, 'stock_loss', 1);

  const handleMove = () => {
    if (!showMove || !moveQty) return;
    const item = items.find(i => i.id === showMove.itemId);
    if (!item) return;
    addMovement({
      itemId: showMove.itemId,
      itemName: item.name,
      type: showMove.type,
      quantity: Number(moveQty),
      date: new Date().toISOString(),
      note: moveNote || (showMove.type === 'entree' ? 'Réapprovisionnement' : 'Consommation cuisine'),
    });
    setShowMove(null);
    setMoveQty('');
    setMoveNote('');
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.quantity) return;
    addItem({
      name: newItem.name,
      quantity: Number(newItem.quantity),
      unit: newItem.unit,
      minStock: Number(newItem.minStock) || 5,
      category: newItem.category || 'Divers',
    });
    setNewItem({ name: '', quantity: '', unit: 'kg', minStock: '', category: '' });
    setShowAdd(false);
  };

  const handleTransfer = () => {
    if (!transferForm.productId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.quantity) return;
    const quantity = Number(transferForm.quantity);
    const needsApproval = requiresManagerApproval(user, 'stock_transfer', quantity);
    if (!canPerform(user, 'stock_transfer', quantity) && needsApproval) {
      setStockNotice('Action bloquée : ce profil ne peut pas transférer ce stock sans validation manager.');
      return;
    }
    const movements = transferStock(
      transferForm.productId,
      transferForm.fromWarehouseId,
      transferForm.toWarehouseId,
      quantity,
      transferForm.reason || 'Transfert inter-dépôts',
      user?.name || 'Système'
    );
    if (movements.length > 0 && user) {
      recordAudit({
        action: 'stock_transfer',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movements[0].reference_id,
        amount: quantity,
        reason: transferForm.reason || 'Transfert inter-dépôts',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowTransfer(false);
    setTransferForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleAdjustment = () => {
    if (!adjustForm.productId || !adjustForm.warehouseId || !adjustForm.countedQuantity) return;
    const countedQuantity = Number(adjustForm.countedQuantity);
    const needsApproval = requiresManagerApproval(user, 'inventory_adjustment', countedQuantity);
    if (!canPerform(user, 'inventory_adjustment', countedQuantity) && needsApproval) {
      setStockNotice('Action bloquée : correction inventaire réservée à un profil autorisé.');
      return;
    }
    const movement = adjustInventory(
      adjustForm.productId,
      adjustForm.warehouseId,
      countedQuantity,
      adjustForm.reason || 'Inventaire physique',
      user?.name || 'Système'
    );
    if (movement && user) {
      recordAudit({
        action: 'inventory_adjustment',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movement.id,
        amount: countedQuantity,
        reason: adjustForm.reason || 'Inventaire physique',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowAdjustment(false);
    setAdjustForm(prev => ({ ...prev, countedQuantity: '' }));
  };

  const handleLoss = () => {
    if (!lossForm.productId || !lossForm.warehouseId || !lossForm.quantity) return;
    const quantity = Number(lossForm.quantity);
    const needsApproval = requiresManagerApproval(user, 'stock_loss', quantity);
    if (!canPerform(user, 'stock_loss', quantity) && needsApproval) {
      setStockNotice('Action bloquée : déclaration de perte sensible réservée à un profil autorisé.');
      return;
    }
    const movement = recordLoss(
      lossForm.productId,
      lossForm.warehouseId,
      quantity,
      lossForm.reason || 'Perte déclarée',
      user?.name || 'Système'
    );
    if (movement && user) {
      recordAudit({
        action: 'stock_loss',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetType: 'stock',
        targetId: movement.id,
        amount: quantity,
        reason: lossForm.reason || 'Perte déclarée',
        managerApprovalRequired: needsApproval,
      });
    }
    setShowLoss(false);
    setLossForm(prev => ({ ...prev, quantity: '' }));
  };

  const handleReceivePurchase = (purchaseOrderId: string) => {
    receivePurchaseOrder(purchaseOrderId, user?.name || 'Système');
  };

  const resetPurchaseForm = () => {
    setEditingPurchaseOrderId(null);
    setPurchaseForm({
      supplierId: suppliers[0]?.id || '',
      warehouseId: warehouses[0]?.id || '',
      expectedAt: '',
      lines: [{ productId: products[0]?.id || '', quantity: '1', unitCost: String(products[0]?.average_purchase_price || 0), lotNumber: '', expiresAt: '' }],
    });
  };

  const startEditPurchaseOrder = (purchaseOrderId: string) => {
    const order = purchaseOrders.find(item => item.id === purchaseOrderId);
    if (!order) return;
    const lines = purchaseOrderLines.filter(line => line.purchase_order_id === purchaseOrderId);
    setEditingPurchaseOrderId(purchaseOrderId);
    setPurchaseForm({
      supplierId: order.supplier_id,
      warehouseId: order.warehouse_id,
      expectedAt: order.expected_at ? order.expected_at.slice(0, 10) : '',
      lines: lines.map(line => ({
        productId: line.product_id,
        quantity: String(line.quantity_ordered),
        unitCost: String(line.unit_cost),
        lotNumber: line.lot_number || '',
        expiresAt: line.expires_at ? line.expires_at.slice(0, 10) : '',
      })),
    });
    setShowPurchaseForm(true);
    setTab('achats');
  };

  const savePurchaseOrder = () => {
    if (!canManageStock) {
      setStockNotice('Action bloquée : seules la direction et l’administration peuvent créer ou modifier une commande fournisseur.');
      return;
    }
    const lines = purchaseForm.lines
      .filter(line => line.productId && Number(line.quantity) > 0)
      .map(line => ({
        product_id: line.productId,
        quantity_ordered: Number(line.quantity),
        unit_cost: Number(line.unitCost) || 0,
        lot_number: line.lotNumber || undefined,
        expires_at: line.expiresAt ? new Date(line.expiresAt).toISOString() : undefined,
      }));
    const payload = {
      supplier_id: purchaseForm.supplierId,
      warehouse_id: purchaseForm.warehouseId,
      expected_at: purchaseForm.expectedAt ? new Date(purchaseForm.expectedAt).toISOString() : undefined,
      lines,
    };
    const order = editingPurchaseOrderId
      ? updatePurchaseOrder(editingPurchaseOrderId, payload)
      : addPurchaseOrder({ ...payload, ordered_by: user?.name || 'Système' });
    if (order) {
      setStockNotice(editingPurchaseOrderId ? 'Commande fournisseur modifiée.' : 'Commande fournisseur créée.');
      setShowPurchaseForm(false);
      resetPurchaseForm();
    }
  };

  const startReceivePurchaseOrder = (purchaseOrderId: string) => {
    const lines = purchaseOrderLines.filter(line => line.purchase_order_id === purchaseOrderId);
    setReceivingPurchaseOrderId(purchaseOrderId);
    setReceiptQuantities(Object.fromEntries(lines.map(line => [line.id, String(Math.max(0, line.quantity_ordered - line.quantity_received))])));
  };

  const savePartialReceipt = () => {
    if (!receivingPurchaseOrderId) return;
    const quantities = Object.fromEntries(Object.entries(receiptQuantities).map(([key, value]) => [key, Number(value) || 0]));
    const receipt = receivePurchaseOrderLines(receivingPurchaseOrderId, user?.name || 'Système', quantities);
    if (receipt) {
      setStockNotice('Réception fournisseur enregistrée.');
      setReceivingPurchaseOrderId(null);
      setReceiptQuantities({});
    }
  };

  const saveThreshold = (productId: string, warehouseId: string, fallback: number) => {
    const value = Number(thresholdEdits[`${productId}-${warehouseId}`] ?? fallback);
    const updated = updateStockThreshold(productId, warehouseId, value);
    if (updated) setStockNotice('Seuil de stock mis à jour.');
  };

  const handleCreateReorder = (productId: string, warehouseId: string, supplierId: string, quantity: number, unitCost: number) => {
    const order = addPurchaseOrder({
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      ordered_by: user?.name || 'Système',
      expected_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      lines: [{ product_id: productId, quantity_ordered: quantity, unit_cost: unitCost }],
    });
    if (order) {
      setStockNotice('Commande fournisseur créée. Elle est disponible dans Achats.');
      setTab('achats');
    }
  };

  const handleGuidedInventory = () => {
    const changed = guidedInventoryLevels.filter(level => {
      const raw = inventoryCounts[level.id];
      return raw !== undefined && raw !== '' && Number(raw) !== level.quantity;
    });
    changed.forEach(level => {
      const counted = Number(inventoryCounts[level.id]);
      const movement = adjustInventory(level.product_id, level.warehouse_id, counted, 'Inventaire guidé', user?.name || 'Système');
      if (movement && user) {
        recordAudit({
          action: 'inventory_adjustment',
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          targetType: 'stock',
          targetId: movement.id,
          amount: Math.abs(counted - level.quantity),
          reason: 'Inventaire guidé',
          managerApprovalRequired: requiresManagerApproval(user, 'inventory_adjustment', Math.abs(counted - level.quantity)),
        });
      }
    });
    setInventoryCounts({});
    setStockNotice(`${changed.length} correction(s) d'inventaire enregistrée(s).`);
  };

  const exportRows = (filename: string, rows: string[][]) => {
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportInventory = () => {
    exportRows('inventaire-stock.csv', [
      ['Site', 'Dépôt', 'Produit', 'SKU', 'Famille', 'Quantité', 'Unité', 'Seuil', 'Valeur estimée'],
      ...siteStockLevels.map(level => {
        const warehouse = warehouses.find(item => item.id === level.warehouse_id);
        const product = products.find(item => item.id === level.product_id);
        return [
          selectedSite?.name || '',
          warehouse?.name || '',
          product?.name || level.product_id,
          product?.sku || '',
          product?.category_id || '',
          String(level.quantity),
          level.unit,
          String(level.alert_threshold),
          String(level.quantity * (product?.average_purchase_price || 0)),
        ];
      }),
    ]);
  };

  const exportLosses = () => {
    exportRows('pertes-stock.csv', [
      ['Date', 'Produit', 'Dépôt', 'Quantité', 'Motif', 'Utilisateur'],
      ...stockMovements.filter(move => move.movement_type === 'loss').map(move => {
        const product = products.find(item => item.id === move.product_id);
        const warehouse = warehouses.find(item => item.id === move.warehouse_id);
        return [
          new Date(move.created_at).toLocaleString('fr-FR'),
          product?.name || move.product_id,
          warehouse?.name || '',
          String(move.quantity),
          move.reason,
          move.created_by || '',
        ];
      }),
    ]);
  };

  const printInventory = () => {
    const rows = siteStockLevels.map(level => {
      const warehouse = warehouses.find(item => item.id === level.warehouse_id);
      const product = products.find(item => item.id === level.product_id);
      return `<tr><td>${warehouse?.name || ''}</td><td>${product?.name || level.product_id}</td><td>${level.quantity} ${level.unit}</td><td>${level.alert_threshold}</td><td>${(level.quantity * (product?.average_purchase_price || 0)).toLocaleString('fr-FR')} F</td></tr>`;
    }).join('');
    const printable = window.open('', '_blank');
    printable?.document.write(`
      <html><head><title>Inventaire ${selectedSite?.name || ''}</title>
      <style>body{font-family:Arial;padding:24px;color:#111}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}</style></head>
      <body><h1>Inventaire stock</h1><p>${selectedSite?.name || ''} - ${new Date().toLocaleDateString('fr-FR')}</p>
      <table><thead><tr><th>Dépôt</th><th>Produit</th><th>Quantité</th><th>Seuil</th><th>Valeur</th></tr></thead><tbody>${rows}</tbody></table></body></html>
    `);
    printable?.document.close();
    printable?.print();
  };

  const getStockBadge = (item: typeof items[0]) => {
    if (item.quantity <= item.minStock * 0.5) return { label: 'Stock faible', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };
    if (item.quantity <= item.minStock) return { label: 'Stock faible', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };
    return { label: 'En stock', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };
  };

  return (
    <div className="page-content pt-14 pb-28">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-white">Stocks & dépôts</h1>
          <p className="text-text-tertiary text-xs mt-1">Piloter le stock réel du complexe, par dépôt et par point de vente.</p>
        </div>
        <div className="flex gap-2">
          <button className="w-9 h-9 glass-card flex items-center justify-center rounded-full">
            <AlertTriangle size={16} className="text-orange" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
        {([
          ['pilotage', 'Pilotage'],
          ['moteur', 'Moteur métier'],
          ['reappro', 'Réappro'],
          ['depots', 'Dépôts'],
          ['achats', 'Achats'],
          ['inventaire-guide', 'Inventaire'],
          ['mouvements', 'Mouvements'],
          ['pertes', 'Pertes'],
          ['inventaire', 'Ancien stock'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === key
              ? 'bg-orange text-white shadow-[0_4px_16px_rgba(255,138,0,0.3)]'
              : 'glass-card text-text-secondary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input type="text" placeholder="Rechercher un produit ou un article..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-card text-sm text-white placeholder-text-tertiary bg-transparent border-none" />
      </div>

      {stockNotice && (
        <button type="button" onClick={() => setStockNotice(null)} className="w-full text-left rounded-2xl bg-green/10 border border-green/20 text-green text-xs font-bold px-4 py-3 mb-4">
          {stockNotice}
        </button>
      )}

      <div className="glass-card-lg p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Site actif</p>
            <h2 className="text-white font-black text-base">{selectedSite?.name || 'Site principal'}</h2>
            <p className="text-text-secondary text-xs mt-1">{siteWarehouses.length} dépôts • {lowHospiStocks.length} alerte(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold outline-none">
              {sites.map(site => <option key={site.id} value={site.id} className="bg-[#111827]">{site.name}</option>)}
            </select>
            <button onClick={() => navigate('/settings')} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-secondary flex items-center justify-center" title="Modifier ou supprimer un dépôt">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}
          className="h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none">
          <option value="all">Tous les dépôts</option>
          {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StockStatusFilter)}
          className="h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none">
          <option value="all">Tous statuts</option>
          <option value="alert">En alerte</option>
          <option value="rupture">En rupture</option>
          <option value="ok">Stock OK</option>
        </select>
        <select value={familyFilter} onChange={e => setFamilyFilter(e.target.value)}
          className="h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none">
          <option value="all">Toutes familles</option>
          {families.map(family => <option key={family} value={family}>{family}</option>)}
        </select>
        <button type="button" onClick={() => { setWarehouseFilter('all'); setStatusFilter('all'); setFamilyFilter('all'); setMovementFilter('all'); }} className="h-11 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-xs font-black">
          Réinitialiser
        </button>
      </div>

      {tab === 'pilotage' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Valeur stock', value: `${stockValue.toLocaleString('fr-FR')} F`, sub: 'au coût moyen', icon: CreditCard, color: '#22C55E' },
              { label: 'Alertes', value: lowHospiStocks.length, sub: 'références à traiter', icon: AlertTriangle, color: '#F59E0B' },
              { label: 'Dépôts', value: siteWarehouses.length, sub: 'sur le site actif', icon: Warehouse, color: '#3B82F6' },
              { label: 'Mouvements jour', value: todayMovements.length, sub: 'ventes, transferts, pertes', icon: Activity, color: '#8B5CF6' },
            ].map(card => (
              <div key={card.label} className="glass-card p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${card.color}20`, color: card.color }}>
                  <card.icon size={18} />
                </div>
                <p className="text-text-tertiary text-[9px] font-black uppercase tracking-widest">{card.label}</p>
                <p className="text-white font-black text-lg mt-1">{card.value}</p>
                <p className="text-text-secondary text-[10px] mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowTransfer(true)} className="py-3 rounded-2xl bg-blue/10 border border-blue/20 text-blue font-black text-[10px] uppercase tracking-widest">
              Transférer
            </button>
            <button onClick={() => setShowAdjustment(true)} className="py-3 rounded-2xl bg-orange/10 border border-orange/20 text-orange font-black text-[10px] uppercase tracking-widest">
              Inventaire
            </button>
            <button onClick={() => setShowLoss(true)} className="py-3 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-[10px] uppercase tracking-widest">
              Perte
            </button>
          </div>

          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">À traiter maintenant</h3>
                <p className="text-text-secondary text-xs">{pendingPurchaseOrders.length} réception(s) fournisseur • {lowHospiStocks.length} alerte(s) stock</p>
              </div>
              <button type="button" onClick={() => setTab('achats')} className="text-blue text-xs font-black">
                Achats
              </button>
            </div>
            <div className="space-y-2">
              {lowHospiStocks.slice(0, 5).map(level => {
                const product = products.find(item => item.id === level.product_id);
                const warehouse = warehouses.find(item => item.id === level.warehouse_id);
                return (
                  <div key={level.id} className="rounded-xl bg-orange/10 border border-orange/15 px-3 py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                      <p className="text-text-secondary text-[10px]">{warehouse?.name} • seuil {level.alert_threshold} {level.unit}</p>
                    </div>
                    <span className="text-orange font-black text-xs">{level.quantity} {level.unit}</span>
                  </div>
                );
              })}
              {pendingPurchaseOrders.slice(0, 3).map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                return (
                  <button key={order.id} type="button" onClick={() => setTab('achats')} className="w-full rounded-xl bg-green/10 border border-green/15 px-3 py-2 flex items-center justify-between gap-3 text-left">
                    <div>
                      <p className="text-white font-bold text-xs">{supplier?.name || 'Fournisseur'}</p>
                      <p className="text-text-secondary text-[10px]">À réceptionner vers {warehouse?.name}</p>
                    </div>
                    <Truck size={16} className="text-green" />
                  </button>
                );
              })}
              {lowHospiStocks.length === 0 && pendingPurchaseOrders.length === 0 && (
                <p className="text-text-tertiary text-xs text-center py-5">Rien d’urgent sur ce site.</p>
              )}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Alertes intelligentes</h3>
            <div className="space-y-2">
              {smartAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`rounded-xl px-3 py-2 border ${alert.tone === 'red' ? 'bg-red/10 border-red/15' : 'bg-orange/10 border-orange/15'}`}>
                  <p className="text-white font-bold text-xs">{alert.title}</p>
                  <p className="text-text-secondary text-[10px] mt-0.5">{alert.detail}</p>
                </div>
              ))}
              {smartAlerts.length === 0 && <p className="text-text-tertiary text-xs text-center py-5">Aucune anomalie détectée.</p>}
            </div>
          </section>

          <section className="glass-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue/10 text-blue flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm">Permissions stock</h3>
                <p className="text-text-secondary text-xs mt-1">
                  {user?.role === 'Admin' || user?.role === 'Gérant'
                    ? 'Vous pouvez transférer, corriger, déclarer des pertes et configurer les dépôts.'
                    : 'Les transferts, pertes et corrections sensibles peuvent demander validation manager.'}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={exportInventory} className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs flex items-center justify-center gap-2">
              <Download size={15} /> Inventaire
            </button>
            <button type="button" onClick={exportLosses} className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs flex items-center justify-center gap-2">
              <Download size={15} /> Pertes
            </button>
            <button type="button" onClick={printInventory} className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs flex items-center justify-center gap-2">
              <Printer size={15} /> PDF
            </button>
          </div>

          <section className="glass-card-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-black text-sm">Catalogue multi-dépôts</h3>
              <button type="button" onClick={() => setTab('depots')} className="text-blue text-xs font-black">Détails</button>
            </div>
            <div className="space-y-2">
              {stockProducts.slice(0, 8).map(row => (
                <button key={row.product.id} type="button" onClick={() => setSelectedProductId(row.product.id)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-left active:scale-[0.99] transition-transform">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs truncate">{row.product.name}</p>
                      <p className="text-text-tertiary text-[10px] truncate">{row.locations.join(' • ')}</p>
                    </div>
                    <span className={`font-black text-xs ${row.low ? 'text-orange' : 'text-green'}`}>{row.total} {row.product.unit}</span>
                  </div>
                </button>
              ))}
              {stockProducts.length === 0 && (
                <p className="text-text-tertiary text-xs text-center py-5">Aucun produit trouvé.</p>
              )}
            </div>
          </section>
        </div>
      ) : tab === 'moteur' ? (
        <div className="space-y-4">
          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Moteur métier du stock</h3>
                <p className="text-text-secondary text-xs mt-1">La logique terrain qui relie produit, POS, dépôt, recette, coût, folio et rapport de caisse.</p>
              </div>
              <ShieldCheck size={20} className="text-green" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {stockEngineCards.map(card => {
                const Icon = card.icon;
                const color = card.tone === 'green' ? '#22C55E' : card.tone === 'blue' ? '#3B82F6' : card.tone === 'purple' ? '#8B5CF6' : '#F59E0B';
                return (
                  <button key={card.title} type="button" onClick={card.action} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-left active:scale-[0.99] transition-transform">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}1F`, color }}>
                        <Icon size={18} />
                      </div>
                      <span className="text-white font-black text-[11px]">{card.value}</span>
                    </div>
                    <p className="text-white font-black text-xs">{card.title}</p>
                    <p className="text-text-secondary text-[10px] leading-relaxed mt-1">{card.detail}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Exemple réel : même produit, règles différentes</h3>
            <div className="space-y-2">
              {posList.filter(pos => getPriceForProduct('prod-coca-33', pos.id)).slice(0, 5).map(pos => {
                const price = getPriceForProduct('prod-coca-33', pos.id);
                const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
                const stock = stockLevels.find(level => level.product_id === 'prod-coca-33' && level.warehouse_id === pos.default_warehouse_id);
                return (
                  <div key={pos.id} className="rounded-xl bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate">{pos.name}</p>
                        <p className="text-text-tertiary text-[10px] truncate">{warehouse?.name} • {pos.tax_profile} • {pos.printer_names?.[0] || 'Imprimante POS'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-green font-black text-xs">{price?.sale_price.toLocaleString('fr-FR')} F</p>
                        <p className="text-text-tertiary text-[10px]">{stock?.quantity ?? 0} en stock</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Recettes, coûts et marges</h3>
            <div className="space-y-2">
              {recipeProducts.map(product => {
                const cost = getRecipeCost(product.id);
                const prices = posList
                  .map(pos => ({ pos, price: getPriceForProduct(product.id, pos.id) }))
                  .filter(item => item.price);
                return (
                  <div key={product.id} className="rounded-xl bg-white/5 px-3 py-2">
                    <p className="text-white font-bold text-xs">{product.name}</p>
                    <p className="text-text-tertiary text-[10px] mt-0.5">Coût recette estimé : {Math.round(cost).toLocaleString('fr-FR')} F</p>
                    <div className="mt-2 space-y-1">
                      {prices.map(({ pos, price }) => (
                        <div key={pos.id} className="flex justify-between text-[10px]">
                          <span className="text-text-secondary">{pos.name}</span>
                          <span className="text-green font-black">
                            marge {Math.max(0, (price?.sale_price || 0) - cost).toLocaleString('fr-FR')} F
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {recipeProducts.length === 0 && <p className="text-text-tertiary text-xs text-center py-5">Aucune recette configurée.</p>}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Conversions fournisseur → terrain</h3>
            <div className="space-y-2">
              {unitConversions.map(conversion => {
                const product = products.find(item => item.id === conversion.product_id);
                return (
                  <div key={conversion.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || conversion.product_id}</p>
                      <p className="text-text-tertiary text-[10px]">{conversion.example}</p>
                    </div>
                    <span className="text-blue font-black text-xs">x{conversion.factor}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Réservé, réel, interne</h3>
            <div className="space-y-2">
              {stockReservations.filter(item => item.status === 'reserved').map(reservation => {
                const product = products.find(item => item.id === reservation.product_id);
                const warehouse = warehouses.find(item => item.id === reservation.warehouse_id);
                return (
                  <div key={reservation.id} className="rounded-xl bg-orange/10 border border-orange/15 px-3 py-2">
                    <p className="text-white font-bold text-xs">{product?.name} réservé</p>
                    <p className="text-text-secondary text-[10px]">{reservation.quantity} • {warehouse?.name} • {reservation.source_label}</p>
                  </div>
                );
              })}
              {internalConsumptions.map(consumption => {
                const product = products.find(item => item.id === consumption.product_id);
                const warehouse = warehouses.find(item => item.id === consumption.warehouse_id);
                return (
                  <div key={consumption.id} className="rounded-xl bg-blue/10 border border-blue/15 px-3 py-2">
                    <p className="text-white font-bold text-xs">{product?.name} sorti en interne</p>
                    <p className="text-text-secondary text-[10px]">{consumption.quantity} • {warehouse?.name} • {consumption.reason}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : tab === 'reappro' ? (
        <div className="space-y-4">
          <section className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-1">Réapprovisionnement conseillé</h3>
            <p className="text-text-secondary text-xs mb-4">Produits sous seuil, quantité conseillée et fournisseur proposé.</p>
            <div className="space-y-3">
              {replenishmentRows.map(row => (
                <div key={row.level.id} className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-white font-black text-sm">{row.product?.name}</p>
                      <p className="text-text-tertiary text-[10px]">{row.warehouse?.name} • actuel {row.level.quantity} {row.level.unit} • seuil {row.level.alert_threshold}</p>
                    </div>
                    <span className="text-orange font-black text-xs">+{row.suggestedQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-text-secondary text-xs">Fournisseur : <span className="text-white font-bold">{row.preferredSupplier?.name || 'À définir'}</span></p>
                    <button
                      type="button"
                      disabled={!row.preferredSupplier || !row.product || !row.warehouse}
                      onClick={() => row.product && row.warehouse && row.preferredSupplier && handleCreateReorder(row.product.id, row.warehouse.id, row.preferredSupplier.id, row.suggestedQuantity, row.product.average_purchase_price || 0)}
                      className="px-3 py-2 rounded-xl bg-green/10 text-green text-[10px] font-black disabled:opacity-40"
                    >
                      Commander
                    </button>
                  </div>
                </div>
              ))}
              {replenishmentRows.length === 0 && <p className="text-text-tertiary text-sm text-center py-8">Aucun réapprovisionnement urgent.</p>}
            </div>
          </section>
        </div>
      ) : tab === 'achats' ? (
        <div className="space-y-4">
          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Commandes fournisseur</h3>
                <p className="text-text-secondary text-xs">{pendingPurchaseOrders.length} commande(s) à réceptionner • {supplierReceipts.length} réception(s) enregistrée(s)</p>
              </div>
              <button
                type="button"
                onClick={() => { resetPurchaseForm(); setShowPurchaseForm(prev => !prev); }}
                aria-label="Ajouter une commande fournisseur"
                title="Ajouter une commande fournisseur"
                className="w-10 h-10 rounded-xl bg-green/10 text-green flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
            {showPurchaseForm && (
              <div className="rounded-2xl bg-white/5 p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select value={purchaseForm.supplierId} onChange={e => setPurchaseForm(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="h-11 rounded-xl bg-black/20 border border-white/10 px-3 text-white text-xs font-bold outline-none">
                    {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                  <select value={purchaseForm.warehouseId} onChange={e => setPurchaseForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="h-11 rounded-xl bg-black/20 border border-white/10 px-3 text-white text-xs font-bold outline-none">
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                  </select>
                </div>
                <input type="date" value={purchaseForm.expectedAt} onChange={e => setPurchaseForm(prev => ({ ...prev, expectedAt: e.target.value }))}
                  className="w-full h-11 rounded-xl bg-black/20 border border-white/10 px-3 text-white text-xs font-bold outline-none" />
                <div className="space-y-2">
                  {purchaseForm.lines.map((line, index) => (
                    <div key={index} className="rounded-xl bg-black/20 p-3 space-y-2">
                      <select value={line.productId} onChange={e => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.map((item, i) => i === index ? { ...item, productId: e.target.value } : item) }))}
                        className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none">
                        {products.filter(product => product.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Quantité" value={line.quantity} onChange={e => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item) }))}
                          className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
                        <input type="number" placeholder="Coût unité" value={line.unitCost} onChange={e => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.map((item, i) => i === index ? { ...item, unitCost: e.target.value } : item) }))}
                          className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
                        <input placeholder="Lot" value={line.lotNumber} onChange={e => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.map((item, i) => i === index ? { ...item, lotNumber: e.target.value } : item) }))}
                          className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
                        <input type="date" value={line.expiresAt} onChange={e => setPurchaseForm(prev => ({ ...prev, lines: prev.lines.map((item, i) => i === index ? { ...item, expiresAt: e.target.value } : item) }))}
                          className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPurchaseForm(prev => ({ ...prev, lines: [...prev.lines, { productId: products[0]?.id || '', quantity: '1', unitCost: '0', lotNumber: '', expiresAt: '' }] }))} className="py-3 rounded-xl bg-white/10 text-white text-xs font-black">
                    Ajouter ligne
                  </button>
                  <button type="button" onClick={savePurchaseOrder} className="py-3 rounded-xl bg-green text-white text-xs font-black">
                    {editingPurchaseOrderId ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {purchaseOrders.map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
                const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
                return (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-black text-sm">{supplier?.name || 'Fournisseur'}</p>
                        <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {total.toLocaleString('fr-FR')} F</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                        {purchaseStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {lines.map(line => {
                        const product = products.find(item => item.id === line.product_id);
                        return (
                          <div key={line.id} className="flex justify-between text-[10px]">
                            <span className="text-text-secondary">{product?.name}</span>
                            <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.status !== 'received' && (
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => startEditPurchaseOrder(order.id)} className="py-2.5 rounded-xl bg-blue/10 text-blue font-black text-[10px] uppercase tracking-widest">
                          Modifier
                        </button>
                        <button onClick={() => startReceivePurchaseOrder(order.id)} className="py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest">
                          Recevoir
                        </button>
                        <button onClick={() => handleReceivePurchase(order.id)} className="py-2.5 rounded-xl bg-white/5 text-white font-black text-[10px] uppercase tracking-widest">
                          Tout
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : tab === 'inventaire-guide' ? (
        <div className="space-y-4">
          <section className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-sm">Inventaire guidé</h3>
                <p className="text-text-secondary text-xs">Choisir un dépôt, compter, puis valider seulement les écarts.</p>
              </div>
              <ClipboardCheck size={20} className="text-orange" />
            </div>
            <select value={inventoryWarehouseId} onChange={e => { setInventoryWarehouseId(e.target.value); setInventoryCounts({}); }}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs font-bold outline-none mb-4">
              {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {guidedInventoryLevels.map(level => {
                const product = products.find(item => item.id === level.product_id);
                const counted = inventoryCounts[level.id] ?? '';
                const hasDiff = counted !== '' && Number(counted) !== level.quantity;
                return (
                  <div key={level.id} className={`rounded-xl px-3 py-2 border ${hasDiff ? 'bg-orange/10 border-orange/20' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-bold text-xs truncate">{product?.name || level.product_id}</p>
                        <p className="text-text-tertiary text-[10px]">Système : {level.quantity} {level.unit}</p>
                      </div>
                      <input
                        type="number"
                        value={counted}
                        onChange={e => setInventoryCounts(prev => ({ ...prev, [level.id]: e.target.value }))}
                        placeholder="Compté"
                        className="w-24 h-10 rounded-xl bg-black/20 border border-white/10 px-3 text-white text-xs font-bold outline-none"
                      />
                    </div>
                    {hasDiff && <p className="text-orange text-[10px] font-bold mt-1">Écart : {Number(counted) - level.quantity} {level.unit}</p>}
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={handleGuidedInventory} className="w-full mt-4 py-3 rounded-2xl bg-orange text-white font-black text-sm">
              Valider les écarts
            </button>
          </section>
        </div>
      ) : tab === 'mouvements' ? (
        <div className="glass-card-lg p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-white font-black text-sm">Traçabilité du stock</h3>
            <select value={movementFilter} onChange={e => setMovementFilter(e.target.value)}
              className="h-9 rounded-xl bg-white/5 border border-white/10 px-2 text-white text-[10px] font-bold outline-none">
              <option value="all">Tous</option>
              {Object.entries(stockMovementLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="date" value={movementFrom} onChange={e => setMovementFrom(e.target.value)}
              className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
            <input type="date" value={movementTo} onChange={e => setMovementTo(e.target.value)}
              className="h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-white text-xs outline-none" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredSiteStockMovements.map(move => {
              const product = products.find(item => item.id === move.product_id);
              const warehouse = warehouses.find(item => item.id === move.warehouse_id);
              const pos = move.pos_id ? posList.find(item => item.id === move.pos_id) : undefined;
              const isEntry = move.movement_type === 'production' || move.movement_type === 'purchase' || move.movement_type === 'transfer_in' || move.movement_type === 'inventory_adjustment';
              return (
                <div key={move.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                    <p className="text-text-tertiary text-[10px]">{stockMovementLabels[move.movement_type] || move.movement_type} • {pos?.name || 'Back-office'} • {warehouse?.name}</p>
                  </div>
                  <span className={`${isEntry ? 'text-green' : 'text-red'} font-black text-xs`}>
                    {isEntry ? '+' : '-'}{move.quantity}
                  </span>
                </div>
              );
            })}
            {filteredSiteStockMovements.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucun mouvement pour ce filtre.</p>}
          </div>
        </div>
      ) : tab === 'depots' ? (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <p className="text-white font-black text-sm mb-2">Que voulez-vous faire ?</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
              <div className="rounded-xl bg-white/5 p-3">Voir les quantités disponibles dans chaque dépôt.</div>
              <div className="rounded-xl bg-white/5 p-3">Réceptionner une commande fournisseur vers un dépôt.</div>
              <div className="rounded-xl bg-white/5 p-3">Déplacer un produit d’un dépôt vers un autre.</div>
              <div className="rounded-xl bg-white/5 p-3">Corriger un inventaire ou déclarer une perte.</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowTransfer(true)} className="py-3 rounded-2xl bg-blue/10 border border-blue/20 text-blue font-black text-[10px] uppercase tracking-widest">
              Transférer
            </button>
            <button onClick={() => setShowAdjustment(true)} className="py-3 rounded-2xl bg-orange/10 border border-orange/20 text-orange font-black text-[10px] uppercase tracking-widest">
              Corriger
            </button>
            <button onClick={() => setShowLoss(true)} className="py-3 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-[10px] uppercase tracking-widest">
              Perte
            </button>
          </div>

          <div className="glass-card-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-white font-black text-sm">Achats fournisseurs</h3>
                <p className="text-text-secondary text-xs">{suppliers.length} fournisseurs • {supplierReceipts.length} réception(s)</p>
              </div>
            </div>
            <div className="space-y-3">
              {purchaseOrders.map(order => {
                const supplier = suppliers.find(item => item.id === order.supplier_id);
                const warehouse = warehouses.find(item => item.id === order.warehouse_id);
                const lines = purchaseOrderLines.filter(line => line.purchase_order_id === order.id);
                const total = lines.reduce((sum, line) => sum + line.quantity_ordered * line.unit_cost, 0);
                return (
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-white font-black text-sm">{supplier?.name || 'Fournisseur'}</p>
                        <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {total.toLocaleString('fr-FR')} F</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${order.status === 'received' ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                        {purchaseStatusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {lines.map(line => {
                        const product = products.find(item => item.id === line.product_id);
                        return (
                          <div key={line.id} className="flex justify-between text-[10px]">
                            <span className="text-text-secondary">{product?.name}</span>
                            <span className="text-white font-bold">{line.quantity_received}/{line.quantity_ordered}</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.status !== 'received' && (
                      <button onClick={() => handleReceivePurchase(order.id)} className="w-full py-2.5 rounded-xl bg-green/10 text-green font-black text-[10px] uppercase tracking-widest">
                        Réceptionner vers dépôt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {siteWarehouses.map(warehouse => {
            const linkedPOS = posList.filter(pos => pos.default_warehouse_id === warehouse.id);
            const levels = stockLevels.filter(level => level.warehouse_id === warehouse.id);
            const lowLevels = levels.filter(level => level.quantity <= level.alert_threshold);
            return (
              <motion.div key={warehouse.id} layout className="glass-card p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black text-sm">{warehouse.name}</h3>
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest mt-1">{levels.length} référence(s) suivie(s)</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${lowLevels.length ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                      {lowLevels.length ? `${lowLevels.length} alerte(s)` : 'Stock OK'}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setSelectedWarehouseId(warehouse.id)} className="text-[10px] font-black text-green bg-green/10 px-2.5 py-1 rounded-full">
                        Détails
                      </button>
                      <button type="button" onClick={() => navigate('/settings')} className="text-[10px] font-black text-blue bg-blue/10 px-2.5 py-1 rounded-full">
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-xs mb-3">
                  Utilisé par : <span className="text-white font-bold">{linkedPOS.length ? linkedPOS.map(pos => pos.name).join(', ') : 'Aucun point de vente lié'}</span>
                </p>
                <div className="space-y-2">
                  {levels.map(level => {
                    const product = products.find(item => item.id === level.product_id);
                    const isLow = level.quantity <= level.alert_threshold;
                    return (
                      <button key={level.id} type="button" onClick={() => setSelectedProductId(level.product_id)} className="w-full flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-left active:scale-[0.99] transition-transform">
                        <div>
                          <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">{isLow ? 'À réapprovisionner' : `Seuil : ${level.alert_threshold} ${level.unit}`}</p>
                        </div>
                        <span className={`font-black text-sm ${isLow ? 'text-orange' : 'text-green'}`}>
                          {level.quantity} {level.unit}
                        </span>
                      </button>
                    );
                  })}
                  {levels.length === 0 && <p className="text-text-tertiary text-xs">Aucun stock suivi dans ce dépôt.</p>}
                </div>
              </motion.div>
            );
          })}

          <div className="glass-card-lg p-4">
            <h3 className="text-white font-black text-sm mb-3">Historique des mouvements Hospi</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stockMovements.map(move => {
                const product = products.find(item => item.id === move.product_id);
                const warehouse = warehouses.find(item => item.id === move.warehouse_id);
                const pos = move.pos_id ? posList.find(item => item.id === move.pos_id) : undefined;
                const isEntry = move.movement_type === 'production' || move.movement_type === 'purchase' || move.movement_type === 'transfer_in';
                return (
                  <div key={move.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <div>
                      <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                      <p className="text-text-tertiary text-[10px]">{stockMovementLabels[move.movement_type] || move.movement_type} • {pos?.name || 'Back-office'} • {warehouse?.name}</p>
                    </div>
                    <span className={`${isEntry ? 'text-green' : 'text-red'} font-black text-xs`}>
                      {isEntry ? '+' : '-'}{move.quantity}
                    </span>
                  </div>
                );
              })}
              {stockMovements.length === 0 && <p className="text-text-tertiary text-xs text-center py-6">Aucun mouvement Hospi pour le moment.</p>}
            </div>
          </div>
        </div>
      ) : tab === 'inventaire' ? (
        <>
          <div className="space-y-3 mb-6">
            {filtered.map(item => {
              const badge = getStockBadge(item);
              return (
                <motion.div key={item.id} layout className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-light flex items-center justify-center shrink-0">
                    <Package size={18} className="text-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{item.name}</div>
                    <div className="text-text-tertiary text-xs">{item.quantity} {item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: badge.color, background: badge.bg }}>
                      {badge.label}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setShowMove({ type: 'entree', itemId: item.id })}
                        className="w-7 h-7 rounded-lg bg-green-light flex items-center justify-center">
                        <ArrowDownCircle size={14} className="text-green" />
                      </button>
                      <button onClick={() => setShowMove({ type: 'sortie', itemId: item.id })}
                        className="w-7 h-7 rounded-lg bg-red-light flex items-center justify-center">
                        <ArrowUpCircle size={14} className="text-red" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <button onClick={() => setShowAdd(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(255,138,0,0.3)]">
            <Plus size={16} className="inline mr-2" />Nouvel inventaire
          </button>
        </>
      ) : tab === 'pertes' ? (
        <div className="space-y-4">
          <button onClick={() => setShowLoss(true)}
            className="w-full py-4 rounded-2xl bg-red/10 border border-red/20 text-red font-black text-xs uppercase tracking-widest">
            Déclarer une perte
          </button>
          {stockMovements.filter(move => move.movement_type === 'loss').map(move => {
            const product = products.find(item => item.id === move.product_id);
            const warehouse = warehouses.find(item => item.id === move.warehouse_id);
            return (
              <div key={move.id} className="glass-card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-black text-sm">{product?.name || move.product_id}</p>
                  <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {move.reason}</p>
                  <p className="text-text-tertiary text-[10px]">{new Date(move.created_at).toLocaleString('fr-FR')}</p>
                </div>
                <span className="text-red font-black text-sm">-{move.quantity}</span>
              </div>
            );
          })}
          {stockMovements.filter(move => move.movement_type === 'loss').length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-sm">Aucune perte déclarée</div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMoves.map(m => (
            <div key={m.id} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.type === 'entree' ? 'bg-green-light' : 'bg-red-light'}`}>
                {m.type === 'entree' ? <ArrowDownCircle size={18} className="text-green" /> : <ArrowUpCircle size={18} className="text-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{m.itemName}</div>
                <div className="text-text-tertiary text-[10px]">{m.note}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${m.type === 'entree' ? 'text-green' : 'text-red'}`}>
                  {m.type === 'entree' ? '+' : '-'}{m.quantity}
                </div>
                <div className="text-text-tertiary text-[10px]">{new Date(m.date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          ))}
          {filteredMoves.length === 0 && (
            <div className="text-center py-12 text-text-tertiary text-sm">Aucun mouvement</div>
          )}
        </div>
      )}

      {/* Partial Receipt Modal */}
      <AnimatePresence>
        {receivingPurchaseOrderId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setReceivingPurchaseOrderId(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Réception fournisseur</p>
                  <h3 className="text-white font-black text-lg">Quantités réellement reçues</h3>
                </div>
                <button type="button" onClick={() => setReceivingPurchaseOrderId(null)} className="w-9 h-9 rounded-xl bg-white/5 text-text-secondary flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {purchaseOrderLines.filter(line => line.purchase_order_id === receivingPurchaseOrderId).map(line => {
                  const product = products.find(item => item.id === line.product_id);
                  const remaining = Math.max(0, line.quantity_ordered - line.quantity_received);
                  return (
                    <div key={line.id} className="rounded-2xl bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="text-white font-bold text-sm">{product?.name || line.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">Restant : {remaining} • reçu : {line.quantity_received}/{line.quantity_ordered}</p>
                          {(line.lot_number || line.expires_at) && <p className="text-text-tertiary text-[10px]">Lot {line.lot_number || '-'} • exp. {line.expires_at ? new Date(line.expires_at).toLocaleDateString('fr-FR') : '-'}</p>}
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={receiptQuantities[line.id] || ''}
                          onChange={e => setReceiptQuantities(prev => ({ ...prev, [line.id]: e.target.value }))}
                          className="w-24 h-11 rounded-xl bg-black/20 border border-white/10 px-3 text-white text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={savePartialReceipt} className="w-full mt-4 py-3 rounded-2xl bg-green text-white font-black text-sm">
                Enregistrer la réception
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warehouse Detail Modal */}
      <AnimatePresence>
        {selectedWarehouse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedWarehouseId(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">Dépôt</p>
                  <h3 className="text-white font-black text-lg leading-tight mt-1">{selectedWarehouse.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">{selectedWarehouse.type} • {selectedWarehousePOS.length} POS lié(s)</p>
                </div>
                <button type="button" onClick={() => setSelectedWarehouseId(null)} className="w-9 h-9 rounded-xl bg-white/5 text-text-secondary flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">Références</p>
                  <p className="text-white font-black text-sm">{selectedWarehouseLevels.length}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">Valeur</p>
                  <p className="text-white font-black text-sm">{selectedWarehouseValue.toLocaleString('fr-FR')} F</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">Alertes</p>
                  <p className="text-white font-black text-sm">{selectedWarehouseLevels.filter(level => level.quantity <= level.alert_threshold).length}</p>
                </div>
              </div>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><Store size={15} className="text-orange" /> POS connectés</h4>
                <div className="space-y-2">
                  {selectedWarehousePOS.map(pos => (
                    <div key={pos.id} className="rounded-xl bg-white/5 px-3 py-2">
                      <p className="text-white font-bold text-xs">{pos.name}</p>
                      <p className="text-text-tertiary text-[10px]">{pos.type} • {pos.tax_profile}</p>
                    </div>
                  ))}
                  {selectedWarehousePOS.length === 0 && <p className="text-orange text-xs py-3">Aucun POS ne déstocke ce dépôt.</p>}
                </div>
              </section>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><Package size={15} className="text-blue" /> Produits du dépôt</h4>
                <div className="space-y-2">
                  {selectedWarehouseLevels.slice(0, 12).map(level => {
                    const product = products.find(item => item.id === level.product_id);
                    const isLow = level.quantity <= level.alert_threshold;
                    return (
                      <button key={level.id} type="button" onClick={() => { setSelectedWarehouseId(null); setSelectedProductId(level.product_id); }} className="w-full rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3 text-left">
                        <div>
                          <p className="text-white font-bold text-xs">{product?.name || level.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">Seuil {level.alert_threshold} {level.unit}</p>
                        </div>
                        <span className={`${isLow ? 'text-orange' : 'text-green'} font-black text-xs`}>{level.quantity} {level.unit}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><ReceiptText size={15} className="text-green" /> Derniers mouvements</h4>
                <div className="space-y-2">
                  {selectedWarehouseMovements.map(move => {
                    const product = products.find(item => item.id === move.product_id);
                    return (
                      <div key={move.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-bold text-xs">{product?.name || move.product_id}</p>
                          <p className="text-text-tertiary text-[10px]">{stockMovementLabels[move.movement_type] || move.movement_type}</p>
                        </div>
                        <span className="text-white font-black text-xs">{move.quantity}</span>
                      </div>
                    );
                  })}
                  {selectedWarehouseMovements.length === 0 && <p className="text-text-tertiary text-xs py-3">Aucun mouvement récent.</p>}
                </div>
              </section>

              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => { setTransferForm(prev => ({ ...prev, fromWarehouseId: selectedWarehouse.id })); setSelectedWarehouseId(null); setShowTransfer(true); }} className="py-3 rounded-2xl bg-blue/10 text-blue font-black text-[10px] uppercase tracking-widest">
                  Transférer
                </button>
                <button type="button" onClick={() => { setInventoryWarehouseId(selectedWarehouse.id); setSelectedWarehouseId(null); setTab('inventaire-guide'); }} className="py-3 rounded-2xl bg-orange/10 text-orange font-black text-[10px] uppercase tracking-widest">
                  Inventaire
                </button>
                <button type="button" onClick={() => navigate('/settings')} className="py-3 rounded-2xl bg-white/5 text-white font-black text-[10px] uppercase tracking-widest">
                  Régler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedStockProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedProductId(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">{selectedStockProduct.sku}</p>
                  <h3 className="text-white font-black text-lg leading-tight mt-1">{selectedStockProduct.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">{selectedStockProduct.category_id} • unité {selectedStockProduct.unit}</p>
                </div>
                <button type="button" onClick={() => setSelectedProductId(null)} className="w-9 h-9 rounded-xl bg-white/5 text-text-secondary flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">Total</p>
                  <p className="text-white font-black text-sm">{selectedProductLevels.reduce((sum, level) => sum + level.quantity, 0)} {selectedStockProduct.unit}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">Valeur</p>
                  <p className="text-white font-black text-sm">{selectedProductValue.toLocaleString('fr-FR')} F</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-text-tertiary text-[9px] font-black uppercase">POS</p>
                  <p className="text-white font-black text-sm">{selectedProductPOS.length}</p>
                </div>
              </div>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><Warehouse size={15} className="text-blue" /> Stock par dépôt</h4>
                <div className="space-y-2">
                  {selectedProductLevels.map(level => {
                    const warehouse = warehouses.find(item => item.id === level.warehouse_id);
                    const site = sites.find(item => item.id === warehouse?.site_id);
                    const isLow = level.quantity <= level.alert_threshold;
                    return (
	                      <div key={level.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
	                        <div>
	                          <p className="text-white font-bold text-xs">{warehouse?.name || 'Dépôt'}</p>
	                          <p className="text-text-tertiary text-[10px]">{site?.name} • seuil {level.alert_threshold} {level.unit}</p>
	                        </div>
	                        <div className="text-right">
	                          <span className={`font-black text-xs ${isLow ? 'text-orange' : 'text-green'}`}>{level.quantity} {level.unit}</span>
	                          <div className="flex items-center gap-1 mt-1">
	                            <input
	                              type="number"
	                              value={thresholdEdits[`${level.product_id}-${level.warehouse_id}`] ?? String(level.alert_threshold)}
	                              onChange={e => setThresholdEdits(prev => ({ ...prev, [`${level.product_id}-${level.warehouse_id}`]: e.target.value }))}
	                              className="w-16 h-7 rounded-lg bg-black/20 border border-white/10 px-2 text-white text-[10px] outline-none"
	                            />
	                            <button type="button" onClick={() => saveThreshold(level.product_id, level.warehouse_id, level.alert_threshold)} className="h-7 px-2 rounded-lg bg-blue/10 text-blue text-[9px] font-black">
	                              OK
	                            </button>
	                          </div>
	                        </div>
	                      </div>
                    );
                  })}
                  {selectedProductLevels.length === 0 && <p className="text-text-tertiary text-xs py-3">Aucun stock enregistré pour ce produit.</p>}
                </div>
	              </section>

	              <section className="mb-4">
	                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><Package size={15} className="text-blue" /> Lots & péremptions FIFO</h4>
	                <div className="space-y-2">
	                  {selectedProductLots.map(lot => {
	                    const warehouse = warehouses.find(item => item.id === lot.warehouse_id);
	                    const expiresSoon = lot.expires_at && new Date(lot.expires_at).getTime() < Date.now() + 86400000 * 30;
	                    return (
	                      <div key={lot.id} className={`rounded-xl px-3 py-2 flex items-center justify-between gap-3 ${expiresSoon ? 'bg-orange/10 border border-orange/15' : 'bg-white/5'}`}>
	                        <div>
	                          <p className="text-white font-bold text-xs">{lot.lot_number}</p>
	                          <p className="text-text-tertiary text-[10px]">{warehouse?.name} • expire {lot.expires_at ? new Date(lot.expires_at).toLocaleDateString('fr-FR') : 'non renseigné'}</p>
	                        </div>
	                        <span className="text-white font-black text-xs">{lot.quantity}</span>
	                      </div>
	                    );
	                  })}
	                  {selectedProductLots.length === 0 && <p className="text-text-tertiary text-xs py-3">Aucun lot suivi pour ce produit.</p>}
	                </div>
	              </section>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><Store size={15} className="text-orange" /> Vendu dans les POS</h4>
                <div className="space-y-2">
                  {selectedProductPOS.map(pos => {
                    const price = getPriceForProduct(selectedStockProduct.id, pos.id);
                    const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
                    return (
                      <div key={pos.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-bold text-xs">{pos.name}</p>
                          <p className="text-text-tertiary text-[10px]">Déstocke : {warehouse?.name || 'Dépôt non lié'}</p>
                        </div>
                        <span className="text-orange font-black text-xs">{(price?.sale_price || 0).toLocaleString('fr-FR')} F</span>
                      </div>
                    );
                  })}
                  {selectedProductPOS.length === 0 && <p className="text-text-tertiary text-xs py-3">Aucun prix POS actif pour ce produit.</p>}
                </div>
              </section>

              <section className="mb-4">
                <h4 className="text-white font-black text-sm mb-2 flex items-center gap-2"><ReceiptText size={15} className="text-green" /> Derniers mouvements</h4>
                <div className="space-y-2">
                  {selectedProductMovements.map(move => {
                    const warehouse = warehouses.find(item => item.id === move.warehouse_id);
                    const isEntry = move.movement_type === 'production' || move.movement_type === 'purchase' || move.movement_type === 'transfer_in' || move.movement_type === 'inventory_adjustment';
                    return (
                      <div key={move.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-white font-bold text-xs">{stockMovementLabels[move.movement_type] || move.movement_type}</p>
                          <p className="text-text-tertiary text-[10px]">{warehouse?.name} • {new Date(move.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <span className={`${isEntry ? 'text-green' : 'text-red'} font-black text-xs`}>
                          {isEntry ? '+' : '-'}{move.quantity}
                        </span>
                      </div>
                    );
                  })}
                  {selectedProductMovements.length === 0 && <p className="text-text-tertiary text-xs py-3">Aucun mouvement récent.</p>}
                </div>
              </section>

              <div className="grid grid-cols-3 gap-2">
	                <button type="button" disabled={!canTransferStock} onClick={() => { setTransferForm(prev => ({ ...prev, productId: selectedStockProduct.id })); setSelectedProductId(null); setShowTransfer(true); }} className="py-3 rounded-2xl bg-blue/10 text-blue font-black text-[10px] uppercase tracking-widest disabled:opacity-40">
	                  Transférer
	                </button>
	                <button type="button" disabled={!canAdjustStock} onClick={() => { setAdjustForm(prev => ({ ...prev, productId: selectedStockProduct.id })); setSelectedProductId(null); setShowAdjustment(true); }} className="py-3 rounded-2xl bg-orange/10 text-orange font-black text-[10px] uppercase tracking-widest disabled:opacity-40">
	                  Inventaire
	                </button>
	                <button type="button" disabled={!canDeclareLoss} onClick={() => { setLossForm(prev => ({ ...prev, productId: selectedStockProduct.id })); setSelectedProductId(null); setShowLoss(true); }} className="py-3 rounded-2xl bg-red/10 text-red font-black text-[10px] uppercase tracking-widest disabled:opacity-40">
	                  Perte
	                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Movement Modal */}
      <AnimatePresence>
        {showMove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowMove(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">
                {showMove.type === 'entree' ? '📦 Entrée de stock' : '📤 Sortie de stock'}
              </h3>
              <p className="text-text-secondary text-sm mb-4">{items.find(i => i.id === showMove.itemId)?.name}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-text-tertiary text-xs font-semibold block mb-1.5">Quantité</label>
                  <input type="number" value={moveQty} onChange={e => setMoveQty(e.target.value)}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" placeholder="10" />
                </div>
                <div>
                  <label className="text-text-tertiary text-xs font-semibold block mb-1.5">Note</label>
                  <input type="text" value={moveNote} onChange={e => setMoveNote(e.target.value)}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" placeholder="Fournisseur, cuisine..." />
                </div>
                <button onClick={handleMove}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm">
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Transfer Modal */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTransfer(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Transfert entre dépôts</h3>
              <div className="space-y-3">
                <select value={transferForm.productId} onChange={e => setTransferForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select value={transferForm.fromWarehouseId} onChange={e => setTransferForm(p => ({ ...p, fromWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    {warehouses.map(warehouse => {
                      const site = sites.find(item => item.id === warehouse.site_id);
                      return <option key={warehouse.id} value={warehouse.id}>{site?.city} • {warehouse.name}</option>;
                    })}
                  </select>
                  <select value={transferForm.toWarehouseId} onChange={e => setTransferForm(p => ({ ...p, toWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    {warehouses.map(warehouse => {
                      const site = sites.find(item => item.id === warehouse.site_id);
                      return <option key={warehouse.id} value={warehouse.id}>{site?.city} • {warehouse.name}</option>;
                    })}
                  </select>
                </div>
                <input type="number" placeholder="Quantité" value={transferForm.quantity} onChange={e => setTransferForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={transferForm.reason} onChange={e => setTransferForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleTransfer}
                  className="w-full py-3.5 rounded-2xl bg-blue text-white font-bold text-sm">
                  Valider le transfert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Adjustment Modal */}
      <AnimatePresence>
        {showAdjustment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAdjustment(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Ajustement inventaire</h3>
              <div className="space-y-3">
                <select value={adjustForm.productId} onChange={e => setAdjustForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <select value={adjustForm.warehouseId} onChange={e => setAdjustForm(p => ({ ...p, warehouseId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
                <input type="number" placeholder="Quantité comptée" value={adjustForm.countedQuantity} onChange={e => setAdjustForm(p => ({ ...p, countedQuantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={adjustForm.reason} onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleAdjustment}
                  className="w-full py-3.5 rounded-2xl bg-orange text-white font-bold text-sm">
                  Valider l’inventaire
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hospi Loss Modal */}
      <AnimatePresence>
        {showLoss && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowLoss(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Déclarer une perte</h3>
              <p className="text-text-secondary text-xs mb-4">Exemples : steak brûlé, casse bouteille, péremption, erreur cuisine.</p>
              <div className="space-y-3">
                <select value={lossForm.productId} onChange={e => setLossForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {products.filter(p => p.is_stockable).map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <select value={lossForm.warehouseId} onChange={e => setLossForm(p => ({ ...p, warehouseId: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                  {siteWarehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
                <input type="number" placeholder="Quantité perdue" value={lossForm.quantity} onChange={e => setLossForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <input type="text" placeholder="Motif" value={lossForm.reason} onChange={e => setLossForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleLoss}
                  className="w-full py-3.5 rounded-2xl bg-red text-white font-bold text-sm">
                  Valider la perte
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <h3 className="text-white font-bold text-lg mb-4">Nouvel article</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Nom de l'article" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Quantité" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                  <select value={newItem.unit} onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none">
                    <option value="kg">kg</option><option value="L">L</option><option value="pcs">pcs</option><option value="boîte">boîte</option>
                  </select>
                </div>
                <input type="number" placeholder="Stock minimum alerte" value={newItem.minStock} onChange={e => setNewItem(p => ({ ...p, minStock: e.target.value }))}
                  className="w-full px-4 py-3 glass-card text-white text-sm bg-transparent border-none" />
                <button onClick={handleAddItem}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange to-amber-600 text-white font-bold text-sm">
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
