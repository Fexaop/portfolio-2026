#include '../glsl/perlin3d.glsl'

attribute float a_seed;

uniform float u_time;
uniform float u_spread;
uniform vec2 u_mouse;

varying float v_alpha;
varying float v_heat;

void main() {
  vec3 pos = position * u_spread;

  float t = u_time * 0.06;
  float n = perlin3d(vec4(pos * 0.8, t + a_seed * 8.0));
  pos += vec3(n) * u_spread * 0.06 * vec3(1.0, 1.0, 0.5);

  vec2 m = u_mouse * u_spread * 0.65;
  vec2 delta = m - pos.xy;
  float dist = length(delta) + 0.001;
  float attract = smoothstep(u_spread * 0.7, 0.0, dist);
  pos.xy += normalize(delta) * attract * u_spread * 0.08 * (0.4 + a_seed);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float pulse = 0.5 + 0.5 * sin(u_time * 1.2 + a_seed * 20.0 + pos.x * 3.0);
  v_alpha = 0.25 + 0.5 * pulse;
  v_heat = attract;
}
