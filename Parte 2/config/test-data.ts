import fs from 'fs';
import path from 'path';
import { Customer } from '../src/types/customer';

export interface EnvData {
  product: string;
  customer: Customer;
}

const ENV = process.env.ENV ?? 'staging';
const filePath = path.resolve(__dirname, 'data', `${ENV}.json`);

if (!fs.existsSync(filePath)) {
  throw new Error(`No existe el archivo de datos para ENV=${ENV}: ${filePath}`);
}

export const envData: EnvData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));