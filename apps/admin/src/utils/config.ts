import getNextConfig from 'next/config';
import type { ApiConfig, AppConfig, PublicRuntimeConfig, ServerRuntimeConfig, NextConfig } from '../types';

export const getConfig = (): NextConfig => getNextConfig() as NextConfig;

const config = getConfig();

export const getPublicRuntimeConfig = (): PublicRuntimeConfig => config.publicRuntimeConfig;
export const getServerRuntimeConfig = (): ServerRuntimeConfig => config.serverRuntimeConfig;
export const getAppConfig = (): AppConfig => config.publicRuntimeConfig.app;
export const getApiConfig = (): ApiConfig => config.serverRuntimeConfig.api;
