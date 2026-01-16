/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useRef, useEffect } from 'react';
import { Box, Input, InputGroup, InputRightElement, IconButton, Flex, Text, List, ListItem } from "@chakra-ui/react";
import { FaSearch } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useOutsideClick } from '@chakra-ui/react';

export default function Navbar() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Handle client-side mounting to prevent hydration errors
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useOutsideClick({
        ref: suggestionsRef as any,
        handler: () => setShowSuggestions(false),
    });

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (val.length > 2) {
            try {
                const res = await fetch(`/api/suggestions?q=${encodeURIComponent(val)}`);
                const data = await res.json();
                if (data.suggestions) {
                    setSuggestions(data.suggestions.slice(0, 10));
                    setShowSuggestions(true);
                }
            } catch (err) { console.error(err); }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setShowSuggestions(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const selectSuggestion = (s: string) => {
        setQuery(s);
        setShowSuggestions(false);
        router.push(`/search?q=${encodeURIComponent(s)}`);
    };

    return (
        <Box
            as="nav"
            bg="rgba(15, 15, 15, 0.9)"
            backdropFilter="blur(10px)"
            borderBottom="1px"
            borderColor="gray.800"
            position="sticky"
            top={0}
            zIndex={1000}
            px={[4, 6]}
            py={3}
            suppressHydrationWarning
        >
            <Flex align="center" justify="space-between" maxW="container.xl" mx="auto">
                {/* Logo */}
                <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="white"
                    cursor="pointer"
                    onClick={() => router.push('/')}
                    _hover={{ color: 'teal.400' }}
                    transition="color 0.2s"
                >
                    Noodle Privacy
                </Text>

                {/* Search Bar */}
                <Box flex="1" maxW="600px" mx={6} position="relative">
                    <form onSubmit={handleSearch}>
                        <InputGroup size="md">
                            <Input
                                placeholder="Search..."
                                value={query}
                                onChange={handleInputChange}
                                onFocus={() => query.length > 2 && setShowSuggestions(true)}
                                bg="gray.800"
                                border="none"
                                _focus={{ ring: 2, ringColor: 'teal.400' }}
                                color="white"
                            />
                            <InputRightElement>
                                <IconButton
                                    aria-label="Search"
                                    icon={<FaSearch />}
                                    type="submit"
                                    variant="ghost"
                                    colorScheme="teal"
                                    size="sm"
                                />
                            </InputRightElement>
                        </InputGroup>
                    </form>

                    {/* Suggestions Dropdown - Client-only to prevent hydration errors */}
                    {isMounted && showSuggestions && suggestions.length > 0 && (
                        <Box
                            ref={suggestionsRef}
                            position="absolute"
                            top="100%"
                            left={0}
                            right={0}
                            bg="gray.800"
                            borderRadius="md"
                            mt={1}
                            shadow="xl"
                            maxH="300px"
                            overflowY="auto"
                            border="1px solid"
                            borderColor="gray.700"
                            zIndex={9999}
                        >
                            <List>
                                {suggestions.map((s, idx) => (
                                    <ListItem
                                        key={idx}
                                        p={2}
                                        px={3}
                                        _hover={{ bg: 'gray.700', cursor: 'pointer' }}
                                        onClick={() => selectSuggestion(s)}
                                        borderBottom={idx < suggestions.length - 1 ? "1px solid" : "none"}
                                        borderColor="gray.700"
                                        fontSize="sm"
                                    >
                                        {s}
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Box>

                {/* Placeholder for right side (e.g. settings) */}
                <Box w="50px" />
            </Flex>
        </Box>
    );
}
