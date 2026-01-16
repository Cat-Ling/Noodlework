'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    MediaPlayer,
    MediaProvider,
    Track,
    isHLSProvider,
    Menu,
    type MediaProviderAdapter,
    type MediaProviderChangeEvent
} from '@vidstack/react';
import {
    DefaultVideoLayout,
    defaultLayoutIcons
} from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import './vidstack-custom.css'; // Custom Seanime Theme

import {
    RiPlayLargeLine,
    RiPauseLargeLine,
    RiResetLeftFill,
    RiPictureInPictureLine,
    RiPictureInPictureExitLine,
    RiFullscreenLine,
    RiFullscreenExitLine,
    RiSettings4Line,
    RiClosedCaptioningFill,
    RiClosedCaptioningLine,
} from "react-icons/ri";
import { LuVolumeX, LuVolume1, LuVolume2, LuCast, LuFlipHorizontal2 } from "react-icons/lu";
import { FaTv, FaDownload } from 'react-icons/fa';
import { Box, IconButton } from "@chakra-ui/react";
import { BsBadgeHd } from "react-icons/bs";
import { MdCheck, MdChevronRight, MdChevronLeft, MdRadioButtonUnchecked, MdRadioButtonChecked } from "react-icons/md";

// ... [Icons object remains same] ...

// Helper Components for Seanime-style Menu Look
function VdsSubmenuButton({ label, hint, icon: Icon, disabled }: { label: string, hint: string, icon: any, disabled?: boolean }) {
    return (
        <Menu.Button className="vds-menu-button" disabled={disabled}>
            <MdChevronLeft className="vds-menu-button-close-icon" />
            <Icon className="vds-menu-button-icon" />
            <span className="vds-menu-button-label">{label}</span>
            <span className="vds-menu-button-hint">{hint}</span>
            <MdChevronRight className="vds-menu-button-open-icon" />
        </Menu.Button>
    )
}

function VdsRadio({ children, value, onSelect }: { children: React.ReactNode, value: string, onSelect: () => void }) {
    return (
        <Menu.Radio className="vds-radio" value={value} onSelect={onSelect}>
            <MdRadioButtonUnchecked className="vds-radio-icon" />
            {/* Show checked icon when selected (handled by CSS) */}
            <MdRadioButtonChecked className="vds-radio-check-icon" />
            <span className="vds-radio-label">{children}</span>
        </Menu.Radio>
    )
}

// ... [Player component body] ...

// Updated CSS in Player return
/*
                // Custom CSS to handle icon toggling for Radio
                '.vds-radio .vds-radio-icon': {
                    display: 'block',
                },
                '.vds-radio[aria-checked="true"] .vds-radio-icon': {
                    display: 'none',
                },
                '.vds-radio .vds-radio-check-icon': {
                    display: 'none',
                },
                '.vds-radio[aria-checked="true"] .vds-radio-check-icon': {
                    display: 'block',
                    color: 'var(--video-brand)',
                },
*/

// Updated Settings Menu Slots
/*
                        settingsMenuStartItems: (
                            <>
                                <FlipVideoMenu isFlipped={isFlipped} onToggle={setIsFlipped} />
                                <QualitySubmenu
                                    currentLabel={currentSource.label}
                                    sources={sources}
                                    onSelect={handleQualitySelect}
                                />
                            </>
                        )
*/




// Seanime-style Custom Icons
const customLayoutIcons = {
    ...defaultLayoutIcons,
    PlayButton: {
        Play: RiPlayLargeLine,
        Pause: RiPauseLargeLine,
        Replay: RiResetLeftFill,
    },
    MuteButton: {
        Mute: LuVolumeX,
        VolumeLow: LuVolume1,
        VolumeHigh: LuVolume2,
    },
    GoogleCastButton: {
        Default: LuCast,
    },
    PIPButton: {
        Enter: RiPictureInPictureLine,
        Exit: RiPictureInPictureExitLine,
    },
    FullscreenButton: {
        Enter: RiFullscreenLine,
        Exit: RiFullscreenExitLine,
    },
    Menu: {
        ...defaultLayoutIcons.Menu,
        Settings: RiSettings4Line,
    },
    CaptionButton: {
        On: RiClosedCaptioningFill,
        Off: RiClosedCaptioningLine,
    },
};

interface Source {
    file: string;
    label: string;
    type: string;
}

interface TrackProps {
    file: string;
    kind: string;
    label?: string;
    lang?: string;
}

// Download Menu Component
function DownloadMenu({ sources, videoTitle }: { sources: Source[]; videoTitle?: string }) {
    const handleDownload = (source: Source) => {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = source.file;
        // Use cleaned video title or fallback
        const filename = videoTitle ? `${videoTitle}_${source.label}.mp4` : `video_${source.label}.mp4`;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Menu.Root>
            <Menu.Button className="vds-menu-button" disabled={sources.length === 0}>
                <MdChevronLeft className="vds-menu-button-close-icon" />
                <FaDownload className="vds-menu-button-icon" />
                <span className="vds-menu-button-label">Download</span>
                <span className="vds-menu-button-hint">{sources.length > 0 ? sources[0].label : 'N/A'}</span>
                <MdChevronRight className="vds-menu-button-open-icon" />
            </Menu.Button>
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup>
                    {sources.map((source) => (
                        <Menu.Radio
                            className="vds-menu-item"
                            value={source.label}
                            key={source.label}
                            onClick={() => handleDownload(source)}
                        >
                            <MdRadioButtonChecked className="vds-menu-item-check-icon" />
                            <MdRadioButtonUnchecked className="vds-menu-item-uncheck-icon" />
                            <span className="vds-menu-item-label">{source.label}</span>
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}

interface PlayerProps {
    sources: Source[];
    tracks?: any[];
    poster?: string;
    theaterMode?: boolean;
    onToggleTheater?: () => void;
    videoTitle?: string;
}

export default function Player({ sources, tracks, poster, theaterMode, onToggleTheater, videoTitle }: PlayerProps) {
    const playerRef = useRef<any>(null); // MediaPlayerInstance

    // Persistence State
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [autoplay, setAutoplay] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Load Settings
    useEffect(() => {
        const savedVol = localStorage.getItem('noodle_volume');
        if (savedVol) {
            const v = parseFloat(savedVol);
            setVolume(v);
            setMuted(v === 0);
        }
        const savedAuto = localStorage.getItem('noodle_autoplay');
        if (savedAuto) setAutoplay(savedAuto === 'true');
        setSettingsLoaded(true);
    }, []);

    // Save Settings
    useEffect(() => {
        if (settingsLoaded) {
            localStorage.setItem('noodle_volume', volume.toString());
            localStorage.setItem('noodle_autoplay', autoplay.toString());
        }
    }, [volume, autoplay, settingsLoaded]);


    // State for Quality Selection
    const [currentSource, setCurrentSource] = useState<Source>(sources.find(s => s.label === '720p') || sources.find(s => s.label === '480p') || sources[0]);

    // Update src when sources change (e.g. navigation) but keep quality pref if possible? For now reset to best default.
    useEffect(() => {
        const defaultSource = sources.find(s => s.label === '720p') || sources.find(s => s.label === '480p') || sources[0];
        setCurrentSource(defaultSource);
    }, [sources]);

    const src = currentSource ? {
        src: currentSource.file,
        type: currentSource.type === 'hls' ? 'application/x-mpegurl' : 'video/mp4'
    } as const : {
        src: '',
        type: 'video/mp4'
    } as const;

    function onQualityChange(newSource: Source) {
        // Save current time? Vidstack might handle src swap gracefully if keys are stable?
        // Actually, changing `src` usually resets the player. We might need to save time.
        // Let's rely on standard src swap behavior for now.
        const time = playerRef.current?.currentTime;
        const wasPlaying = !playerRef.current?.paused;

        setCurrentSource(newSource);

        // Restore time after swap (heuristic) - Vidstack might not need this if we swap the track?
        // But here we are swapping the *File*.
        // A better way is to pass *all* sources to Vidstack and let it pick, BUT Vidstack's MP4 quality switching is manual
        // unless creating a custom provider.
        // Swapping SRC is the standard "simple" way.

        // Note: We'll likely lose buffer.
        if (playerRef.current && time) {
            // We need to wait for metadata... doing this in a `useEffect` on `currentSource` change is safer.
        }
    }

    // Restore time on source quality change
    const isQualitySwap = useRef(false);
    const savedTime = useRef(0);
    const wasPlayingRef = useRef(false);

    const handleQualitySelect = (s: Source) => {
        if (s.label === currentSource.label) return;
        savedTime.current = playerRef.current?.currentTime || 0;
        wasPlayingRef.current = !playerRef.current?.paused;
        isQualitySwap.current = true;
        setCurrentSource(s);
    };

    function onCanPlay() {
        if (isQualitySwap.current && playerRef.current) {
            playerRef.current.currentTime = savedTime.current;
            if (wasPlayingRef.current) playerRef.current.play();
            isQualitySwap.current = false;
        }
    }

    function onProviderChange(provider: MediaProviderAdapter | null, nativeEvent: MediaProviderChangeEvent) {
        // HLS configuration if needed
        if (isHLSProvider(provider)) {
            provider.config = {
                // HLS config if needed
            };
        }
    }

    return (
        <Box
            w="full"
            h="full"
            bg="black"
            className="vidstack-player"
            sx={{
                'media-player': {
                    aspectRatio: '16/9',
                    backgroundColor: 'black',
                    color: 'white',
                    height: '100%',
                    width: '100%',
                },
                // Robust Flip Logic: Flip the provider (which contains video/poster)
                'media-player[data-flipped="true"] media-provider': {
                    transform: 'scaleX(-1) !important',
                },
                // Fallback: direct video target
                'media-player[data-flipped="true"] video': {
                    transform: 'scaleX(-1) !important',
                },
                '.vds-video-layout': {
                    '--video-brand': '#38b2ac',
                    '--video-control-color': 'white',
                },

                // Ensure text is aligned
                '.vds-menu-button-label': {
                    flex: 1,
                    textAlign: 'left',
                    fontWeight: 500,
                },
                '.vds-menu-button-hint': {
                    fontSize: '13px',
                    opacity: 0.7,
                },
                // Custom Radio Icon Toggling (Seanime Style)
                '.vds-radio .vds-radio-icon': {
                    display: 'block !important',
                    marginLeft: 0,
                    marginRight: '8px',
                    fontSize: '18px',
                },
                '.vds-radio[aria-checked="true"] .vds-radio-icon': {
                    display: 'none !important',
                },
                '.vds-radio .vds-radio-check-icon': {
                    display: 'none !important',
                    marginLeft: 0,
                    marginRight: '8px',
                    color: 'var(--video-brand)',
                    fontSize: '18px',
                },
                '.vds-radio[aria-checked="true"] .vds-radio-check-icon': {
                    display: 'block !important',
                },
                // Ensure label is aligned
                '.vds-radio-label': {
                    flex: 1,
                    fontWeight: 500,
                }
            }}
        >
            <MediaPlayer
                src={src}
                poster={poster}
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin
                playsInline
                title="Video"
                autoplay={autoplay}
                volume={volume}
                muted={muted}

                onVolumeChange={(detail) => {
                    setVolume(detail.volume);
                    setMuted(detail.muted);
                }}
                onProviderChange={onProviderChange}
                onCanPlay={onCanPlay}
                ref={playerRef}
                data-flipped={isFlipped ? "true" : undefined}
            >
                <MediaProvider style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }}>
                    {tracks?.map((track, i) => (
                        <Track
                            key={i.toString()}
                            src={track.file}
                            kind={track.kind as any}
                            label={track.label || 'Unknown'}
                            lang={track.lang || 'en'}
                            default={track.kind === 'captions' && i === 0}
                        />
                    ))}
                </MediaProvider>

                <DefaultVideoLayout
                    icons={customLayoutIcons}
                    slots={{
                        afterFullscreenButton: (
                            <Menu.Root>
                                <Menu.Button className="vds-button vds-menu-button">
                                    <FaDownload className="vds-icon" style={{ fontSize: '24px' }} />
                                </Menu.Button>
                                <Menu.Content className="vds-menu-items" placement="top">
                                    {sources.map((source) => (
                                        <button
                                            className="vds-menu-item"
                                            key={source.label}
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = source.file;
                                                const filename = videoTitle ? `${videoTitle}_${source.label}.mp4` : `video_${source.label}.mp4`;
                                                link.download = filename;
                                                link.target = '_blank';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            <span className="vds-menu-item-label">{source.label}</span>
                                        </button>
                                    ))}
                                </Menu.Content>
                            </Menu.Root>
                        ),

                        settingsMenuStartItems: (
                            <>
                                <FlipVideoMenu isFlipped={isFlipped} onToggle={setIsFlipped} />
                                <QualitySubmenu
                                    currentLabel={currentSource?.label || 'Default'}
                                    sources={sources}
                                    onSelect={handleQualitySelect}
                                />
                            </>
                        )
                    }}
                />
            </MediaPlayer>
        </Box>
    );
}



function QualitySubmenu({ currentLabel, sources, onSelect }: { currentLabel: string, sources: Source[], onSelect: (s: Source) => void }) {
    return (
        <Menu.Root>
            <VdsSubmenuButton
                label="Quality"
                hint={currentLabel}
                icon={BsBadgeHd}
            />
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={currentLabel}>
                    {sources.map(s => (
                        <VdsRadio
                            value={s.label}
                            key={s.label}
                            onSelect={() => onSelect(s)}
                        >
                            {s.label}
                        </VdsRadio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}

function FlipVideoMenu({ isFlipped, onToggle }: { isFlipped: boolean, onToggle: (flipped: boolean) => void }) {
    return (
        <Menu.Root>
            <VdsSubmenuButton
                label="Flip Video"
                hint={isFlipped ? 'On' : 'Off'}
                icon={LuFlipHorizontal2}
            />
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={isFlipped ? 'on' : 'off'}>
                    <VdsRadio value="on" onSelect={() => onToggle(true)}>On</VdsRadio>
                    <VdsRadio value="off" onSelect={() => onToggle(false)}>Off</VdsRadio>
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    )
}
