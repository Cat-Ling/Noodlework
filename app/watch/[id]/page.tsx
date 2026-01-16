/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Container, Heading, Text, Spinner, Center, Button, Flex, Grid } from "@chakra-ui/react";
import { FaArrowLeft } from 'react-icons/fa';
import { VideoCard } from '../../components/VideoCard';
import Player from '../../components/Player';
import { VideoMetadata } from '../../components/WatchMetadata';

export default function WatchPage() {
    const { id } = useParams();
    const router = useRouter();
    const [video, setVideo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [theaterMode, setTheaterMode] = useState(false);

    const videoId = id as string;

    useEffect(() => {
        if (videoId) {
            fetchVideo(videoId);
            window.scrollTo(0, 0);
        }
    }, [videoId]);

    // Persistence for Theater Mode
    useEffect(() => {
        const savedMode = localStorage.getItem('noodle_theater');
        if (savedMode) {
            setTheaterMode(savedMode === 'true');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('noodle_theater', theaterMode.toString());
    }, [theaterMode]);

    // Auto Theater Mode if no related videos (only if not manually set/overridden by persistence check potentially? 
    // Actually, let's allow auto-theater to engage if it's truly empty, but user pref should generally win. 
    // For now, let's keep auto-theater simply setting state, but maybe we should rely on the saved state first.
    // However, if there are NO related videos, we probably ALWAYS want theater mode regardless of pref, because sidebar would be empty.
    useEffect(() => {
        if (!loading && video && (!video.relatedVideos || video.relatedVideos.length === 0)) {
            setTheaterMode(true);
        }
    }, [loading, video]);

    const fetchVideo = async (id: string) => {
        setLoading(true);
        setVideo(null);
        try {
            const res = await fetch(`/api/video?id=${id}`);
            const data = await res.json();
            if (data.error) {
                console.error(data.error);
            } else {
                setVideo(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Split related videos for mixed layout (safe access)
    const relatedVideos = video?.relatedVideos || [];

    const [extraVideos, setExtraVideos] = useState<any[]>([]);
    const [moreLoading, setMoreLoading] = useState(false);
    const [searchPage, setSearchPage] = useState(1);

    const loadMoreRelated = async () => {
        if (!video) return;
        setMoreLoading(true);
        try {
            // Use Tags if available, else Title
            const query = video.tags && video.tags.length > 0 ? video.tags[0] : video.title.replace(/[^\w\s]/gi, '');
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${searchPage}`);
            const data = await res.json();

            if (data.videos) {
                // Filter duplicates
                const newVideos = data.videos.filter((v: any) => v.id !== video.id && !relatedVideos.find((r: any) => r.id === v.id) && !extraVideos.find((e: any) => e.id === v.id));
                setExtraVideos(prev => [...prev, ...newVideos]);
                setSearchPage(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setMoreLoading(false);
        }
    };

    // Memoize player sources to prevent unnecessary re-renders
    const playerSources = useMemo(() => {
        if (!video?.sources) return [];
        return (video.sources || [{ file: video.sources?.[0]?.file || '', label: 'Default', type: 'mp4' }]).map((s: any) => ({
            ...s,
            file: `/api/proxy?url=${encodeURIComponent(s.file)}&referer=${encodeURIComponent(`https://mat6tube.com/watch/${videoId}`)}&cookie=${encodeURIComponent(video.cookies || '')}`
        }));
    }, [video?.sources, video?.cookies, videoId]);

    const playerPoster = useMemo(() => {
        return video?.thumbnail ? `/api/proxy?url=${encodeURIComponent(video.thumbnail)}` : '';
    }, [video?.thumbnail]);

    if (loading) {
        return (
            <Center h="100vh" bg="gray.900">
                <Spinner size="xl" color="teal.500" />
            </Center>
        );
    }

    if (!video) {
        return (
            <Center h="100vh" bg="gray.900">
                <Text color="white">Video not found.</Text>
            </Center>
        );
    }

    return (
        <Box minH="100vh" bg="gray.900" color="white" pt={theaterMode ? 0 : 6} pb={20}>
            <Container
                maxW={theaterMode ? '100%' : 'container.xl'}
                px={theaterMode ? 0 : 4}
                transition="all 0.4s ease"
            >
                {/* Back Button */}
                {!theaterMode && (
                    <Button
                        leftIcon={<FaArrowLeft />}
                        onClick={() => router.back()}
                        mb={4}
                        variant="ghost"
                        colorScheme="teal"
                        size="sm"
                        _hover={{ bg: 'whiteAlpha.100' }}
                    >
                        Back
                    </Button>
                )}

                <Flex direction={theaterMode ? 'column' : ['column', 'column', 'row']} gap={6}>

                    {/* Main Content Column */}
                    <Box flex={theaterMode ? '1' : '1'} w={theaterMode ? '100%' : 'auto'} minW={0}>
                        {/* Player Section */}
                        <Box
                            w="full"
                            bg="black"
                            borderRadius={theaterMode ? 0 : 'xl'}
                            overflow="hidden"
                            boxShadow="2xl"
                            mb={6}
                            maxH={theaterMode ? '90vh' : ['60vh', '70vh', 'none']}
                            position="relative"
                            sx={{
                                // Ensure video fits properly on mobile
                                '& video': {
                                    objectFit: 'contain',
                                    width: '100%',
                                    height: '100%',
                                    maxHeight: theaterMode ? '90vh' : ['60vh', '70vh', 'none']
                                }
                            }}
                        >
                            <Player
                                key={videoId}
                                sources={playerSources}
                                tracks={video.tracks || []}
                                poster={playerPoster}
                                videoTitle={video.title}
                            />
                        </Box>

                        {/* Metadata Section - Theater Mode Only */}
                        {theaterMode && (
                            <Box w="full" mb={6}>
                                <VideoMetadata video={video} textAlign="center" />
                            </Box>
                        )}
                    </Box>



                    {/* Right Sidebar - Standard Mode Only & If videos exist */}
                    {!theaterMode && (
                        <Box w={['100%', '100%', '350px']} minW={['100%', '100%', '350px']}>
                            <VideoMetadata video={video} />
                        </Box>
                    )}

                </Flex>

                {/* Bottom Grid Suggestions (Full Width) */}
                {((relatedVideos.length > 0) || (extraVideos.length > 0)) && (
                    <Box mt={4}>
                        <Heading size="lg" mb={6} color="gray.200" textAlign={['center', 'left']}>
                            More Videos
                        </Heading>
                        <Grid templateColumns={["1fr", "repeat(auto-fill, minmax(260px, 1fr))"]} gap={6}>
                            {[...relatedVideos, ...extraVideos].map((vid: any) => (
                                <VideoCard key={vid.id} id={vid.id} title={vid.title} thumbnail={vid.thumbnail} duration={vid.duration} views={vid.views} preview={vid.preview} />
                            ))}
                        </Grid>

                        <Center mt={8}>
                            <Button
                                onClick={loadMoreRelated}
                                isLoading={moreLoading}
                                disabled={moreLoading}
                                variant="outline"
                                colorScheme="teal"
                                size="lg"
                                _hover={{ bg: 'whiteAlpha.100' }}
                            >
                                Show More
                            </Button>
                        </Center>
                    </Box>
                )}
            </Container>
        </Box>
    );
}
