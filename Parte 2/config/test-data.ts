import fs from 'fs';
import path from 'path';
import { Customer } from '../src/types/customer';

export interface EnvData {
  product: string;
  cartProducts: string[];
  customer: Customer;
}

const ENV = process.env.ENV ?? 'staging';
const filePath = path.resolve(__dirname, 'data', `${ENV}.json`);

if (!fs.existsSync(filePath)) {
  throw new Error(`No existe el archivo de datos para ENV=${ENV}: ${filePath}`);
}

const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as EnvData;

const requiredKeys: (keyof EnvData)[] = ['product', 'cartProducts', 'customer'];
const missingKeys = requiredKeys.filter((key) => data[key] === undefined);

if (missingKeys.length > 0) {
  throw new Error(`Faltan campos en config/data/${ENV}.json: ${missingKeys.join(', ')}`);
}

export const envData = data;