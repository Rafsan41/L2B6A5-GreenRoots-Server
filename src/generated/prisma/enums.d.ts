export declare const Role: {
    readonly CUSTOMER: "CUSTOMER";
    readonly SELLER: "SELLER";
    readonly ADMIN: "ADMIN";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly BANNED: "BANNED";
    readonly PENDING: "PENDING";
    readonly SUSPENDED: "SUSPENDED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const SellerStatus: {
    readonly APPROVED: "APPROVED";
    readonly PENDING: "PENDING";
    readonly REJECTED: "REJECTED";
    readonly SUSPENDED: "SUSPENDED";
};
export type SellerStatus = (typeof SellerStatus)[keyof typeof SellerStatus];
export declare const OrderStatus: {
    readonly PLACED: "PLACED";
    readonly PROCESSING: "PROCESSING";
    readonly SHIPPED: "SHIPPED";
    readonly DELIVERED: "DELIVERED";
    readonly CANCELLED: "CANCELLED";
};
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export declare const PaymentMethod: {
    readonly CASH_ON_DELIVERY: "CASH_ON_DELIVERY";
};
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
//# sourceMappingURL=enums.d.ts.map