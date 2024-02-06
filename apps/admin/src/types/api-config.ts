import type { Backend } from 'service';

export interface ApiConfig {
  backend: Backend;
  baseUrl: string;
  key: string;
}
