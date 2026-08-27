/**
 * CursorScrubVideo
 *
 * Renders a video whose playhead is driven by cursor position.
 *
 * For buttery scrubbing, encode the uploaded video with every frame as a keyframe:
 * ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4
 */
import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState } from "react"

type Axis = "horizontal" | "vertical"
type TrackingArea = "component" | "window"
type ObjectFit = "cover" | "contain" | "fill"

interface Props {
    videoFile: string
    axis: Axis
    reverse: boolean
    trackingArea: TrackingArea
    smoothing: number
    objectFit: ObjectFit
    showPoster: boolean
    borderRadius: number
}

export default function CursorScrubVideo(props: Props) {
    const {
        videoFile,
        axis = "horizontal",
        reverse = false,
        trackingArea = "component",
        smoothing = 0.22,
        objectFit = "cover",
        showPoster = true,
        borderRadius = 0,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const targetTimeRef = useRef(0)
    const currentTimeRef = useRef(0)
    const seekingRef = useRef(false)
    const readyRef = useRef(false)
    const rafRef = useRef(0)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const video = videoRef.current
        if (!video || !videoFile) return

        readyRef.current = false
        setReady(false)
        seekingRef.current = false
        targetTimeRef.current = 0
        currentTimeRef.current = 0

        const onSeeking = () => {
            seekingRef.current = true
        }
        const onSeeked = () => {
            seekingRef.current = false
        }
        const onCanPlayThrough = () => {
            readyRef.current = true
            setReady(true)
        }

        video.addEventListener("seeking", onSeeking)
        video.addEventListener("seeked", onSeeked)
        video.addEventListener("canplaythrough", onCanPlayThrough)

        video.load()
        video.currentTime = 0
        void video
            .play()
            .then(() => video.pause())
            .catch(() => {})

        const tick = () => {
            const v = videoRef.current
            if (
                v &&
                readyRef.current &&
                Number.isFinite(v.duration) &&
                v.duration > 0
            ) {
                const next =
                    currentTimeRef.current +
                    (targetTimeRef.current - currentTimeRef.current) * smoothing
                currentTimeRef.current = next
                if (!seekingRef.current && Math.abs(v.currentTime - next) > 0.008) {
                    v.currentTime = next
                }
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafRef.current)
            video.removeEventListener("seeking", onSeeking)
            video.removeEventListener("seeked", onSeeked)
            video.removeEventListener("canplaythrough", onCanPlayThrough)
        }
    }, [videoFile, smoothing])

    useEffect(() => {
        const root = rootRef.current
        if (!root) return

        const onMove = (event: PointerEvent) => {
            const video = videoRef.current
            if (!video || !readyRef.current || !Number.isFinite(video.duration))
                return

            let nx = 0
            let ny = 0

            if (trackingArea === "window") {
                nx = window.innerWidth > 0 ? event.clientX / window.innerWidth : 0
                ny =
                    window.innerHeight > 0 ? event.clientY / window.innerHeight : 0
            } else {
                const rect = root.getBoundingClientRect()
                nx = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0
                ny =
                    rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0
            }

            nx = Math.min(1, Math.max(0, nx))
            ny = Math.min(1, Math.max(0, ny))
            let pos = axis === "horizontal" ? nx : ny
            if (reverse) pos = 1 - pos
            targetTimeRef.current = pos * video.duration
        }

        const target: EventTarget = trackingArea === "window" ? window : root
        target.addEventListener("pointermove", onMove as EventListener)
        return () => {
            target.removeEventListener("pointermove", onMove as EventListener)
        }
    }, [axis, reverse, trackingArea])

    if (!videoFile) {
        return (
            <div
                ref={rootRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#1a0a0c",
                    color: "#c4a8a4",
                    fontSize: 14,
                    borderRadius,
                }}
            >
                Add a video file
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius,
            }}
        >
            <video
                ref={videoRef}
                src={videoFile}
                muted
                playsInline
                preload="auto"
                disableRemotePlayback
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit,
                    borderRadius,
                    display: "block",
                }}
            />
            {showPoster && !ready ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(26,10,12,0.4)",
                        color: "#c4a8a4",
                        fontSize: 14,
                        pointerEvents: "none",
                    }}
                >
                    Loading…
                </div>
            ) : null}
        </div>
    )
}

addPropertyControls(CursorScrubVideo, {
    videoFile: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    trackingArea: {
        type: ControlType.Enum,
        title: "Tracking",
        options: ["component", "window"],
        optionTitles: ["Component", "Window"],
        defaultValue: "component",
        displaySegmentedControl: true,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.02,
        defaultValue: 0.22,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    showPoster: {
        type: ControlType.Boolean,
        title: "Poster",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 0,
        unit: "px",
    },
})
