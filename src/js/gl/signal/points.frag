precision mediump float;

uniform vec3 u_color;
uniform vec3 u_colorHot;
uniform float u_opacity;

varying float v_alpha;
varying float v_heat;
varying float v_seed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float core = smoothstep(0.18, 0.0, d);
  float glow = pow(smoothstep(0.5, 0.0, d), 1.5);

  vec3 col = mix(u_color, u_colorHot, v_heat * 0.85 + v_seed * 0.15);
  float alpha = (glow * 0.7 + core) * v_alpha * u_opacity * (0.55 + v_heat * 0.7);

  gl_FragColor = vec4(col, alpha);
}
