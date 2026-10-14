export type OrderStatus = 'placed' | 'approved' | 'delivered';

export interface Order {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string; // ISO 8601: en JSON las fechas viajan como texto
  status: OrderStatus;
  complete: boolean;
}