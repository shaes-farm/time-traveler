export interface AppConfig {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  basePath: string;
  icon: string;
  logo: {
    main: string;
    contrast: string;
  };
  copyright: {
    holder: string;
    url: string;
    year: number;
  };
}
