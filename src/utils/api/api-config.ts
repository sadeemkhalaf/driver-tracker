import { API_TIMEOUT, DEFAULT_API } from "./api-constants";

export interface ApiConfig {
    /**
     * The URL of the api.
     */
    url: string;
  
    /**
     * Milliseconds before we timeout the request.
     */
    timeout: number;
  
    /**
     * Authorization Header
     */
    authorizationHeader?: string;
  }
  
  /**
   * The default configuration for the app.
   */
  export const DEFAULT_API_CONFIG: ApiConfig = {
    url: DEFAULT_API || 'https://jsonplaceholder.typicode.com',
    timeout: API_TIMEOUT,
  };
  