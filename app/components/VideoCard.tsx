'use client'

import { Box, Image, Text, VStack, Badge, AspectRatio } from "@chakra-ui/react";
import Link from 'next/link';
import { useState } from 'react';

interface VideoCardProps {
    id: string;
    title: string;
    thumbnail: string;
    duration?: string;
    views?: string;
    preview?: string;
}

export const VideoCard = ({ id, title, thumbnail, duration, views, preview }: VideoCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Box
            display="block"
            cursor="pointer"
            transition="all 0.2s"
            borderRadius={['md', 'xl']}
            overflow="hidden"
            _hover={{
                bg: ['transparent', 'whiteAlpha.50'],
                transform: ['none', 'translateY(-2px)']
            }}
            borderBottom={['1px solid', 'none']}
            borderColor="whiteAlpha.200"
            pb={[4, 0]}
            mb={[4, 0]}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/watch/${id}`}>
                {/* Thumbnail Container with AspectRatio wrapper */}
                <AspectRatio
                    ratio={16 / 9}
                    mb={3}
                    borderRadius={['md', 'xl']}
                    overflow="hidden"
                    bg="gray.800"
                >
                    <Box position="relative" w="full">
                        <Image
                            src={thumbnail ? `/api/proxy?url=${encodeURIComponent(thumbnail)}` : '/placeholder.jpg'}
                            alt={title}
                            w="full"
                            h="full"
                            objectFit="cover"
                            loading="lazy"
                            opacity={isHovered && preview ? 0 : 1}
                            transition="opacity 0.3s"
                        />

                        {/* Preview Video on Hover (Desktop only) */}
                        {isHovered && preview && (
                            <Box
                                as="video"
                                src={`/api/proxy?url=${encodeURIComponent(preview)}`}
                                muted
                                loop
                                autoPlay
                                playsInline
                                position="absolute"
                                top={0}
                                left={0}
                                w="full"
                                h="full"
                                objectFit="cover"
                                display={['none', 'block']}
                            />
                        )}

                        {duration && (
                            <Badge
                                position="absolute"
                                bottom={2}
                                right={2}
                                bg="blackAlpha.800"
                                color="white"
                                fontSize="xs"
                                fontWeight="bold"
                                px={2}
                                py={1}
                                borderRadius="sm"
                                zIndex={2}
                            >
                                {duration}
                            </Badge>
                        )}
                    </Box>
                </AspectRatio>

                {/* Video Info */}
                <VStack align="stretch" spacing={1} px={[0, 2]}>
                    <Text
                        fontSize={['md', 'sm']}
                        fontWeight="semibold"
                        color="white"
                        noOfLines={2}
                        lineHeight="shorter"
                    >
                        {title}
                    </Text>

                    {views && (
                        <Text fontSize="xs" color="gray.400">
                            {views}
                        </Text>
                    )}
                </VStack>
            </Link>
        </Box>
    );
};
