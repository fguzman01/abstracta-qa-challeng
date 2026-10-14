import { APIRequestContext, APIResponse } from '@playwright/test';
import { Pet, PetStatus } from '../type/pet';

export class PetClient {
  constructor(private readonly request: APIRequestContext) {}

  create(pet: Pet): Promise<APIResponse> {
    return this.request.post('pet', { data: pet });
  }

  getById(id: number): Promise<APIResponse> {
    return this.request.get(`pet/${id}`);
  }

  update(pet: Pet): Promise<APIResponse> {
    return this.request.put('pet', { data: pet });
  }

  findByStatus(status: PetStatus): Promise<APIResponse> {
    return this.request.get('pet/findByStatus', { params: { status } });
  }
}