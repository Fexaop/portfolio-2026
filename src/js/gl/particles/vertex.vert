#include '../glsl/perlin3d.glsl'

attribute float a_seed;

uniform float u_time;
uniform float u_spread;
uniform float u_size;
uniform vec2 u_mouse;

varying float v_alpha;
varying float v_seed;

void main() {
  vec3 pos = position * u_spread;

  float t = u_time * 0.08;
  float nx = perlin3d(vec4(pos * 0.55, t + a_seed * 10.0));
  float ny = perlin3d(vec4(pos * 0.55 + 30.0, t + a_seed * 10.0));
  float nz = perlin3d(vec4(pos * 0.55 + 60.0, t + a_seed * 10.0));

  pos += vec3(nx, ny, nz) * u_spread * 0.22;

  // stronger parallax + radial push away from cursor
  vec2 toMouse = pos.xy - u_mouse * u_spread * 0.55;
  float dist = length(toMouse) + 0.001;
  float push = smoothstep(u_spread * 0.55, 0.0, dist) * u_spread * 0.12;
  pos.xy += normalize(toMouse) * push * (0.5 + a_seed);
  pos.xy += u_mouse * u_spread * 0.08 * (0.35 + a_seed * 0.65);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float pulse = 0.55 + 0.45 * sin(u_time * (0.7 + a_seed) + a_seed * 18.0);
  gl_PointSize = u_size * (0.45 + a_seed * 1.1) * pulse * (280.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;

  v_alpha = 0.3 + 0.7 * pulse;
  v_seed = a_seed;
}
