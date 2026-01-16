import { Box, Heading, HStack, Text, Divider, Flex, Badge, IconButton, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";
import { FaEye, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const VideoMetadata = ({ video, textAlign = "left" }: { video: any, textAlign?: any }) => {
    const router = useRouter();
    const [likes, setLikes] = useState(parseInt(video.likes || '0'));
    const [dislikes, setDislikes] = useState(parseInt(video.dislikes || '0'));
    const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleVote = async (action: 'like' | 'dislike') => {
        if (voted) return;

        // Optimistic update
        if (action === 'like') setLikes(l => l + 1);
        else setDislikes(d => d + 1);
        setVoted(action);

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: video.id, action })
            });
            const result = await response.json();
            console.log('Vote result:', result);
        } catch (e) {
            console.error('Vote error:', e);
        }
    };

    if (!video) return null;

    const descriptionLimit = 200;
    const isTruncated = video.description && video.description.length > descriptionLimit;
    const displayDescription = isTruncated
        ? video.description.substring(0, descriptionLimit) + '...'
        : video.description;

    return (
        <Box mb={6} textAlign={textAlign}>
            {/* Title Section */}
            <Heading as="h1" size="lg" mb={4} lineHeight="shorter">
                {video.title}
            </Heading>

            {/* Stats Row (Views & Likes) */}
            <Flex
                justify={textAlign === 'center' ? 'center' : 'space-between'}
                align="center"
                mb={6}
                direction={['column', 'row']}
                gap={4}
            >
                <HStack spacing={6} color="gray.400" fontSize="md">
                    <HStack spacing={2}>
                        <FaEye />
                        <Text fontWeight="medium">{video.views}</Text>
                    </HStack>
                </HStack>

                <HStack spacing={3}>
                    <Button
                        leftIcon={<FaThumbsUp />}
                        size="sm"
                        colorScheme={voted === 'like' ? 'green' : 'whiteAlpha'}
                        variant={voted === 'like' ? 'solid' : 'outline'}
                        onClick={() => handleVote('like')}
                        isDisabled={!!voted}
                        bg={voted === 'like' ? 'green.500' : 'transparent'}
                        borderColor={voted === 'like' ? 'green.500' : 'whiteAlpha.400'}
                        color={voted === 'like' ? 'white' : 'gray.300'}
                        _hover={{
                            bg: voted === 'like' ? 'green.600' : 'whiteAlpha.200',
                            borderColor: voted === 'like' ? 'green.600' : 'whiteAlpha.500'
                        }}
                    >
                        {likes}
                    </Button>
                    <Button
                        leftIcon={<FaThumbsDown />}
                        size="sm"
                        colorScheme={voted === 'dislike' ? 'red' : 'whiteAlpha'}
                        variant={voted === 'dislike' ? 'solid' : 'outline'}
                        onClick={() => handleVote('dislike')}
                        isDisabled={!!voted}
                        bg={voted === 'dislike' ? 'red.500' : 'transparent'}
                        borderColor={voted === 'dislike' ? 'red.500' : 'whiteAlpha.400'}
                        color={voted === 'dislike' ? 'white' : 'gray.300'}
                        _hover={{
                            bg: voted === 'dislike' ? 'red.600' : 'whiteAlpha.200',
                            borderColor: voted === 'dislike' ? 'red.600' : 'whiteAlpha.500'
                        }}
                    >
                        {dislikes}
                    </Button>
                </HStack>
            </Flex>

            <Divider my={4} borderColor="gray.700" />

            {/* Tags Section (Distinct) - Horizontally Scrollable */}
            {video.tags && video.tags.length > 0 && (
                <Box mb={6}>
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" mb={3} letterSpacing="wide">
                        Tags
                    </Text>
                    <Box
                        overflowX="auto"
                        css={{
                            '&::-webkit-scrollbar': {
                                height: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: 'rgba(255, 255, 255, 0.3)',
                            },
                        }}
                    >
                        <Flex gap={2} pb={2} flexWrap="nowrap">
                            {video.tags.map((tag: string, i: number) => (
                                <Badge
                                    key={i}
                                    px={3}
                                    py={1.5}
                                    borderRadius="full"
                                    variant="subtle"
                                    colorScheme="gray"
                                    cursor="pointer"
                                    _hover={{ bg: 'whiteAlpha.300', color: 'white' }}
                                    transition="all 0.2s"
                                    onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                                    whiteSpace="nowrap"
                                    flexShrink={0}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </Flex>
                    </Box>
                </Box>
            )}

            {/* Description Section with Truncation */}
            {video.description && (
                <Box>
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.500" mb={3} letterSpacing="wide">
                        About
                    </Text>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                        {displayDescription}
                    </Text>
                    {isTruncated && (
                        <Button
                            size="xs"
                            variant="link"
                            colorScheme="teal"
                            mt={2}
                            onClick={onOpen}
                        >
                            Show More
                        </Button>
                    )}

                    {/* Description Modal */}
                    <Modal isOpen={isOpen} onClose={onClose} size="xl">
                        <ModalOverlay bg="blackAlpha.800" />
                        <ModalContent bg="gray.800" color="white">
                            <ModalHeader>About</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody pb={6}>
                                <Text fontSize="sm" color="gray.300" lineHeight="tall" whiteSpace="pre-wrap">
                                    {video.description}
                                </Text>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Box>
            )}
        </Box>
    );
};
