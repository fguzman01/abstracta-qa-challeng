import { Order } from '../../src/type/order';
import { generateId } from './pet.factory';

export function buildOrder(petId: number, overrides: Partial<Order> = {}): Order {
  return {
    id: generateId(),
    petId,
    quantity: 1,
    shipDate: new Date().toISOString(),
    status: 'placed',
    complete: false,
    ...overrides,
  };
}