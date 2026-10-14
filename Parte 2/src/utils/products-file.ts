import fs from 'fs';
import path from 'path';
import { Product } from '../types/product';

export function writeProductsFile(products: Product[], fileName: string): string {
  const outputDir = path.resolve(__dirname, '../../output');
  fs.mkdirSync(outputDir, { recursive: true });

  const filePath = path.join(outputDir, fileName);
  const header = 'Nombre | Precio | Link';
  const lines = products.map((p) => `${p.name} | $${p.price} | ${p.link}`);

  fs.writeFileSync(filePath, [header, ...lines].join('\n'), 'utf-8');
  return filePath;
}