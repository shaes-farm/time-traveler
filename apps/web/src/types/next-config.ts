import type {
    PublicRuntimeConfig,
    ServerRuntimeConfig
} from '.';

export interface NextConfig {
    publicRuntimeConfig: PublicRuntimeConfig
    serverRuntimeConfig: ServerRuntimeConfig
};
