precision mediump float;

uniform vec3 u_color;
uniform vec3 u_color2;
uniform float u_opacity;

varying float v_alpha;
varying float v_seed;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);

  float core = smoothstep(0.22, 0.0, d);
  float glow = pow(smoothstep(0.5, 0.0, d), 1.45);

  vec3 col = mix(u_color, u_color2, v_seed);
  float alpha = (glow * 0.75 + core * 0.55) * v_alpha * u_opacity;

  gl_FragColor = vec4(col, alpha);
}
