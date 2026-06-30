import type { UserProfile } from '../stores/authStore';
import type { POS, POSType } from '../stores/hospiStore';
import { BUSINESS_LABELS, moduleForPOS } from './accessControl';

export type WorkspaceTone = 'orange' | 'blue' | 'green' | 'purple' | 'cyan' | 'red' | 'slate';

export interface WorkspaceCard {
  label: string;
  value: string;
  detail: string;
  tone: WorkspaceTone;
}

export interface ProfileWorkspace {
  eyebrow: string;
  title: string;
  subtitle: string;
  tone: WorkspaceTone;
}

const POS_TYPE_LABELS: Record<POSType, string> = {
  restaurant: 'Restaurant',
  bar: 'Bar',
  nightclub: 'Night club',
  casino: 'Casino',
  room_service: 'Room service',
  spa: 'Spa',
  boutique: 'Boutique',
  other: 'Point de vente',
};

const MODULE_TONES: Record<string, WorkspaceTone> = {
  restaurant: 'orange',
  hotel: 'cyan',
  casino: 'purple',
  spa: 'green',
  boutique: 'blue',
  stock: 'slate',
  delivery: 'orange',
  direction: 'purple',
};

export const workspaceToneClasses: Record<WorkspaceTone, { text: string; bg: string; border: string; solid: string }> = {
  orange: { text: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/20', solid: 'bg-orange' },
  blue: { text: 'text-blue', bg: 'bg-blue/10', border: 'border-blue/20', solid: 'bg-blue' },
  green: { text: 'text-green', bg: 'bg-green/10', border: 'border-green/20', solid: 'bg-green' },
  purple: { text: 'text-purple', bg: 'bg-purple/10', border: 'border-purple/20', solid: 'bg-purple' },
  cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-400/20', solid: 'bg-cyan-500' },
  red: { text: 'text-red', bg: 'bg-red/10', border: 'border-red/20', solid: 'bg-red' },
  slate: { text: 'text-text-secondary', bg: 'bg-white/5', border: 'border-white/10', solid: 'bg-white/10' },
};

export function getPOSTypeLabel(type?: POSType) {
  if (!type) return 'Point de vente';
  return POS_TYPE_LABELS[type] || 'Point de vente';
}

function getPrimaryModule(user?: UserProfile | null, activePOS?: POS): NonNullable<UserProfile['businessModules']>[number] | 'restaurant' {
  if (activePOS) return moduleForPOS(activePOS);
  return user?.businessModules?.[0] || 'restaurant';
}

export function getProfileWorkspace(user?: UserProfile | null, activePOS?: POS): ProfileWorkspace {
  const module = getPrimaryModule(user, activePOS);
  const moduleLabel = BUSINESS_LABELS[module] || BUSINESS_LABELS[getPrimaryModule(user)] || 'Métier';
  const posName = activePOS?.name;
  const tone = MODULE_TONES[module] || 'slate';

  if (!user) {
    return {
      eyebrow: 'Espace métier',
      title: posName || moduleLabel,
      subtitle: 'Sélectionne un profil pour afficher les actions autorisées.',
      tone,
    };
  }

  if (user.role === 'Client') {
    return {
      eyebrow: 'Espace client',
      title: user.demoTitle || 'Mon séjour',
      subtitle: 'Réservations, folio, avantages et demandes liées au séjour.',
      tone: 'cyan',
    };
  }

  if (user.role === 'Livreur') {
    return {
      eyebrow: 'Terrain',
      title: user.demoTitle || 'Tournée active',
      subtitle: 'Courses assignées, encaissements à ramener et preuve de livraison.',
      tone: 'orange',
    };
  }

  if (user.role === 'Chef cuisine') {
    return {
      eyebrow: 'Production',
      title: user.demoTitle || 'Cuisine',
      subtitle: 'Tickets à produire, postes de préparation, pertes et alertes cuisine.',
      tone: 'orange',
    };
  }

  if (user.role === 'Réceptionniste') {
    return {
      eyebrow: 'Réception hôtel',
      title: user.demoTitle || 'Réception PMS',
      subtitle: 'Arrivées, départs, folios, paiements et demandes client.',
      tone: 'cyan',
    };
  }

  if (user.role === 'Gouvernante') {
    return {
      eyebrow: 'Housekeeping',
      title: user.demoTitle || 'Gouvernante',
      subtitle: 'Chambres à nettoyer, inspection, mini-bar et anomalies de séjour.',
      tone: 'cyan',
    };
  }

  if (user.role === 'Maintenance') {
    return {
      eyebrow: 'Technique hôtel',
      title: user.demoTitle || 'Maintenance',
      subtitle: 'Chambres bloquées, tickets techniques et remise en service.',
      tone: 'orange',
    };
  }

  if (user.role === 'Barman') {
    return {
      eyebrow: 'Service bar',
      title: posName || user.demoTitle || 'Bar',
      subtitle: 'Ventes comptoir, cave, caisse et stock boissons du POS.',
      tone: 'purple',
    };
  }

  if (user.role === 'Croupier') {
    return {
      eyebrow: 'Casino floor',
      title: posName || user.demoTitle || 'Tables casino',
      subtitle: 'Sessions, buy-in, cash-out, traçabilité et audit caisse.',
      tone: 'purple',
    };
  }

  if (user.role === 'Praticien spa') {
    return {
      eyebrow: 'Cabines spa',
      title: posName || user.demoTitle || 'Spa',
      subtitle: 'Planning soins, clients, cabines et consommables spa.',
      tone: 'green',
    };
  }

  if (user.role === 'Vendeur boutique') {
    return {
      eyebrow: 'Boutique hôtel',
      title: posName || user.demoTitle || 'Boutique',
      subtitle: 'Ventes, retours, échanges, stock boutique et room charge.',
      tone: 'blue',
    };
  }

  if (user.role === 'Stockiste') {
    return {
      eyebrow: 'Dépôts & inventaires',
      title: user.demoTitle || 'Stocks',
      subtitle: 'Seuils, transferts, inventaires, pertes et mouvements multi-dépôts.',
      tone: 'blue',
    };
  }

  if (user.role === 'Acheteur') {
    return {
      eyebrow: 'Achats fournisseurs',
      title: user.demoTitle || 'Achats',
      subtitle: 'Commandes fournisseurs, réceptions partielles, lots et coûts.',
      tone: 'orange',
    };
  }

  if (user.role === 'Serveur') {
    if (activePOS?.type === 'room_service') {
      return {
        eyebrow: 'Service hôtel',
        title: posName || 'Room service',
        subtitle: 'Prise de commande, imputation chambre et suivi de préparation.',
        tone: 'cyan',
      };
    }
    return {
      eyebrow: 'Service salle',
      title: posName || user.demoTitle || 'Salle restaurant',
      subtitle: 'Tables, commandes, envoi cuisine et suivi des tickets à servir.',
      tone: 'orange',
    };
  }

  if (user.role === 'Caissier') {
    if (activePOS?.type === 'room_service') {
      return {
        eyebrow: 'Réception & caisse',
        title: posName || user.demoTitle || 'Caisse hôtel',
        subtitle: 'Paiements, imputations chambre, comptes ouverts et clôture Z.',
        tone: 'cyan',
      };
    }
    if (activePOS?.type === 'boutique') {
      return {
        eyebrow: 'Comptoir boutique',
        title: posName || user.demoTitle || 'Boutique hôtel',
        subtitle: 'Ventes, retours, échanges, paiements et stock boutique.',
        tone: 'blue',
      };
    }
    return {
      eyebrow: 'Caisse POS',
      title: posName || user.demoTitle || 'Encaissement',
      subtitle: 'Tickets, paiements, remises autorisées, room charge et clôture.',
      tone,
    };
  }

  if (user.accessLevel === 'direction') {
    return {
      eyebrow: 'Direction générale',
      title: 'Pilotage entreprise',
      subtitle: 'Tous les sites, tous les métiers, tous les chiffres consolidés.',
      tone: 'purple',
    };
  }

  if (user.accessLevel === 'site_manager') {
    return {
      eyebrow: 'Gérance de site',
      title: user.demoTitle || 'Pilotage du site',
      subtitle: 'Activités, équipes, stocks, caisses et performance du site autorisé.',
      tone: 'purple',
    };
  }

  if (user.accessLevel === 'business_manager') {
    return {
      eyebrow: `Manager ${moduleLabel}`,
      title: posName || user.demoTitle || moduleLabel,
      subtitle: 'Exploitation quotidienne, équipe, ventes, stock et réglages du métier.',
      tone,
    };
  }

  if (user.accessLevel === 'pos_manager') {
    return {
      eyebrow: 'Responsable POS',
      title: posName || user.demoTitle || 'Points de vente',
      subtitle: 'Ventes, équipe, caisse, dépôt lié et qualité de service du périmètre.',
      tone,
    };
  }

  return {
    eyebrow: user.demoTitle || user.role,
    title: posName || moduleLabel,
    subtitle: 'Actions autorisées pour le service en cours.',
    tone,
  };
}

export function getPOSActionCards(pos: POS, roomCount: number): WorkspaceCard[] {
  if (pos.type === 'room_service') {
    return [
      { label: 'Priorité', value: `${roomCount}`, detail: 'chambres ouvertes', tone: 'cyan' },
      { label: 'Action clé', value: 'Imputer', detail: 'directement sur folio', tone: 'blue' },
      { label: 'Stock', value: 'Auto', detail: 'dépôt lié au POS', tone: 'green' },
    ];
  }

  if (pos.type === 'spa') {
    return [
      { label: 'Planning', value: 'Soins', detail: 'rendez-vous du jour', tone: 'green' },
      { label: 'Paiement', value: 'Chambre', detail: 'ou encaissement direct', tone: 'cyan' },
      { label: 'Cabine', value: 'Stock', detail: 'produits spa suivis', tone: 'blue' },
    ];
  }

  if (pos.type === 'casino') {
    return [
      { label: 'Tables', value: 'Sessions', detail: 'buy-in et clôtures', tone: 'purple' },
      { label: 'Caisse', value: 'Audit', detail: 'flux tracés', tone: 'orange' },
      { label: 'VIP', value: 'Folio', detail: 'liaison hôtel possible', tone: 'cyan' },
    ];
  }

  if (pos.type === 'boutique') {
    return [
      { label: 'Comptoir', value: 'Vendre', detail: 'articles boutique', tone: 'blue' },
      { label: 'Retours', value: 'Échanger', detail: 'stock réintégré', tone: 'green' },
      { label: 'Client', value: 'Folio', detail: 'paiement chambre', tone: 'cyan' },
    ];
  }

  if (pos.type === 'bar' || pos.type === 'nightclub') {
    return [
      { label: 'Service', value: 'Rapide', detail: 'ventes comptoir', tone: 'purple' },
      { label: 'Dépôt', value: 'Séparé', detail: 'stock propre au bar', tone: 'green' },
      { label: 'Caisse', value: 'Z', detail: 'clôture par POS', tone: 'orange' },
    ];
  }

  return [
    { label: 'Salle', value: 'Tables', detail: 'commandes restaurant', tone: 'orange' },
    { label: 'Cuisine', value: 'KDS', detail: 'tickets synchronisés', tone: 'blue' },
    { label: 'Stock', value: 'Recettes', detail: 'ingrédients déduits', tone: 'green' },
  ];
}

export function getCashierActionCards(pos: POS | undefined, open: boolean, pendingCount: number): WorkspaceCard[] {
  const sessionValue = open ? 'Ouverte' : 'À ouvrir';
  const sessionTone: WorkspaceTone = open ? 'green' : 'orange';
  if (pos?.type === 'room_service') {
    return [
      { label: 'Session', value: sessionValue, detail: 'caisse room service', tone: sessionTone },
      { label: 'À encaisser', value: String(pendingCount), detail: 'tickets visibles', tone: 'blue' },
      { label: 'Hôtel', value: 'Folio', detail: 'imputation chambre', tone: 'cyan' },
    ];
  }

  if (pos?.type === 'boutique') {
    return [
      { label: 'Session', value: sessionValue, detail: 'caisse boutique', tone: sessionTone },
      { label: 'À encaisser', value: String(pendingCount), detail: 'tickets comptoir', tone: 'blue' },
      { label: 'Retour', value: 'Échange', detail: 'lié au stock', tone: 'green' },
    ];
  }

  return [
    { label: 'Session', value: sessionValue, detail: 'rapport X/Z', tone: sessionTone },
    { label: 'À encaisser', value: String(pendingCount), detail: 'tickets autorisés', tone: 'blue' },
    { label: 'Règles', value: 'Contrôle', detail: 'remises et annulations', tone: 'purple' },
  ];
}

export function getKitchenActionCards(ticketCount: number, wasteTotal: number): WorkspaceCard[] {
  return [
    { label: 'Tickets', value: String(ticketCount), detail: 'à produire maintenant', tone: ticketCount ? 'orange' : 'green' },
    { label: 'Postes', value: 'Filtrer', detail: 'entrées, plats, desserts', tone: 'blue' },
    { label: 'Pertes', value: `${wasteTotal.toLocaleString('fr-FR')} F`, detail: 'semaine courante', tone: wasteTotal ? 'red' : 'green' },
  ];
}

export function getDeliveryActionCards(activeCount: number, doneCount: number, cashToReturn: number, isManager: boolean): WorkspaceCard[] {
  if (isManager) {
    return [
      { label: 'Courses', value: String(activeCount), detail: 'à superviser', tone: activeCount ? 'orange' : 'green' },
      { label: 'Terminées', value: String(doneCount), detail: 'déjà livrées', tone: 'green' },
      { label: 'Espèces', value: `${cashToReturn.toLocaleString('fr-FR')} F`, detail: 'à rapprocher', tone: cashToReturn ? 'blue' : 'green' },
    ];
  }

  return [
    { label: 'Ma tournée', value: String(activeCount), detail: 'courses assignées', tone: activeCount ? 'orange' : 'green' },
    { label: 'Livrées', value: String(doneCount), detail: 'validées', tone: 'green' },
    { label: 'À ramener', value: `${cashToReturn.toLocaleString('fr-FR')} F`, detail: 'espèces restaurant', tone: cashToReturn ? 'blue' : 'green' },
  ];
}
