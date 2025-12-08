/**
 * BabyDaily Design Tokens
 * 统一的设计变量，支持主题 A（可爱微调）和主题 B（半扁平）
 */

export const colors = {
    // 主色
    primary: '#FFB7C5',
    primaryDark: '#FF9FB4',

    // 文字色
    textMain: '#5A3A2E',
    textMuted: '#8A6F63',
    textLight: '#A89B94',

    // 背景色
    bgLight: '#FFF7F9',
    bgAlt: '#F9F5F3',
    bgWhite: '#FFFFFF',

    // 点缀色
    accent: '#E0FFFF',

    // 功能色
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#F56565',
    info: '#4299E1',

    // 中性色
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
} as const;

export const spacing = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
} as const;

export const borderRadius = {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
} as const;

export const shadows = {
    // 主题 A: 玻璃态阴影
    themeA: {
        soft: '0 8px 24px rgba(255, 183, 197, 0.15)',
        medium: '0 12px 32px rgba(255, 183, 197, 0.25)',
        strong: '0 16px 48px rgba(255, 183, 197, 0.35)',
    },
    // 主题 B: 半扁平阴影
    themeB: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 12px rgba(0, 0, 0, 0.08)',
        strong: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
} as const;

export const typography = {
    fontFamily: {
        display: '"Varela Round", sans-serif',
        sans: '"Nunito", sans-serif',
    },
    fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const transitions = {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
} as const;

export const zIndex = {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
} as const;

// 触控区域最小尺寸（WCAG AA）
export const touchTarget = {
    minSize: '44px',
    minSizeMobile: '48px',
} as const;

// 对比度要求（WCAG AA）
export const contrast = {
    normalText: 4.5,
    largeText: 3,
    uiComponents: 3,
} as const;
