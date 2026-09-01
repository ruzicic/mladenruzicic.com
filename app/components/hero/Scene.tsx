"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import type { ThreeEvent } from "@react-three/fiber"
import {
  Color,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Shape,
  type BufferGeometry,
  type CanvasTexture,
  type Group,
  type LineBasicMaterial,
  type Mesh,
  type MeshPhysicalMaterial,
  type PointLight,
} from "three"

import { requestExpand, setHighlight } from "./highlight-store"
import { loadMarkTexture } from "./logo-texture"
import {
  createShards,
  DESKTOP_SHARD_COUNT,
  EXTRUDE,
  MARK_Z,
  MOBILE_SHARD_COUNT,
  type ShardSpec,
} from "./shards"
import { ACCENT, BG, type HeroLogoShard } from "./types"

/**
 * The WebGL hero — docs/v3-redesign-plan.md §5.1, ported from
 * `docs/v3-design/hero-shards.js`.
 *
 * Loaded through `next/dynamic({ ssr: false })` from `HeroCanvas.tsx`, only
 * after fonts are ready, the main thread is idle, WebGL2 probes clean and the
 * visitor has not asked for reduced motion. Nothing here is the sole route to
 * any content: every company is a real button in the timeline.
 */

export interface TooltipInfo {
  name: string
  years: string
  color: string
  x: number
  y: number
}

export interface SceneProps {
  logos: HeroLogoShard[]
  /** The hero `<section>`; R3F's `eventSource` and the intersection target. */
  sectionRef: RefObject<HTMLElement | null>
  onFirstFrame: () => void
  onTooltip: (info: TooltipInfo | null) => void
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

function buildGeometry(spec: ShardSpec): ExtrudeGeometry {
  const { w, h, skew } = spec
  const shape = new Shape()
  shape.moveTo(-w / 2, -h / 2)
  shape.lineTo(w / 2 + skew, -h / 2)
  shape.lineTo(w / 2, h / 2)
  shape.lineTo(-w / 2 - skew, h / 2)
  shape.closePath()
  return new ExtrudeGeometry(shape, {
    depth: EXTRUDE.depth,
    bevelEnabled: true,
    bevelThickness: EXTRUDE.bevelThickness,
    bevelSize: EXTRUDE.bevelSize,
    bevelSegments: EXTRUDE.bevelSegments,
  })
}

/* -------------------------------------------------------------------------- */
/* One shard                                                                  */
/* -------------------------------------------------------------------------- */

interface ShardProps {
  spec: ShardSpec
  logo: HeroLogoShard | null
  texture: CanvasTexture | null
  hovered: boolean
  onOver: (event: ThreeEvent<PointerEvent>, logo: HeroLogoShard) => void
  onMove: (event: ThreeEvent<PointerEvent>, logo: HeroLogoShard) => void
  onOut: () => void
  onSelect: (logo: HeroLogoShard) => void
}

function Shard({
  spec,
  logo,
  texture,
  hovered,
  onOver,
  onMove,
  onOut,
  onSelect,
}: ShardProps) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshPhysicalMaterial>(null)
  const edgeRef = useRef<LineBasicMaterial>(null)

  const geometry = useMemo(() => buildGeometry(spec), [spec])
  const edges = useMemo(
    () => new EdgesGeometry(geometry as BufferGeometry, 20),
    [geometry]
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      edges.dispose()
    }
  }, [geometry, edges])

  const tint = useMemo(() => {
    // Pale blue glass, the hue band from the reference scene.
    const c = new Color()
    const hue = 0.55 + ((spec.index * 0.137) % 1) * 0.15
    c.setHSL(hue, 0.25, 0.82)
    return c
  }, [spec.index])

  const brandColor = useMemo(
    () => new Color(logo ? logo.color : ACCENT),
    [logo]
  )

  const baseEdgeOpacity = spec.bright ? 0.9 : 0.35
  const markSize = Math.min(spec.w, spec.h) * 0.62

  // Hover response is eased on the frame loop rather than through React state
  // so it never competes with the scroll recede for renders.
  useFrame((_, delta) => {
    const material = materialRef.current
    const edge = edgeRef.current
    if (!material || !edge) return
    const target = hovered ? 1 : 0
    const k = 1 - Math.pow(0.001, delta)
    material.userData.hover =
      (material.userData.hover ?? 0) +
      (target - (material.userData.hover ?? 0)) * k
    const t = material.userData.hover as number
    material.emissive.copy(brandColor)
    material.emissiveIntensity = t * 0.45
    edge.opacity = baseEdgeOpacity + t * (1 - baseEdgeOpacity)
  })

  const interactive = logo !== null

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[spec.x, spec.y, spec.z]}
      rotation={[spec.rx, spec.ry, spec.rz]}
      userData={{ spec }}
      // Blank shards are never raycast — §5.1 "Raycast only logo shards".
      raycast={interactive ? undefined : () => null}
      onPointerOver={
        interactive
          ? (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              onOver(event, logo)
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              onMove(event, logo)
            }
          : undefined
      }
      onPointerOut={interactive ? onOut : undefined}
      onClick={
        interactive
          ? (event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation()
              onSelect(logo)
            }
          : undefined
      }
    >
      {/*
        §5.1 "Glass". `transmission` refracts what is behind the panel *inside
        the scene*; the page background is DOM, not scene, so the panel is also
        blended (`transparent` + `opacity`) to keep the near-black page showing
        through. Without that the shards read as solid slabs over the copy.
        `depthWrite: false` matches the reference and stops the panels from
        cutting each other out.
      */}
      <meshPhysicalMaterial
        ref={materialRef}
        color={tint}
        transmission={1}
        roughness={0.28}
        thickness={0.3}
        ior={1.45}
        metalness={0}
        clearcoat={1}
        clearcoatRoughness={0.08}
        attenuationColor={tint}
        attenuationDistance={1.6}
        transparent
        opacity={0.3}
        depthWrite={false}
        side={DoubleSide}
        emissive={brandColor}
        emissiveIntensity={0}
      />

      <lineSegments geometry={edges}>
        <lineBasicMaterial
          ref={edgeRef}
          color={ACCENT}
          transparent
          opacity={baseEdgeOpacity}
          depthWrite={false}
        />
      </lineSegments>

      {logo && texture ? (
        <mesh position={[0, 0, MARK_Z]} raycast={() => null}>
          <planeGeometry args={[markSize, markSize]} />
          <meshBasicMaterial
            alphaMap={texture}
            color="#F2F0EA"
            opacity={0.9}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */
/* Scene contents                                                             */
/* -------------------------------------------------------------------------- */

interface ContentsProps extends Omit<SceneProps, "onFirstFrame"> {
  shards: ShardSpec[]
  textures: (CanvasTexture | null)[]
  onFirstFrame: () => void
}

function Contents({
  shards,
  logos,
  textures,
  sectionRef,
  onFirstFrame,
  onTooltip,
}: ContentsProps) {
  const groupRef = useRef<Group>(null)
  const keyRef = useRef<PointLight>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const invalidate = useThree((state) => state.invalidate)

  const pointer = useRef({ x: 0, y: 0 })
  const smooth = useRef({ x: 0, y: 0, progress: 0 })
  const progressTarget = useRef(0)
  const intersecting = useRef(true)
  const firstFrame = useRef(false)

  /* Pointer parallax — window-level and passive, exactly as in the reference. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const onMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [sectionRef])

  /* Only read scroll while the hero is on screen — §5.1 "Motion". */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting.current = entry.isIntersecting
      },
      { threshold: 0 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [sectionRef])

  /* Leaving the page with a stale highlight would strand the timeline. */
  useEffect(() => {
    return () => {
      setHighlight(null)
      document.body.style.cursor = ""
      onTooltip(null)
    }
  }, [onTooltip])

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()

    const section = sectionRef.current
    if (intersecting.current && section) {
      const height = section.offsetHeight || 1
      progressTarget.current = Math.max(0, Math.min(1, window.scrollY / height))
    }

    smooth.current.progress +=
      (progressTarget.current - smooth.current.progress) * 0.08

    const gain = 0.25 // calm mode — §10 decision 1
    smooth.current.x += (pointer.current.x * gain - smooth.current.x) * 0.05
    smooth.current.y += (pointer.current.y * gain - smooth.current.y) * 0.05

    const p = smooth.current.progress
    const mx = smooth.current.x
    const my = smooth.current.y

    const group = groupRef.current
    if (group) {
      for (const child of group.children) {
        const spec = child.userData.spec as ShardSpec | undefined
        if (!spec) continue
        child.position.y =
          spec.y + Math.sin(t * spec.speed + spec.phase) * spec.amp
        child.position.x =
          spec.x + Math.cos(t * spec.speed * 0.7 + spec.phase) * spec.amp * 0.6
        child.position.z = spec.z - p * 14 * (1 + (spec.z + 9) / 11)
        child.rotation.y = spec.ry + t * spec.speed * 0.25 + mx * 0.3
        child.rotation.x =
          spec.rx +
          Math.sin(t * spec.speed * 0.5 + spec.phase) * 0.15 +
          my * 0.2
      }
      group.rotation.y = mx * 0.12
      group.rotation.x = -my * 0.08
    }

    state.camera.position.z = 11 + p * 3
    if (keyRef.current) keyRef.current.intensity = 60 + Math.sin(t * 0.8) * 12

    if (!firstFrame.current) {
      firstFrame.current = true
      // useFrame runs before the render, so hand the crossfade one more tick.
      requestAnimationFrame(() => requestAnimationFrame(onFirstFrame))
    }
    void delta
  })

  const handleOver = (event: ThreeEvent<PointerEvent>, logo: HeroLogoShard) => {
    setHoveredId(logo.id)
    setHighlight(logo.bandId)
    document.body.style.cursor = "pointer"
    onTooltip({
      name: logo.name,
      years: logo.years,
      color: logo.color,
      x: event.clientX,
      y: event.clientY,
    })
    invalidate()
  }

  const handleMove = (event: ThreeEvent<PointerEvent>, logo: HeroLogoShard) => {
    onTooltip({
      name: logo.name,
      years: logo.years,
      color: logo.color,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleOut = () => {
    setHoveredId(null)
    setHighlight(null)
    document.body.style.cursor = ""
    onTooltip(null)
  }

  const handleSelect = (logo: HeroLogoShard) => {
    requestExpand(logo.bandId)
    const target = document.getElementById("history")
    target?.scrollIntoView({ block: "start" })
  }

  return (
    <>
      <fogExp2 attach="fog" args={[BG, 0.055]} />
      <ambientLight intensity={0.35} />
      <pointLight
        ref={keyRef}
        color={ACCENT}
        intensity={60}
        distance={40}
        position={[6, 5, 6]}
      />
      <pointLight
        color="#5b6cff"
        intensity={45}
        distance={40}
        position={[-7, -4, 4]}
      />
      <directionalLight intensity={0.8} position={[-3, 6, -4]} />

      <group ref={groupRef}>
        {shards.map((spec) => {
          const logo = spec.logoIndex === null ? null : logos[spec.logoIndex]
          return (
            <Shard
              key={spec.index}
              spec={spec}
              logo={logo ?? null}
              texture={
                spec.logoIndex === null ? null : textures[spec.logoIndex]
              }
              hovered={logo != null && hoveredId === logo.id}
              onOver={handleOver}
              onMove={handleMove}
              onOut={handleOut}
              onSelect={handleSelect}
            />
          )
        })}
      </group>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Canvas                                                                     */
/* -------------------------------------------------------------------------- */

export default function Scene({
  logos,
  sectionRef,
  onFirstFrame,
  onTooltip,
}: SceneProps) {
  // Resolved once at mount; a device does not change class mid-session.
  const [{ mobile, antialias }] = useState(() => {
    const small =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 719px)").matches
    return { mobile: small, antialias: !small }
  })

  const [active, setActive] = useState(true)
  const [textures, setTextures] = useState<(CanvasTexture | null)[]>(() =>
    logos.map(() => null)
  )

  const shards = useMemo(
    () =>
      createShards(
        mobile ? MOBILE_SHARD_COUNT : DESKTOP_SHARD_COUNT,
        logos.length
      ),
    [mobile, logos.length]
  )

  /* Rasterise the six marks off the critical path. */
  useEffect(() => {
    let cancelled = false
    Promise.all(
      logos.map((logo) =>
        loadMarkTexture({ src: logo.markSrc, text: logo.mark })
      )
    ).then((result) => {
      if (!cancelled) setTextures(result)
    })
    return () => {
      cancelled = true
    }
  }, [logos])

  /* frameloop off when the hero is offscreen or the tab is hidden — §9. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let onScreen = true
    const sync = () => setActive(onScreen && !document.hidden)
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        sync()
      },
      { threshold: 0 }
    )
    observer.observe(section)
    document.addEventListener("visibilitychange", sync)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", sync)
    }
  }, [sectionRef])

  return (
    <Canvas
      eventSource={sectionRef as RefObject<HTMLElement>}
      eventPrefix="client"
      dpr={[1, 1.5]}
      gl={{ antialias, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 42, position: [0, 0, 11], near: 0.1, far: 100 }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        // One shared, half-resolution transmission pass for every panel — §5.1.
        const renderer = gl as unknown as {
          transmissionResolutionScale?: number
        }
        if ("transmissionResolutionScale" in renderer) {
          renderer.transmissionResolutionScale = 0.5
        }
      }}
    >
      <Contents
        shards={shards}
        logos={logos}
        textures={textures}
        sectionRef={sectionRef}
        onFirstFrame={onFirstFrame}
        onTooltip={onTooltip}
      />
    </Canvas>
  )
}
