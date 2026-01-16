import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    colors: {
        gray: {
            900: '#0f0f0f', // Cinema Black: Background
            800: '#1a1a1a', // Surface: Cards/Sidebar
            700: '#272727', // Hover/Borders
            600: '#3f3f3f', // Muted text
            500: '#717171',
            400: '#a0a0a0',
            300: '#d1d1d1',
            200: '#e5e5e5',
            100: '#f5f5f5',
        },
        brand: {
            900: '#1a365d',
            800: '#153e75',
            700: '#2a69ac',
            500: '#38b2ac', // Primary Teal/Cyan accent
            200: '#90cdf4',
        },
    },
    styles: {
        global: {
            body: {
                bg: 'gray.900',
                color: 'white',
            },
        },
    },
    components: {
        Button: {
            baseStyle: {
                _focus: { boxShadow: 'none' },
            },
            variants: {
                ghost: {
                    _hover: {
                        bg: 'whiteAlpha.200',
                    }
                },
                solid: {
                    bg: 'whiteAlpha.200',
                    _hover: {
                        bg: 'whiteAlpha.300',
                    }
                }
            }
        },
        Input: {
            variants: {
                filled: {
                    field: {
                        bg: 'gray.800',
                        _hover: {
                            bg: 'gray.700',
                        },
                        _focus: {
                            bg: 'gray.700',
                            borderColor: 'brand.500',
                        }
                    }
                }
            }
        }
    },
});

export default theme;
