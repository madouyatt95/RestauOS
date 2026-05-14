import { useState, useEffect } from 'react';

const GALSEN_API_BASE = 'https://galsenapi.lassanasiby.com/api';

export interface GalsenRegion {
  id: number;
  nom: string;
  code: string;
  population: number;
  superficie: number;
  departments: string[];
}

export interface GalsenCommune {
  id: number;
  nom: string;
  region: string;
}

export interface LocationSuggestion {
  name: string;
  type: 'region' | 'department' | 'commune';
  region: string;
}

/**
 * Custom hook to fetch regions, departments & communes from GalsenAPI.
 * Falls back to hardcoded data if the API is unreachable.
 */
export function useGalsenRegions() {
  const [regions, setRegions] = useState<GalsenRegion[]>([]);
  const [communes, setCommunes] = useState<GalsenCommune[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [regRes, comRes] = await Promise.all([
          fetch(`${GALSEN_API_BASE}/regions/`),
          fetch(`${GALSEN_API_BASE}/communes/`),
        ]);

        if (!regRes.ok) throw new Error(`Regions HTTP ${regRes.status}`);
        const regData: GalsenRegion[] = await regRes.json();

        let comData: GalsenCommune[] = [];
        if (comRes.ok) {
          comData = await comRes.json();
        }

        if (!cancelled) {
          setRegions(regData);
          setCommunes(comData);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('GalsenAPI indisponible, utilisation des données locales:', err.message);
        if (!cancelled) {
          setRegions(FALLBACK_REGIONS);
          setCommunes([]);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  /** Get departments for a specific region name */
  const getDepartments = (regionName: string): string[] => {
    const region = regions.find(r => r.nom === regionName);
    return region?.departments || [];
  };

  /** Get all region names as a simple string array */
  const regionNames = regions.map(r => r.nom);

  /**
   * Build a flat, searchable list of all locations:
   * regions, departments, and communes — each tagged with its type and parent region.
   */
  const allLocations: LocationSuggestion[] = (() => {
    const list: LocationSuggestion[] = [];
    regions.forEach(r => {
      list.push({ name: r.nom, type: 'region', region: r.nom });
      r.departments.forEach(d => {
        list.push({ name: d, type: 'department', region: r.nom });
      });
    });
    communes.forEach(c => {
      if (!list.some(l => l.name.toLowerCase() === c.nom.toLowerCase())) {
        list.push({ name: c.nom, type: 'commune', region: c.region });
      }
    });
    return list;
  })();

  /**
   * Search locations by query string.
   * Returns up to `limit` matching suggestions, prioritized: region > department > commune.
   */
  const searchLocations = (query: string, limit = 8): LocationSuggestion[] => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = allLocations.filter(l => l.name.toLowerCase().includes(q));

    const priority: Record<string, number> = { region: 0, department: 1, commune: 2 };
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return priority[a.type] - priority[b.type];
    });

    return results.slice(0, limit);
  };

  return { regions, regionNames, getDepartments, communes, allLocations, searchLocations, loading, error };
}

// ── Fallback data (mirrors GalsenAPI structure) ──
const FALLBACK_REGIONS: GalsenRegion[] = [
  { id: 29, nom: 'Dakar', code: 'DK', population: 4042225, superficie: 547, departments: ['Dakar', 'Pikine', 'Guédiawaye', 'Rufisque', 'Keur Massar'] },
  { id: 30, nom: 'Diourbel', code: 'DB', population: 1049954, superficie: 4824, departments: ['Diourbel', 'Bambey', 'Mbacké'] },
  { id: 31, nom: 'Fatick', code: 'FK', population: 613000, superficie: 6849, departments: ['Fatick', 'Foundiougne', 'Gossas'] },
  { id: 32, nom: 'Kaffrine', code: 'KA', population: 655121, superficie: 11262, departments: ['Kaffrine', 'Birkilane', 'Malème-Hodar', 'Koungheul'] },
  { id: 33, nom: 'Kaolack', code: 'KL', population: 1066375, superficie: 5357, departments: ['Kaolack', 'Guinguinéo', 'Nioro du Rip'] },
  { id: 34, nom: 'Kédougou', code: 'KE', population: 156351, superficie: 16800, departments: ['Kédougou', 'Salémata', 'Saraya'] },
  { id: 35, nom: 'Kolda', code: 'KD', population: 847243, superficie: 13771, departments: ['Kolda', 'Médina Yoro Foulah', 'Vélingara'] },
  { id: 36, nom: 'Louga', code: 'LG', population: 677533, superficie: 24889, departments: ['Louga', 'Kébémer', 'Linguère'] },
  { id: 37, nom: 'Matam', code: 'MT', population: 423041, superficie: 29445, departments: ['Matam', 'Kanel', 'Ranérou'] },
  { id: 38, nom: 'Saint-Louis', code: 'SL', population: 944550, superficie: 19241, departments: ['Saint-Louis', 'Dagana', 'Podor'] },
  { id: 39, nom: 'Sédhiou', code: 'SE', population: 398615, superficie: 7341, departments: ['Sédhiou', 'Bounkiling', 'Goudomp'] },
  { id: 40, nom: 'Tambacounda', code: 'TC', population: 812075, superficie: 42364, departments: ['Tambacounda', 'Goudiry', 'Bakel', 'Koumpentoum'] },
  { id: 41, nom: 'Thies', code: 'TH', population: 1442338, superficie: 6670, departments: ['Thies', 'Tivaouane', 'Mbour'] },
  { id: 42, nom: 'Ziguinchor', code: 'ZG', population: 437986, superficie: 7352, departments: ['Ziguinchor', 'Bignona', 'Oussouye'] },
];
