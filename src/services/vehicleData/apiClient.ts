import { CarModel } from '../../types/domain';
import fs from 'fs';
import path from 'path';

type NhtsaModelsResponse = {
  Results: Array<{ Model_Name: string }>
};

type FeMenuOptionsResponse = {
  menuItem?: Array<{ value: string }> | { value: string };
};

type FeVehicleResponse = {
  // subset of fields we care about
  make?: string;
  model?: string;
  trany?: string;
  fuelType?: string;
  comb08?: number; // mpg combined (gas/hybrid)
  combE?: number; // kWh/100mi maybe; not always present
  charge120?: number;
  co2TailpipeGpm?: number; // grams per mile
  VClass?: string; // vehicle size/class
};

let cache: { timestamp: number; models: CarModel[] } | null = null;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function safeJsonFetch<T>(url: string, init?: any, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, headers: { 'accept': 'application/json', ...(init?.headers || {}) } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

function mapClassToSize(vclass?: string): CarModel['size'] | undefined {
  if (!vclass) return undefined;
  const cls = vclass.toLowerCase();
  if (cls.includes('suv')) return 'SUV';
  if (cls.includes('compact')) return 'Compact';
  if (cls.includes('midsize') || cls.includes('mid-size') || cls.includes('large') || cls.includes('sedan')) return 'Sedan';
  if (cls.includes('truck') || cls.includes('pickup')) return 'Truck';
  return undefined;
}

function powertrainFromFuelType(fuelType?: string): CarModel['type'] | undefined {
  if (!fuelType) return undefined;
  const ft = fuelType.toLowerCase();
  if (ft.includes('electric')) return 'EV';
  if (ft.includes('hybrid')) return 'Hybrid';
  return 'Gas';
}

export async function fetchVehicleModels(year = 2024, make = 'Toyota'): Promise<CarModel[]> {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.models;
  }

  // Fetch model names from NHTSA (vPIC)
  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make)}?format=json`;
  const nhtsa = await safeJsonFetch<NhtsaModelsResponse>(nhtsaUrl);
  const modelNames = (nhtsa?.Results || []).map(x => x.Model_Name).filter(Boolean);
  // Focus on a subset that we can enrich reliably via FuelEconomy API
  const targetNames = ['Corolla', 'Corolla Hybrid', 'Prius', 'RAV4', 'RAV4 Hybrid', 'bZ4X'];
  const selected = modelNames.filter(n => targetNames.some(t => n.toLowerCase().includes(t.toLowerCase())));

  const mapped: CarModel[] = [];
  for (const name of selected) {
    // Use FuelEconomy menu options to find a vehicleId
    const menuUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(name)}&format=json`;
    const menu = await safeJsonFetch<FeMenuOptionsResponse>(menuUrl);
    const items = Array.isArray(menu?.menuItem) ? menu?.menuItem : menu?.menuItem ? [menu.menuItem] : [];
    const firstId = items && items.length > 0 ? items[0].value : undefined;
    let mpg: number | undefined;
    let mpge: number | undefined;
    let fuelType: string | undefined;
    let co2gpm: number | undefined;
    let size: CarModel['size'] | undefined;
    let type: CarModel['type'] | undefined;
    if (firstId) {
      const vehUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/${firstId}?format=json`;
      const v = await safeJsonFetch<FeVehicleResponse>(vehUrl);
      if (v) {
        fuelType = v.fuelType;
        type = powertrainFromFuelType(v.fuelType);
        size = mapClassToSize(v.VClass);
        if (typeof v.comb08 === 'number') {
          mpg = v.comb08;
        }
        // For EVs, FuelEconomy uses MPGe via comb08 for EV? If not, leave mpge undefined
        // co2TailpipeGpm is grams per mile
        if (typeof v.co2TailpipeGpm === 'number') {
          co2gpm = v.co2TailpipeGpm;
        }
      }
    }

    mapped.push({
      name,
      type: type ?? 'Gas',
      msrp: 0, // to be filled from local fallback merge
      mpg,
      mpge,
      size: size ?? 'Sedan',
      aprBase: 0.06,
      leaseResidualPct: 0.58,
      fuelType,
      co2GramsPerMile: co2gpm
    });
  }

  // Merge with local dataset to fill missing msrp/apr/residual/size defaults
  function loadLocalDatasetDirect(): CarModel[] {
    const file = path.resolve(__dirname, '../../../data/toyota_models.json');
    const content = fs.readFileSync(file, 'utf-8');
    return JSON.parse(content) as CarModel[];
  }
  const local = loadLocalDatasetDirect();
  const merged: CarModel[] = mapped.map(apiModel => {
    const fallback = local.find(l => l.name.toLowerCase() === apiModel.name.toLowerCase());
    return {
      ...fallback,
      ...apiModel,
      msrp: apiModel.msrp && apiModel.msrp > 0 ? apiModel.msrp : (fallback?.msrp ?? 0),
      aprBase: apiModel.aprBase || (fallback?.aprBase ?? 0.06),
      leaseResidualPct: apiModel.leaseResidualPct || (fallback?.leaseResidualPct ?? 0.58),
      size: apiModel.size || (fallback?.size ?? 'Sedan')
    } as CarModel;
  });

  // If nothing was mapped, fallback entirely
  const result = merged.length > 0 ? merged : local;
  cache = { timestamp: Date.now(), models: result };
  return result;
}


