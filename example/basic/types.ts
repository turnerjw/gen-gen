export type CustomerProfile = {
  fullName: string;
  email: string;
  marketingOptIn: boolean;
};

export type ShippingAddress = {
  line1: string;
  city: string;
  countryCode: string;
  postalCode: string;
};

export type CheckoutDraft = {
  orderId: string;
  profile: CustomerProfile;
  shipping: {
    address: ShippingAddress;
    instructions: string;
  };
  tags: string[];
};
