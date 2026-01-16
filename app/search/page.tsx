'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, SimpleGrid, Heading, Spinner, Center, Text, Container, Button, Select, Checkbox, HStack, VStack } from "@chakra-ui/react";
import { VideoCard } from '../components/VideoCard';
import { useRouter } from 'next/navigation';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [videos, setVideos] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter states
    const [duration, setDuration] = useState('any');
    const [sortBy, setSortBy] = useState('2'); // Relevance
    const [hdOnly, setHdOnly] = useState(false);

    const router = useRouter();

    // Update query state if URL param changes
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            setPage(1);
            fetchResults(initialQuery, 1);
        }
    }, [initialQuery]);

    // Trigger search when filters change
    useEffect(() => {
        if (query) {
            setPage(1);
            fetchResults(query, 1);
        }
    }, [duration, sortBy, hdOnly]);

    const fetchResults = async (q: string, pageNum: number = 1) => {
        if (!q) return;
        if (pageNum === 1) setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({
                q,
                page: pageNum.toString(),
                ...(duration !== 'any' && { len: duration }),
                ...(sortBy !== '2' && { sort: sortBy }),
                ...(hdOnly && { hd: '1' })
            });

            const res = await fetch(`/api/search?${params}`);
            const data = await res.json();
            if (data.videos && data.videos.length > 0) {
                setVideos(prev => pageNum === 1 ? data.videos : [...prev, ...data.videos]);
                setHasMore(true);
            } else {
                if (pageNum === 1) setVideos([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch videos');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchResults(query, nextPage);
    };

    return (
        <Box minH="100vh" bg="gray.900" color="white" p={4}>
            <Container maxW="container.xl">
                {/* Page Title */}
                <Heading size="lg" mb={6} mt={4}>
                    Search Results for "{query}"
                </Heading>

                {/* Filters */}
                <Box mb={6} p={4} bg="gray.800" borderRadius="lg">
                    <HStack spacing={4} flexWrap="wrap">
                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.400" fontWeight="semibold">Duration</Text>
                            <Select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                size="sm"
                                bg="gray.700"
                                borderColor="gray.600"
                                color="white"
                                w="120px"
                                sx={{
                                    option: {
                                        bg: 'gray.800',
                                        color: 'white'
                                    }
                                }}
                            >
                                <option value="any">Any</option>
                                <option value="long">Long</option>
                                <option value="short">Short</option>
                            </Select>
                        </VStack>

                        <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color="gray.400" fontWeight="semibold">Sort By</Text>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                size="sm"
                                bg="gray.700"
                                borderColor="gray.600"
                                color="white"
                                w="140px"
                                sx={{
                                    option: {
                                        bg: 'gray.800',
                                        color: 'white'
                                    }
                                }}
                            >
                                <option value="2">Relevance</option>
                                <option value="1">Duration</option>
                                <option value="0">Date Added</option>
                            </Select>
                        </VStack>

                        <VStack align="start" spacing={1} pt={5}>
                            <Checkbox
                                isChecked={hdOnly}
                                onChange={(e) => setHdOnly(e.target.checked)}
                                colorScheme="teal"
                            >
                                HD Only
                            </Checkbox>
                        </VStack>
                    </HStack>
                </Box>

                <Box position="relative" zIndex={1}>
                    {loading ? (
                        <Center h="50vh">
                            <Spinner size="xl" color="teal.500" thickness="4px" />
                        </Center>
                    ) : error ? (
                        <Center h="50vh"><Text color="red.400">{error}</Text></Center>
                    ) : (
                        <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
                            {videos.map((video) => (
                                <VideoCard key={video.id} {...video} />
                            ))}
                        </SimpleGrid>
                    )}
                    {!loading && videos.length === 0 && query && (
                        <Center h="20vh"><Text color="gray.500">No videos found.</Text></Center>
                    )}

                    {/* Load More Button */}
                    {!loading && hasMore && videos.length > 0 && (
                        <Center mt={8}>
                            <Button onClick={handleLoadMore} size="lg" colorScheme="teal" variant="outline" _hover={{ bg: 'whiteAlpha.100' }}>
                                Show More
                            </Button>
                        </Center>
                    )}
                </Box>
            </Container>
        </Box>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<Center h="100vh" bg="gray.900"><Spinner size="xl" color="teal.500" /></Center>}>
            <SearchPageContent />
        </Suspense>
    );
}
