'use client'

import React, { useState } from 'react';
import { Box, Image, Text, Flex, LinkBox, LinkOverlay, AspectRatio, Skeleton } from "@chakra-ui/react";
import NextLink from 'next/link';

interface SidebarVideoCardProps {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    preview?: string;
}

export const SidebarVideoCard = ({ id, title, thumbnail, duration, views, preview }: SidebarVideoCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <LinkBox as="article" w="full" _hover={{ bg: 'gray.800' }} transition="background 0.2s" borderRadius="md" p={2}>
            <Flex gap={2}>
                {/* Thumbnail */}
                <Box
                    w="168px"
                    flexShrink={0}
                    position="relative"
                    borderRadius="md"
                    overflow="hidden"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <AspectRatio ratio={16 / 9}>
                        <Box position="relative" w="full" h="full">
                            <Image
                                src={`/api/proxy?url=${encodeURIComponent(thumbnail)}`}
                                alt={title}
                                objectFit="cover"
                                w="full"
                                h="full"
                                opacity={isHovered && preview ? 0 : 1}
                            />
                            {isHovered && preview && (
                                <video
                                    src={`/api/proxy?url=${encodeURIComponent(preview)}`}
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            )}
                        </Box>
                    </AspectRatio>
                    <Box
                        position="absolute"
                        bottom="1"
                        right="1"
                        bg="blackAlpha.800"
                        color="white"
                        fontSize="xs"
                        px={1}
                        borderRadius="sm"
                    >
                        {duration}
                    </Box>
                </Box>

                {/* Details */}
                <Box flex="1" minW="0">
                    <LinkOverlay as={NextLink} href={`/watch/${id}`}>
                        <Text
                            fontWeight="semibold"
                            fontSize="sm"
                            lineHeight="search"
                            noOfLines={2}
                            color="white"
                            title={title}
                        >
                            {title}
                        </Text>
                    </LinkOverlay>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                        {views} views
                    </Text>
                </Box>
            </Flex>
        </LinkBox>
    );
};
