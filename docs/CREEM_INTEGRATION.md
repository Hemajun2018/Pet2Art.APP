# Creem Payment Integration Guide

## Overview
This application now supports Creem payment processing for handling subscriptions and one-time payments. Creem is integrated alongside the existing Stripe implementation, allowing you to switch between payment providers.

## Setup Instructions

### 1. Environment Variables
Add the following environment variables to your `.env` file:

```env
# Creem Configuration
CREEM_API_KEY="your_creem_api_key_here"
CREEM_WEBHOOK_SECRET="your_creem_webhook_secret_here"
NEXT_PUBLIC_CREEM_ENABLED="true"  # Set to "false" to use Stripe instead
```

### 2. Obtain Creem API Credentials
1. Sign up for a Creem account at https://creem.io
2. Navigate to your dashboard
3. Generate your API key
4. Set up webhook endpoint (see below)

### 3. Configure Webhook Endpoint
In your Creem dashboard, add the following webhook endpoint:
```
https://your-domain.com/api/creem-webhook
```

Subscribe to the following events:
- `checkout.session.completed`
- `payment.succeeded`
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `subscription.deleted`

### 4. Test Mode
Creem provides a test mode for development:
1. Use test API keys (usually prefixed with `test_`)
2. Test credit card numbers are available in Creem documentation
3. Webhook events can be simulated from the Creem dashboard

## File Structure

```
/lib/creem.ts                    # Creem client utility
/app/api/creem-checkout/         # Checkout session creation endpoint
/app/api/creem-webhook/          # Webhook handler for Creem events
/app/api/cancel-subscription/    # Subscription cancellation endpoint
/components/SubscriptionManager.tsx  # UI for managing subscriptions
```

## Key Features

### 1. Checkout Flow
- Creates Creem checkout sessions
- Supports both one-time payments and subscriptions
- Handles multiple currencies (USD, CNY, etc.)
- Includes metadata for order tracking

### 2. Webhook Processing
- Verifies webhook signatures
- Updates order status on successful payment
- Adds credits to user accounts
- Handles subscription lifecycle events

### 3. Subscription Management
- Users can view active subscriptions
- Cancel subscriptions through the UI
- Automatic handling of subscription updates
- Integration with Creem Customer Portal

## API Endpoints

### POST /api/creem-checkout
Creates a new checkout session.

Request body:
```json
{
  "product_id": "basic",
  "product_name": "Basic Plan",
  "credits": 20,
  "interval": "month",
  "amount": 999,
  "currency": "usd",
  "valid_months": 1
}
```

Response:
```json
{
  "code": 0,
  "data": {
    "checkout_url": "https://checkout.creem.io/...",
    "order_no": "123456789",
    "session_id": "cs_..."
  }
}
```

### POST /api/creem-webhook
Handles Creem webhook events. This endpoint is called by Creem when payment events occur.

### POST /api/cancel-subscription
Cancels a user's subscription.

Request body:
```json
{
  "subscription_id": "sub_123456"  // Optional, cancels all if not provided
}
```

### GET /api/cancel-subscription
Lists user's active subscriptions.

## Switching Between Payment Providers

The application supports both Creem and Stripe. To switch:

1. **Use Creem**: Set `NEXT_PUBLIC_CREEM_ENABLED="true"`
2. **Use Stripe**: Set `NEXT_PUBLIC_CREEM_ENABLED="false"`

The pricing component automatically detects which provider to use based on this environment variable.

## Testing Checklist

- [ ] Create a test account on Creem
- [ ] Configure test API keys
- [ ] Test checkout flow for one-time payment
- [ ] Test checkout flow for subscription
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation
- [ ] Verify credits are added to user account
- [ ] Test refund flow (if applicable)

## Support

For Creem-specific issues:
- Documentation: https://docs.creem.io
- Support: Contact Creem support directly

For integration issues:
- Check webhook logs in Creem dashboard
- Verify environment variables are set correctly
- Ensure webhook endpoint is accessible
- Check application logs for error messages

## Migration from Stripe

If migrating from Stripe to Creem:
1. Keep Stripe configuration for existing subscriptions
2. New subscriptions will use Creem
3. Consider migrating existing subscriptions gradually
4. Update customer communication about the payment provider change