import { HydratedDocument, model, models, Schema, Types } from "mongoose";

export const PAYMENT_STATUSES = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export interface OrderCustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface OrderLineItem {
  productId: Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unitAmount: number;
}

export interface Order {
  customer: OrderCustomer;
  shippingAddress: ShippingAddress;
  items: OrderLineItem[];
  currency: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  discountCode?: string;
  total: number;
  stripeSessionId?: string;
  paymentIntentId?: string;
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
  orderStatus: (typeof ORDER_STATUSES)[number];
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>;

const minorUnitAmount = () => ({
  type: Number,
  required: true,
  min: 0,
  validate: {
    validator: (amount: number) => Number.isSafeInteger(amount),
    message: "{PATH} must be a non-negative integer in minor currency units.",
  },
});

const customerSchema = new Schema<OrderCustomer>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid customer email address."],
    },
    phone: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false, versionKey: false },
);

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    region: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, trim: true, maxlength: 32 },
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2}$/, "Country must be a two-letter ISO country code."],
    },
  },
  { _id: false, versionKey: false },
);

const orderLineItemSchema = new Schema<OrderLineItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, required: true, trim: true, maxlength: 100 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: (quantity: number) => Number.isSafeInteger(quantity),
        message: "Quantity must be a positive safe integer.",
      },
    },
    unitAmount: minorUnitAmount(),
  },
  { _id: false, versionKey: false },
);

const orderSchema = new Schema<Order>(
  {
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: {
      type: [orderLineItemSchema],
      required: true,
      validate: {
        validator: (items: OrderLineItem[]) => items.length > 0,
        message: "An order must contain at least one line item.",
      },
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      match: [/^[A-Z]{3}$/, "Currency must be a three-letter ISO currency code."],
    },
    subtotal: minorUnitAmount(),
    shippingCost: minorUnitAmount(),
    discount: minorUnitAmount(),
    discountCode: { type: String, trim: true, uppercase: true, maxlength: 64 },
    total: minorUnitAmount(),
    stripeSessionId: {
      type: String,
      trim: true,
      match: [/^cs_(test|live)_[A-Za-z0-9]+$/, "Invalid Stripe Checkout Session ID."],
    },
    paymentIntentId: {
      type: String,
      trim: true,
      match: [/^pi_[A-Za-z0-9]+$/, "Invalid Stripe Payment Intent ID."],
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
      default: "pending",
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    strict: "throw",
  },
);

orderSchema.pre("validate", function () {
  const itemSubtotal = this.items.reduce(
    (sum, item) => sum + item.unitAmount * item.quantity,
    0,
  );

  if (!Number.isSafeInteger(itemSubtotal)) {
    this.invalidate("items", "The line item subtotal exceeds the safe currency range.");
    return;
  }

  if (this.subtotal !== itemSubtotal) {
    this.invalidate("subtotal", "Subtotal must equal the sum of all line item amounts.");
  }

  if (this.discount > this.subtotal) {
    this.invalidate("discount", "Discount cannot exceed the item subtotal.");
  }

  const expectedTotal = this.subtotal + this.shippingCost - this.discount;
  if (!Number.isSafeInteger(expectedTotal) || this.total !== expectedTotal) {
    this.invalidate("total", "Total must equal subtotal plus shipping minus discount.");
  }
});

orderSchema.index(
  { stripeSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { stripeSessionId: { $type: "string" } },
  },
);
orderSchema.index(
  { paymentIntentId: 1 },
  {
    unique: true,
    partialFilterExpression: { paymentIntentId: { $type: "string" } },
  },
);
orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const OrderModel =
  models.Order ?? model<Order>("Order", orderSchema);
