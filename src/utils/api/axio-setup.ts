import axios, { AxiosInstance, ResponseType } from "axios";
import { ApiConfig } from "./api-config";
import { API_TIMEOUT, DEFAULT_API } from "./api-constants";

export class AxiosApi {
  apiInstance: AxiosInstance | undefined;
  config: ApiConfig | undefined;

  constructor(baseURL: string = DEFAULT_API, timeout: number = API_TIMEOUT) {
    const apiConfig = { url: baseURL, timeout };
    this.config = apiConfig;
    this.setup();
  }

  setup() {
    this.apiInstance = axios.create({
      baseURL: "",
      timeout: 0,
      headers: {
        Accept: "application/json",
      },
    });
  }

  getAuthBearerHeader = () => {
    const headers = {
      Accept: "application/json",
    };
    if (this.config?.authorizationHeader) {
      return {
        ...headers,
        Authorization: `Bearer ${this.config.authorizationHeader}`,
      };
    }
    return headers;
  };

  public async getRequest(
    endpoint: string,
    params?: any,
    showAlert: boolean = true
  ): Promise<ResponseType | null> {
    try {
      const header = this.getAuthBearerHeader();
      const response = await this.apiInstance?.get(endpoint, {
        ...params,
        headers: header,
      });
      if (!response?.status) {
        throw response?.statusText;
      } else {
        return response.data;
      }
    } catch (error) {}
    return null;
  }

  public async postRequest(
    endpoint: string,
    data?: any
  ): Promise<ResponseType | null> {
    try {
      const header = this.getAuthBearerHeader();
      const response = await this.apiInstance?.post(endpoint, null, {
        headers: header,
      });
      if (!response?.status) {
        throw response?.statusText;
      } else {
        return response.data;
      }
    } catch (error) {}
    return null;
  }
}

export const ApiService = new AxiosApi();
