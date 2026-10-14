import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { PurchaseFlow } from '../flows/PurchaseFlow';

type PageFixtures = {
  homePage: HomePage;
  productPage: ProductPage;
  cartPage: CartPage;
  purchaseFlow: PurchaseFlow;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  purchaseFlow: async ({ homePage, productPage, cartPage }, use) => {
    await use(new PurchaseFlow(homePage, productPage, cartPage));
  },
});

export { expect } from '@playwright/test';