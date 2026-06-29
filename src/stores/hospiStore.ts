import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type POSType = 'restaurant' | 'bar' | 'nightclub' | 'casino' | 'room_service' | 'spa' | 'boutique' | 'other';
export type WarehouseType = 'restaurant' | 'bar' | 'kitchen' | 'cold_room' | 'central' | 'casino' | 'boutique' | 'other';
export type StockMovementType = 'sale' | 'purchase' | 'transfer_in' | 'transfer_out' | 'inventory_adjustment' | 'loss' | 'production';
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
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderLines: PurchaseOrderLine[];
  supplierReceipts: SupplierReceipt[];
  activePOSId: string;
  setActivePOS: (posId: string) => void;
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
  recordProduction: (productId: string, warehouseId: string, quantity: number, createdBy: string) => ProductionBatch | null;
  transferStock: (productId: string, fromWarehouseId: string, toWarehouseId: string, quantity: number, reason: string, createdBy: string) => StockMovement[];
  adjustInventory: (productId: string, warehouseId: string, countedQuantity: number, reason: string, createdBy: string) => StockMovement | null;
  recordLoss: (productId: string, warehouseId: string, quantity: number, reason: string, createdBy: string) => StockMovement | null;
  receivePurchaseOrder: (purchaseOrderId: string, receivedBy: string) => SupplierReceipt | null;
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
      posList,
      warehouses,
      products,
      posProductPrices,
      stockLevels,
      stockMovements: [],
      rooms,
      guests,
      stays,
      folios,
      folioLines: [],
      customerAccounts,
      customerLedgerEntries,
      cashRegisters,
      cashSessions: [],
      recipes,
      recipeItems,
      productionBatches: [],
      suppliers,
      purchaseOrders,
      purchaseOrderLines,
      supplierReceipts: [],
      activePOSId: 'pos-restaurant-jardin',

      setActivePOS: (posId) => set({ activePOSId: posId }),
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

        const nextStockLevels = state.stockLevels.map(stock => {
          const consumption = consumptionByProduct
            .filter(item => item.productId === stock.product_id && stock.warehouse_id === item.warehouseId)
            .reduce((sum, item) => sum + item.quantity, 0);
          if (!consumption) return stock;
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
            stockMovements: [...movements, ...state.stockMovements],
          });
        }

        return movements;
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
      receivePurchaseOrder: (purchaseOrderId, receivedBy) => {
        const state = get();
        const order = state.purchaseOrders.find(item => item.id === purchaseOrderId);
        if (!order || order.status === 'received' || order.status === 'cancelled') return null;
        const warehouse = state.warehouses.find(item => item.id === order.warehouse_id);
        if (!warehouse) return null;
        const lines = state.purchaseOrderLines.filter(line => line.purchase_order_id === purchaseOrderId);
        const receivableLines = lines.filter(line => line.quantity_ordered > line.quantity_received);
        if (receivableLines.length === 0) return null;

        const createdAt = new Date().toISOString();
        const site = state.sites.find(item => item.id === warehouse.site_id) || state.sites[0];
        const receipt: SupplierReceipt = {
          id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          purchase_order_id: purchaseOrderId,
          warehouse_id: order.warehouse_id,
          received_by: receivedBy,
          total_cost: receivableLines.reduce((sum, line) => sum + ((line.quantity_ordered - line.quantity_received) * line.unit_cost), 0),
          created_at: createdAt,
        };

        const nextLines = state.purchaseOrderLines.map(line => {
          if (line.purchase_order_id !== purchaseOrderId) return line;
          return { ...line, quantity_received: line.quantity_ordered };
        });

        const nextStockLevels = [...state.stockLevels];
        receivableLines.forEach(line => {
          const product = state.products.find(item => item.id === line.product_id);
          if (!product) return;
          const quantity = line.quantity_ordered - line.quantity_received;
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
        });

        const movements: StockMovement[] = receivableLines.map(line => ({
          id: `purchase-${Date.now()}-${line.id}`,
          company_id: site?.company_id || state.companies[0]?.id || 'comp-sartal-demo',
          site_id: site?.id || 'site-dakar',
          warehouse_id: order.warehouse_id,
          product_id: line.product_id,
          movement_type: 'purchase',
          quantity: line.quantity_ordered - line.quantity_received,
          reason: `Réception fournisseur ${order.id}`,
          reference_type: 'supplier_receipt',
          reference_id: receipt.id,
          created_by: receivedBy,
          created_at: createdAt,
        }));

        set({
          purchaseOrders: state.purchaseOrders.map(item => item.id === purchaseOrderId ? { ...item, status: 'received' } : item),
          purchaseOrderLines: nextLines,
          supplierReceipts: [receipt, ...state.supplierReceipts],
          stockLevels: nextStockLevels,
          stockMovements: [...movements, ...state.stockMovements],
        });
        return receipt;
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
    { name: 'sartal-hospi' }
  )
);
