import { Pet } from '../../src/type/pet';
import { envData } from '../../config/test-data';

export function generateId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export function buildPet(overrides: Partial<Pet> = {}): Pet {
  const id = generateId();

  return {
    id,
    name: `${envData.petNamePrefix}-Pet-${id}`,
    photoUrls: [],
    status: 'available',
    category: envData.category,
    tags: envData.tags,
    ...overrides,
  };
}