export class ApiClient {
  private readonly baseUrl = typeof window === "undefined" ? process.env.INTERNAL_API_URL ?? "" : "";

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await this.request(path, {
      method: "GET",
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await this.request(path, {
      method: "DELETE",
      ...options,
    });
    return this.handleResponse<T>(response);
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let message = response.statusText;

      try {
        const payload = (await response.json()) as { error?: string };
        if (payload.error) {
          message = payload.error;
        }
      } catch {
        // Keep default HTTP status text when no JSON body is returned.
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
