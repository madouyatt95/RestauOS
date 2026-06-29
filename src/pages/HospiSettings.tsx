import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Building2, Store, Warehouse, BedDouble, ReceiptText, ShieldCheck, ChefHat, Truck, Users, CreditCard, Plus, Edit2, Trash2, X, Search, Network, Upload, PlayCircle, AlertTriangle, CheckCircle2, KeyRound, Settings2, Boxes, Landmark, Sparkles, History, Copy, Table2, GitCompare, Globe2, PlugZap, RotateCcw, Percent, UserCheck, Layers, PackageCheck } from 'lucide-react';
import { useHospiStore, type POSType, type WarehouseType } from '../stores/hospiStore';
import { useBusinessRulesStore } from '../stores/businessRulesStore';

const fmt = (n: number) => n.toLocaleString('fr-FR');
const warehouseTypeLabels: Record<string, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  kitchen: 'Cuisine',
  cold_room: 'Chambre froide',
  central: 'Dépôt central',
  casino: 'Casino',
  boutique: 'Boutique',
  other: 'Autre',
};

type AdminView = 'assistant' | 'architecture' | 'modules' | 'pos' | 'permissions' | 'rules' | 'health' | 'imports' | 'audit' | 'simulation' | 'drafts' | 'history' | 'duplicate' | 'packs' | 'priceMatrix' | 'permissionMatrix' | 'impact' | 'multisite' | 'connectors' | 'backup' | 'taxes' | 'approvals' | 'environments';

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
    productVariants,
    unitConversions,
    stockReservations,
    internalConsumptions,
    stockPolicy,
    configDrafts,
    configHistoryEntries,
    permissionPolicies,
    taxProfiles,
    approvalRequests,
    configSnapshots,
    adminEnvironments,
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
    createConfigDraft,
    testConfigDraft,
    publishConfigDraft,
    duplicatePOSConfig,
    createBusinessPack,
    setPermissionPolicy,
    upsertTaxProfile,
    createApprovalRequest,
    resolveApprovalRequest,
    createConfigSnapshot,
    restoreConfigSnapshot,
    getCustomerAccountBalance,
    settleCustomerAccount,
  } = useHospiStore();
  const { auditLogs } = useBusinessRulesStore();
  const [adminView, setAdminView] = useState<AdminView>('assistant');
  const [configPanel, setConfigPanel] = useState<'pos' | 'warehouse' | 'product' | 'price' | 'recipe'>('pos');
  const [editingPOSId, setEditingPOSId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsSiteId, setSettingsSiteId] = useState('all');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'inactive' | 'stockable' | 'recipes'>('all');
  const [configNotice, setConfigNotice] = useState<{ tone: 'success' | 'warning'; message: string } | null>(null);
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

  const adminViews: Array<{ key: AdminView; label: string; icon: typeof Sparkles }> = [
    { key: 'assistant', label: 'Assistant', icon: Sparkles },
    { key: 'architecture', label: 'Architecture', icon: Network },
    { key: 'modules', label: 'Modules métier', icon: Boxes },
    { key: 'pos', label: 'Centre POS', icon: Store },
    { key: 'permissions', label: 'Permissions', icon: KeyRound },
    { key: 'rules', label: 'Règles', icon: Settings2 },
    { key: 'health', label: 'Santé', icon: AlertTriangle },
    { key: 'imports', label: 'Imports', icon: Upload },
    { key: 'audit', label: 'Audit', icon: ShieldCheck },
    { key: 'simulation', label: 'Simulation', icon: PlayCircle },
    { key: 'drafts', label: 'Brouillons', icon: Layers },
    { key: 'history', label: 'Historique config', icon: History },
    { key: 'duplicate', label: 'Duplication', icon: Copy },
    { key: 'packs', label: 'Packs métier', icon: PackageCheck },
    { key: 'priceMatrix', label: 'Matrice prix', icon: Table2 },
    { key: 'permissionMatrix', label: 'Matrice droits', icon: KeyRound },
    { key: 'impact', label: 'Impact', icon: GitCompare },
    { key: 'multisite', label: 'Multi-site', icon: Globe2 },
    { key: 'connectors', label: 'Connecteurs', icon: PlugZap },
    { key: 'backup', label: 'Sauvegarde', icon: RotateCcw },
    { key: 'taxes', label: 'Taxes', icon: Percent },
    { key: 'approvals', label: 'Validations', icon: UserCheck },
    { key: 'environments', label: 'Environnements', icon: Layers },
  ];

  const setupSteps = [
    { title: 'Entreprise', done: companies.length > 0, detail: companies[0]?.name || 'Créer la société' },
    { title: 'Sites', done: sites.length > 0, detail: `${sites.length} site(s) configuré(s)` },
    { title: 'Modules métier', done: posList.some(pos => ['restaurant', 'spa', 'casino', 'boutique', 'room_service'].includes(pos.type)), detail: 'Restaurant, hôtel, casino, spa, boutique' },
    { title: 'POS', done: posList.length > 0, detail: `${posList.length} point(s) de vente` },
    { title: 'Dépôts', done: warehouses.length > 0, detail: `${warehouses.length} dépôt(s)` },
    { title: 'Catalogue', done: products.length > 0, detail: `${products.length} produit(s)` },
    { title: 'Prix par POS', done: posProductPrices.length > 0, detail: `${posProductPrices.length} tarif(s)` },
    { title: 'Contrôles', done: auditLogs.length > 0 || stockLevels.length > 0, detail: 'Stock, audit et règles prêts' },
  ];

  const businessModules = [
    { type: 'restaurant', label: 'Restaurant / RestauOS', icon: Store, color: '#F59E0B' },
    { type: 'room_service', label: 'Hôtel / PMS / Room service', icon: BedDouble, color: '#22D3EE' },
    { type: 'casino', label: 'Casino', icon: Landmark, color: '#8B5CF6' },
    { type: 'spa', label: 'Spa', icon: Sparkles, color: '#22C55E' },
    { type: 'boutique', label: 'Boutique', icon: ReceiptText, color: '#3B82F6' },
    { type: 'bar', label: 'Bars', icon: CreditCard, color: '#EF4444' },
  ].map(module => {
    const modulePOS = posList.filter(pos => pos.type === module.type);
    const modulePrices = posProductPrices.filter(price => modulePOS.some(pos => pos.id === price.pos_id));
    return { ...module, posCount: modulePOS.length, priceCount: modulePrices.length };
  });

  const healthAlerts = [
    ...posList
      .filter(pos => !warehouses.some(warehouse => warehouse.id === pos.default_warehouse_id))
      .map(pos => ({ level: 'critical', title: `${pos.name} sans dépôt valide`, detail: 'Les ventes ne pourront pas déstocker correctement.' })),
    ...posList
      .filter(pos => posProductPrices.filter(price => price.pos_id === pos.id && price.is_available).length === 0)
      .map(pos => ({ level: 'warning', title: `${pos.name} sans catalogue de vente`, detail: 'Aucun prix actif n’est associé à ce POS.' })),
    ...products
      .filter(product => product.is_stockable && !stockLevels.some(level => level.product_id === product.id))
      .slice(0, 6)
      .map(product => ({ level: 'warning', title: `${product.name} sans stock initial`, detail: 'Produit stockable sans quantité suivie.' })),
    ...recipes
      .filter(recipe => !recipeItems.some(item => item.recipe_id === recipe.id))
      .map(recipe => ({ level: 'warning', title: `${recipe.name} sans ingrédient`, detail: 'Une recette vide ne déstockera rien.' })),
    ...warehouses
      .filter(warehouse => !posList.some(pos => pos.default_warehouse_id === warehouse.id) && !stockLevels.some(level => level.warehouse_id === warehouse.id))
      .slice(0, 4)
      .map(warehouse => ({ level: 'info', title: `${warehouse.name} isolé`, detail: 'Aucun POS et aucun stock actif liés.' })),
  ];

  const roleRows = [
    { role: 'Direction générale', rights: 'Tout voir, tout configurer, valider les actions sensibles' },
    { role: 'Manager Restaurant', rights: 'POS restaurant, tables, caisse, remises contrôlées, stocks restaurant' },
    { role: 'Manager Hôtel', rights: 'Chambres, folios, room charge, housekeeping, clôtures PMS' },
    { role: 'Responsable stock', rights: 'Achats, transferts, inventaires, pertes et seuils' },
    { role: 'Réceptionniste', rights: 'Check-in, folios, imputations chambre, encaissements PMS' },
    { role: 'Caissier', rights: 'Encaissement, caisse X/Z, moyens de paiement autorisés' },
    { role: 'Serveur', rights: 'Prise de commande, impression, room charge si autorisé' },
    { role: 'Auditeur', rights: 'Lecture rapports, audit, export sans modification' },
  ];

  const ruleRows = [
    { title: 'Stock négatif', value: stockPolicy.allow_negative_stock ? 'Autorisé' : 'Bloqué', detail: 'Empêche les sorties impossibles si le dépôt est vide.' },
    { title: 'FIFO / lots', value: stockPolicy.fifo_enabled ? 'Actif' : 'Inactif', detail: 'Les lots les plus anciens ou proches péremption sortent d’abord.' },
    { title: 'Réservation avant préparation', value: stockPolicy.reserve_before_preparation ? 'Active' : 'Inactive', detail: 'Room service ou banquet peut bloquer du stock avant consommation.' },
    { title: 'Transfert automatique', value: stockPolicy.auto_transfer_enabled ? 'Suggéré' : 'Désactivé', detail: 'Le système propose un dépôt donneur quand un dépôt manque.' },
    { title: 'Remises sensibles', value: 'Validation manager', detail: 'Les remises fortes sont contrôlées par rôle.' },
    { title: 'Annulations', value: 'Traçables', detail: 'Annulation ticket, perte et inventaire sont journalisés.' },
  ];

  const importRows = [
    { title: 'Produits', detail: 'CSV/Excel avec nom, SKU, famille, unité, coût moyen', count: products.length },
    { title: 'Stocks initiaux', detail: 'Produit, dépôt, quantité, seuil, lot, péremption', count: stockLevels.length },
    { title: 'Prix par POS', detail: 'Produit, POS, prix, TVA, disponibilité', count: posProductPrices.length },
    { title: 'Variantes', detail: 'Suppléments, options, doubles doses, impacts prix et stock', count: productVariants.length },
    { title: 'Conversions', detail: 'Carton, sac, bidon, kg, grammes et unités vendues', count: unitConversions.length },
    { title: 'Réservations stock', detail: 'Room service, banquets, productions à préparer', count: stockReservations.length },
    { title: 'Consommations internes', detail: 'Personnel, VIP, offerts, direction, casino, mini-bar', count: internalConsumptions.length },
    { title: 'Fournisseurs', detail: 'Nom, téléphone, email, adresse, produits associés', count: suppliers.length },
    { title: 'Chambres', detail: 'Numéro, type, statut, site, étage futur', count: rooms.length },
    { title: 'Clients', detail: 'Client hôtel, CRM, compte corporate, limite crédit', count: customerAccounts.length },
  ];

  const simulationPOS = posList.find(pos => pos.id === 'pos-restaurant-jardin') || posList[0];
  const simulationProduct = products.find(product => product.id === 'prod-coca-33') || products.find(product => product.is_stockable) || products[0];
  const simulationPrice = simulationPOS && simulationProduct ? posProductPrices.find(price => price.pos_id === simulationPOS.id && price.product_id === simulationProduct.id) : undefined;
  const simulationWarehouse = simulationPOS ? warehouses.find(warehouse => warehouse.id === simulationPOS.default_warehouse_id) : undefined;
  const simulationStock = simulationWarehouse && simulationProduct ? stockLevels.find(level => level.warehouse_id === simulationWarehouse.id && level.product_id === simulationProduct.id) : undefined;
  const simulationRows = [
    { label: 'Produit', value: simulationProduct?.name || 'Aucun produit' },
    { label: 'POS', value: simulationPOS?.name || 'Aucun POS' },
    { label: 'Prix appliqué', value: simulationPrice ? `${fmt(simulationPrice.sale_price)} F` : 'Prix manquant' },
    { label: 'TVA', value: simulationPrice ? `${simulationPrice.tax_rate}%` : 'Non définie' },
    { label: 'Dépôt de sortie', value: simulationWarehouse?.name || 'Dépôt manquant' },
    { label: 'Stock disponible', value: simulationStock ? `${simulationStock.quantity} ${simulationStock.unit}` : 'Aucune ligne stock' },
    { label: 'Imprimante', value: simulationPOS?.printer_names?.[0] || 'Non définie' },
    { label: 'Caisse / rapport Z', value: simulationPOS ? 'Relié au POS' : 'Non relié' },
  ];

  const duplicateRows = [
    { title: 'Dupliquer un POS', detail: 'Copier dépôt, paiements, imprimantes, taxes et prix vers un nouveau point de vente.', action: 'Dupliquer POS' },
    { title: 'Dupliquer un site', detail: 'Créer Saly depuis Dakar avec catalogue commun et prix locaux.', action: 'Créer copie' },
    { title: 'Dupliquer les prix', detail: 'Copier les tarifs Restaurant vers Room Service puis ajuster.', action: 'Copier tarifs' },
    { title: 'Dupliquer un rôle', detail: 'Créer Manager Spa à partir de Manager Hôtel.', action: 'Copier droits' },
  ];

  const packRows = [
    { title: 'Restaurant complet', detail: 'POS, dépôt, caisse, imprimante cuisine, familles plats/boissons, règles remises.' },
    { title: 'Bar / Night Club', detail: 'POS bar, cave, prix premium, FIFO boissons, clôture Z dédiée.' },
    { title: 'Hôtel PMS', detail: 'Chambres, folios, room charge, réception, housekeeping, taxes hébergement.' },
    { title: 'Spa', detail: 'Prestations, consommables spa, room charge, planning praticiens.' },
    { title: 'Boutique', detail: 'Catalogue boutique, dépôt dédié, paiements, imputation chambre.' },
    { title: 'Casino', detail: 'Caisse casino, services table, fiscalité spécifique et audit renforcé.' },
  ];

  const priceMatrixProducts = products.slice(0, 6);
  const priceMatrixPOS = posList.slice(0, 5);
  const permissionActions = ['Vendre', 'Encaisser', 'Annuler', 'Remise', 'Transférer stock', 'Corriger inventaire', 'Clôturer caisse'];
  const permissionRoles = ['Direction', 'Manager', 'Caissier', 'Serveur', 'Chef cuisine'];

  const impactRows = [
    { title: 'Produit Coca-Cola 33 cl', detail: `${posProductPrices.filter(price => price.product_id === 'prod-coca-33').length} POS, ${stockLevels.filter(level => level.product_id === 'prod-coca-33').length} dépôt(s), FIFO actif` },
    { title: 'Dépôt Bar Casino', detail: `${posList.filter(pos => pos.default_warehouse_id === 'wh-bar-casino').length} POS lié(s), ${stockLevels.filter(level => level.warehouse_id === 'wh-bar-casino').length} référence(s)` },
    { title: 'Recette Thiéboudienne', detail: `${recipeItems.filter(item => item.recipe_id === 'recipe-thieb').length} ingrédient(s), coût calculable avant publication` },
  ];

  const connectorRows = [
    { title: 'PMS externe', status: 'Prévu', detail: 'Connexion Opera / Mews / autre PMS pour folios et chambres.' },
    { title: 'Comptabilité', status: 'Prévu', detail: 'Export ventes, taxes, règlements et comptes clients.' },
    { title: 'Terminaux de paiement', status: 'Maquette', detail: 'TPE carte, mobile money, rapprochement caisse.' },
    { title: 'Imprimantes réseau', status: 'Actif local', detail: 'Routage par POS et par préparation.' },
    { title: 'API fournisseurs', status: 'Prévu', detail: 'Commandes et réceptions fournisseurs automatisables.' },
  ];

  const getPermissionMode = (role: string, action: string) => permissionPolicies.find(item => item.role === role && item.action === action)?.mode;

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
      const before = posList.find(pos => pos.id === editingPOSId);
      updatePOS(editingPOSId, payload);
      createConfigDraft({
        title: `Modification ${payload.name}`,
        module: 'POS',
        change_type: 'pos',
        before_value: before ? `${before.name} / ${before.tax_profile || ''}` : 'Ancien POS',
        after_value: `${payload.name} / ${payload.tax_profile}`,
        created_by: 'Admin',
        status: 'tested',
      });
      setEditingPOSId(null);
    } else {
      addPOS(payload);
    }
    setConfigNotice({ tone: 'success', message: editingPOSId ? 'Point de vente modifié.' : 'Point de vente créé.' });
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
      const before = warehouses.find(warehouse => warehouse.id === editingWarehouseId);
      updateWarehouse(editingWarehouseId, payload);
      createConfigDraft({
        title: `Modification ${payload.name}`,
        module: 'Dépôt',
        change_type: 'warehouse',
        before_value: before ? before.name : 'Ancien dépôt',
        after_value: payload.name,
        created_by: 'Admin',
        status: 'tested',
      });
      setEditingWarehouseId(null);
    } else {
      addWarehouse(payload);
    }
    setConfigNotice({ tone: 'success', message: editingWarehouseId ? 'Dépôt modifié.' : 'Dépôt créé.' });
    setNewWarehouse(prev => ({ ...prev, name: '' }));
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    const warehouse = warehouses.find(item => item.id === warehouseId);
    if (!warehouse) return;
    const linkedPOS = posList.filter(pos => pos.default_warehouse_id === warehouseId);
    const stockedRefs = stockLevels.filter(level => level.warehouse_id === warehouseId && level.quantity > 0);
    if (linkedPOS.length || stockedRefs.length) {
      const reasons = [
        linkedPOS.length ? `${linkedPOS.length} point(s) de vente utilisent ce dépôt` : '',
        stockedRefs.length ? `${stockedRefs.length} référence(s) ont encore du stock` : '',
      ].filter(Boolean).join(' et ');
      setConfigNotice({
        tone: 'warning',
        message: `${warehouse.name} ne peut pas être supprimé : ${reasons}. Déplace d'abord le POS ou vide/transfère le stock.`,
      });
      return;
    }
    const deleted = deleteWarehouse(warehouseId);
    setConfigNotice({
      tone: deleted ? 'success' : 'warning',
      message: deleted ? `${warehouse.name} supprimé.` : `${warehouse.name} n'a pas pu être supprimé.`,
    });
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
      const before = products.find(product => product.id === editingProductId);
      updateProduct(editingProductId, payload);
      createConfigDraft({
        title: `Modification ${payload.name}`,
        module: 'Produit',
        change_type: 'product',
        before_value: before ? `${before.name} / ${before.average_purchase_price || 0} F` : 'Ancien produit',
        after_value: `${payload.name} / ${payload.average_purchase_price || 0} F`,
        created_by: 'Admin',
        status: 'tested',
      });
      setEditingProductId(null);
    } else {
      addProduct({
        ...payload,
        initial_warehouse_id: newProduct.primaryWarehouseId || undefined,
        initial_quantity: Number(newProduct.initialQuantity) || 0,
        alert_threshold: Number(newProduct.alertThreshold) || 0,
      });
    }
    setConfigNotice({ tone: 'success', message: editingProductId ? 'Produit modifié.' : 'Produit créé.' });
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
    const pos = posList.find(item => item.id === priceForm.posId);
    const product = products.find(item => item.id === priceForm.productId);
    const before = editingPriceId ? posProductPrices.find(price => price.id === editingPriceId) : undefined;
    createConfigDraft({
      title: `Prix ${product?.name || 'produit'} - ${pos?.name || 'POS'}`,
      module: 'Prix POS',
      change_type: 'price',
      before_value: before ? `${before.sale_price} F` : 'Non vendu',
      after_value: `${Number(priceForm.salePrice)} F`,
      created_by: 'Admin',
      status: 'tested',
    });
    setEditingPriceId(null);
    setConfigNotice({ tone: 'success', message: editingPriceId ? 'Prix POS modifié.' : 'Prix POS créé.' });
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
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {adminViews.map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.key}
                type="button"
                onClick={() => setAdminView(view.key)}
                className={`shrink-0 min-w-[112px] rounded-2xl px-3 py-3 text-left transition-all ${adminView === view.key ? 'bg-orange text-white shadow-[0_8px_24px_rgba(255,138,0,0.25)]' : 'bg-white/5 text-text-secondary border border-white/10'}`}
              >
                <Icon size={16} className="mb-2" />
                <span className="block text-[10px] font-black uppercase tracking-widest">{view.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-5">
        {adminView === 'assistant' && (
          <div className="glass-card-lg p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-base">Assistant de configuration</h3>
                <p className="text-text-secondary text-xs mt-1">Le parcours pour ouvrir un nouveau complexe sans oublier les liens critiques.</p>
              </div>
              <Sparkles size={20} className="text-orange" />
            </div>
            <div className="space-y-2">
              {setupSteps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => {
                    if (step.title === 'POS') setConfigPanel('pos');
                    if (step.title === 'Dépôts') setConfigPanel('warehouse');
                    if (step.title === 'Catalogue') setConfigPanel('product');
                    if (step.title === 'Prix par POS') setConfigPanel('price');
                  }}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 flex items-center gap-3 text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${step.done ? 'bg-green/10 text-green' : 'bg-orange/10 text-orange'}`}>
                    {step.done ? <CheckCircle2 size={17} /> : <span className="font-black text-xs">{index + 1}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-xs">{step.title}</p>
                    <p className="text-text-tertiary text-[10px] truncate">{step.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {adminView === 'architecture' && (
          <div className="space-y-3">
            {sites.map(site => {
              const sitePOS = posList.filter(pos => pos.site_id === site.id);
              const siteWarehouses = warehouses.filter(warehouse => warehouse.site_id === site.id);
              return (
                <div key={site.id} className="glass-card-lg p-5">
                  <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">{companies[0]?.name}</p>
                  <h3 className="text-white font-black text-base mt-1">{site.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">{site.city} • {sitePOS.length} POS • {siteWarehouses.length} dépôt(s)</p>
                  <div className="mt-4 space-y-3">
                    {sitePOS.map(pos => {
                      const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
                      const prices = posProductPrices.filter(price => price.pos_id === pos.id);
                      return (
                        <div key={pos.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-white font-black text-sm">{pos.name}</p>
                              <p className="text-text-tertiary text-[10px]">{pos.type} → {warehouse?.name || 'Dépôt manquant'}</p>
                            </div>
                            <span className="text-orange font-black text-xs">{prices.length} prix</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="rounded-xl bg-black/20 p-2">
                              <p className="text-text-tertiary text-[9px] font-black uppercase">TVA</p>
                              <p className="text-white text-xs font-bold">{pos.tax_profile || 'Non définie'}</p>
                            </div>
                            <div className="rounded-xl bg-black/20 p-2">
                              <p className="text-text-tertiary text-[9px] font-black uppercase">Imprimante</p>
                              <p className="text-white text-xs font-bold truncate">{pos.printer_names?.[0] || 'Aucune'}</p>
                            </div>
                            <div className="rounded-xl bg-black/20 p-2">
                              <p className="text-text-tertiary text-[9px] font-black uppercase">Paiements</p>
                              <p className="text-white text-xs font-bold">{pos.payment_methods.length}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {adminView === 'modules' && (
          <div className="grid grid-cols-2 gap-3">
            {businessModules.map(module => {
              const Icon = module.icon;
              return (
                <div key={module.type} className="glass-card p-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${module.color}1F`, color: module.color }}>
                    <Icon size={19} />
                  </div>
                  <p className="text-white font-black text-sm">{module.label}</p>
                  <p className="text-text-secondary text-xs mt-1">{module.posCount} POS • {module.priceCount} tarif(s)</p>
                  <button type="button" onClick={() => setConfigPanel('pos')} className="mt-3 w-full h-10 rounded-xl bg-white/5 text-white text-xs font-black">
                    Configurer
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {adminView === 'pos' && (
          <div className="space-y-3">
            {posList.map(pos => {
              const warehouse = warehouses.find(item => item.id === pos.default_warehouse_id);
              const prices = posProductPrices.filter(price => price.pos_id === pos.id);
              return (
                <div key={pos.id} className="glass-card-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-black text-sm">{pos.name}</p>
                      <p className="text-text-tertiary text-[10px]">{warehouse?.name || 'Dépôt manquant'} • {pos.tax_profile}</p>
                    </div>
                    <button type="button" onClick={() => startEditPOS(pos.id)} className="h-9 px-3 rounded-xl bg-blue/10 text-blue text-xs font-black">
                      Éditer
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">Prix</p>
                      <p className="text-white font-black">{prices.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">Paiements</p>
                      <p className="text-white font-black">{pos.payment_methods.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">Impr.</p>
                      <p className="text-white font-black">{pos.printer_names?.length || 0}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-text-tertiary text-[9px] font-black uppercase">TPE</p>
                      <p className="text-white font-black">{pos.terminal_names?.length || 0}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {adminView === 'permissions' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Rôles et permissions</h3>
            <p className="text-text-secondary text-xs mb-4">La matrice cible pour bloquer clairement les actions sensibles selon le métier.</p>
            <div className="space-y-2">
              {roleRows.map(row => (
                <div key={row.role} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-white font-black text-sm">{row.role}</p>
                  <p className="text-text-secondary text-xs mt-1">{row.rights}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'rules' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Moteur de règles métier</h3>
            <p className="text-text-secondary text-xs mb-4">Les règles qui contrôlent stock, ventes, remises, annulations, folios et caisse.</p>
            <div className="space-y-2">
              {ruleRows.map(row => (
                <div key={row.title} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{row.title}</p>
                    <p className="text-text-secondary text-xs mt-1">{row.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full bg-green/10 text-green">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'health' && (
          <div className="glass-card-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-black text-base">Santé système</h3>
                <p className="text-text-secondary text-xs">{healthAlerts.length} point(s) à surveiller</p>
              </div>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full ${healthAlerts.length ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                {healthAlerts.length ? 'À corriger' : 'Prêt'}
              </span>
            </div>
            <div className="space-y-2">
              {healthAlerts.map(alert => (
                <div key={`${alert.title}-${alert.detail}`} className={`rounded-2xl border p-4 ${alert.level === 'critical' ? 'bg-red/10 border-red/20' : alert.level === 'warning' ? 'bg-orange/10 border-orange/20' : 'bg-blue/10 border-blue/20'}`}>
                  <p className="text-white font-black text-sm">{alert.title}</p>
                  <p className="text-text-secondary text-xs mt-1">{alert.detail}</p>
                </div>
              ))}
              {healthAlerts.length === 0 && <p className="text-text-tertiary text-sm text-center py-6">Configuration saine.</p>}
            </div>
          </div>
        )}

        {adminView === 'imports' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Imports et migration</h3>
            <p className="text-text-secondary text-xs mb-4">Préparer la reprise des données RestauOS et des fichiers terrain.</p>
            <div className="space-y-2">
              {importRows.map(row => (
                <div key={row.title} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-black text-sm">{row.title}</p>
                    <p className="text-text-secondary text-xs mt-1">{row.detail}</p>
                  </div>
                  <span className="text-blue font-black text-sm">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'audit' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Audit complet</h3>
            <p className="text-text-secondary text-xs mb-4">Actions sensibles, validations manager et traces d’exploitation.</p>
            <div className="space-y-2">
              {auditLogs.slice(0, 8).map(log => (
                <div key={log.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-black text-sm">{log.action}</p>
                      <p className="text-text-tertiary text-[10px]">{log.actorName} • {log.actorRole}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${log.managerApprovalRequired ? 'bg-orange/10 text-orange' : 'bg-green/10 text-green'}`}>
                      {log.managerApprovalRequired ? 'Manager' : 'OK'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mt-2">{log.reason}</p>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-text-tertiary text-sm text-center py-6">Aucune action sensible journalisée.</p>}
            </div>
          </div>
        )}

        {adminView === 'simulation' && (
          <div className="glass-card-lg p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-black text-base">Simulation de vente</h3>
                <p className="text-text-secondary text-xs mt-1">Test rapide : produit → POS → prix → TVA → dépôt → stock → impression → caisse.</p>
              </div>
              <PlayCircle size={22} className="text-green" />
            </div>
            <div className="space-y-2">
              {simulationRows.map(row => (
                <div key={row.label} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3">
                  <span className="text-text-secondary text-xs font-bold">{row.label}</span>
                  <span className="text-white font-black text-xs text-right">{row.value}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setConfigNotice({ tone: simulationPrice && simulationWarehouse && simulationStock ? 'success' : 'warning', message: simulationPrice && simulationWarehouse && simulationStock ? 'Simulation valide : la vente peut être tracée de bout en bout.' : 'Simulation incomplète : vérifier prix, dépôt ou stock.' })} className="mt-4 w-full h-12 rounded-2xl bg-green text-white font-black text-sm">
              Lancer le contrôle
            </button>
          </div>
        )}

        {adminView === 'drafts' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Mode brouillon / publication</h3>
            <p className="text-text-secondary text-xs mb-4">Préparer, tester puis publier une configuration sans casser le service.</p>
            <div className="space-y-2">
              {configDrafts.map(row => (
                <div key={row.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-black text-sm">{row.title}</p>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange/10 text-orange">{row.status}</span>
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{row.module} • {row.before_value} → {row.after_value}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button type="button" onClick={() => setConfigNotice({ tone: 'success', message: `${row.title} : ${row.before_value} → ${row.after_value}` })} className="h-9 rounded-xl bg-white/5 text-white text-[10px] font-black">Prévisualiser</button>
                    <button type="button" onClick={() => { testConfigDraft(row.id); setConfigNotice({ tone: 'success', message: `${row.title} testé.` }); }} className="h-9 rounded-xl bg-white/5 text-white text-[10px] font-black">Tester</button>
                    <button type="button" onClick={() => { publishConfigDraft(row.id, 'Admin'); setConfigNotice({ tone: 'success', message: `${row.title} publié et historisé.` }); }} className="h-9 rounded-xl bg-green/10 text-green text-[10px] font-black">Publier</button>
                  </div>
                </div>
              ))}
              {configDrafts.length === 0 && <p className="text-text-tertiary text-sm text-center py-6">Aucun brouillon.</p>}
            </div>
          </div>
        )}

        {adminView === 'history' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Historique de configuration</h3>
            <p className="text-text-secondary text-xs mb-4">Ancienne valeur, nouvelle valeur, auteur et module impacté.</p>
            <div className="space-y-2">
              {configHistoryEntries.map(row => (
                <div key={row.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-white font-black text-sm">{row.title}</p>
                  <p className="text-text-tertiary text-[10px] mt-1">{row.module} • {row.actor}</p>
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mt-3">
                    <span className="rounded-xl bg-red/10 text-red text-xs font-black px-3 py-2">{row.before_value}</span>
                    <span className="text-text-tertiary text-xs">→</span>
                    <span className="rounded-xl bg-green/10 text-green text-xs font-black px-3 py-2">{row.after_value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'duplicate' && (
          <div className="grid grid-cols-2 gap-3">
            {duplicateRows.map(row => (
              <div key={row.title} className="glass-card p-4">
                <Copy size={18} className="text-blue mb-3" />
                <p className="text-white font-black text-sm">{row.title}</p>
                <p className="text-text-secondary text-xs mt-1 min-h-[44px]">{row.detail}</p>
                <button type="button" onClick={() => {
                  if (row.title === 'Dupliquer un POS') duplicatePOSConfig(posList[0]?.id || '', `${posList[0]?.name || 'POS'} copie`);
                  else createConfigDraft({ title: row.title, module: 'Duplication', change_type: 'pos', before_value: 'Original', after_value: row.action, created_by: 'Admin' });
                  setConfigNotice({ tone: 'success', message: `${row.action} préparé en brouillon.` });
                }} className="mt-3 w-full h-10 rounded-xl bg-blue/10 text-blue text-xs font-black">
                  {row.action}
                </button>
              </div>
            ))}
          </div>
        )}

        {adminView === 'packs' && (
          <div className="grid grid-cols-2 gap-3">
            {packRows.map(row => (
              <div key={row.title} className="glass-card p-4">
                <PackageCheck size={18} className="text-green mb-3" />
                <p className="text-white font-black text-sm">{row.title}</p>
                <p className="text-text-secondary text-xs mt-1 min-h-[54px]">{row.detail}</p>
                <button type="button" onClick={() => {
                  const type = row.title.includes('Hôtel') ? 'room_service' : row.title.includes('Spa') ? 'spa' : row.title.includes('Boutique') ? 'boutique' : row.title.includes('Casino') ? 'casino' : row.title.includes('Bar') ? 'bar' : 'restaurant';
                  createBusinessPack(type as POSType, sites[0]?.id || 'site-dakar', row.title);
                  setConfigNotice({ tone: 'success', message: `Pack ${row.title} créé avec POS et dépôt.` });
                }} className="mt-3 w-full h-10 rounded-xl bg-green/10 text-green text-xs font-black">
                  Préparer le pack
                </button>
              </div>
            ))}
          </div>
        )}

        {adminView === 'priceMatrix' && (
          <div className="glass-card-lg p-5 overflow-hidden">
            <h3 className="text-white font-black text-base mb-1">Matrice POS × Produits</h3>
            <p className="text-text-secondary text-xs mb-4">Prix, TVA et disponibilité par point de vente.</p>
            <div className="overflow-x-auto scrollbar-none">
              <div className="min-w-[720px] space-y-2">
                <div className="grid gap-2" style={{ gridTemplateColumns: `160px repeat(${priceMatrixPOS.length}, 1fr)` }}>
                  <div />
                  {priceMatrixPOS.map(pos => <div key={pos.id} className="text-text-tertiary text-[10px] font-black uppercase truncate">{pos.name}</div>)}
                </div>
                {priceMatrixProducts.map(product => (
                  <div key={product.id} className="grid gap-2" style={{ gridTemplateColumns: `160px repeat(${priceMatrixPOS.length}, 1fr)` }}>
                    <div className="rounded-xl bg-white/5 p-3 text-white text-xs font-black truncate">{product.name}</div>
                    {priceMatrixPOS.map(pos => {
                      const price = posProductPrices.find(item => item.pos_id === pos.id && item.product_id === product.id);
                      return (
                        <button key={pos.id} type="button" onClick={() => {
                          if (price) {
                            upsertPOSProductPrice({ ...price, sale_price: price.sale_price + 100 });
                            createConfigDraft({ title: `Ajustement ${product.name} - ${pos.name}`, module: 'Matrice prix', change_type: 'price', before_value: `${price.sale_price} F`, after_value: `${price.sale_price + 100} F`, created_by: 'Admin', status: 'tested' });
                            setConfigNotice({ tone: 'success', message: `Prix ${product.name} augmenté de 100 F pour ${pos.name}.` });
                          } else {
                            upsertPOSProductPrice({ pos_id: pos.id, product_id: product.id, sale_price: 1000, tax_rate: 18, is_available: true });
                            setConfigNotice({ tone: 'success', message: `${product.name} ajouté à ${pos.name}.` });
                          }
                        }} className={`rounded-xl p-3 text-left ${price ? 'bg-green/10 text-green' : 'bg-white/5 text-text-tertiary'}`}>
                          <p className="font-black text-xs">{price ? `${fmt(price.sale_price)} F` : 'Non vendu'}</p>
                          <p className="text-[10px] opacity-80">{price ? `TVA ${price.tax_rate}%` : 'Ajouter'}</p>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminView === 'permissionMatrix' && (
          <div className="glass-card-lg p-5 overflow-hidden">
            <h3 className="text-white font-black text-base mb-1">Matrice rôles × permissions</h3>
            <p className="text-text-secondary text-xs mb-4">Lecture rapide : autorisé, validation manager ou bloqué.</p>
            <div className="overflow-x-auto scrollbar-none">
              <div className="min-w-[680px] space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  <div />
                  {permissionRoles.map(role => <div key={role} className="text-text-tertiary text-[10px] font-black uppercase">{role}</div>)}
                </div>
                {permissionActions.map(action => (
                  <div key={action} className="grid grid-cols-6 gap-2">
                    <div className="rounded-xl bg-white/5 p-3 text-white text-xs font-black">{action}</div>
                    {permissionRoles.map(role => {
                      const persisted = getPermissionMode(role, action);
                      const open = persisted ? persisted === 'allow' : role === 'Direction' || role === 'Manager' || (action === 'Vendre' && role === 'Serveur') || (action === 'Encaisser' && role === 'Caissier') || (action.includes('inventaire') && role === 'Chef cuisine');
                      const manager = persisted ? persisted === 'manager' : ['Annuler', 'Remise', 'Corriger inventaire'].includes(action) && !['Direction', 'Manager'].includes(role);
                      return (
                        <button key={`${role}-${action}`} type="button" onClick={() => {
                          const next = open ? 'manager' : manager ? 'deny' : 'allow';
                          setPermissionPolicy(role, action, next);
                          setConfigNotice({ tone: 'success', message: `${role} / ${action} : ${next}` });
                        }} className={`rounded-xl p-3 text-center text-[10px] font-black ${open ? 'bg-green/10 text-green' : manager ? 'bg-orange/10 text-orange' : 'bg-red/10 text-red'}`}>
                          {open ? 'Oui' : manager ? 'Manager' : 'Non'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminView === 'impact' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Contrôle d’impact</h3>
            <p className="text-text-secondary text-xs mb-4">Avant suppression ou modification sensible, voir ce qui sera touché.</p>
            <div className="space-y-2">
              {impactRows.map(row => (
                <div key={row.title} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <p className="text-white font-black text-sm">{row.title}</p>
                  <p className="text-text-secondary text-xs mt-1">{row.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'multisite' && (
          <div className="space-y-3">
            {sites.map(site => {
              const siteProducts = stockLevels.filter(level => warehouses.some(warehouse => warehouse.id === level.warehouse_id && warehouse.site_id === site.id));
              return (
                <div key={site.id} className="glass-card-lg p-5">
                  <h3 className="text-white font-black text-base">{site.name}</h3>
                  <p className="text-text-secondary text-xs mt-1">Catalogue commun, règles locales, prix et stocks locaux.</p>
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">POS</p><p className="text-white font-black">{posList.filter(pos => pos.site_id === site.id).length}</p></div>
                    <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Dépôts</p><p className="text-white font-black">{warehouses.filter(warehouse => warehouse.site_id === site.id).length}</p></div>
                    <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Stocks</p><p className="text-white font-black">{siteProducts.length}</p></div>
                    <div className="rounded-xl bg-white/5 p-3"><p className="text-text-tertiary text-[9px] font-black uppercase">Taxes</p><p className="text-white font-black">Local</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {adminView === 'connectors' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Centre de connecteurs</h3>
            <p className="text-text-secondary text-xs mb-4">Préparer les intégrations PMS, comptabilité, TPE, imprimantes et fournisseurs.</p>
            <div className="space-y-2">
              {connectorRows.map(row => (
                <div key={row.title} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-3">
                  <div><p className="text-white font-black text-sm">{row.title}</p><p className="text-text-secondary text-xs mt-1">{row.detail}</p></div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue/10 text-blue">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminView === 'backup' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Sauvegarde / restauration configuration</h3>
            <p className="text-text-secondary text-xs mb-4">Exporter, restaurer et sécuriser la configuration avant publication.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Sauvegarder maintenant', 'Exporter config', 'Importer config', 'Restaurer version'].map(action => (
                <button key={action} type="button" onClick={() => {
                  if (action === 'Sauvegarder maintenant' || action === 'Exporter config') {
                    const snapshot = createConfigSnapshot(`Snapshot ${new Date().toLocaleString('fr-FR')}`, 'Admin');
                    setConfigNotice({ tone: 'success', message: `${snapshot.name} créé : ${snapshot.summary}` });
                  } else if (action === 'Restaurer version' && configSnapshots[0]) {
                    restoreConfigSnapshot(configSnapshots[0].id, 'Admin');
                    setConfigNotice({ tone: 'success', message: `${configSnapshots[0].name} restauré.` });
                  } else {
                    createConfigDraft({ title: 'Import configuration', module: 'Sauvegarde', change_type: 'backup', before_value: 'Configuration actuelle', after_value: 'Fichier importé', created_by: 'Admin' });
                    setConfigNotice({ tone: 'success', message: `${action} préparé en brouillon.` });
                  }
                }} className="h-20 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black">
                  {action}
                </button>
              ))}
            </div>
            {configSnapshots.length > 0 && (
              <div className="mt-4 space-y-2">
                {configSnapshots.slice(0, 3).map(snapshot => (
                  <div key={snapshot.id} className="rounded-xl bg-white/5 px-3 py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-xs">{snapshot.name}</p>
                      <p className="text-text-tertiary text-[10px]">{snapshot.summary}</p>
                    </div>
                    <span className="text-green font-black text-[10px]">{snapshot.created_by}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {adminView === 'taxes' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Gestion des taxes avancée</h3>
            <p className="text-text-secondary text-xs mb-4">Profils fiscaux par métier, site, client et famille produit.</p>
            <div className="space-y-2">
              {taxProfiles.map(row => (
                <div key={row.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-3">
                  <div><p className="text-white font-black text-sm">{row.name}</p><p className="text-text-secondary text-xs mt-1">{row.detail}</p></div>
                  <button type="button" onClick={() => { upsertTaxProfile({ ...row, rate: row.rate + 1 }); setConfigNotice({ tone: 'success', message: `${row.name} passé à ${row.rate + 1}%` }); }} className="text-orange font-black text-xs">{row.rate}%</button>
                </div>
              ))}
              <button type="button" onClick={() => { upsertTaxProfile({ name: 'Corporate exonéré', module: 'Corporate', rate: 0, detail: 'Profil client entreprise avec exonération contrôlée.', is_active: true }); setConfigNotice({ tone: 'success', message: 'Profil fiscal corporate ajouté.' }); }} className="w-full h-11 rounded-xl bg-orange/10 text-orange text-xs font-black">Ajouter profil fiscal</button>
            </div>
          </div>
        )}

        {adminView === 'approvals' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Centre de validation manager</h3>
            <p className="text-text-secondary text-xs mb-4">Toutes les actions sensibles à approuver ou refuser.</p>
            <div className="space-y-2">
              {approvalRequests.map(row => (
                <div key={row.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-black text-sm">{row.title}</p>
                    <span className="text-orange font-black text-sm">{row.status}</span>
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{row.detail}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => resolveApprovalRequest(row.id, 'approved', 'Admin')} className="h-9 rounded-xl bg-green/10 text-green text-[10px] font-black">Approuver</button>
                    <button type="button" onClick={() => resolveApprovalRequest(row.id, 'rejected', 'Admin')} className="h-9 rounded-xl bg-red/10 text-red text-[10px] font-black">Refuser</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => { createApprovalRequest({ title: 'Validation test', detail: 'Demande sensible créée depuis Admin.', module: 'Admin', requested_by: 'Admin' }); setConfigNotice({ tone: 'success', message: 'Demande de validation créée.' }); }} className="w-full h-11 rounded-xl bg-orange/10 text-orange text-xs font-black">Créer demande</button>
            </div>
          </div>
        )}

        {adminView === 'environments' && (
          <div className="glass-card-lg p-5">
            <h3 className="text-white font-black text-base mb-1">Environnements</h3>
            <p className="text-text-secondary text-xs mb-4">Séparer démo, formation et production pour tester sans risque.</p>
            <div className="space-y-2">
              {adminEnvironments.map(row => (
                <div key={row.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-start justify-between gap-3">
                  <div><p className="text-white font-black text-sm">{row.name}</p><p className="text-text-secondary text-xs mt-1">{row.detail}</p></div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-green/10 text-green">{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

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

        {configNotice && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-xs font-bold ${
            configNotice.tone === 'success'
              ? 'border-green/25 bg-green/10 text-green'
              : 'border-orange/30 bg-orange/10 text-orange'
          }`}>
            {configNotice.message}
          </div>
        )}

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
                {['restaurant', 'bar', 'kitchen', 'cold_room', 'central', 'casino', 'boutique', 'other'].map(type => (
                  <option key={type} value={type}>{warehouseTypeLabels[type] || type}</option>
                ))}
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
                    <p className="text-text-tertiary text-[10px] uppercase tracking-widest">{warehouseTypeLabels[warehouse.type] || warehouse.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" title="Modifier le dépôt" aria-label={`Modifier ${warehouse.name}`} onClick={() => startEditWarehouse(warehouse.id)} className="h-8 px-3 rounded-xl bg-white/5 text-blue flex items-center justify-center gap-1.5 text-[10px] font-black">
                      <Edit2 size={14} />
                      Modifier
                    </button>
                    <button
                      type="button"
                      title="Supprimer le dépôt"
                      aria-label={`Supprimer ${warehouse.name}`}
                      onClick={() => handleDeleteWarehouse(warehouse.id)}
                      className="h-8 px-3 rounded-xl bg-red/10 text-red flex items-center justify-center gap-1.5 text-[10px] font-black"
                    >
                      <Trash2 size={14} />
                      Supprimer
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
