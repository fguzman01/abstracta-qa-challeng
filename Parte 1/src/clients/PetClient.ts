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

  delete(id: number): Promise<APIResponse> {
    return this.request.delete(`pet/${id}`);
  }

  updateWithForm(id: number, form: Record<string, string>): Promise<APIResponse> {
    // Sobrescribe el Content-Type JSON global definido en playwright.config.ts
    return this.request.post(`pet/${id}`, {
      form,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  findByTags(tags: string[]): Promise<APIResponse> {
    // collectionFormat multi: ?tags=a&tags=b
    const params = new URLSearchParams();
    tags.forEach((tag) => params.append('tags', tag));
    return this.request.get('pet/findByTags', { params });
  }

  // Para casos negativos: permiten enviar ids o bodies que no cumplen el tipo
  getByRawId(id: string): Promise<APIResponse> {
    return this.request.get(`pet/${id}`);
  }

  createRaw(data: unknown): Promise<APIResponse> {
    return this.request.post('pet', { data });
  }
}