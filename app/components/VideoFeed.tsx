/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Center, Button } from "@chakra-ui/react";
import { VideoCard } from './VideoCard';

interface VideoFeedProps {
    apiEndpoint: string;
    title?: string;
    initialVideos?: any[];
}

export const VideoFeed = ({ apiEndpoint, title, initialVideos = [] }: VideoFeedProps) => {
    const [videos, setVideos] = useState<any[]>(initialVideos);
    const [loading, setLoading] = useState(initialVideos.length === 0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchVideos = async (pageNum: number, isLoadMore = false) => {
        try {
            if (pageNum === 1 && videos.length === 0) setLoading(true); // Only show big loader if empty
            if (isLoadMore) setLoadingMore(true);

            const separator = apiEndpoint.includes('?') ? '&' : '?';
            const res = await fetch(`${apiEndpoint}${separator}page=${pageNum}`);
            const data = await res.json();

            if (data.videos && data.videos.length > 0) {
                setVideos(prev => pageNum === 1 ? data.videos : [...prev, ...data.videos]);
                setHasMore(true);
            } else {
                if (pageNum === 1) setVideos([]);
                setHasMore(false);
            }
        } catch (e) {
            console.error('Failed to fetch videos', e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        // If initialVideos provided, we assume page 1 is loaded.
        if (initialVideos.length === 0) {
            fetchVideos(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVideos(nextPage, true);
    };

    return (
        <Box>
            {title && (
                <Heading size="lg" mb={6} color="gray.200" borderLeft="4px solid" borderColor="brand.500" pl={4}>
                    {title}
                </Heading>
            )}

            {loading && page === 1 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Box key={i} h="200px" bg="gray.800" borderRadius="lg" />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {videos.map((video) => (
                        <VideoCard key={video.id} {...video} />
                    ))}
                </div>
            )}

            {!loading && videos.length === 0 && (
                <Center h="200px">
                    <Text color="gray.500">No videos found.</Text>
                </Center>
            )}

            {hasMore && videos.length > 0 && (
                <Center mt={8}>
                    <Button
                        onClick={handleLoadMore}
                        size="lg"
                        colorScheme="teal"
                        variant="outline"
                        _hover={{ bg: 'whiteAlpha.100' }}
                        isLoading={loadingMore}
                        disabled={loadingMore}
                    >
                        Show More
                    </Button>
                </Center>
            )}
        </Box>
    );
};
