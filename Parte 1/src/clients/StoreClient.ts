import { APIRequestContext, APIResponse } from '@playwright/test';
import { Order } from '../type/order';

export class StoreClient {
  constructor(private readonly request: APIRequestContext) {}

  createOrder(order: Order): Promise<APIResponse> {
    return this.request.post('store/order', { data: order });
  }

  getOrderById(id: number): Promise<APIResponse> {
    return this.request.get(`store/order/${id}`);
  }

  deleteOrder(id: number): Promise<APIResponse> {
    return this.request.delete(`store/order/${id}`);
  }
}