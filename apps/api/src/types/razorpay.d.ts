declare module "razorpay" {
  type RazorpayOrder = {
    id: string;
    amount: number;
    currency: string;
  };

  type RazorpayOrderCreateInput = {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  };

  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });

    orders: {
      create(input: RazorpayOrderCreateInput): Promise<RazorpayOrder>;
    };
  }
}
