import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type POSType = 'restaurant' | 'bar' | 'nightclub' | 'casino' | 'room_service' | 'spa' | 'boutique' | 'other';
export type WarehouseType = 'restaurant' | 'bar' | 'kitchen' | 'cold_room' | 'central' | 'casino' | 'boutique' | 'other';
export type StockMovementType = 'sale' | 'purchase' | 'transfer_in' | 'transfer_out' | 'inventory_adjustment' | 'loss' | 'production' | 'reservation' | 'internal_consumption';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type StayStatus = 'booked' | 'checked_in' | 'checked_out' | 'cancelled';
export type FolioStatus = 'open' | 'closed';
export type CashSessionStatus = 'open' | 'closed';
export type PaymentMethod = 'especes' | 'wave' | 'orange_money' | 'carte' | 'room_charge';
export type CustomerAccountType = 'guest' | 'corporate' | 'vip' | 'walk_in';
export type CustomerLedgerSource = 'folio' | 'pos_order' | 'manual_charge' | 'payment' | 'adjustment';

export interface Company {
  id: string;
  name: string;
  legal_name: string;
  country: string;
  currency: string;
  created_at: string;
}

export interface Site {
  id: string;
  company_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  created_at: string;
}

export interface POS {
  id: string;
  site_id: string;
  name: string;
  type: POSType;
  default_warehouse_id: string;
  is_active: boolean;
  payment_methods: string[];
  printer_names?: string[];
  terminal_names?: string[];
  tax_profile?: string;
  created_at: string;
}

export interface HospiProduct {
  id: string;
  company_id: string;
  legacy_product_id?: string;
  name: string;
  sku: string;
  category_id: string;
  unit: string;
  is_stockable: boolean;
  is_active: boolean;
  primary_warehouse_id?: string;
  secondary_warehouse_id?: string;
  fallback_warehouse_id?: string;
  fallback_policy?: 'use_secondary' | 'block_sale';
  average_purchase_price?: number;
  supplier_ids?: string[];
  lot_number?: string;
  expires_at?: string;
  created_at: string;
}

export interface POSProductPrice {
  id: string;
  pos_id: string;
  product_id: string;
  sale_price: number;
  tax_rate: number;
  is_available: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  site_id: string;
  name: string;
  type: WarehouseType;
  is_active: boolean;
  created_at: string;
}

export interface StockLevel {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  alert_threshold: number;
  updated_at: string;
}

export interface StockLot {
  id: string;
  warehouse_id: string;
  product_id: string;
  lot_number: string;
  expires_at?: string;
  quantity: number;
  unit_cost: number;
  received_at: string;
}

export interface StockMovement {
  id: string;
  company_id: string;
  site_id: string;
  pos_id?: string;
  warehouse_id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reason: string;
  reference_type: string;
  reference_id: string;
  created_by?: string;
  created_at: string;
}

export interface Room {
  id: string;
  site_id: string;
  room_number: string;
  room_type: string;
  status: RoomStatus;
  created_at: string;
}

export interface HotelGuest {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Stay {
  id: string;
  room_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  status: StayStatus;
  created_at: string;
}

export interface Folio {
  id: string;
  stay_id: string;
  guest_id: string;
  room_id: string;
  status: FolioStatus;
  total_amount: number;
  created_at: string;
}

export interface FolioLine {
  id: string;
  folio_id: string;
  source_type: 'pos_order' | 'manual_charge' | 'room_service';
  source_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface CustomerAccount {
  id: string;
  company_id: string;
  display_name: string;
  type: CustomerAccountType;
  phone?: string;
  email?: string;
  hotel_guest_id?: string;
  loyalty_client_id?: string;
  credit_limit: number;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomerLedgerEntry {
  id: string;
  account_id: string;
  source_type: CustomerLedgerSource;
  source_id: string;
  description: string;
  debit: number;
  credit: number;
  created_at: string;
}

export interface CashRegister {
  id: string;
  pos_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CashSession {
  id: string;
  register_id: string;
  pos_id: string;
  opened_by: string;
  closed_by?: string;
  status: CashSessionStatus;
  opening_float: number;
  closing_cash_count?: number;
  expected_cash?: number;
  difference?: number;
  opened_at: string;
  closed_at?: string;
}

export interface CashSessionSummary {
  orderCount: number;
  grossSales: number;
  byMethod: Record<PaymentMethod, number>;
  expectedCash: number;
  roomChargeTotal: number;
}

export interface Recipe {
  id: string;
  product_id: string;
  name: string;
  created_at: string;
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  ingredient_product_id: string;
  quantity: number;
  unit: string;
}

export interface ProductionBatch {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  created_by: string;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_delta: number;
  stock_delta_description: string;
  created_at: string;
}

export interface UnitConversion {
  id: string;
  product_id: string;
  from_unit: string;
  to_unit: string;
  factor: number;
  example: string;
}

export interface StockReservation {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  source_type: 'room_service' | 'pos_order' | 'event' | 'production';
  source_label: string;
  status: 'reserved' | 'consumed' | 'released';
  created_at: string;
}

export interface InternalConsumption {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reason: 'personnel' | 'offert' | 'vip' | 'direction' | 'casino' | 'room_service' | 'mini_bar';
  created_by: string;
  created_at: string;
}

export interface StockPolicy {
  allow_negative_stock: boolean;
  auto_transfer_enabled: boolean;
  fifo_enabled: boolean;
  reserve_before_preparation: boolean;
}

export type ConfigDraftStatus = 'draft' | 'tested' | 'published' | 'cancelled';
export type PermissionMode = 'allow' | 'manager' | 'deny';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ConfigDraft {
  id: string;
  title: string;
  module: string;
  change_type: 'site' | 'price' | 'pos' | 'warehouse' | 'product' | 'pack' | 'permission' | 'tax' | 'backup' | 'connector';
  before_value: string;
  after_value: string;
  status: ConfigDraftStatus;
  created_by: string;
  created_at: string;
  tested_at?: string;
  published_at?: string;
}

export interface ConfigHistoryEntry {
  id: string;
  title: string;
  module: string;
  before_value: string;
  after_value: string;
  actor: string;
  created_at: string;
}

export interface PermissionPolicy {
  id: string;
  role: string;
  action: string;
  mode: PermissionMode;
  updated_at: string;
}

export interface TaxProfile {
  id: string;
  name: string;
  module: string;
  rate: number;
  detail: string;
  is_active: boolean;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  detail: string;
  module: string;
  status: ApprovalStatus;
  requested_by: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ConfigSnapshot {
  id: string;
  name: string;
  summary: string;
  created_by: string;
  created_at: string;
  payload: {
    sites: Site[];
    posList: POS[];
    warehouses: Warehouse[];
    products: HospiProduct[];
    posProductPrices: POSProductPrice[];
    taxProfiles: TaxProfile[];
    permissionPolicies: PermissionPolicy[];
  };
}

export interface AdminEnvironment {
  id: string;
  name: string;
  status: 'active' | 'ready' | 'protected';
  detail: string;
  updated_at: string;
}

export interface ImportReport {
  id: string;
  kind: 'products' | 'prices' | 'stock' | 'suppliers' | 'rooms' | 'customers';
  imported: number;
  errors: string[];
  created_by: string;
  created_at: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  lot_number?: string;
  expires_at?: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  warehouse_id: string;
  status: PurchaseOrderStatus;
  ordered_by: string;
  expected_at?: string;
  created_at: string;
}

export interface SupplierReceipt {
  id: string;
  purchase_order_id: string;
  warehouse_id: string;
  received_by: string;
  total_cost: number;
  created_at: string;
}

export interface POSProduct {
  product: HospiProduct;
  price: POSProductPrice;
  stock?: StockLevel;
}

export interface SaleLineInput {
  productId: string;
  quantity: number;
}

const now = new Date().toISOString();

const companies: Company[] = [
  {
    id: 'comp-sartal-demo',
    name: 'Sártal Demo Hospitality',
    legal_name: 'Sártal Demo Hospitality SARL',
    country: 'Sénégal',
    currency: 'FCFA',
    created_at: now,
  },
];

const sites: Site[] = [
  {
    id: 'site-dakar',
    company_id: 'comp-sartal-demo',
    name: 'Complexe Hôtelier Dakar',
    address: 'Corniche Ouest',
    city: 'Dakar',
    country: 'Sénégal',
    created_at: now,
  },
  {
    id: 'site-saly',
    company_id: 'comp-sartal-demo',
    name: 'Restaurant Saly',
    address: 'Saly Portudal',
    city: 'Saly',
    country: 'Sénégal',
    created_at: now,
  },
  {
    id: 'site-thies',
    company_id: 'comp-sartal-demo',
    name: 'Restaurant Thiès',
    address: 'Centre-ville',
    city: 'Thiès',
    country: 'Sénégal',
    created_at: now,
  },
];

const warehouses: Warehouse[] = [
  { id: 'wh-restaurant', site_id: 'site-dakar', name: 'Dépôt Restaurant', type: 'restaurant', is_active: true, created_at: now },
  { id: 'wh-bar-casino', site_id: 'site-dakar', name: 'Dépôt Bar Casino', type: 'bar', is_active: true, created_at: now },
  { id: 'wh-nightclub', site_id: 'site-dakar', name: 'Dépôt Night Club', type: 'casino', is_active: true, created_at: now },
  { id: 'wh-central', site_id: 'site-dakar', name: 'Dépôt Central', type: 'central', is_active: true, created_at: now },
  { id: 'wh-dakar-boissons', site_id: 'site-dakar', name: 'Dépôt Boissons', type: 'bar', is_active: true, created_at: now },
  { id: 'wh-dakar-viandes', site_id: 'site-dakar', name: 'Dépôt Viandes', type: 'cold_room', is_active: true, created_at: now },
  { id: 'wh-dakar-legumes', site_id: 'site-dakar', name: 'Dépôt Légumes', type: 'kitchen', is_active: true, created_at: now },
  { id: 'wh-dakar-epicerie', site_id: 'site-dakar', name: 'Dépôt Épicerie', type: 'kitchen', is_active: true, created_at: now },
  { id: 'wh-saly-bar', site_id: 'site-saly', name: 'Dépôt Bar Saly', type: 'bar', is_active: true, created_at: now },
  { id: 'wh-saly-cuisine', site_id: 'site-saly', name: 'Dépôt Cuisine Saly', type: 'kitchen', is_active: true, created_at: now },
  { id: 'wh-saly-congelateur', site_id: 'site-saly', name: 'Dépôt Congélateur Saly', type: 'cold_room', is_active: true, created_at: now },
  { id: 'wh-thies-cuisine', site_id: 'site-thies', name: 'Dépôt Cuisine Thiès', type: 'kitchen', is_active: true, created_at: now },
];

const posList: POS[] = [
  {
    id: 'pos-restaurant-jardin',
    site_id: 'site-dakar',
    name: 'Restaurant Le Jardin',
    type: 'restaurant',
    default_warehouse_id: 'wh-restaurant',
    is_active: true,
    payment_methods: ['especes', 'wave', 'orange_money', 'carte', 'room_charge'],
    printer_names: ['Cuisine Le Jardin', 'Bar Jardin'],
    terminal_names: ['SoftPOS Jardin 1'],
    tax_profile: 'TVA 18%',
    created_at: now,
  },
  {
    id: 'pos-bar-machines',
    site_id: 'site-dakar',
    name: 'Bar des Machines à Sous',
    type: 'bar',
    default_warehouse_id: 'wh-bar-casino',
    is_active: true,
    payment_methods: ['especes', 'wave', 'orange_money', 'carte', 'room_charge'],
    printer_names: ['Bar Machines'],
    terminal_names: ['TPE Bar Casino'],
    tax_profile: 'TVA 18%',
    created_at: now,
  },
  {
    id: 'pos-nightclub',
    site_id: 'site-dakar',
    name: 'Night Club',
    type: 'nightclub',
    default_warehouse_id: 'wh-nightclub',
    is_active: true,
    payment_methods: ['especes', 'wave', 'orange_money', 'carte'],
    printer_names: ['Bar Night Club'],
    terminal_names: ['TPE Night Club'],
    tax_profile: 'TVA 18%',
    created_at: now,
  },
  {
    id: 'pos-room-service',
    site_id: 'site-dakar',
    name: 'Room Service',
    type: 'room_service',
    default_warehouse_id: 'wh-restaurant',
    is_active: true,
    payment_methods: ['room_charge', 'especes', 'carte'],
    printer_names: ['Room Service'],
    terminal_names: ['SoftPOS Room Service'],
    tax_profile: 'TVA 18%',
    created_at: now,
  },
  {
    id: 'pos-saly-bar',
    site_id: 'site-saly',
    name: 'Bar Saly',
    type: 'bar',
    default_warehouse_id: 'wh-saly-bar',
    is_active: true,
    payment_methods: ['especes', 'wave', 'orange_money', 'carte'],
    printer_names: ['Bar Saly'],
    terminal_names: ['TPE Saly'],
    tax_profile: 'TVA 18%',
    created_at: now,
  },
];

const products: HospiProduct[] = [
  {
    id: 'prod-thieboudienne',
    company_id: 'comp-sartal-demo',
    legacy_product_id: 'p1',
    name: 'Thiéboudienne',
    sku: 'PLAT-THIEB',
    category_id: 'plats',
    unit: 'portion',
    is_stockable: false,
    is_active: true,
    created_at: now,
  },
  {
    id: 'prod-coca-33',
    company_id: 'comp-sartal-demo',
    legacy_product_id: 'p10',
    name: 'Coca-Cola 33 cl',
    sku: 'COCA-33',
    category_id: 'boissons',
    unit: 'bouteille',
    is_stockable: true,
    is_active: true,
    primary_warehouse_id: 'wh-dakar-boissons',
    secondary_warehouse_id: 'wh-central',
    fallback_policy: 'use_secondary',
    average_purchase_price: 350,
    supplier_ids: ['sup-touba-distribution'],
    lot_number: 'COCA-DAK-001',
    created_at: now,
  },
  { id: 'ing-riz-brise', company_id: 'comp-sartal-demo', name: 'Riz brisé', sku: 'ING-RIZ', category_id: 'ingredient', unit: 'kg', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-epicerie', secondary_warehouse_id: 'wh-central', fallback_policy: 'use_secondary', average_purchase_price: 600, supplier_ids: ['sup-marche-sandaga'], lot_number: 'RIZ-001', created_at: now },
  { id: 'ing-poisson', company_id: 'comp-sartal-demo', name: 'Poisson frais', sku: 'ING-POISSON', category_id: 'ingredient', unit: 'kg', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-viandes', secondary_warehouse_id: 'wh-saly-congelateur', fallback_policy: 'block_sale', average_purchase_price: 1800, supplier_ids: ['sup-marche-sandaga'], lot_number: 'POIS-001', expires_at: new Date(Date.now() + 86400000 * 3).toISOString(), created_at: now },
  { id: 'ing-huile', company_id: 'comp-sartal-demo', name: 'Huile végétale', sku: 'ING-HUILE', category_id: 'ingredient', unit: 'L', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-epicerie', secondary_warehouse_id: 'wh-central', fallback_policy: 'use_secondary', average_purchase_price: 900, supplier_ids: ['sup-touba-distribution'], created_at: now },
  { id: 'ing-legumes', company_id: 'comp-sartal-demo', name: 'Légumes thieb', sku: 'ING-LEGUMES', category_id: 'ingredient', unit: 'kg', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-legumes', secondary_warehouse_id: 'wh-saly-cuisine', fallback_policy: 'block_sale', average_purchase_price: 700, supplier_ids: ['sup-marche-sandaga'], expires_at: new Date(Date.now() + 86400000 * 5).toISOString(), created_at: now },
  { id: 'ing-steak', company_id: 'comp-sartal-demo', name: 'Steak', sku: 'ING-STEAK', category_id: 'ingredient', unit: 'unité', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-viandes', secondary_warehouse_id: 'wh-saly-congelateur', fallback_policy: 'block_sale', average_purchase_price: 2200, supplier_ids: ['sup-marche-sandaga'], expires_at: new Date(Date.now() + 86400000 * 4).toISOString(), created_at: now },
  { id: 'ing-pommes-terre', company_id: 'comp-sartal-demo', name: 'Pommes de terre', sku: 'ING-PDT', category_id: 'ingredient', unit: 'kg', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-legumes', secondary_warehouse_id: 'wh-saly-cuisine', fallback_policy: 'use_secondary', average_purchase_price: 500, supplier_ids: ['sup-marche-sandaga'], created_at: now },
  { id: 'ing-sel', company_id: 'comp-sartal-demo', name: 'Sel', sku: 'ING-SEL', category_id: 'ingredient', unit: 'kg', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-dakar-epicerie', secondary_warehouse_id: 'wh-central', fallback_policy: 'use_secondary', average_purchase_price: 150, supplier_ids: ['sup-touba-distribution'], created_at: now },
];

const posProductPrices: POSProductPrice[] = [
  { id: 'price-thieb-jardin', pos_id: 'pos-restaurant-jardin', product_id: 'prod-thieboudienne', sale_price: 5000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-thieb-room', pos_id: 'pos-room-service', product_id: 'prod-thieboudienne', sale_price: 6000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-coca-jardin', pos_id: 'pos-restaurant-jardin', product_id: 'prod-coca-33', sale_price: 1500, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-coca-bar', pos_id: 'pos-bar-machines', product_id: 'prod-coca-33', sale_price: 2000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-coca-night', pos_id: 'pos-nightclub', product_id: 'prod-coca-33', sale_price: 2500, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-coca-room', pos_id: 'pos-room-service', product_id: 'prod-coca-33', sale_price: 1800, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-coca-saly-bar', pos_id: 'pos-saly-bar', product_id: 'prod-coca-33', sale_price: 2200, tax_rate: 18, is_available: true, created_at: now },
];

const stockLevels: StockLevel[] = [
  { id: 'stock-coca-resto', warehouse_id: 'wh-restaurant', product_id: 'prod-coca-33', quantity: 100, unit: 'bouteille', alert_threshold: 20, updated_at: now },
  { id: 'stock-coca-bar', warehouse_id: 'wh-bar-casino', product_id: 'prod-coca-33', quantity: 150, unit: 'bouteille', alert_threshold: 30, updated_at: now },
  { id: 'stock-coca-night', warehouse_id: 'wh-nightclub', product_id: 'prod-coca-33', quantity: 80, unit: 'bouteille', alert_threshold: 20, updated_at: now },
  { id: 'stock-coca-dakar-boissons', warehouse_id: 'wh-dakar-boissons', product_id: 'prod-coca-33', quantity: 210, unit: 'bouteille', alert_threshold: 30, updated_at: now },
  { id: 'stock-coca-saly-bar', warehouse_id: 'wh-saly-bar', product_id: 'prod-coca-33', quantity: 250, unit: 'bouteille', alert_threshold: 35, updated_at: now },
  { id: 'stock-riz-resto', warehouse_id: 'wh-restaurant', product_id: 'ing-riz-brise', quantity: 45, unit: 'kg', alert_threshold: 15, updated_at: now },
  { id: 'stock-riz-epicerie', warehouse_id: 'wh-dakar-epicerie', product_id: 'ing-riz-brise', quantity: 80, unit: 'kg', alert_threshold: 20, updated_at: now },
  { id: 'stock-poisson-resto', warehouse_id: 'wh-restaurant', product_id: 'ing-poisson', quantity: 22, unit: 'kg', alert_threshold: 8, updated_at: now },
  { id: 'stock-poisson-viandes', warehouse_id: 'wh-dakar-viandes', product_id: 'ing-poisson', quantity: 26, unit: 'kg', alert_threshold: 8, updated_at: now },
  { id: 'stock-huile-resto', warehouse_id: 'wh-restaurant', product_id: 'ing-huile', quantity: 18, unit: 'L', alert_threshold: 5, updated_at: now },
  { id: 'stock-huile-epicerie', warehouse_id: 'wh-dakar-epicerie', product_id: 'ing-huile', quantity: 36, unit: 'L', alert_threshold: 8, updated_at: now },
  { id: 'stock-legumes-resto', warehouse_id: 'wh-restaurant', product_id: 'ing-legumes', quantity: 28, unit: 'kg', alert_threshold: 10, updated_at: now },
  { id: 'stock-legumes-dakar', warehouse_id: 'wh-dakar-legumes', product_id: 'ing-legumes', quantity: 60, unit: 'kg', alert_threshold: 12, updated_at: now },
  { id: 'stock-steak-dakar', warehouse_id: 'wh-dakar-viandes', product_id: 'ing-steak', quantity: 48, unit: 'unité', alert_threshold: 10, updated_at: now },
  { id: 'stock-pdt-dakar', warehouse_id: 'wh-dakar-legumes', product_id: 'ing-pommes-terre', quantity: 70, unit: 'kg', alert_threshold: 14, updated_at: now },
  { id: 'stock-sel-dakar', warehouse_id: 'wh-dakar-epicerie', product_id: 'ing-sel', quantity: 12, unit: 'kg', alert_threshold: 2, updated_at: now },
];

const recipes: Recipe[] = [
  { id: 'recipe-thieb', product_id: 'prod-thieboudienne', name: 'Recette Thiéboudienne', created_at: now },
];

const recipeItems: RecipeItem[] = [
  { id: 'recipe-thieb-riz', recipe_id: 'recipe-thieb', ingredient_product_id: 'ing-riz-brise', quantity: 0.2, unit: 'kg' },
  { id: 'recipe-thieb-poisson', recipe_id: 'recipe-thieb', ingredient_product_id: 'ing-poisson', quantity: 0.3, unit: 'kg' },
  { id: 'recipe-thieb-huile', recipe_id: 'recipe-thieb', ingredient_product_id: 'ing-huile', quantity: 0.05, unit: 'L' },
  { id: 'recipe-thieb-legumes', recipe_id: 'recipe-thieb', ingredient_product_id: 'ing-legumes', quantity: 0.15, unit: 'kg' },
];

const productVariants: ProductVariant[] = [
  { id: 'variant-thieb-extra-poisson', product_id: 'prod-thieboudienne', name: 'Supplément poisson', price_delta: 1500, stock_delta_description: '+0,2 kg poisson frais', created_at: now },
  { id: 'variant-coca-grand-service', product_id: 'prod-coca-33', name: 'Service VIP glacé', price_delta: 500, stock_delta_description: '+1 bouteille Coca, glace suivie côté bar', created_at: now },
  { id: 'variant-whisky-double', product_id: 'prod-whisky', name: 'Double dose', price_delta: 9000, stock_delta_description: 'Consomme 2 doses au lieu de 1', created_at: now },
];

const unitConversions: UnitConversion[] = [
  { id: 'conv-coca-carton', product_id: 'prod-coca-33', from_unit: 'carton', to_unit: 'bouteille', factor: 24, example: '1 carton fournisseur = 24 bouteilles vendues' },
  { id: 'conv-riz-sac', product_id: 'ing-riz-brise', from_unit: 'sac 25 kg', to_unit: 'kg', factor: 25, example: '1 sac reçu = 25 kg disponibles' },
  { id: 'conv-huile-bidon', product_id: 'ing-huile', from_unit: 'bidon 20 L', to_unit: 'L', factor: 20, example: '1 bidon reçu = 20 litres en stock' },
  { id: 'conv-sel-gramme', product_id: 'ing-sel', from_unit: 'kg', to_unit: 'g', factor: 1000, example: '1 kg permet de consommer des grammes en recette' },
];

const stockReservations: StockReservation[] = [
  { id: 'res-room-201-minibar', product_id: 'prod-eau-minibar', warehouse_id: 'wh-minibar', quantity: 6, source_type: 'room_service', source_label: 'Mini-bar chambre 201 à contrôler', status: 'reserved', created_at: now },
  { id: 'res-banquet-coca', product_id: 'prod-coca-33', warehouse_id: 'wh-dakar-boissons', quantity: 48, source_type: 'event', source_label: 'Banquet corporate ce soir', status: 'reserved', created_at: now },
];

const internalConsumptions: InternalConsumption[] = [
  { id: 'ic-staff-coca', product_id: 'prod-coca-33', warehouse_id: 'wh-restaurant', quantity: 8, reason: 'personnel', created_by: 'Chef de rang', created_at: now },
  { id: 'ic-vip-champagne', product_id: 'prod-champagne', warehouse_id: 'wh-nightclub', quantity: 1, reason: 'vip', created_by: 'Direction', created_at: now },
];

const stockPolicy: StockPolicy = {
  allow_negative_stock: false,
  auto_transfer_enabled: true,
  fifo_enabled: true,
  reserve_before_preparation: true,
};

const configDrafts: ConfigDraft[] = [
  { id: 'draft-price-coca-night', title: 'Prix Coca Night Club', module: 'Prix POS', change_type: 'price', before_value: '2500 F', after_value: '2800 F', status: 'draft', created_by: 'Admin', created_at: now },
  { id: 'draft-rooftop-pos', title: 'Nouveau POS Rooftop', module: 'POS', change_type: 'pos', before_value: 'Aucun', after_value: 'POS Rooftop Bar', status: 'tested', created_by: 'Direction', tested_at: now, created_at: now },
];

const configHistoryEntries: ConfigHistoryEntry[] = [
  { id: 'hist-roomcharge-spa', title: 'Room charge Spa', module: 'PMS', before_value: 'Inactif', after_value: 'Actif', actor: 'Manager Hôtel', created_at: now },
  { id: 'hist-depot-night', title: 'Dépôt Night Club', module: 'Stock', before_value: 'Casino', after_value: 'Dépôt Night Club', actor: 'Direction', created_at: now },
];

const permissionPolicies: PermissionPolicy[] = [
  { id: 'perm-admin-all', role: 'Admin', action: 'Tout gérer', mode: 'allow', updated_at: now },
  { id: 'perm-gerant-all', role: 'Gérant', action: 'Tout gérer', mode: 'allow', updated_at: now },
  { id: 'perm-direction-all', role: 'Direction', action: 'Tout gérer', mode: 'allow', updated_at: now },
  { id: 'perm-manager-discount', role: 'Manager', action: 'Remise', mode: 'allow', updated_at: now },
  { id: 'perm-serveur-discount', role: 'Serveur', action: 'Remise', mode: 'manager', updated_at: now },
  { id: 'perm-caissier-cash', role: 'Caissier', action: 'Encaisser', mode: 'allow', updated_at: now },
  { id: 'perm-caissier-pms', role: 'Caissier', action: 'PMS hôtel', mode: 'allow', updated_at: now },
  { id: 'perm-chef-stock', role: 'Chef cuisine', action: 'Stock', mode: 'allow', updated_at: now },
  { id: 'perm-chef-inventory', role: 'Chef cuisine', action: 'Corriger inventaire', mode: 'manager', updated_at: now },
];

const taxProfiles: TaxProfile[] = [
  { id: 'tax-restaurant', name: 'Restaurant', module: 'Restaurant', rate: 18, detail: 'Plats, boissons et room service restaurant.', is_active: true, updated_at: now },
  { id: 'tax-hotel', name: 'Hébergement', module: 'Hôtel', rate: 18, detail: 'Chambres, nuitées, forfaits et folios.', is_active: true, updated_at: now },
  { id: 'tax-premium-bar', name: 'Alcool premium', module: 'Bar', rate: 18, detail: 'Bar, nightclub, cave premium.', is_active: true, updated_at: now },
  { id: 'tax-casino', name: 'Casino', module: 'Casino', rate: 0, detail: 'Jeux, services casino et audit renforcé.', is_active: true, updated_at: now },
];

const approvalRequests: ApprovalRequest[] = [
  { id: 'approval-discount-demo', title: 'Remise forte restaurant', detail: 'Remise supérieure au seuil serveur.', module: 'POS', status: 'pending', requested_by: 'Awa Fall', created_at: now },
  { id: 'approval-stock-demo', title: 'Correction inventaire cave', detail: 'Écart stock Champagne à valider.', module: 'Stock', status: 'pending', requested_by: 'Responsable Stock', created_at: now },
];

const adminEnvironments: AdminEnvironment[] = [
  { id: 'env-demo', name: 'Démo', status: 'active', detail: 'Données riches pour présentation et formation.', updated_at: now },
  { id: 'env-training', name: 'Formation', status: 'ready', detail: 'Même configuration, ventes et stocks sans impact réel.', updated_at: now },
  { id: 'env-production', name: 'Production', status: 'protected', detail: 'Publication contrôlée, audit obligatoire, sauvegarde avant changement.', updated_at: now },
];

const parseSimpleCsv = (csv: string) => {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(header => header.trim());
  return lines.slice(1).map(line => {
    const values = line.split(';').map(value => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
};

const rooms: Room[] = [
  { id: 'room-101', site_id: 'site-dakar', room_number: '101', room_type: 'Deluxe', status: 'occupied', created_at: now },
  { id: 'room-102', site_id: 'site-dakar', room_number: '102', room_type: 'Standard', status: 'available', created_at: now },
];

const guests: HotelGuest[] = [
  {
    id: 'guest-test',
    company_id: 'comp-sartal-demo',
    first_name: 'Aminata',
    last_name: 'Ndiaye',
    phone: '+221 77 000 00 00',
    email: 'aminata.ndiaye@example.com',
    created_at: now,
  },
];

const stays: Stay[] = [
  {
    id: 'stay-101-active',
    room_id: 'room-101',
    guest_id: 'guest-test',
    check_in_date: new Date(Date.now() - 86400000).toISOString(),
    check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'checked_in',
    created_at: now,
  },
];

const folios: Folio[] = [
  {
    id: 'folio-101-open',
    stay_id: 'stay-101-active',
    guest_id: 'guest-test',
    room_id: 'room-101',
    status: 'open',
    total_amount: 0,
    created_at: now,
  },
];

const customerAccounts: CustomerAccount[] = [
  {
    id: 'account-guest-aminata',
    company_id: 'comp-sartal-demo',
    display_name: 'Aminata Ndiaye',
    type: 'vip',
    phone: '+221 77 000 00 00',
    email: 'aminata.ndiaye@example.com',
    hotel_guest_id: 'guest-test',
    credit_limit: 250000,
    balance: 0,
    is_active: true,
    created_at: now,
  },
  {
    id: 'account-corporate-teranga',
    company_id: 'comp-sartal-demo',
    display_name: 'Teranga Events',
    type: 'corporate',
    phone: '+221 33 800 10 10',
    email: 'finance@teranga-events.sn',
    credit_limit: 1500000,
    balance: 185000,
    is_active: true,
    created_at: now,
  },
];

const customerLedgerEntries: CustomerLedgerEntry[] = [
  {
    id: 'ledger-teranga-opening',
    account_id: 'account-corporate-teranga',
    source_type: 'manual_charge',
    source_id: 'opening-balance',
    description: 'Solde banquet corporate',
    debit: 185000,
    credit: 0,
    created_at: now,
  },
];

const cashRegisters: CashRegister[] = [
  { id: 'reg-jardin-main', pos_id: 'pos-restaurant-jardin', name: 'Caisse Restaurant', is_active: true, created_at: now },
  { id: 'reg-bar-main', pos_id: 'pos-bar-machines', name: 'Caisse Bar Casino', is_active: true, created_at: now },
  { id: 'reg-night-main', pos_id: 'pos-nightclub', name: 'Caisse Night Club', is_active: true, created_at: now },
  { id: 'reg-room-main', pos_id: 'pos-room-service', name: 'Caisse Room Service', is_active: true, created_at: now },
];

const suppliers: Supplier[] = [
  {
    id: 'sup-touba-distribution',
    company_id: 'comp-sartal-demo',
    name: 'Touba Distribution',
    phone: '+221 77 123 45 67',
    email: 'contact@touba-distribution.sn',
    address: 'Dakar',
    is_active: true,
    created_at: now,
  },
  {
    id: 'sup-marche-sandaga',
    company_id: 'comp-sartal-demo',
    name: 'Marché Sandaga',
    phone: '+221 76 222 33 44',
    address: 'Plateau, Dakar',
    is_active: true,
    created_at: now,
  },
];

const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-demo-central',
    supplier_id: 'sup-touba-distribution',
    warehouse_id: 'wh-central',
    status: 'ordered',
    ordered_by: 'Cheikh Fall',
    expected_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: now,
  },
];

const purchaseOrderLines: PurchaseOrderLine[] = [
  { id: 'po-line-coca', purchase_order_id: 'po-demo-central', product_id: 'prod-coca-33', quantity_ordered: 120, quantity_received: 0, unit_cost: 350 },
  { id: 'po-line-riz', purchase_order_id: 'po-demo-central', product_id: 'ing-riz-brise', quantity_ordered: 50, quantity_received: 0, unit_cost: 600 },
];

const demoWarehouses: Warehouse[] = [
  { id: 'wh-spa', site_id: 'site-dakar', name: 'Dépôt Spa & Bien-être', type: 'boutique', is_active: true, created_at: now },
  { id: 'wh-boutique', site_id: 'site-dakar', name: 'Dépôt Boutique Hôtel', type: 'boutique', is_active: true, created_at: now },
  { id: 'wh-casino-cage', site_id: 'site-dakar', name: 'Cage Casino', type: 'casino', is_active: true, created_at: now },
  { id: 'wh-cave-premium', site_id: 'site-dakar', name: 'Cave Premium', type: 'bar', is_active: true, created_at: now },
  { id: 'wh-minibar', site_id: 'site-dakar', name: 'Dépôt Mini-bar', type: 'central', is_active: true, created_at: now },
  { id: 'wh-housekeeping', site_id: 'site-dakar', name: 'Dépôt Housekeeping', type: 'other', is_active: true, created_at: now },
];

const demoPOS: POS[] = [
  { id: 'pos-casino-floor', site_id: 'site-dakar', name: 'Casino Floor', type: 'casino', default_warehouse_id: 'wh-casino-cage', is_active: true, payment_methods: ['especes', 'carte', 'jetons'], printer_names: ['Caisse Casino'], terminal_names: ['TPE Casino 1'], tax_profile: 'Jeux / TVA spécifique', created_at: now },
  { id: 'pos-spa-wellness', site_id: 'site-dakar', name: 'Spa Bien-être', type: 'spa', default_warehouse_id: 'wh-spa', is_active: true, payment_methods: ['especes', 'wave', 'carte', 'room_charge'], printer_names: ['Spa'], terminal_names: ['TPE Spa'], tax_profile: 'TVA 18%', created_at: now },
  { id: 'pos-boutique-hotel', site_id: 'site-dakar', name: 'Boutique Hôtel', type: 'boutique', default_warehouse_id: 'wh-boutique', is_active: true, payment_methods: ['especes', 'wave', 'orange_money', 'carte', 'room_charge'], printer_names: ['Boutique'], terminal_names: ['TPE Boutique'], tax_profile: 'TVA 18%', created_at: now },
  { id: 'pos-minibar', site_id: 'site-dakar', name: 'Mini-bar Hôtel', type: 'room_service', default_warehouse_id: 'wh-minibar', is_active: true, payment_methods: ['room_charge'], printer_names: ['Réception'], terminal_names: ['PMS'], tax_profile: 'TVA 18%', created_at: now },
];

const demoProducts: HospiProduct[] = [
  { id: 'prod-massage-60', company_id: 'comp-sartal-demo', name: 'Massage relaxant 60 min', sku: 'SPA-MASS60', category_id: 'spa', unit: 'prestation', is_stockable: false, is_active: true, created_at: now },
  { id: 'prod-hammam', company_id: 'comp-sartal-demo', name: 'Hammam traditionnel', sku: 'SPA-HAMMAM', category_id: 'spa', unit: 'prestation', is_stockable: false, is_active: true, created_at: now },
  { id: 'prod-soin-visage', company_id: 'comp-sartal-demo', name: 'Soin visage premium', sku: 'SPA-VISAGE', category_id: 'spa', unit: 'prestation', is_stockable: false, is_active: true, created_at: now },
  { id: 'prod-huile-massage', company_id: 'comp-sartal-demo', name: 'Huile de massage', sku: 'SPA-HUILE', category_id: 'consommable_spa', unit: 'flacon', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-spa', fallback_policy: 'block_sale', average_purchase_price: 4500, created_at: now },
  { id: 'prod-peignoir', company_id: 'comp-sartal-demo', name: 'Peignoir hôtel', sku: 'BOUT-PEIGNOIR', category_id: 'boutique', unit: 'unité', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-boutique', fallback_policy: 'block_sale', average_purchase_price: 9000, created_at: now },
  { id: 'prod-casquette', company_id: 'comp-sartal-demo', name: 'Casquette resort', sku: 'BOUT-CAP', category_id: 'boutique', unit: 'unité', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-boutique', fallback_policy: 'block_sale', average_purchase_price: 2500, created_at: now },
  { id: 'prod-carte-souvenir', company_id: 'comp-sartal-demo', name: 'Carte souvenir Dakar', sku: 'BOUT-CARTE', category_id: 'boutique', unit: 'unité', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-boutique', fallback_policy: 'block_sale', average_purchase_price: 400, created_at: now },
  { id: 'prod-champagne', company_id: 'comp-sartal-demo', name: 'Champagne Brut 75 cl', sku: 'BAR-CHAMP', category_id: 'boissons_premium', unit: 'bouteille', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-cave-premium', secondary_warehouse_id: 'wh-nightclub', fallback_policy: 'use_secondary', average_purchase_price: 18000, created_at: now },
  { id: 'prod-whisky', company_id: 'comp-sartal-demo', name: 'Whisky Premium 70 cl', sku: 'BAR-WHISKY', category_id: 'boissons_premium', unit: 'bouteille', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-cave-premium', secondary_warehouse_id: 'wh-bar-casino', fallback_policy: 'use_secondary', average_purchase_price: 14500, created_at: now },
  { id: 'prod-eau-minibar', company_id: 'comp-sartal-demo', name: 'Eau mini-bar 50 cl', sku: 'MINI-EAU', category_id: 'minibar', unit: 'bouteille', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-minibar', fallback_policy: 'block_sale', average_purchase_price: 250, created_at: now },
  { id: 'prod-snack-minibar', company_id: 'comp-sartal-demo', name: 'Snack mini-bar', sku: 'MINI-SNACK', category_id: 'minibar', unit: 'unité', is_stockable: true, is_active: true, primary_warehouse_id: 'wh-minibar', fallback_policy: 'block_sale', average_purchase_price: 700, created_at: now },
  { id: 'prod-jetons-vip', company_id: 'comp-sartal-demo', name: 'Pack jetons VIP', sku: 'CAS-JETVIP', category_id: 'casino', unit: 'pack', is_stockable: false, is_active: true, created_at: now },
  { id: 'prod-service-casino', company_id: 'comp-sartal-demo', name: 'Service table casino', sku: 'CAS-SERVICE', category_id: 'casino', unit: 'prestation', is_stockable: false, is_active: true, created_at: now },
];

const demoPrices: POSProductPrice[] = [
  { id: 'price-massage-spa', pos_id: 'pos-spa-wellness', product_id: 'prod-massage-60', sale_price: 45000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-hammam-spa', pos_id: 'pos-spa-wellness', product_id: 'prod-hammam', sale_price: 30000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-soin-spa', pos_id: 'pos-spa-wellness', product_id: 'prod-soin-visage', sale_price: 55000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-peignoir-boutique', pos_id: 'pos-boutique-hotel', product_id: 'prod-peignoir', sale_price: 18000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-casquette-boutique', pos_id: 'pos-boutique-hotel', product_id: 'prod-casquette', sale_price: 7500, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-carte-boutique', pos_id: 'pos-boutique-hotel', product_id: 'prod-carte-souvenir', sale_price: 1500, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-champagne-night', pos_id: 'pos-nightclub', product_id: 'prod-champagne', sale_price: 60000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-champagne-casino', pos_id: 'pos-casino-floor', product_id: 'prod-champagne', sale_price: 65000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-whisky-bar', pos_id: 'pos-bar-machines', product_id: 'prod-whisky', sale_price: 45000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-whisky-casino', pos_id: 'pos-casino-floor', product_id: 'prod-whisky', sale_price: 50000, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-eau-minibar', pos_id: 'pos-minibar', product_id: 'prod-eau-minibar', sale_price: 1200, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-snack-minibar', pos_id: 'pos-minibar', product_id: 'prod-snack-minibar', sale_price: 2500, tax_rate: 18, is_available: true, created_at: now },
  { id: 'price-jetons-casino', pos_id: 'pos-casino-floor', product_id: 'prod-jetons-vip', sale_price: 100000, tax_rate: 0, is_available: true, created_at: now },
  { id: 'price-service-casino', pos_id: 'pos-casino-floor', product_id: 'prod-service-casino', sale_price: 25000, tax_rate: 18, is_available: true, created_at: now },
];

const demoStockLevels: StockLevel[] = [
  { id: 'stock-huile-spa', warehouse_id: 'wh-spa', product_id: 'prod-huile-massage', quantity: 42, unit: 'flacon', alert_threshold: 10, updated_at: now },
  { id: 'stock-peignoir-boutique', warehouse_id: 'wh-boutique', product_id: 'prod-peignoir', quantity: 28, unit: 'unité', alert_threshold: 6, updated_at: now },
  { id: 'stock-casquette-boutique', warehouse_id: 'wh-boutique', product_id: 'prod-casquette', quantity: 75, unit: 'unité', alert_threshold: 15, updated_at: now },
  { id: 'stock-carte-boutique', warehouse_id: 'wh-boutique', product_id: 'prod-carte-souvenir', quantity: 180, unit: 'unité', alert_threshold: 30, updated_at: now },
  { id: 'stock-champagne-cave', warehouse_id: 'wh-cave-premium', product_id: 'prod-champagne', quantity: 34, unit: 'bouteille', alert_threshold: 8, updated_at: now },
  { id: 'stock-champagne-night', warehouse_id: 'wh-nightclub', product_id: 'prod-champagne', quantity: 12, unit: 'bouteille', alert_threshold: 5, updated_at: now },
  { id: 'stock-whisky-cave', warehouse_id: 'wh-cave-premium', product_id: 'prod-whisky', quantity: 26, unit: 'bouteille', alert_threshold: 6, updated_at: now },
  { id: 'stock-whisky-bar', warehouse_id: 'wh-bar-casino', product_id: 'prod-whisky', quantity: 10, unit: 'bouteille', alert_threshold: 4, updated_at: now },
  { id: 'stock-eau-minibar', warehouse_id: 'wh-minibar', product_id: 'prod-eau-minibar', quantity: 240, unit: 'bouteille', alert_threshold: 50, updated_at: now },
  { id: 'stock-snack-minibar', warehouse_id: 'wh-minibar', product_id: 'prod-snack-minibar', quantity: 160, unit: 'unité', alert_threshold: 40, updated_at: now },
];

const demoRooms: Room[] = [
  { id: 'room-103', site_id: 'site-dakar', room_number: '103', room_type: 'Standard', status: 'cleaning', created_at: now },
  { id: 'room-104', site_id: 'site-dakar', room_number: '104', room_type: 'Standard', status: 'available', created_at: now },
  { id: 'room-105', site_id: 'site-dakar', room_number: '105', room_type: 'Suite', status: 'occupied', created_at: now },
  { id: 'room-201', site_id: 'site-dakar', room_number: '201', room_type: 'Deluxe', status: 'occupied', created_at: now },
  { id: 'room-202', site_id: 'site-dakar', room_number: '202', room_type: 'Deluxe', status: 'available', created_at: now },
  { id: 'room-203', site_id: 'site-dakar', room_number: '203', room_type: 'Suite', status: 'maintenance', created_at: now },
  { id: 'room-301', site_id: 'site-dakar', room_number: '301', room_type: 'Villa', status: 'occupied', created_at: now },
  { id: 'room-302', site_id: 'site-dakar', room_number: '302', room_type: 'Villa', status: 'available', created_at: now },
];

const demoGuests: HotelGuest[] = [
  { id: 'guest-jean-dupont', company_id: 'comp-sartal-demo', first_name: 'Jean', last_name: 'Dupont', phone: '+33 6 11 22 33 44', email: 'jean.dupont@example.com', created_at: now },
  { id: 'guest-aicha-diallo', company_id: 'comp-sartal-demo', first_name: 'Aicha', last_name: 'Diallo', phone: '+221 77 444 55 66', email: 'aicha.diallo@example.com', created_at: now },
  { id: 'guest-corporate-lee', company_id: 'comp-sartal-demo', first_name: 'Daniel', last_name: 'Lee', phone: '+44 7700 900123', email: 'daniel.lee@example.com', created_at: now },
];

const demoStays: Stay[] = [
  { id: 'stay-105-active', room_id: 'room-105', guest_id: 'guest-jean-dupont', check_in_date: new Date(Date.now() - 86400000 * 2).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'checked_in', created_at: now },
  { id: 'stay-201-active', room_id: 'room-201', guest_id: 'guest-aicha-diallo', check_in_date: new Date(Date.now() - 86400000).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 1).toISOString(), status: 'checked_in', created_at: now },
  { id: 'stay-301-active', room_id: 'room-301', guest_id: 'guest-corporate-lee', check_in_date: new Date(Date.now() - 86400000 * 3).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'checked_in', created_at: now },
];

const demoFolios: Folio[] = [
  { id: 'folio-105-open', stay_id: 'stay-105-active', guest_id: 'guest-jean-dupont', room_id: 'room-105', status: 'open', total_amount: 83000, created_at: now },
  { id: 'folio-201-open', stay_id: 'stay-201-active', guest_id: 'guest-aicha-diallo', room_id: 'room-201', status: 'open', total_amount: 47500, created_at: now },
  { id: 'folio-301-open', stay_id: 'stay-301-active', guest_id: 'guest-corporate-lee', room_id: 'room-301', status: 'open', total_amount: 165000, created_at: now },
];

const demoFolioLines: FolioLine[] = [
  { id: 'folio-line-105-spa', folio_id: 'folio-105-open', source_type: 'room_service', source_id: 'pos-spa-wellness', description: 'Massage relaxant 60 min', amount: 45000, created_at: now },
  { id: 'folio-line-105-bar', folio_id: 'folio-105-open', source_type: 'pos_order', source_id: 'ord-demo-bar-105', description: 'Whisky Premium - Bar Casino', amount: 38000, created_at: now },
  { id: 'folio-line-201-minibar', folio_id: 'folio-201-open', source_type: 'room_service', source_id: 'pos-minibar', description: 'Mini-bar chambre 201', amount: 7500, created_at: now },
  { id: 'folio-line-201-boutique', folio_id: 'folio-201-open', source_type: 'pos_order', source_id: 'ord-demo-boutique-201', description: 'Boutique Hôtel', amount: 40000, created_at: now },
  { id: 'folio-line-301-casino', folio_id: 'folio-301-open', source_type: 'pos_order', source_id: 'ord-demo-casino-301', description: 'Pack jetons VIP', amount: 100000, created_at: now },
  { id: 'folio-line-301-champagne', folio_id: 'folio-301-open', source_type: 'pos_order', source_id: 'ord-demo-night-301', description: 'Champagne Night Club', amount: 65000, created_at: now },
];

const demoCustomerAccounts: CustomerAccount[] = [
  { id: 'account-guest-jean', company_id: 'comp-sartal-demo', display_name: 'Jean Dupont', type: 'vip', phone: '+33 6 11 22 33 44', email: 'jean.dupont@example.com', hotel_guest_id: 'guest-jean-dupont', credit_limit: 500000, balance: 83000, is_active: true, created_at: now },
  { id: 'account-guest-aicha', company_id: 'comp-sartal-demo', display_name: 'Aicha Diallo', type: 'guest', phone: '+221 77 444 55 66', email: 'aicha.diallo@example.com', hotel_guest_id: 'guest-aicha-diallo', credit_limit: 250000, balance: 47500, is_active: true, created_at: now },
  { id: 'account-guest-lee', company_id: 'comp-sartal-demo', display_name: 'Daniel Lee', type: 'corporate', phone: '+44 7700 900123', email: 'daniel.lee@example.com', hotel_guest_id: 'guest-corporate-lee', credit_limit: 1200000, balance: 165000, is_active: true, created_at: now },
];

const demoCustomerLedgerEntries: CustomerLedgerEntry[] = [
  { id: 'ledger-jean-folio', account_id: 'account-guest-jean', source_type: 'folio', source_id: 'folio-105-open', description: 'Consommations Spa et Bar Casino', debit: 83000, credit: 0, created_at: now },
  { id: 'ledger-aicha-folio', account_id: 'account-guest-aicha', source_type: 'folio', source_id: 'folio-201-open', description: 'Mini-bar et Boutique Hôtel', debit: 47500, credit: 0, created_at: now },
  { id: 'ledger-lee-folio', account_id: 'account-guest-lee', source_type: 'folio', source_id: 'folio-301-open', description: 'Casino et Night Club', debit: 165000, credit: 0, created_at: now },
];

const mergeById = <T extends { id: string }>(seeded: T[], persisted?: T[]) => {
  const merged = [...(persisted || [])];
  seeded.forEach(item => {
    if (!merged.some(existing => existing.id === item.id)) merged.push(item);
  });
  return merged;
};

interface HospiState {
  companies: Company[];
  sites: Site[];
  posList: POS[];
  warehouses: Warehouse[];
  products: HospiProduct[];
  posProductPrices: POSProductPrice[];
  stockLevels: StockLevel[];
  stockMovements: StockMovement[];
  rooms: Room[];
  guests: HotelGuest[];
  stays: Stay[];
  folios: Folio[];
  folioLines: FolioLine[];
  customerAccounts: CustomerAccount[];
  customerLedgerEntries: CustomerLedgerEntry[];
  cashRegisters: CashRegister[];
  cashSessions: CashSession[];
  recipes: Recipe[];
  recipeItems: RecipeItem[];
  productionBatches: ProductionBatch[];
  productVariants: ProductVariant[];
  unitConversions: UnitConversion[];
  stockReservations: StockReservation[];
  internalConsumptions: InternalConsumption[];
  stockPolicy: StockPolicy;
  configDrafts: ConfigDraft[];
  configHistoryEntries: ConfigHistoryEntry[];
  permissionPolicies: PermissionPolicy[];
  taxProfiles: TaxProfile[];
  approvalRequests: ApprovalRequest[];
  configSnapshots: ConfigSnapshot[];
  adminEnvironments: AdminEnvironment[];
  importReports: ImportReport[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  supplierReceipts: SupplierReceipt[];
  stockLots: StockLot[];
  activePOSId: string;
  setActivePOS: (posId: string) => void;
  addSite: (input: Omit<Site, 'id' | 'created_at'>) => Site;
  updateSite: (siteId: string, input: Partial<Omit<Site, 'id' | 'created_at'>>) => Site | null;
  deleteSite: (siteId: string) => boolean;
  addPOS: (input: Omit<POS, 'id' | 'created_at'>) => POS;
  updatePOS: (posId: string, input: Partial<Omit<POS, 'id' | 'created_at'>>) => POS | null;
  deletePOS: (posId: string) => boolean;
  addWarehouse: (input: Omit<Warehouse, 'id' | 'created_at'>) => Warehouse;
  updateWarehouse: (warehouseId: string, input: Partial<Omit<Warehouse, 'id' | 'created_at'>>) => Warehouse | null;
  deleteWarehouse: (warehouseId: string) => boolean;
  addProduct: (input: Omit<HospiProduct, 'id' | 'created_at'> & { initial_warehouse_id?: string; initial_quantity?: number; alert_threshold?: number }) => HospiProduct;
  updateProduct: (productId: string, input: Partial<Omit<HospiProduct, 'id' | 'created_at'>>) => HospiProduct | null;
  deleteProduct: (productId: string) => boolean;
  upsertPOSProductPrice: (input: Omit<POSProductPrice, 'id' | 'created_at'>) => POSProductPrice;
  deletePOSProductPrice: (priceId: string) => boolean;
  upsertRecipe: (productId: string, name?: string) => Recipe;
  addRecipeItem: (input: Omit<RecipeItem, 'id'>) => RecipeItem;
  getActivePOS: () => POS | undefined;
  getActiveWarehouse: () => Warehouse | undefined;
  getProductsForPOS: (posId?: string) => POSProduct[];
  getPriceForProduct: (productId: string, posId?: string) => POSProductPrice | undefined;
  getStockLevel: (productId: string, warehouseId: string) => StockLevel | undefined;
  getRecipeForProduct: (productId: string) => { recipe: Recipe; items: RecipeItem[] } | undefined;
  recordSale: (orderId: string, lines: SaleLineInput[], createdBy?: string, posId?: string) => StockMovement[];
  createConfigDraft: (input: Omit<ConfigDraft, 'id' | 'status' | 'created_at'> & { status?: ConfigDraftStatus }) => ConfigDraft;
  testConfigDraft: (draftId: string) => ConfigDraft | null;
  publishConfigDraft: (draftId: string, actor: string) => ConfigDraft | null;
  duplicatePOSConfig: (posId: string, name: string) => POS | null;
  createBusinessPack: (type: POSType, siteId: string, label: string) => { pos: POS; warehouse: Warehouse } | null;
  setPermissionPolicy: (role: string, action: string, mode: PermissionMode) => PermissionPolicy;
  getPermissionMode: (role: string, action: string) => PermissionMode | undefined;
  upsertTaxProfile: (input: Omit<TaxProfile, 'id' | 'updated_at'> & { id?: string }) => TaxProfile;
  createApprovalRequest: (input: Omit<ApprovalRequest, 'id' | 'status' | 'created_at'>) => ApprovalRequest;
  resolveApprovalRequest: (approvalId: string, status: Exclude<ApprovalStatus, 'pending'>, actor: string) => ApprovalRequest | null;
  createConfigSnapshot: (name: string, createdBy: string) => ConfigSnapshot;
  restoreConfigSnapshot: (snapshotId: string, actor: string) => boolean;
  getCriticalConfigAlerts: () => Array<{ title: string; detail: string }>;
  importAdminCsv: (kind: ImportReport['kind'], csv: string, createdBy: string) => ImportReport;
  recordProduction: (productId: string, warehouseId: string, quantity: number, createdBy: string) => ProductionBatch | null;
  reserveStock: (productId: string, warehouseId: string, quantity: number, sourceLabel: string) => StockReservation | null;
  recordInternalConsumption: (productId: string, warehouseId: string, quantity: number, reason: InternalConsumption['reason'], createdBy: string) => StockMovement | null;
  transferStock: (productId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number, reason: string, createdBy: string) => StockMovement[];
  adjustInventory: (productId: string, warehouseId: string, countedQuantity: number, reason: string, createdBy: string) => StockMovement | null;
  recordLoss: (productId: string, warehouseId: string, quantity: number, reason: string, createdBy: string) => StockMovement | null;
  addPurchaseOrder: (input: {
    supplier_id: string;
    warehouse_id: string;
    ordered_by: string;
    expected_at?: string;
    lines: Array<{ product_id: string; quantity_ordered: number; unit_cost: number; lot_number?: string; expires_at?: string }>;
  }) => PurchaseOrder | null;
  updatePurchaseOrder: (purchaseOrderId: string, input: {
    supplier_id?: string;
    warehouse_id?: string;
    expected_at?: string;
    lines?: Array<{ product_id: string; quantity_ordered: number; unit_cost: number; lot_number?: string; expires_at?: string }>;
  }) => PurchaseOrder | null;
  receivePurchaseOrderLines: (purchaseOrderId: string, receivedBy: string, receivedQuantities: Record<string, number>) => SupplierReceipt | null;
  receivePurchaseOrder: (purchaseOrderId: string, receivedBy: string) => SupplierReceipt | null;
  updateStockThreshold: (productId: string, warehouseId: string, alertThreshold: number) => StockLevel | null;
  getRegisterForPOS: (posId?: string) => CashRegister | undefined;
  getOpenCashSession: (posId?: string) => CashSession | undefined;
  openCashSession: (posId: string, openedBy: string, openingFloat: number) => CashSession | null;
  closeCashSession: (sessionId: string, closedBy: string, closingCashCount: number, expectedCash: number) => CashSession | null;
  getOccupiedRoomsWithOpenFolios: () => { room: Room; guest: HotelGuest; stay: Stay; folio: Folio }[];
  getCustomerAccountBalance: (accountId: string) => number;
  settleCustomerAccount: (accountId: string, amount: number, method: PaymentMethod, createdBy: string) => CustomerLedgerEntry | null;
  updateRoomStatus: (roomId: string, status: RoomStatus) => Room | null;
  addManualFolioCharge: (folioId: string, description: string, amount: number, createdBy: string) => FolioLine | null;
  closeFolio: (folioId: string, closedBy: string) => Folio | null;
  chargeOrderToRoom: (roomId: string, orderId: string, description: string, amount: number) => FolioLine | null;
}

export const useHospiStore = create<HospiState>()(
  persist(
    (set, get) => ({
      companies,
      sites,
      posList: [...posList, ...demoPOS],
      warehouses: [...warehouses, ...demoWarehouses],
      products: [...products, ...demoProducts],
      posProductPrices: [...posProductPrices, ...demoPrices],
      stockLevels: [...stockLevels, ...demoStockLevels],
      stockMovements: [],
      stockLots: [],
      rooms: [...rooms, ...demoRooms],
      guests: [...guests, ...demoGuests],
      stays: [...stays, ...demoStays],
      folios: [...folios, ...demoFolios],
      folioLines: demoFolioLines,
      customerAccounts: [...customerAccounts, ...demoCustomerAccounts],
      customerLedgerEntries: [...customerLedgerEntries, ...demoCustomerLedgerEntries],
      cashRegisters,
      cashSessions: [],
      recipes,
      recipeItems,
      productionBatches: [],
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
      configSnapshots: [],
      adminEnvironments,
      importReports: [],
      suppliers,
      purchaseOrders,
      purchaseOrderLines,
      supplierReceipts: [],
      activePOSId: 'pos-restaurant-jardin',

      setActivePOS: (posId) => set({ activePOSId: posId }),
      addSite: (input) => {
        const state = get();
        const site: Site = {
          ...input,
          id: `site-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString(),
        };
        set({ sites: [...state.sites, site] });
        return site;
      },
      updateSite: (siteId, input) => {
        const state = get();
        const site = state.sites.find(item => item.id === siteId);
        if (!site) return null;
        const updated: Site = { ...site, ...input };
        set({ sites: state.sites.map(item => item.id === siteId ? updated : item) });
        return updated;
      },
      deleteSite: (siteId) => {
        const state = get();
        const linked = state.posList.some(pos => pos.site_id === siteId)
          || state.warehouses.some(warehouse => warehouse.site_id === siteId)
          || state.rooms.some(room => room.site_id === siteId);
        if (linked) return false;
        set({ sites: state.sites.filter(item => item.id !== siteId) });
        return true;
      },
      addPOS: (input) => {
        const state = get();
        const createdAt = new Date().toISOString();
        const pos: POS = {
          ...input,
          id: `pos-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: createdAt,
        };
        const register: CashRegister = {
          id: `reg-${pos.id}`,
          pos_id: pos.id,
          name: `Caisse ${pos.name}`,
          is_active: true,
          created_at: createdAt,
        };
        set({
          posList: [...state.posList, pos],
          cashRegisters: [...state.cashRegisters, register],
        });
        return pos;
      },
      updatePOS: (posId, input) => {
        const state = get();
        const pos = state.posList.find(item => item.id === posId);
        if (!pos) return null;
        const updated: POS = { ...pos, ...input };
        set({ posList: state.posList.map(item => item.id === posId ? updated : item) });
        return updated;
      },
      deletePOS: (posId) => {
        const state = get();
        const pos = state.posList.find(item => item.id === posId);
        if (!pos) return false;
        const nextPOS = state.posList.filter(item => item.id !== posId);
        set({
          posList: nextPOS,
          posProductPrices: state.posProductPrices.filter(price => price.pos_id !== posId),
          cashRegisters: state.cashRegisters.filter(register => register.pos_id !== posId),
          activePOSId: state.activePOSId === posId ? nextPOS[0]?.id || '' : state.activePOSId,
        });
        return true;
      },
      addWarehouse: (input) => {
        const state = get();
        const warehouse: Warehouse = {
          ...input,
          id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: new Date().toISOString(),
        };
        set({ warehouses: [...state.warehouses, warehouse] });
        return warehouse;
      },
      updateWarehouse: (warehouseId, input) => {
        const state = get();
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!warehouse) return null;
        const updated: Warehouse = { ...warehouse, ...input };
        set({ warehouses: state.warehouses.map(item => item.id === warehouseId ? updated : item) });
        return updated;
      },
      deleteWarehouse: (warehouseId) => {
        const state = get();
        const isLinkedToPOS = state.posList.some(pos => pos.default_warehouse_id === warehouseId);
        const hasStock = state.stockLevels.some(level => level.warehouse_id === warehouseId && level.quantity > 0);
        if (isLinkedToPOS || hasStock) return false;
        set({
          warehouses: state.warehouses.filter(warehouse => warehouse.id !== warehouseId),
          stockLevels: state.stockLevels.filter(level => level.warehouse_id !== warehouseId),
        });
        return true;
      },
      addProduct: (input) => {
        const state = get();
        const createdAt = new Date().toISOString();
        const {
          initial_warehouse_id,
          initial_quantity,
          alert_threshold,
          ...productInput
        } = input;
        const product: HospiProduct = {
          ...productInput,
          id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: createdAt,
        };
        const initialStock = product.is_stockable && initial_warehouse_id ? [{
          id: `stock-${product.id}-${initial_warehouse_id}`,
          warehouse_id: initial_warehouse_id,
          product_id: product.id,
          quantity: initial_quantity || 0,
          unit: product.unit,
          alert_threshold: alert_threshold || 0,
          updated_at: createdAt,
        }] : [];
        set({
          products: [...state.products, product],
          stockLevels: [...state.stockLevels, ...initialStock],
        });
        return product;
      },
      updateProduct: (productId, input) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        if (!product) return null;
        const updated: HospiProduct = { ...product, ...input };
        set({
          products: state.products.map(item => item.id === productId ? updated : item),
          stockLevels: state.stockLevels.map(level => level.product_id === productId ? { ...level, unit: updated.unit } : level),
        });
        return updated;
      },
      deleteProduct: (productId) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        if (!product) return false;
        const isUsed = state.stockLevels.some(level => level.product_id === productId && level.quantity > 0)
          || state.stockMovements.some(move => move.product_id === productId)
          || state.recipeItems.some(item => item.ingredient_product_id === productId)
          || state.recipes.some(recipe => recipe.product_id === productId);
        if (isUsed) {
          set({
            products: state.products.map(item => item.id === productId ? { ...item, is_active: false } : item),
            posProductPrices: state.posProductPrices.map(price => price.product_id === productId ? { ...price, is_available: false } : price),
          });
          return true;
        }
        set({
          products: state.products.filter(item => item.id !== productId),
          posProductPrices: state.posProductPrices.filter(price => price.product_id !== productId),
          stockLevels: state.stockLevels.filter(level => level.product_id !== productId),
        });
        return true;
      },
      upsertPOSProductPrice: (input) => {
        const state = get();
        const existing = state.posProductPrices.find(price => price.pos_id === input.pos_id && price.product_id === input.product_id);
        const createdAt = new Date().toISOString();
        if (existing) {
          const nextPrice: POSProductPrice = { ...existing, ...input };
          set({
            posProductPrices: state.posProductPrices.map(price => price.id === existing.id ? nextPrice : price),
          });
          return nextPrice;
        }
        const price: POSProductPrice = {
          ...input,
          id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          created_at: createdAt,
        };
        set({ posProductPrices: [...state.posProductPrices, price] });
        return price;
      },
      deletePOSProductPrice: (priceId) => {
        const state = get();
        const price = state.posProductPrices.find(item => item.id === priceId);
        if (!price) return false;
        set({ posProductPrices: state.posProductPrices.filter(item => item.id !== priceId) });
        return true;
      },
      upsertRecipe: (productId, name) => {
        const state = get();
        const existing = state.recipes.find(recipe => recipe.product_id === productId);
        if (existing) return existing;
        const product = state.products.find(item => item.id === productId);
        const recipe: Recipe = {
          id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: productId,
          name: name || `Recette ${product?.name || productId}`,
          created_at: new Date().toISOString(),
        };
        set({ recipes: [...state.recipes, recipe] });
        return recipe;
      },
      addRecipeItem: (input) => {
        const state = get();
        const item: RecipeItem = {
          ...input,
          id: `recipe-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };
        set({ recipeItems: [...state.recipeItems, item] });
        return item;
      },
      getActivePOS: () => get().posList.find(pos => pos.id === get().activePOSId),
      getActiveWarehouse: () => {
        const pos = get().getActivePOS();
        return pos ? get().warehouses.find(warehouse => warehouse.id === pos.default_warehouse_id) : undefined;
      },
      getProductsForPOS: (posId) => {
        const currentPOSId = posId || get().activePOSId;
        const prices = get().posProductPrices.filter(price => price.pos_id === currentPOSId && price.is_available);
        const pos = get().posList.find(item => item.id === currentPOSId);
        return prices.flatMap(price => {
          const product = get().products.find(item => item.id === price.product_id && item.is_active);
          if (!product) return [];
          const stock = pos ? get().getStockLevel(product.id, pos.default_warehouse_id) : undefined;
          return [{ product, price, stock }];
        });
      },
      getPriceForProduct: (productId, posId) => get().posProductPrices.find(price =>
        price.product_id === productId &&
        price.pos_id === (posId || get().activePOSId) &&
        price.is_available
      ),
      getStockLevel: (productId, warehouseId) => get().stockLevels.find(stock =>
        stock.product_id === productId && stock.warehouse_id === warehouseId
      ),
      getRecipeForProduct: (productId) => {
        const recipe = get().recipes.find(item => item.product_id === productId);
        if (!recipe) return undefined;
        return {
          recipe,
          items: get().recipeItems.filter(item => item.recipe_id === recipe.id),
        };
      },
      recordSale: (orderId, lines, createdBy, posId) => {
        const state = get();
        const pos = state.posList.find(item => item.id === (posId || state.activePOSId));
        const site = pos ? state.sites.find(item => item.id === pos.site_id) : undefined;
        const companyId = site?.company_id || state.companies[0]?.id || 'comp-sartal-demo';
        const warehouseId = pos?.default_warehouse_id;
        if (!pos || !site || !warehouseId) return [];

        const createdAt = new Date().toISOString();
        const movements: StockMovement[] = [];
        const resolveWarehouseForConsumption = (productId: string, preferredWarehouseId: string, fromRecipe: boolean) => {
          const product = state.products.find(item => item.id === productId);
          if (!product) return preferredWarehouseId;
          if (!fromRecipe) return preferredWarehouseId;
          const candidates = [
            product.primary_warehouse_id,
            product.secondary_warehouse_id,
            product.fallback_warehouse_id,
            preferredWarehouseId,
          ].filter(Boolean) as string[];
          const inSameSite = candidates.filter(id => state.warehouses.find(warehouse => warehouse.id === id)?.site_id === site.id);
          const scopedCandidates = inSameSite.length ? inSameSite : [preferredWarehouseId];
          const firstWithStock = scopedCandidates.find(id => {
            const stock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === id);
            return stock && stock.quantity > 0;
          });
          if (firstWithStock) return firstWithStock;
          return product.fallback_policy === 'use_secondary' ? scopedCandidates[1] || scopedCandidates[0] : scopedCandidates[0];
        };
        const consumptionByProduct = lines.flatMap(line => {
          const recipe = state.recipes.find(item => item.product_id === line.productId);
          if (!recipe) {
            return [{
              productId: line.productId,
              quantity: line.quantity,
              warehouseId: resolveWarehouseForConsumption(line.productId, warehouseId, false),
              sourceProductId: line.productId,
            }];
          }
          return state.recipeItems
            .filter(item => item.recipe_id === recipe.id)
            .map(item => ({
              productId: item.ingredient_product_id,
              quantity: item.quantity * line.quantity,
              warehouseId: resolveWarehouseForConsumption(item.ingredient_product_id, warehouseId, true),
              sourceProductId: line.productId,
            }));
        });

        const nextStockLots = [...state.stockLots];
        const consumeLots = (productId: string, stockWarehouseId: string, quantity: number) => {
          let remaining = quantity;
          const lotIndexes = nextStockLots
            .map((lot, index) => ({ lot, index }))
            .filter(item => item.lot.product_id === productId && item.lot.warehouse_id === stockWarehouseId && item.lot.quantity > 0)
            .sort((a, b) => {
              const aDate = a.lot.expires_at || a.lot.received_at;
              const bDate = b.lot.expires_at || b.lot.received_at;
              return new Date(aDate).getTime() - new Date(bDate).getTime();
            });
          lotIndexes.forEach(({ lot, index }) => {
            if (remaining <= 0) return;
            const consumed = Math.min(lot.quantity, remaining);
            nextStockLots[index] = { ...lot, quantity: Math.max(0, lot.quantity - consumed) };
            remaining -= consumed;
          });
        };

        const nextStockLevels = state.stockLevels.map(stock => {
          const consumption = consumptionByProduct
            .filter(item => item.productId === stock.product_id && stock.warehouse_id === item.warehouseId)
            .reduce((sum, item) => sum + item.quantity, 0);
          if (!consumption) return stock;
          consumeLots(stock.product_id, stock.warehouse_id, consumption);
          movements.push({
            id: `mov-${Date.now()}-${stock.product_id}-${Math.random().toString(36).slice(2, 6)}`,
            company_id: companyId,
            site_id: site.id,
            pos_id: pos.id,
            warehouse_id: stock.warehouse_id,
            product_id: stock.product_id,
            movement_type: 'sale',
            quantity: consumption,
            reason: `Vente ${pos.name}`,
            reference_type: 'pos_order',
            reference_id: orderId,
            created_by: createdBy,
            created_at: createdAt,
          });
          return {
            ...stock,
            quantity: Math.max(0, stock.quantity - consumption),
            updated_at: createdAt,
          };
        });

        if (movements.length > 0) {
          set({
            stockLevels: nextStockLevels,
            stockLots: nextStockLots,
            stockMovements: [...movements, ...state.stockMovements],
          });
        }

        return movements;
      },
      createConfigDraft: (input) => {
        const state = get();
        const draft: ConfigDraft = {
          ...input,
          id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: input.status || 'draft',
          created_at: new Date().toISOString(),
        };
        set({ configDrafts: [draft, ...state.configDrafts] });
        return draft;
      },
      testConfigDraft: (draftId) => {
        const state = get();
        const draft = state.configDrafts.find(item => item.id === draftId);
        if (!draft) return null;
        const updated: ConfigDraft = { ...draft, status: 'tested', tested_at: new Date().toISOString() };
        set({ configDrafts: state.configDrafts.map(item => item.id === draftId ? updated : item) });
        return updated;
      },
      publishConfigDraft: (draftId, actor) => {
        const state = get();
        const draft = state.configDrafts.find(item => item.id === draftId);
        if (!draft) return null;
        const criticalAlerts = get().getCriticalConfigAlerts();
        if (criticalAlerts.length > 0 && !['warehouse', 'pos', 'price'].includes(draft.change_type)) {
          return null;
        }
        const publishedAt = new Date().toISOString();
        const updated: ConfigDraft = { ...draft, status: 'published', published_at: publishedAt };
        const history: ConfigHistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: draft.title,
          module: draft.module,
          before_value: draft.before_value,
          after_value: draft.after_value,
          actor,
          created_at: publishedAt,
        };
        set({
          configDrafts: state.configDrafts.map(item => item.id === draftId ? updated : item),
          configHistoryEntries: [history, ...state.configHistoryEntries],
        });
        return updated;
      },
      duplicatePOSConfig: (posId, name) => {
        const state = get();
        const source = state.posList.find(item => item.id === posId);
        if (!source) return null;
        const pos = get().addPOS({
          site_id: source.site_id,
          name,
          type: source.type,
          default_warehouse_id: source.default_warehouse_id,
          is_active: false,
          payment_methods: [...source.payment_methods],
          printer_names: [...(source.printer_names || [])],
          terminal_names: [...(source.terminal_names || [])],
          tax_profile: source.tax_profile,
        });
        const prices = state.posProductPrices.filter(price => price.pos_id === posId);
        prices.forEach(price => get().upsertPOSProductPrice({
          pos_id: pos.id,
          product_id: price.product_id,
          sale_price: price.sale_price,
          tax_rate: price.tax_rate,
          is_available: price.is_available,
        }));
        get().createConfigDraft({
          title: `Duplication ${source.name}`,
          module: 'POS',
          change_type: 'pos',
          before_value: source.name,
          after_value: pos.name,
          created_by: 'Admin',
          status: 'tested',
        });
        return pos;
      },
      createBusinessPack: (type, siteId, label) => {
        const state = get();
        const site = state.sites.find(item => item.id === siteId);
        if (!site) return null;
        const warehouse = get().addWarehouse({
          site_id: siteId,
          name: `Dépôt ${label}`,
          type: type === 'room_service' ? 'central' : type === 'spa' || type === 'boutique' ? 'boutique' : type === 'restaurant' ? 'restaurant' : type === 'bar' ? 'bar' : type === 'casino' || type === 'nightclub' ? 'casino' : 'other',
          is_active: true,
        });
        const pos = get().addPOS({
          site_id: siteId,
          name: label,
          type,
          default_warehouse_id: warehouse.id,
          is_active: true,
          payment_methods: type === 'room_service' ? ['room_charge', 'carte'] : ['especes', 'carte', 'wave'],
          printer_names: [`Imprimante ${label}`],
          terminal_names: [`TPE ${label}`],
          tax_profile: type === 'casino' ? 'Jeux / TVA spécifique' : 'TVA 18%',
        });
        get().createConfigDraft({
          title: `Pack ${label}`,
          module: 'Pack métier',
          change_type: 'pack',
          before_value: 'Aucun',
          after_value: `${pos.name} + ${warehouse.name}`,
          created_by: 'Admin',
          status: 'published',
        });
        return { pos, warehouse };
      },
      setPermissionPolicy: (role, action, mode) => {
        const state = get();
        const existing = state.permissionPolicies.find(item => item.role === role && item.action === action);
        const updatedAt = new Date().toISOString();
        const policy: PermissionPolicy = existing
          ? { ...existing, mode, updated_at: updatedAt }
          : { id: `perm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role, action, mode, updated_at: updatedAt };
        set({
          permissionPolicies: existing
            ? state.permissionPolicies.map(item => item.id === existing.id ? policy : item)
            : [policy, ...state.permissionPolicies],
        });
        return policy;
      },
      getPermissionMode: (role, action) => {
        const policies = get().permissionPolicies;
        return policies.find(item => item.role === role && item.action === action)?.mode
          || policies.find(item => item.role === role && item.action === 'Tout gérer')?.mode;
      },
      upsertTaxProfile: (input) => {
        const state = get();
        const updatedAt = new Date().toISOString();
        const existing = input.id ? state.taxProfiles.find(item => item.id === input.id) : state.taxProfiles.find(item => item.name === input.name);
        const profile: TaxProfile = existing
          ? { ...existing, ...input, updated_at: updatedAt }
          : { ...input, id: `tax-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, updated_at: updatedAt };
        set({
          taxProfiles: existing
            ? state.taxProfiles.map(item => item.id === existing.id ? profile : item)
            : [profile, ...state.taxProfiles],
        });
        return profile;
      },
      createApprovalRequest: (input) => {
        const state = get();
        const approval: ApprovalRequest = {
          ...input,
          id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        set({ approvalRequests: [approval, ...state.approvalRequests] });
        return approval;
      },
      resolveApprovalRequest: (approvalId, status, actor) => {
        const state = get();
        const approval = state.approvalRequests.find(item => item.id === approvalId);
        if (!approval) return null;
        const updated: ApprovalRequest = {
          ...approval,
          status,
          resolved_by: actor,
          resolved_at: new Date().toISOString(),
        };
        set({ approvalRequests: state.approvalRequests.map(item => item.id === approvalId ? updated : item) });
        return updated;
      },
      createConfigSnapshot: (name, createdBy) => {
        const state = get();
        const snapshot: ConfigSnapshot = {
          id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          summary: `${state.posList.length} POS, ${state.warehouses.length} dépôts, ${state.products.length} produits`,
          created_by: createdBy,
          created_at: new Date().toISOString(),
          payload: {
            sites: state.sites,
            posList: state.posList,
            warehouses: state.warehouses,
            products: state.products,
            posProductPrices: state.posProductPrices,
            taxProfiles: state.taxProfiles,
            permissionPolicies: state.permissionPolicies,
          },
        };
        set({ configSnapshots: [snapshot, ...state.configSnapshots] });
        return snapshot;
      },
      restoreConfigSnapshot: (snapshotId, actor) => {
        const state = get();
        const snapshot = state.configSnapshots.find(item => item.id === snapshotId);
        if (!snapshot) return false;
        const history: ConfigHistoryEntry = {
          id: `hist-restore-${Date.now()}`,
          title: `Restauration ${snapshot.name}`,
          module: 'Sauvegarde',
          before_value: `${state.posList.length} POS`,
          after_value: snapshot.summary,
          actor,
          created_at: new Date().toISOString(),
        };
        set({
          sites: snapshot.payload.sites || state.sites,
          posList: snapshot.payload.posList,
          warehouses: snapshot.payload.warehouses,
          products: snapshot.payload.products,
          posProductPrices: snapshot.payload.posProductPrices,
          taxProfiles: snapshot.payload.taxProfiles,
          permissionPolicies: snapshot.payload.permissionPolicies,
          configHistoryEntries: [history, ...state.configHistoryEntries],
        });
        return true;
      },
      getCriticalConfigAlerts: () => {
        const state = get();
        return [
          ...state.posList
            .filter(pos => !state.warehouses.some(warehouse => warehouse.id === pos.default_warehouse_id))
            .map(pos => ({ title: `${pos.name} sans dépôt valide`, detail: 'Les ventes ne pourront pas déstocker correctement.' })),
          ...state.posList
            .filter(pos => state.posProductPrices.filter(price => price.pos_id === pos.id && price.is_available).length === 0)
            .map(pos => ({ title: `${pos.name} sans catalogue de vente`, detail: 'Aucun prix actif n’est associé à ce POS.' })),
        ];
      },
      importAdminCsv: (kind, csv, createdBy) => {
        const state = get();
        const rows = parseSimpleCsv(csv);
        const errors: string[] = [];
        let imported = 0;
        if (kind === 'products') {
          rows.forEach((row, index) => {
            if (!row.name || !row.sku) {
              errors.push(`Ligne ${index + 2}: nom ou SKU manquant`);
              return;
            }
            get().addProduct({
              company_id: state.companies[0]?.id || 'comp-sartal-demo',
              name: row.name,
              sku: row.sku,
              category_id: row.category || 'import',
              unit: row.unit || 'unité',
              is_stockable: row.stockable !== 'false',
              is_active: true,
              primary_warehouse_id: row.warehouse_id || state.warehouses[0]?.id,
              fallback_policy: 'block_sale',
              average_purchase_price: Number(row.cost) || 0,
              initial_warehouse_id: row.warehouse_id || state.warehouses[0]?.id,
              initial_quantity: Number(row.quantity) || 0,
              alert_threshold: Number(row.threshold) || 0,
            });
            imported += 1;
          });
        } else if (kind === 'prices') {
          rows.forEach((row, index) => {
            if (!row.pos_id || !row.product_id || !row.sale_price) {
              errors.push(`Ligne ${index + 2}: pos_id, product_id ou sale_price manquant`);
              return;
            }
            if (!state.posList.some(pos => pos.id === row.pos_id) || !state.products.some(product => product.id === row.product_id)) {
              errors.push(`Ligne ${index + 2}: POS ou produit introuvable`);
              return;
            }
            get().upsertPOSProductPrice({
              pos_id: row.pos_id,
              product_id: row.product_id,
              sale_price: Number(row.sale_price) || 0,
              tax_rate: Number(row.tax_rate) || 0,
              is_available: row.available !== 'false',
            });
            imported += 1;
          });
        } else {
          errors.push('Import non encore automatisé pour ce type.');
        }
        const report: ImportReport = {
          id: `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind,
          imported,
          errors,
          created_by: createdBy,
          created_at: new Date().toISOString(),
        };
        set({ importReports: [report, ...get().importReports] });
        return report;
      },
      recordProduction: (productId, warehouseId, quantity, createdBy) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        if (!product) return null;
        const createdAt = new Date().toISOString();
        const batch: ProductionBatch = {
          id: `prod-batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
          created_by: createdBy,
          created_at: createdAt,
        };
        const existingStock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === warehouseId);
        const nextStockLevels = existingStock
          ? state.stockLevels.map(level => level.id === existingStock.id ? { ...level, quantity: level.quantity + quantity, updated_at: createdAt } : level)
          : [...state.stockLevels, {
              id: `stock-${productId}-${warehouseId}`,
              warehouse_id: warehouseId,
              product_id: productId,
              quantity,
              unit: product.unit,
              alert_threshold: 0,
              updated_at: createdAt,
            }];

        const site = state.sites.find(item => item.id === state.warehouses.find(warehouse => warehouse.id === warehouseId)?.site_id);
        const movement: StockMovement = {
          id: `mov-production-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || state.sites[0]?.id || 'site-dakar',
          warehouse_id: warehouseId,
          product_id: productId,
          movement_type: 'production',
          quantity,
          reason: `Production ${product.name}`,
          reference_type: 'production_batch',
          reference_id: batch.id,
          created_by: createdBy,
          created_at: createdAt,
        };

        set({
          productionBatches: [batch, ...state.productionBatches],
          stockLevels: nextStockLevels,
          stockMovements: [movement, ...state.stockMovements],
        });
        return batch;
      },
      reserveStock: (productId, warehouseId, quantity, sourceLabel) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!product || !warehouse || quantity <= 0) return null;
        const reservation: StockReservation = {
          id: `stock-res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
          source_type: 'room_service',
          source_label: sourceLabel,
          status: 'reserved',
          created_at: new Date().toISOString(),
        };
        set({ stockReservations: [reservation, ...state.stockReservations] });
        return reservation;
      },
      recordInternalConsumption: (productId, warehouseId, quantity, reason, createdBy) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!product || !warehouse || quantity <= 0) return null;
        const createdAt = new Date().toISOString();
        const site = state.sites.find(item => item.id === warehouse.site_id) || state.sites[0];
        const stock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === warehouseId);
        const currentQuantity = stock?.quantity || 0;
        if (!state.stockPolicy.allow_negative_stock && currentQuantity < quantity) return null;
        const nextQuantity = state.stockPolicy.allow_negative_stock ? currentQuantity - quantity : Math.max(0, currentQuantity - quantity);
        const consumption: InternalConsumption = {
          id: `internal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product_id: productId,
          warehouse_id: warehouseId,
          quantity,
          reason,
          created_by: createdBy,
          created_at: createdAt,
        };
        const movement: StockMovement = {
          id: `mov-internal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: warehouseId,
          product_id: productId,
          movement_type: 'internal_consumption',
          quantity,
          reason: `Consommation interne : ${reason}`,
          reference_type: 'internal_consumption',
          reference_id: consumption.id,
          created_by: createdBy,
          created_at: createdAt,
        };
        set({
          internalConsumptions: [consumption, ...state.internalConsumptions],
          stockMovements: [movement, ...state.stockMovements],
          stockLevels: stock
            ? state.stockLevels.map(level => level.id === stock.id ? { ...level, quantity: nextQuantity, updated_at: createdAt } : level)
            : state.stockLevels,
        });
        return movement;
      },
      transferStock: (productId, fromWarehouseId, toWarehouseId, quantity, reason, createdBy) => {
        const state = get();
        if (fromWarehouseId === toWarehouseId || quantity <= 0) return [];
        const product = state.products.find(item => item.id === productId);
        const fromWarehouse = state.warehouses.find(item => item.id === fromWarehouseId);
        const toWarehouse = state.warehouses.find(item => item.id === toWarehouseId);
        if (!product || !fromWarehouse || !toWarehouse) return [];

        const createdAt = new Date().toISOString();
        const transferRef = `transfer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const site = state.sites.find(item => item.id === fromWarehouse.site_id) || state.sites[0];
        const fromStock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === fromWarehouseId);
        const toStock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === toWarehouseId);

        const nextStockLevels = [...state.stockLevels]
          .map(level => {
            if (level.id === fromStock?.id) return { ...level, quantity: Math.max(0, level.quantity - quantity), updated_at: createdAt };
            if (level.id === toStock?.id) return { ...level, quantity: level.quantity + quantity, updated_at: createdAt };
            return level;
          });

        if (!toStock) {
          nextStockLevels.push({
            id: `stock-${productId}-${toWarehouseId}`,
            warehouse_id: toWarehouseId,
            product_id: productId,
            quantity,
            unit: product.unit,
            alert_threshold: 0,
            updated_at: createdAt,
          });
        }

        const outMovement: StockMovement = {
          id: `${transferRef}-out`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: fromWarehouseId,
          product_id: productId,
          movement_type: 'transfer_out',
          quantity,
          reason,
          reference_type: 'stock_transfer',
          reference_id: transferRef,
          created_by: createdBy,
          created_at: createdAt,
        };

        const inMovement: StockMovement = {
          ...outMovement,
          id: `${transferRef}-in`,
          warehouse_id: toWarehouseId,
          movement_type: 'transfer_in',
        };

        set({
          stockLevels: nextStockLevels,
          stockMovements: [inMovement, outMovement, ...state.stockMovements],
        });
        return [outMovement, inMovement];
      },
      adjustInventory: (productId, warehouseId, countedQuantity, reason, createdBy) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!product || !warehouse || countedQuantity < 0) return null;

        const createdAt = new Date().toISOString();
        const stock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === warehouseId);
        const currentQuantity = stock?.quantity || 0;
        const delta = countedQuantity - currentQuantity;
        const site = state.sites.find(item => item.id === warehouse.site_id) || state.sites[0];

        const movement: StockMovement = {
          id: `adjust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: warehouseId,
          product_id: productId,
          movement_type: 'inventory_adjustment',
          quantity: Math.abs(delta),
          reason: `${reason} (${currentQuantity} -> ${countedQuantity})`,
          reference_type: 'inventory_count',
          reference_id: `inventory-${Date.now()}`,
          created_by: createdBy,
          created_at: createdAt,
        };

        const nextStockLevels = stock
          ? state.stockLevels.map(level => level.id === stock.id ? { ...level, quantity: countedQuantity, updated_at: createdAt } : level)
          : [...state.stockLevels, {
              id: `stock-${productId}-${warehouseId}`,
              warehouse_id: warehouseId,
              product_id: productId,
              quantity: countedQuantity,
              unit: product.unit,
              alert_threshold: 0,
              updated_at: createdAt,
            }];

        set({
          stockLevels: nextStockLevels,
          stockMovements: [movement, ...state.stockMovements],
        });
        return movement;
      },
      recordLoss: (productId, warehouseId, quantity, reason, createdBy) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!product || !warehouse || quantity <= 0) return null;

        const createdAt = new Date().toISOString();
        const site = state.sites.find(item => item.id === warehouse.site_id) || state.sites[0];
        const stock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === warehouseId);
        const currentQuantity = stock?.quantity || 0;
        const nextQuantity = Math.max(0, currentQuantity - quantity);

        const movement: StockMovement = {
          id: `loss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: warehouseId,
          product_id: productId,
          movement_type: 'loss',
          quantity,
          reason,
          reference_type: 'stock_loss',
          reference_id: `loss-${Date.now()}`,
          created_by: createdBy,
          created_at: createdAt,
        };

        const nextStockLevels = stock
          ? state.stockLevels.map(level => level.id === stock.id ? { ...level, quantity: nextQuantity, updated_at: createdAt } : level)
          : state.stockLevels;

        set({
          stockLevels: nextStockLevels,
          stockMovements: [movement, ...state.stockMovements],
        });
        return movement;
      },
      addPurchaseOrder: (input) => {
        const state = get();
        const supplier = state.suppliers.find(item => item.id === input.supplier_id && item.is_active);
        const warehouse = state.warehouses.find(item => item.id === input.warehouse_id);
        const validLines = input.lines.filter(line =>
          state.products.some(product => product.id === line.product_id)
          && line.quantity_ordered > 0
        );
        if (!supplier || !warehouse || validLines.length === 0) return null;

        const createdAt = new Date().toISOString();
        const order: PurchaseOrder = {
          id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          supplier_id: input.supplier_id,
          warehouse_id: input.warehouse_id,
          status: 'ordered',
          ordered_by: input.ordered_by,
          expected_at: input.expected_at,
          created_at: createdAt,
        };
        const lines: PurchaseOrderLine[] = validLines.map(line => ({
          id: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          purchase_order_id: order.id,
          product_id: line.product_id,
          quantity_ordered: line.quantity_ordered,
          quantity_received: 0,
          unit_cost: line.unit_cost,
          lot_number: line.lot_number,
          expires_at: line.expires_at,
        }));

        set({
          purchaseOrders: [order, ...state.purchaseOrders],
          purchaseOrderLines: [...lines, ...state.purchaseOrderLines],
        });
        return order;
      },
      updatePurchaseOrder: (purchaseOrderId, input) => {
        const state = get();
        const order = state.purchaseOrders.find(item => item.id === purchaseOrderId);
        if (!order || order.status === 'received' || order.status === 'cancelled') return null;
        const nextOrder: PurchaseOrder = {
          ...order,
          supplier_id: input.supplier_id || order.supplier_id,
          warehouse_id: input.warehouse_id || order.warehouse_id,
          expected_at: input.expected_at ?? order.expected_at,
        };
        const nextLines = input.lines
          ? [
              ...state.purchaseOrderLines.filter(line => line.purchase_order_id !== purchaseOrderId),
              ...input.lines
                .filter(line => state.products.some(product => product.id === line.product_id) && line.quantity_ordered > 0)
                .map(line => ({
                  id: `pol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  purchase_order_id: purchaseOrderId,
                  product_id: line.product_id,
                  quantity_ordered: line.quantity_ordered,
                  quantity_received: 0,
                  unit_cost: line.unit_cost,
                  lot_number: line.lot_number,
                  expires_at: line.expires_at,
                })),
            ]
          : state.purchaseOrderLines;
        set({
          purchaseOrders: state.purchaseOrders.map(item => item.id === purchaseOrderId ? nextOrder : item),
          purchaseOrderLines: nextLines,
        });
        return nextOrder;
      },
      receivePurchaseOrderLines: (purchaseOrderId, receivedBy, receivedQuantities) => {
        const state = get();
        const order = state.purchaseOrders.find(item => item.id === purchaseOrderId);
        if (!order || order.status === 'received' || order.status === 'cancelled') return null;
        const warehouse = state.warehouses.find(item => item.id === order.warehouse_id);
        if (!warehouse) return null;
        const lines = state.purchaseOrderLines.filter(line => line.purchase_order_id === purchaseOrderId);
        const receivableLines = lines
          .map(line => {
            const remaining = Math.max(0, line.quantity_ordered - line.quantity_received);
            const requested = Math.max(0, Number(receivedQuantities[line.id] || 0));
            return { line, quantity: Math.min(remaining, requested) };
          })
          .filter(item => item.quantity > 0);
        if (receivableLines.length === 0) return null;

        const createdAt = new Date().toISOString();
        const site = state.sites.find(item => item.id === warehouse.site_id) || state.sites[0];
        const receipt: SupplierReceipt = {
          id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          purchase_order_id: purchaseOrderId,
          warehouse_id: order.warehouse_id,
          received_by: receivedBy,
          total_cost: receivableLines.reduce((sum, item) => sum + item.quantity * item.line.unit_cost, 0),
          created_at: createdAt,
        };

        const nextLines = state.purchaseOrderLines.map(line => {
          if (line.purchase_order_id !== purchaseOrderId) return line;
          const received = receivableLines.find(item => item.line.id === line.id)?.quantity || 0;
          return { ...line, quantity_received: Math.min(line.quantity_ordered, line.quantity_received + received) };
        });

        const nextStockLevels = [...state.stockLevels];
        const nextStockLots = [...state.stockLots];
        receivableLines.forEach(({ line, quantity }) => {
          const product = state.products.find(item => item.id === line.product_id);
          if (!product) return;
          const existingStockIndex = nextStockLevels.findIndex(level => level.product_id === line.product_id && level.warehouse_id === order.warehouse_id);
          if (existingStockIndex >= 0) {
            nextStockLevels[existingStockIndex] = {
              ...nextStockLevels[existingStockIndex],
              quantity: nextStockLevels[existingStockIndex].quantity + quantity,
              updated_at: createdAt,
            };
          } else {
            nextStockLevels.push({
              id: `stock-${line.product_id}-${order.warehouse_id}`,
              warehouse_id: order.warehouse_id,
              product_id: line.product_id,
              quantity,
              unit: product.unit,
              alert_threshold: 0,
              updated_at: createdAt,
            });
          }
          if (line.lot_number || line.expires_at || ['boissons', 'boissons_premium', 'spa', 'minibar'].includes(product.category_id) || warehouse.type === 'cold_room') {
            nextStockLots.push({
              id: `lot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              warehouse_id: order.warehouse_id,
              product_id: line.product_id,
              lot_number: line.lot_number || `LOT-${new Date().toISOString().slice(0, 10)}`,
              expires_at: line.expires_at,
              quantity,
              unit_cost: line.unit_cost,
              received_at: createdAt,
            });
          }
        });

        const movements: StockMovement[] = receivableLines.map(({ line, quantity }) => ({
          id: `purchase-${Date.now()}-${line.id}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: order.warehouse_id,
          product_id: line.product_id,
          movement_type: 'purchase',
          quantity,
          reason: `Réception fournisseur ${order.id}`,
          reference_type: 'supplier_receipt',
          reference_id: receipt.id,
          created_by: receivedBy,
          created_at: createdAt,
        }));
        const allLinesDone = nextLines
          .filter(line => line.purchase_order_id === purchaseOrderId)
          .every(line => line.quantity_received >= line.quantity_ordered);

        set({
          purchaseOrders: state.purchaseOrders.map(item => item.id === purchaseOrderId ? { ...item, status: allLinesDone ? 'received' : 'partially_received' } : item),
          purchaseOrderLines: nextLines,
          supplierReceipts: [receipt, ...state.supplierReceipts],
          stockLevels: nextStockLevels,
          stockLots: nextStockLots,
          stockMovements: [...movements, ...state.stockMovements],
        });
        return receipt;
      },
      receivePurchaseOrder: (purchaseOrderId, receivedBy) => {
        const state = get();
        const quantities = Object.fromEntries(
          state.purchaseOrderLines
            .filter(line => line.purchase_order_id === purchaseOrderId)
            .map(line => [line.id, Math.max(0, line.quantity_ordered - line.quantity_received)])
        );
        return get().receivePurchaseOrderLines(purchaseOrderId, receivedBy, quantities);
      },
      updateStockThreshold: (productId, warehouseId, alertThreshold) => {
        const state = get();
        const product = state.products.find(item => item.id === productId);
        const warehouse = state.warehouses.find(item => item.id === warehouseId);
        if (!product || !warehouse || alertThreshold < 0) return null;
        const createdAt = new Date().toISOString();
        const stock = state.stockLevels.find(level => level.product_id === productId && level.warehouse_id === warehouseId);
        const updated: StockLevel = stock
          ? { ...stock, alert_threshold: alertThreshold, updated_at: createdAt }
          : {
              id: `stock-${productId}-${warehouseId}`,
              warehouse_id: warehouseId,
              product_id: productId,
              quantity: 0,
              unit: product.unit,
              alert_threshold: alertThreshold,
              updated_at: createdAt,
            };
        set({
          stockLevels: stock
            ? state.stockLevels.map(level => level.id === stock.id ? updated : level)
            : [...state.stockLevels, updated],
        });
        return updated;
      },
      getRegisterForPOS: (posId) => get().cashRegisters.find(register =>
        register.pos_id === (posId || get().activePOSId) && register.is_active
      ),
      getOpenCashSession: (posId) => get().cashSessions.find(session =>
        session.pos_id === (posId || get().activePOSId) && session.status === 'open'
      ),
      openCashSession: (posId, openedBy, openingFloat) => {
        const state = get();
        const existingSession = state.cashSessions.find(session => session.pos_id === posId && session.status === 'open');
        if (existingSession) return existingSession;

        const register = state.cashRegisters.find(item => item.pos_id === posId && item.is_active);
        if (!register) return null;

        const session: CashSession = {
          id: `cash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          register_id: register.id,
          pos_id: posId,
          opened_by: openedBy,
          status: 'open',
          opening_float: openingFloat,
          opened_at: new Date().toISOString(),
        };

        set({ cashSessions: [session, ...state.cashSessions] });
        return session;
      },
      closeCashSession: (sessionId, closedBy, closingCashCount, expectedCash) => {
        const state = get();
        const session = state.cashSessions.find(item => item.id === sessionId && item.status === 'open');
        if (!session) return null;
        const closedSession: CashSession = {
          ...session,
          closed_by: closedBy,
          status: 'closed',
          closing_cash_count: closingCashCount,
          expected_cash: expectedCash,
          difference: closingCashCount - expectedCash,
          closed_at: new Date().toISOString(),
        };
        set({
          cashSessions: state.cashSessions.map(item => item.id === sessionId ? closedSession : item),
        });
        return closedSession;
      },
      getOccupiedRoomsWithOpenFolios: () => {
        const state = get();
        return state.rooms.flatMap(room => {
          if (room.status !== 'occupied') return [];
          const stay = state.stays.find(item => item.room_id === room.id && item.status === 'checked_in');
          const folio = stay ? state.folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
          const guest = stay ? state.guests.find(item => item.id === stay.guest_id) : undefined;
          if (!stay || !folio || !guest) return [];
          return [{ room, guest, stay, folio }];
        });
      },
      getCustomerAccountBalance: (accountId) => {
        return get().customerLedgerEntries
          .filter(entry => entry.account_id === accountId)
          .reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
      },
      settleCustomerAccount: (accountId, amount, method, createdBy) => {
        const state = get();
        const account = state.customerAccounts.find(item => item.id === accountId && item.is_active);
        if (!account || amount <= 0) return null;

        const entry: CustomerLedgerEntry = {
          id: `ledger-payment-${Date.now()}`,
          account_id: accountId,
          source_type: 'payment',
          source_id: `${method}-${Date.now()}`,
          description: `Règlement client ${method} par ${createdBy}`,
          debit: 0,
          credit: amount,
          created_at: new Date().toISOString(),
        };

        set({
          customerLedgerEntries: [entry, ...state.customerLedgerEntries],
          customerAccounts: state.customerAccounts.map(item => item.id === accountId
            ? { ...item, balance: Math.max(0, item.balance - amount) }
            : item
          ),
        });

        return entry;
      },
      updateRoomStatus: (roomId, status) => {
        const state = get();
        const room = state.rooms.find(item => item.id === roomId);
        if (!room) return null;

        const updatedRoom: Room = { ...room, status };

        set({
          rooms: state.rooms.map(item => item.id === roomId ? updatedRoom : item),
        });

        return updatedRoom;
      },
      addManualFolioCharge: (folioId, description, amount, createdBy) => {
        const state = get();
        const trimmedDescription = description.trim();
        const folio = state.folios.find(item => item.id === folioId && item.status === 'open');
        if (!folio || !trimmedDescription || amount <= 0) return null;

        const createdAt = new Date().toISOString();
        const line: FolioLine = {
          id: `folio-line-manual-${Date.now()}`,
          folio_id: folio.id,
          source_type: 'manual_charge',
          source_id: `manual-${Date.now()}`,
          description: `${trimmedDescription} · ${createdBy}`,
          amount,
          created_at: createdAt,
        };
        const account = state.customerAccounts.find(item => item.hotel_guest_id === folio.guest_id && item.is_active);
        const ledgerEntry: CustomerLedgerEntry | null = account ? {
          id: `ledger-manual-${Date.now()}`,
          account_id: account.id,
          source_type: 'manual_charge',
          source_id: line.id,
          description: trimmedDescription,
          debit: amount,
          credit: 0,
          created_at: createdAt,
        } : null;

        set({
          folioLines: [line, ...state.folioLines],
          folios: state.folios.map(item => item.id === folio.id
            ? { ...item, total_amount: item.total_amount + amount }
            : item
          ),
          customerLedgerEntries: ledgerEntry ? [ledgerEntry, ...state.customerLedgerEntries] : state.customerLedgerEntries,
          customerAccounts: account ? state.customerAccounts.map(item => item.id === account.id
            ? { ...item, balance: item.balance + amount }
            : item
          ) : state.customerAccounts,
        });

        return line;
      },
      closeFolio: (folioId, closedBy) => {
        const state = get();
        const folio = state.folios.find(item => item.id === folioId && item.status === 'open');
        if (!folio) return null;

        const closedFolio: Folio = { ...folio, status: 'closed' };
        const account = state.customerAccounts.find(item => item.hotel_guest_id === folio.guest_id && item.is_active);
        const ledgerEntry: CustomerLedgerEntry | null = account ? {
          id: `ledger-folio-close-${Date.now()}`,
          account_id: account.id,
          source_type: 'folio',
          source_id: folio.id,
          description: `Clôture folio par ${closedBy}`,
          debit: 0,
          credit: 0,
          created_at: new Date().toISOString(),
        } : null;

        set({
          folios: state.folios.map(item => item.id === folio.id ? closedFolio : item),
          stays: state.stays.map(item => item.id === folio.stay_id ? { ...item, status: 'checked_out' } : item),
          rooms: state.rooms.map(item => item.id === folio.room_id ? { ...item, status: 'cleaning' } : item),
          customerLedgerEntries: ledgerEntry ? [ledgerEntry, ...state.customerLedgerEntries] : state.customerLedgerEntries,
        });

        return closedFolio;
      },
      chargeOrderToRoom: (roomId, orderId, description, amount) => {
        const state = get();
        const stay = state.stays.find(item => item.room_id === roomId && item.status === 'checked_in');
        const folio = stay ? state.folios.find(item => item.stay_id === stay.id && item.status === 'open') : undefined;
        if (!stay || !folio) return null;

        const line: FolioLine = {
          id: `folio-line-${Date.now()}`,
          folio_id: folio.id,
          source_type: 'pos_order',
          source_id: orderId,
          description,
          amount,
          created_at: new Date().toISOString(),
        };
        const account = state.customerAccounts.find(item => item.hotel_guest_id === stay.guest_id && item.is_active);
        const ledgerEntry: CustomerLedgerEntry | null = account ? {
          id: `ledger-folio-${Date.now()}`,
          account_id: account.id,
          source_type: 'folio',
          source_id: folio.id,
          description,
          debit: amount,
          credit: 0,
          created_at: line.created_at,
        } : null;

        set({
          folioLines: [line, ...state.folioLines],
          folios: state.folios.map(item => item.id === folio.id
            ? { ...item, total_amount: item.total_amount + amount }
            : item
          ),
          customerLedgerEntries: ledgerEntry ? [ledgerEntry, ...state.customerLedgerEntries] : state.customerLedgerEntries,
          customerAccounts: account ? state.customerAccounts.map(item => item.id === account.id
            ? { ...item, balance: item.balance + amount }
            : item
          ) : state.customerAccounts,
        });

        return line;
      },
    }),
    {
      name: 'sartal-hospi',
      merge: (persisted, current) => {
        const saved = persisted as Partial<HospiState> | undefined;
        if (!saved) return current;
        return {
          ...current,
          ...saved,
          companies: mergeById(current.companies, saved.companies),
          sites: mergeById(current.sites, saved.sites),
          posList: mergeById(current.posList, saved.posList),
          warehouses: mergeById(current.warehouses, saved.warehouses),
          products: mergeById(current.products, saved.products),
          posProductPrices: mergeById(current.posProductPrices, saved.posProductPrices),
          stockLevels: mergeById(current.stockLevels, saved.stockLevels),
          stockLots: mergeById(current.stockLots, saved.stockLots),
          rooms: mergeById(current.rooms, saved.rooms),
          guests: mergeById(current.guests, saved.guests),
          stays: mergeById(current.stays, saved.stays),
          folios: mergeById(current.folios, saved.folios),
          folioLines: mergeById(current.folioLines, saved.folioLines),
          customerAccounts: mergeById(current.customerAccounts, saved.customerAccounts),
          customerLedgerEntries: mergeById(current.customerLedgerEntries, saved.customerLedgerEntries),
          cashRegisters: mergeById(current.cashRegisters, saved.cashRegisters),
          suppliers: mergeById(current.suppliers, saved.suppliers),
          purchaseOrders: mergeById(current.purchaseOrders, saved.purchaseOrders),
          purchaseOrderLines: mergeById(current.purchaseOrderLines, saved.purchaseOrderLines),
          supplierReceipts: mergeById(current.supplierReceipts, saved.supplierReceipts),
          recipes: mergeById(current.recipes, saved.recipes),
          recipeItems: mergeById(current.recipeItems, saved.recipeItems),
          productionBatches: mergeById(current.productionBatches, saved.productionBatches),
          productVariants: mergeById(current.productVariants, saved.productVariants),
          unitConversions: mergeById(current.unitConversions, saved.unitConversions),
          stockReservations: mergeById(current.stockReservations, saved.stockReservations),
          internalConsumptions: mergeById(current.internalConsumptions, saved.internalConsumptions),
          stockPolicy: { ...current.stockPolicy, ...saved.stockPolicy },
          configDrafts: mergeById(current.configDrafts, saved.configDrafts),
          configHistoryEntries: mergeById(current.configHistoryEntries, saved.configHistoryEntries),
          permissionPolicies: mergeById(current.permissionPolicies, saved.permissionPolicies),
          taxProfiles: mergeById(current.taxProfiles, saved.taxProfiles),
          approvalRequests: mergeById(current.approvalRequests, saved.approvalRequests),
          configSnapshots: mergeById(current.configSnapshots, saved.configSnapshots),
          adminEnvironments: mergeById(current.adminEnvironments, saved.adminEnvironments),
          importReports: mergeById(current.importReports, saved.importReports),
          stockMovements: mergeById(current.stockMovements, saved.stockMovements),
        };
      },
    }
  )
);
