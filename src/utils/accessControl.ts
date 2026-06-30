import type { UserProfile } from '../stores/authStore';
import type { POS, Site } from '../stores/hospiStore';

export type BusinessModule = NonNullable<UserProfile['businessModules']>[number];

export const BUSINESS_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  casino: 'Casino',
  spa: 'Spa',
  boutique: 'Boutique',
  stock: 'Stock',
  delivery: 'Livraison',
  direction: 'Direction',
};

const POS_TO_MODULE: Record<string, BusinessModule> = {
  restaurant: 'restaurant',
  bar: 'casino',
  nightclub: 'casino',
  casino: 'casino',
  room_service: 'hotel',
  spa: 'spa',
  boutique: 'boutique',
  other: 'restaurant',
};

const ROUTE_MODULES: Array<{ prefix: string; modules: BusinessModule[]; managersOnly?: boolean }> = [
  { prefix: '/dashboard', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock'], managersOnly: true },
  { prefix: '/modules', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique'], managersOnly: true },
  { prefix: '/settings', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock'], managersOnly: true },
  { prefix: '/rapports', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock'], managersOnly: true },
  { prefix: '/demo-guide', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock', 'delivery'], managersOnly: true },
  { prefix: '/whatsapp-bot', modules: ['direction', 'restaurant', 'hotel', 'delivery'], managersOnly: true },
  { prefix: '/poste', modules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock', 'delivery'] },
  { prefix: '/pos-metier', modules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique'] },
  { prefix: '/commandes', modules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique'] },
  { prefix: '/caisse', modules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique'] },
  { prefix: '/cuisine', modules: ['restaurant'] },
  { prefix: '/stocks', modules: ['stock', 'restaurant', 'hotel', 'casino', 'spa', 'boutique'] },
  { prefix: '/pms', modules: ['hotel'] },
  { prefix: '/personnel', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique', 'stock', 'delivery'] },
  { prefix: '/livraisons', modules: ['delivery', 'hotel', 'restaurant'] },
  { prefix: '/fidelite', modules: ['restaurant', 'hotel', 'casino', 'spa', 'boutique'] },
  { prefix: '/menu-builder', modules: ['restaurant', 'casino', 'spa', 'boutique'], managersOnly: true },
  { prefix: '/factures', modules: ['direction', 'restaurant', 'hotel', 'casino', 'spa', 'boutique'], managersOnly: true },
];

export function isDirection(user?: UserProfile | null) {
  return user?.accessLevel === 'direction' || user?.role === 'Admin';
}

export function isManagerScope(user?: UserProfile | null) {
  return ['direction', 'site_manager', 'business_manager', 'pos_manager'].includes(user?.accessLevel || '');
}

export function moduleForPOS(pos: POS): BusinessModule {
  return POS_TO_MODULE[pos.type] || 'restaurant';
}

export function canAccessSite(user: UserProfile | null | undefined, siteId?: string) {
  if (!user || !siteId) return false;
  if (isDirection(user)) return true;
  return (user.siteIds || []).includes(siteId);
}

export function canAccessPOS(user: UserProfile | null | undefined, pos: POS) {
  if (!user) return false;
  if (isDirection(user)) return true;
  if (!canAccessSite(user, pos.site_id)) return false;
  const scopedPOS = user.posIds || [];
  if (scopedPOS.length > 0) return scopedPOS.includes(pos.id);
  return canAccessModule(user, moduleForPOS(pos));
}

export function canAccessModule(user: UserProfile | null | undefined, module: BusinessModule) {
  if (!user) return false;
  if (isDirection(user)) return true;
  return (user.businessModules || []).includes(module);
}

export function getVisibleSites(user: UserProfile | null | undefined, sites: Site[]) {
  if (!user) return [];
  if (isDirection(user)) return sites;
  return sites.filter(site => canAccessSite(user, site.id));
}

export function getVisiblePOS(user: UserProfile | null | undefined, posList: POS[]) {
  if (!user) return [];
  if (isDirection(user)) return posList;
  return posList.filter(pos => canAccessPOS(user, pos));
}

export function canAccessRoute(user: UserProfile | null | undefined, pathname: string) {
  if (!user) return false;
  if (pathname === '/plus') return true;
  if (user.role === 'Client') return pathname.startsWith('/client') || pathname === '/reservations' || pathname === '/wallet';
  if (pathname.startsWith('/settings') && user.accessLevel === 'pos_manager') return false;

  const route = ROUTE_MODULES.find(item => pathname.startsWith(item.prefix));
  if (!route) return false;
  if (route.managersOnly && !isManagerScope(user)) return false;
  return route.modules.some(module => canAccessModule(user, module));
}

export function getHomePathForUser(user: UserProfile | null | undefined) {
  if (!user) return '/';
  const modules = user.businessModules || [];
  const hasOnly = (module: BusinessModule) => modules.length === 1 && modules.includes(module);
  const has = (module: BusinessModule) => modules.includes(module);
  const specialistRoles = ['Réceptionniste', 'Gouvernante', 'Maintenance', 'Barman', 'Croupier', 'Praticien spa', 'Vendeur boutique', 'Stockiste', 'Acheteur'];
  const isRoomServiceOnly = (user.posIds || []).length > 0
    && (user.posIds || []).every(posId => posId.includes('room-service') || posId.includes('minibar'));

  if (user.role === 'Client') return '/client';
  if (specialistRoles.includes(user.role)) return '/poste';
  if (user.role === 'Livreur') return '/livraisons';
  if (user.role === 'Chef cuisine') return '/cuisine';

  if (user.role === 'Serveur') {
    if ((has('hotel') && !has('restaurant')) || isRoomServiceOnly) return '/pos-metier';
    return '/commandes';
  }

  if (user.role === 'Caissier') {
    if (hasOnly('hotel')) return '/pms';
    if (has('restaurant')) return '/caisse';
    if (has('boutique') || has('spa') || has('casino')) return '/pos-metier';
    return '/caisse';
  }

  if (user.accessLevel === 'business_manager' || user.accessLevel === 'pos_manager') {
    if (hasOnly('hotel')) return '/pms';
    if (hasOnly('stock')) return '/stocks';
    if (has('restaurant') && !has('hotel') && !has('casino') && !has('spa') && !has('boutique')) return '/commandes';
    if (has('casino') || has('spa') || has('boutique') || has('hotel')) return '/pos-metier';
  }

  return '/dashboard';
}

export function getAccessSummary(user: UserProfile | null | undefined, sites: Site[], posList: POS[]) {
  if (!user) return 'Aucun profil actif';
  if (isDirection(user)) return 'Toute l’entreprise · tous les sites · tous les métiers';
  if (user.role === 'Client') return user.roomId ? `Client · ${user.roomId.replace('room-', 'chambre ')}` : 'Client';

  const siteNames = getVisibleSites(user, sites).map(site => site.name);
  const posNames = getVisiblePOS(user, posList).map(pos => pos.name);
  const moduleNames = (user.businessModules || []).map(module => BUSINESS_LABELS[module] || module);
  return [
    siteNames.length ? siteNames.join(', ') : 'Site non défini',
    moduleNames.length ? moduleNames.join(', ') : 'Activité non définie',
    posNames.length ? posNames.join(', ') : 'Tous les points de vente autorisés',
  ].join(' · ');
}
