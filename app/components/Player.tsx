/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    MediaPlayer,
    MediaProvider,
    Track,
    isHLSProvider,
    Menu,
    type MediaProviderAdapter,
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
import { FaDownload } from 'react-icons/fa';
import { Box } from "@chakra-ui/react";
import { BsBadgeHd } from "react-icons/bs";
import { MdChevronRight, MdChevronLeft, MdRadioButtonUnchecked, MdRadioButtonChecked } from "react-icons/md";

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



// Download Menu Component


interface PlayerProps {
    sources: Source[];
    tracks?: any[];
    poster?: string;
    videoTitle?: string;
}

export default function Player({ sources, tracks, poster, videoTitle }: PlayerProps) {
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentSource(defaultSource);
    }, [sources]);

    const src = currentSource ? {
        src: currentSource.file,
        type: currentSource.type === 'hls' ? 'application/x-mpegurl' : 'video/mp4'
    } as const : {
        src: '',
        type: 'video/mp4'
    } as const;

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

    function onProviderChange(provider: MediaProviderAdapter | null) {
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
