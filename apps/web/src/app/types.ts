import type {LabeledRoute} from 'ui';

export interface AppConfig {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  icon: string;
  logo: {
    main: string;
    contrast: string;
  },
  copyright: {
    holder: string;
    url: string;
    year: number;
  };
  ui: {
    header: {
      menu: LabeledRoute[];
    };
    footer: {
      menu: LabeledRoute[];
    };
  };
}

export interface ApiConfig {
  baseUrl: string;
}

export interface Config {
  app: AppConfig;
  api: ApiConfig;
}
