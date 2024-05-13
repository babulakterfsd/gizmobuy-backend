/* eslint-disable no-unused-vars */

export type TOrder = {
  _id: string;
  products: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    billForThisProduct: number;
  }[];
  orderBy: string;
  shippingInfo: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    mobile: string;
  };
  paymentInfo: {
    method: string;
    amount: number;
  };
  isPaid: boolean;
  orderStatus: string;
  billForThisOrder: number;
  appliedCoupon: string;
  discountGiven: number;
  totalBill: number;
};
