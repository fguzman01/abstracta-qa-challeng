import { User } from '../../src/type/user';
import { envData } from '../../config/test-data';
import { generateId } from './pet.factory';

export function buildUser(overrides: Partial<User> = {}): User {
  const id = generateId();

  return {
    id,
    username: `${envData.petNamePrefix.toLowerCase()}_user_${id}`,
    firstName: 'QA',
    lastName: `${envData.petNamePrefix}-${id}`,
    email: `qa.${id}@example.com`,
    password: `Pass-${id}`,
    phone: '099123456',
    userStatus: 1,
    ...overrides,
  };
}
