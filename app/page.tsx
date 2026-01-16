'use client'
import { Box, Container } from "@chakra-ui/react";
import { VideoFeed } from './components/VideoFeed';

export default function Home() {
  return (
    <Box minH="100vh" bg="gray.900" color="white" pt={8}>
      <Container maxW="container.xl">
        <VideoFeed
          apiEndpoint="/api/now"
          title="Trending Videos"
        />
      </Container>
    </Box>
  );
}
// Need to import VideoCard at top. I will do this in a separate chunk to avoid import errors?
// Or I can add the import in the same replace if I target the whole file or top.
// Current lines 1..38 do not have VideoCard import.
// I will split this into two edits: one for content, one for import.
