"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STITCH_SEGMENT_STRIDE, type StitchLayer } from "@/lib/configurator/stitch-simulation";

interface EmbroideryPreview3DProps {
  textureUrl: string | null;
  heightTextureUrl: string | null;
  normalTextureUrl: string | null;
  stitchLayers: StitchLayer[];
  garmentColor: string;
  productCategory: string;
  widthInches: number;
  heightInches: number;
  positionX: number;
  positionY: number;
  rotationDegrees: number;
  densityMm: number;
  threadWeight: "W30" | "W40" | "W60";
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
}

interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  presentation: THREE.Group;
  fabric: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  artwork: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshPhysicalMaterial>;
  stitchGroup: THREE.Group;
  fabricTexture: THREE.CanvasTexture;
  artworkTexture: THREE.Texture | null;
  artworkHeightTexture: THREE.Texture | null;
  artworkNormalTexture: THREE.Texture | null;
  frameId: number;
  reducedMotion: boolean;
  dragging: boolean;
  pointerX: number;
  pointerY: number;
}

function makeFabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#8a8a88";
  context.fillRect(0, 0, 128, 128);
  context.globalAlpha = 0.34;
  for (let index = 0; index < 128; index += 3) {
    context.strokeStyle = index % 6 === 0 ? "#f2f0eb" : "#2b2a29";
    context.beginPath();
    context.moveTo(index + 0.5, 0);
    context.lineTo(index + 0.5, 128);
    context.stroke();
    context.beginPath();
    context.moveTo(0, index + 0.5);
    context.lineTo(128, index + 0.5);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(13, 15);
  return texture;
}

function makeFabricGeometry(category: string) {
  const cap = /cap|hat/i.test(category);
  const geometry = new THREE.PlaneGeometry(cap ? 6.6 : 6.8, cap ? 4.15 : 7.4, 72, 72);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const normalizedX = x / 3.4;
    const normalizedY = y / (cap ? 2.05 : 3.7);
    const crownCurve = cap ? 0.52 * (1 - normalizedX ** 2) : 0.16 * normalizedX ** 2;
    const drape = Math.sin(normalizedY * Math.PI * 2.2) * 0.055 + Math.cos(normalizedX * 7) * 0.025;
    positions.setZ(index, crownCurve + drape);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function cameraDistance(category: string, zoom: number) {
  const baseDistance = /cap|hat/i.test(category) ? 8.1 : 9.3;
  return THREE.MathUtils.clamp(baseDistance / zoom, 3.05, 13.5);
}

function disposeMaterial(material: THREE.Material) {
  material.dispose();
}

function clearStitchGroup(group: THREE.Group) {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
      else disposeMaterial(child.material);
    }
  }
}

export function EmbroideryPreview3D({
  textureUrl,
  heightTextureUrl,
  normalTextureUrl,
  stitchLayers,
  garmentColor,
  productCategory,
  widthInches,
  heightInches,
  positionX,
  positionY,
  rotationDegrees,
  densityMm,
  threadWeight,
  zoom,
  onZoomChange,
  className,
}: EmbroideryPreview3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneState | null>(null);
  const zoomRef = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);
  const [failed, setFailed] = useState(false);

  zoomRef.current = zoom;
  onZoomChangeRef.current = onZoomChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let state: SceneState | null = null;
    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.setAttribute("data-testid", "embroidery-preview-canvas");
      renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional embroidery proof");
      renderer.domElement.setAttribute("role", "img");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xd8cec0, 0.045);
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.1, cameraDistance("Polo Shirt", zoomRef.current));

      const presentation = new THREE.Group();
      presentation.rotation.set(-0.08, 0.08, -0.02);
      scene.add(presentation);

      const fabricTexture = makeFabricTexture();
      const fabricMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#E9E1D4"),
        roughness: 0.88,
        metalness: 0,
        bumpMap: fabricTexture,
        bumpScale: 0.035,
        side: THREE.DoubleSide,
      });
      const fabric = new THREE.Mesh(makeFabricGeometry("Polo Shirt"), fabricMaterial);
      fabric.castShadow = true;
      fabric.receiveShadow = true;
      presentation.add(fabric);

      const artworkMaterial = new THREE.MeshPhysicalMaterial({
        transparent: true,
        alphaTest: 0.025,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.22,
        clearcoatRoughness: 0.5,
        sheen: 0.72,
        sheenRoughness: 0.38,
        sheenColor: new THREE.Color("#fff4df"),
        side: THREE.DoubleSide,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      const artwork = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 56, 56), artworkMaterial);
      artwork.position.z = 0.22;
      artwork.visible = false;
      presentation.add(artwork);

      const stitchGroup = new THREE.Group();
      stitchGroup.name = "Dimensional thread strands";
      stitchGroup.position.z = 0.024;
      artwork.add(stitchGroup);

      const hemisphere = new THREE.HemisphereLight(0xfff8eb, 0x4c4037, 2.2);
      scene.add(hemisphere);
      const key = new THREE.DirectionalLight(0xfff2da, 3.4);
      key.position.set(-4, 5, 7);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.PointLight(0xc68d5b, 2.8, 25);
      rim.position.set(5, 1.5, 4);
      scene.add(rim);
      const grazing = new THREE.DirectionalLight(0xffffff, 2.1);
      grazing.position.set(4.5, -1.5, 2.6);
      scene.add(grazing);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 22),
        new THREE.ShadowMaterial({ color: 0x1a1714, opacity: 0.22 }),
      );
      ground.position.set(0, -4.25, -1.5);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      state = {
        renderer,
        scene,
        camera,
        presentation,
        fabric,
        artwork,
        stitchGroup,
        fabricTexture,
        artworkTexture: null,
        artworkHeightTexture: null,
        artworkNormalTexture: null,
        frameId: 0,
        reducedMotion,
        dragging: false,
        pointerX: 0,
        pointerY: 0,
      };
      sceneRef.current = state;

      const resize = () => {
        if (!state || !host.clientWidth || !host.clientHeight) return;
        state.renderer.setSize(host.clientWidth, host.clientHeight, false);
        state.camera.aspect = host.clientWidth / host.clientHeight;
        state.camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const onPointerDown = (event: PointerEvent) => {
        if (!state) return;
        state.dragging = true;
        state.pointerX = event.clientX;
        state.pointerY = event.clientY;
        renderer.domElement.setPointerCapture(event.pointerId);
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!state?.dragging) return;
        const deltaX = event.clientX - state.pointerX;
        const deltaY = event.clientY - state.pointerY;
        state.pointerX = event.clientX;
        state.pointerY = event.clientY;
        state.presentation.rotation.y = THREE.MathUtils.clamp(state.presentation.rotation.y + deltaX * 0.006, -0.7, 0.7);
        state.presentation.rotation.x = THREE.MathUtils.clamp(state.presentation.rotation.x + deltaY * 0.004, -0.45, 0.35);
      };
      const onPointerUp = (event: PointerEvent) => {
        if (!state) return;
        state.dragging = false;
        if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      };
      const onWheel = (event: WheelEvent) => {
        if (!state) return;
        event.preventDefault();
        const nextZoom = THREE.MathUtils.clamp(zoomRef.current - event.deltaY * 0.0018, 0.65, 2.75);
        onZoomChangeRef.current(Number(nextZoom.toFixed(3)));
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointermove", onPointerMove);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("pointercancel", onPointerUp);
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

      const started = performance.now();
      const render = (time: number) => {
        if (!state) return;
        if (!state.reducedMotion && !state.dragging) {
          const elapsed = (time - started) / 1000;
          state.presentation.position.y = Math.sin(elapsed * 0.45) * 0.035;
          state.presentation.rotation.z = -0.02 + Math.sin(elapsed * 0.32) * 0.012;
        }
        state.renderer.render(state.scene, state.camera);
        state.frameId = requestAnimationFrame(render);
      };
      state.frameId = requestAnimationFrame(render);

      return () => {
        if (state) cancelAnimationFrame(state.frameId);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("pointercancel", onPointerUp);
        renderer.domElement.removeEventListener("wheel", onWheel);
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
            else disposeMaterial(object.material);
          }
        });
        fabricTexture.dispose();
        state?.artworkTexture?.dispose();
        state?.artworkHeightTexture?.dispose();
        state?.artworkNormalTexture?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        sceneRef.current = null;
      };
    } catch (error) {
      console.warn("Three-dimensional preview is unavailable", error);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.fabric.material.color.set(garmentColor);
  }, [garmentColor]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const previousGeometry = state.fabric.geometry;
    state.fabric.geometry = makeFabricGeometry(productCategory);
    previousGeometry.dispose();
  }, [productCategory]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    state.camera.position.z = cameraDistance(productCategory, zoom);
  }, [productCategory, zoom]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const relief = threadWeight === "W30" ? 0.19 : threadWeight === "W60" ? 0.105 : 0.145;
    const densityRelief = THREE.MathUtils.clamp(0.45 / densityMm, 0.78, 1.4);
    state.artwork.material.bumpScale = relief * 0.72 * densityRelief;
    state.artwork.material.displacementScale = relief * 0.16 * densityRelief;
    state.artwork.material.displacementBias = -relief * 0.018;
    state.artwork.position.set(positionX * 1.75, positionY * 2.05, /cap|hat/i.test(productCategory) ? 0.55 : 0.09);
    state.artwork.rotation.z = THREE.MathUtils.degToRad(rotationDegrees);
    state.artwork.scale.set(widthInches * 0.54, heightInches * 0.54, 1);
  }, [densityMm, heightInches, positionX, positionY, productCategory, rotationDegrees, threadWeight, widthInches]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (!textureUrl) {
      state.artwork.visible = false;
      state.artwork.material.map = null;
      state.artwork.material.needsUpdate = true;
      state.artworkTexture?.dispose();
      state.artworkTexture = null;
      return;
    }

    let cancelled = false;
    new THREE.TextureLoader().load(
      textureUrl,
      (texture) => {
        if (cancelled || !sceneRef.current) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, state.renderer.capabilities.getMaxAnisotropy());
        state.artworkTexture?.dispose();
        state.artworkTexture = texture;
        state.artwork.material.map = texture;
        state.artwork.material.needsUpdate = true;
        state.artwork.visible = true;
      },
      undefined,
      () => setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [textureUrl]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (!heightTextureUrl) {
      state.artwork.material.bumpMap = null;
      state.artwork.material.displacementMap = null;
      state.artwork.material.needsUpdate = true;
      state.artworkHeightTexture?.dispose();
      state.artworkHeightTexture = null;
      return;
    }

    let cancelled = false;
    new THREE.TextureLoader().load(
      heightTextureUrl,
      (texture) => {
        if (cancelled || !sceneRef.current) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.NoColorSpace;
        texture.anisotropy = Math.min(8, state.renderer.capabilities.getMaxAnisotropy());
        state.artworkHeightTexture?.dispose();
        state.artworkHeightTexture = texture;
        state.artwork.material.bumpMap = texture;
        state.artwork.material.displacementMap = texture;
        state.artwork.material.needsUpdate = true;
      },
      undefined,
      () => setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [heightTextureUrl]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (!normalTextureUrl) {
      state.artwork.material.normalMap = null;
      state.artwork.material.needsUpdate = true;
      state.artworkNormalTexture?.dispose();
      state.artworkNormalTexture = null;
      return;
    }

    let cancelled = false;
    new THREE.TextureLoader().load(
      normalTextureUrl,
      (texture) => {
        if (cancelled || !sceneRef.current) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.NoColorSpace;
        texture.anisotropy = Math.min(8, state.renderer.capabilities.getMaxAnisotropy());
        state.artworkNormalTexture?.dispose();
        state.artworkNormalTexture = texture;
        state.artwork.material.normalMap = texture;
        state.artwork.material.normalScale.set(0.78, 0.78);
        state.artwork.material.needsUpdate = true;
      },
      undefined,
      () => setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [normalTextureUrl]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    clearStitchGroup(state.stitchGroup);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);

    for (const layer of stitchLayers) {
      const count = Math.floor(layer.segments.length / STITCH_SEGMENT_STRIDE);
      if (count === 0) continue;
      const geometry = new THREE.CapsuleGeometry(0.5, 1, 2, 6);
      const threadColor = new THREE.Color(layer.colorHex);
      const sheenColor = threadColor.clone().lerp(new THREE.Color("#fff7e8"), 0.68);
      const material = new THREE.MeshPhysicalMaterial({
        color: threadColor,
        roughness: 0.34,
        metalness: 0,
        clearcoat: 0.2,
        clearcoatRoughness: 0.42,
        sheen: 1,
        sheenRoughness: 0.28,
        sheenColor,
        specularIntensity: 1,
      });
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      mesh.name = `${layer.colorHex} thread strands`;
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;

      let instance = 0;
      for (let offset = 0; offset < layer.segments.length; offset += STITCH_SEGMENT_STRIDE) {
        const vectorX = layer.segments[offset + 2];
        const vectorY = layer.segments[offset + 3];
        const length = Math.hypot(vectorX, vectorY);
        const width = Math.max(0.0012, layer.segments[offset + 4] * 1.18);
        const relief = layer.segments[offset + 5];
        position.set(
          layer.segments[offset],
          layer.segments[offset + 1],
          0.012 + relief * 0.006,
        );
        quaternion.setFromAxisAngle(zAxis, Math.atan2(vectorY, vectorX) - Math.PI / 2);
        scale.set(width, Math.max(0.0008, length / 2), 0.014 * relief);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(instance++, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      state.stitchGroup.add(mesh);
    }
    state.stitchGroup.visible = !!textureUrl && stitchLayers.length > 0;

    return () => {
      const current = sceneRef.current;
      if (current) clearStitchGroup(current.stitchGroup);
    };
  }, [stitchLayers, textureUrl]);

  if (failed) {
    return (
      <div className={className} role="img" aria-label="Embroidery proof preview">
        {/* A generated data URL cannot be optimized by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {textureUrl ? <img src={textureUrl} alt="Mapped embroidery artwork" style={{ width: "52%", height: "52%", objectFit: "contain" }} /> : null}
      </div>
    );
  }

  return <div ref={hostRef} className={className} />;
}
