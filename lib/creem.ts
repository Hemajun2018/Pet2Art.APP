interface CreemCheckoutSession {
  id: string;
  url: string;
  status: string;
  customer_email?: string;
  metadata?: Record<string, any>;
}

interface CreemCheckoutParams {
  success_url: string;
  cancel_url: string;
  customer_email?: string;
  metadata?: Record<string, any>;
  line_items: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
      };
      unit_amount: number;
      recurring?: {
        interval: 'month' | 'year';
      };
    };
    quantity: number;
  }>;
  mode: 'payment' | 'subscription';
  allow_promotion_codes?: boolean;
}

interface CreemWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

class CreemClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.creem.io';
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Creem API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createCheckoutSession(params: CreemCheckoutParams): Promise<CreemCheckoutSession> {
    return this.request<CreemCheckoutSession>('/v1/checkout/sessions', 'POST', params);
  }

  async retrieveCheckoutSession(sessionId: string): Promise<CreemCheckoutSession> {
    return this.request<CreemCheckoutSession>(`/v1/checkout/sessions/${sessionId}`);
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/v1/subscriptions/${subscriptionId}`, 'DELETE');
  }

  async retrieveSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/v1/subscriptions/${subscriptionId}`);
  }

  async listCustomerSubscriptions(customerEmail: string): Promise<any> {
    return this.request(`/v1/subscriptions?customer_email=${encodeURIComponent(customerEmail)}`);
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Creem webhook signature verification
    // This is a placeholder - actual implementation depends on Creem's signature method
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }
}

export { CreemClient, CreemCheckoutParams, CreemCheckoutSession, CreemWebhookEvent };