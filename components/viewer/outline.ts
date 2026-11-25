import * as THREE from "three";

/**
 * Inverted-hull outline: a back-face copy pushed out along normals. Works with any
 * geometry, supports clipping planes so the section view cuts it too.
 */
export function createOutlineMaterial(color: string, thickness: number) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uThickness: { value: thickness },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      uniform float uThickness;
      void main() {
        vec3 p = position + normal * uThickness;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        #include <clipping_planes_fragment>
        gl_FragColor = vec4(uColor, uOpacity);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  m.clipping = true;
  return m;
}

export const OUTLINE_NAME = "__outline";

export function addOutlines(root: THREE.Object3D, material: THREE.Material): THREE.Mesh[] {
  const added: THREE.Mesh[] = [];
  const targets: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name !== OUTLINE_NAME) targets.push(o as THREE.Mesh);
  });
  for (const mesh of targets) {
    const outline = new THREE.Mesh(mesh.geometry, material);
    outline.name = OUTLINE_NAME;
    outline.raycast = () => {};
    outline.renderOrder = -1;
    mesh.add(outline);
    added.push(outline);
  }
  return added;
}
