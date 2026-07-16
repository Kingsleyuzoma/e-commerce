
// src/types/index.ts
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string | number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: any;
  status: "pending" | "processing" | "shipped" | "cancelled";
  customer: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  financials: {
    subtotal: number;
    shipping: number;
    tax: number;
    grandTotal: number;
  };
}