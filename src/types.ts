// x402 types for TypeScript
export interface PaymentOption {
  scheme: string;
  price: string;
  network: string;
  payTo: string;
}

export interface BazaarExtension {
  info: {
    input?: {
      type: string;
      method: string;
      queryParams?: Record<string, unknown>;
      pathParams?: Record<string, string>;
    };
    inputSchema?: Record<string, unknown>;
    output?: {
      type: string;
      example: unknown;
    };
    outputSchema?: Record<string, unknown>;
  };
}

export interface RouteConfig {
  accepts: PaymentOption[];
  description?: string;
  mimeType?: string;
  extensions?: {
    bazaar?: BazaarExtension;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
