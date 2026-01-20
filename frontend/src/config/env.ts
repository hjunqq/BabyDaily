const DEFAULT_API_URL = 'http://127.0.0.1:40000';

export const API_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || DEFAULT_API_URL;
