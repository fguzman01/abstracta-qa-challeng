import fs from 'fs';
import path from 'path';
import { Category, Tag } from '../src/type/pet';

export interface EnvData {
  baseUrl: string;
  petNamePrefix: string;
  category: Category;
  tags: Tag[];
}

// Ambiente activo: staging por defecto, para no apuntar a producción por accidente.
export const ENV = process.env.ENV ?? 'staging';
const filePath = path.resolve(__dirname, 'data', `${ENV}.json`);

if (!fs.existsSync(filePath)) {
  throw new Error(`No existe la configuración para ENV=${ENV}: ${filePath}`);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as EnvData;

// Los types no validan en ejecución: si falta un campo, se falla aquí con un mensaje claro.
const requiredKeys: (keyof EnvData)[] = ['baseUrl', 'petNamePrefix', 'category', 'tags'];
const missingKeys = requiredKeys.filter((key) => data[key] === undefined);

if (missingKeys.length > 0) {
  throw new Error(`Faltan campos en config/data/${ENV}.json: ${missingKeys.join(', ')}`);
}

export const envData = data;