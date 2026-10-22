import { test as base } from '@playwright/test';
import { PetClient } from '../clients/PetClient';
import { StoreClient } from '../clients/StoreClient';
import { UserClient } from '../clients/UserClient';



type ApiFixtures = {
  petClient: PetClient;
  storeClient : StoreClient
  userClient: UserClient;
};

// Los tests piden los clients por parámetro ({ petClient }) en vez de construirlos.
// Si cambia cómo se crea un client, se ajusta solo aquí. Cada test recibe su propia
// instancia, sin estado compartido entre tests en paralelo.

export const test = base.extend<ApiFixtures>({
  petClient: async ({ request }, use) => {
    const petClient = new PetClient(request);
    await use(petClient);
  },
  storeClient: async ({ request }, use) => {
    await use(new StoreClient(request));
  },
  userClient: async ({ request }, use) => {
    await use(new UserClient(request));
  },
});

export { expect } from '@playwright/test';