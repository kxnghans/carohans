import Hashids from 'hashids';

// Custom alphabet removing ambiguous chars: 0, O, I, L, 1
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Consistent salt for production
const SALT = process.env.NEXT_PUBLIC_HASHID_SALT || 'carohans_default_salt_2026';

const orderHasher = new Hashids(SALT + 'orders', 6, ALPHABET);
const clientHasher = new Hashids(SALT + 'clients', 6, ALPHABET);

export const encodeOrderId = (id: number): string => {
    return `ORD-${orderHasher.encode(id)}`;
};

export const decodeOrderId = (publicId: string): number | null => {
    const cleanId = publicId.replace(/^ORD-/i, '').toUpperCase();
    const decoded = orderHasher.decode(cleanId);
    return decoded.length > 0 ? Number(decoded[0]) : null;
};

export const encodeClientId = (id: number): string => {
    return `CUS-${clientHasher.encode(id)}`;
};

export const decodeClientId = (publicId: string): number | null => {
    const cleanId = publicId.replace(/^CUS-/i, '').toUpperCase();
    const decoded = clientHasher.decode(cleanId);
    return decoded.length > 0 ? Number(decoded[0]) : null;
};

export const isPublicId = (str: string): boolean => {
    const upper = str.toUpperCase();
    return /^ORD-[A-Z0-9]+$/.test(upper) || /^CUS-[A-Z0-9]+$/.test(upper);
};

export const maybeHash = (str: string): boolean => {
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6,}$/i.test(str);
};
