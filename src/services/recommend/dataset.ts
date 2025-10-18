import path from 'path';
import fs from 'fs';
import { CarModel } from '../../types/domain';
import { fetchVehicleModels } from '../../services/vehicleData/apiClient';

export async function loadModels(): Promise<CarModel[]> {
  const apiModels = await fetchVehicleModels().catch(() => null);
  if (apiModels && apiModels.length > 0) return apiModels;
  return loadLocalDataset();
}

export function loadLocalDataset(): CarModel[] {
  const file = path.resolve(__dirname, '../../../data/toyota_models.json');
  const content = fs.readFileSync(file, 'utf-8');
  return JSON.parse(content) as CarModel[];
}


