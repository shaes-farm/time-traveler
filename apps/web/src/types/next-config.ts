import type {
    PublicRuntimeConfig,
    ServerRuntimeConfig
} from '../types';

export interface NextConfig {
    publicRuntimeConfig: PublicRuntimeConfig
    serverRuntimeConfig: ServerRuntimeConfig
};
