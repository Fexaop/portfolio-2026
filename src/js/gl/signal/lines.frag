precision mediump float;

uniform vec3 u_color;
uniform float u_opacity;

varying float v_alpha;
varying float v_heat;

void main() {
  vec3 col = mix(u_color, vec3(0.75, 0.55, 1.0), v_heat);
  float alpha = v_alpha * u_opacity * (0.35 + v_heat * 0.9);
  gl_FragColor = vec4(col, alpha);
}
