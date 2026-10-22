import { Pet } from '../../src/type/pet';
import { envData } from '../../config/test-data';

// Id único para una API pública compartida. Date.now() solo no alcanza: varias mascotas
// creadas en el mismo milisegundo (escenario A) tendrían el mismo id. El resultado
// queda bajo 2^53, el máximo entero que JavaScript representa sin perder precisión.

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