export declare enum CheckoutMode {
    Subscription = "subscription",
    Payment = "payment"
}
export declare class CheckoutDto {
    mode: CheckoutMode;
    priceId?: string;
    amount?: number;
    vendorId?: string;
}
