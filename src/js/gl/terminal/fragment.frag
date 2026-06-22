precision mediump float;

uniform float u_time;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;

  // multi-layer plasma in purple/dark palette
  float n1 = sin(uv.x * 7.0 + u_time * 0.65) * 0.5 + 0.5;
  float n2 = sin(uv.y * 5.5 - u_time * 0.48) * 0.5 + 0.5;
  float n3 = sin((uv.x + uv.y) * 5.0 + u_time * 0.9) * 0.5 + 0.5;
  float n4 = sin(length(uv - 0.5) * 9.0 - u_time * 1.1) * 0.5 + 0.5;
  float plasma = (n1 + n2 + n3 + n4) * 0.25;

  // site palette: near-black → deep purple → #A855F7 accent
  vec3 dark   = vec3(0.04, 0.02, 0.07);
  vec3 mid    = vec3(0.18, 0.04, 0.30);
  vec3 bright = vec3(0.44, 0.12, 0.72);

  float t = pow(plasma, 1.8);
  vec3 col = mix(dark, mix(mid, bright, t * 0.45), t * 0.7);

  gl_FragColor = vec4(col, 0.9);
}
