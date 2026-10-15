import { APIRequestContext, APIResponse } from '@playwright/test';
import { User } from '../type/user';

export class UserClient {
  constructor(private readonly request: APIRequestContext) {}

  create(user: User): Promise<APIResponse> {
    return this.request.post('user', { data: user });
  }

  getByUsername(username: string): Promise<APIResponse> {
    return this.request.get(`user/${encodeURIComponent(username)}`);
  }

  delete(username: string): Promise<APIResponse> {
    return this.request.delete(`user/${encodeURIComponent(username)}`);
  }

  login(username: string, password: string): Promise<APIResponse> {
    return this.request.get('user/login', { params: { username, password } });
  }
}
