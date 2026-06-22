precision mediump float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float u_time;
uniform float u_wave;

varying vec2 v_uv;

void main() {
  vec3 pos = position;

  // wave distortion — surges while scroll is animating, quiet at rest
  float rip = sin(pos.x * 3.8 + u_time * 1.6) * 0.5
            + sin(pos.y * 3.1 - u_time * 1.3) * 0.5;
  pos.z += rip * 0.06 * u_wave;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  v_uv = uv;
}
