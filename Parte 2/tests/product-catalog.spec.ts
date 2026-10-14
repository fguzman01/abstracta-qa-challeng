import { test, expect } from '../src/fixtures/pages.fixture';
import { writeProductsFile } from '../src/utils/products-file';
import { Product } from '../src/types/product';

const PAGES_TO_SCRAPE = 2;

test('Escenario A: obtener productos de las primeras 2 páginas y generar archivo', async ({ homePage }) => {
  const allProducts: Product[] = [];

  await test.step('Abrir el home', async () => {
    await homePage.goto();
  });

  for (let pageNumber = 1; pageNumber <= PAGES_TO_SCRAPE; pageNumber++) {
    await test.step(`Leer productos de la página ${pageNumber}`, async () => {
      if (pageNumber > 1) {
        await homePage.goToNextPage();
      }
      const products = await homePage.getProducts();
      expect(products.length, `La página ${pageNumber} debe tener productos`).toBeGreaterThan(0);
      allProducts.push(...products);
    });
  }

  await test.step('Validar datos y generar archivo', async () => {
    for (const product of allProducts) {
      expect(product.name, 'Nombre vacío').not.toBe('');
      expect(product.price, `Precio inválido en ${product.name}`).toBeGreaterThan(0);
      expect(product.link).toContain('prod.html');
    }

    const env = process.env.ENV ?? 'staging';
    const filePath = writeProductsFile(allProducts, `products-${env}.txt`);
    await test.info().attach('products', { path: filePath, contentType: 'text/plain' });
  });
});