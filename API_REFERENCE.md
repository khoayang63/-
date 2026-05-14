# API Reference

## POST `/api/place-order`
Creates a new order after validating stock, vouchers, and recalculating shipping fees.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "form": {
    "name": "string",
    "phone": "string",
    "address": "string",
    "note": "string"
  },
  "paymentMethod": "COD" | "ONLINE",
  "selectedVoucherCodes": ["string"],
  "shippingData": {
    "lat": "number",
    "lng": "number",
    "fee": "number"
  }
}
```

**Response (200 OK):**
```json
{
  "orderId": "uuid",
  "paymentId": "uuid"
}
```

## GET `/api/products`
Fetches available products with optional filtering.

## GET `/api/series`
Fetches available product series/categories.
