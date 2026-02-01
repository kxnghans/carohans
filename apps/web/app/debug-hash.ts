import Hashids from 'hashids';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SALT = process.env.NEXT_PUBLIC_HASHID_SALT || 'carohans_default_salt_2026';

const orderHasher = new Hashids(SALT + 'orders', 6, ALPHABET);

const testId = 'ORD-5LEMPL';
const cleanId = testId.replace(/^ORD-/i, '').toUpperCase();
const decoded = orderHasher.decode(cleanId);

console.log('Test ID:', testId);
console.log('Clean ID:', cleanId);
console.log('Decoded:', decoded);
console.log('Decoded ID:', decoded.length > 0 ? Number(decoded[0]) : 'null');

// Also test encoding a random ID to see if it matches pattern
const encoded = orderHasher.encode(123456);
console.log('Encoded 123456:', encoded);
