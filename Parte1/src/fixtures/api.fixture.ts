import { test as base } from '@playwright/test';
import { PetClient } from '../clients/PetClient';

type ApiFixtures = {
  petClient: PetClient;
};

export const test = base.extend<ApiFixtures>({
  petClient: async ({ request }, use) => {
    const petClient = new PetClient(request);
    await use(petClient);
  },
});

export { expect } from '@playwright/test';