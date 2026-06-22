precision mediump float;
#include '../../glsl/constants.glsl'

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 u_random;

#include './pass.glsl'
#include '../../glsl/perlin3d.glsl'

uniform float u_a_view;
uniform float u_a_speed;
uniform float u_a_center;
uniform float u_a_in;

uniform float u_cardW;
uniform float u_radius;
uniform float u_curve;
uniform float u_wave;
uniform float u_pull;



void main() {
  vec3 pos = position;

  // bend the card back along its width so it curves around the ring radius
  // (a segment of the cylinder) instead of staying a flat 2D plane. The arc
  // angle a vertex covers is (worldX / radius); pushing it inward by
  // radius*(1-cos(angle)) lands it on the circle.
  float curveAng = (position.x * u_cardW) / u_radius;
  pos.z -= u_radius * (1. - cos(curveAng)) * u_curve;

  // --- fluid sheet warp (Lusion-style wave + stretch) ---
  float sp = u_a_speed;       // signed slider speed
  float asp = abs(sp);

  // a traveling ripple across the sheet: a gentle idle wobble that surges into
  // a strong wave while the carousel is moving, so the card feels like cloth
  float ripple =
      sin(pos.x * 5.5 - u_time * 3.0 + u_random.x) +
      0.5 * sin(pos.y * 4.0 + u_time * 2.0 + u_random.y);
  pos.z += ripple * (0.025 + asp * 0.14) * u_wave;

  // banner pull: the card stretches from its leading edge out to a point on the
  // trailing edge (which also curls back), like a sheet being dragged — the
  // Lusion warp. `u_pull` is signed: its sign picks the edge, magnitude the
  // strength. `edge` is 0 at the leading edge and 1 at the trailing edge.
  float pull = u_pull;
  float ap = min(abs(pull), 1.6);
  float edge = clamp(position.x * sign(pull) + 0.5, 0.0, 1.0);
  float necks = edge * edge;
  pos.x *= 1.0 + ap * 0.30;                       // stretch the whole width out
  pos.x += sign(pull) * necks * ap * 0.45;        // ...and fling the edge further out
  pos.y *= 1.0 - 0.42 * min(ap, 1.0) * necks;     // soft neck (not a hard point)
  pos.z -= 0.42 * ap * necks;                     // curl that edge away
  pos.z += position.y * necks * sign(pull) * ap * 0.45; // twist/fold round the horizontal axis

  // entrance squash
  pos.y -= .5;
  pos.y *= u_a_in;
  pos.y += .5;

  // view reveal scale
  float startAt = distance(uv, vec2(0.5));
  float prog = smoothstep(startAt, 1., u_a_view);
  pos.xyz = mix(
    pos.xyz * .9,
    pos.xyz * .8,
    prog
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  v_uv = uv;

  float ns = perlin3d(vec4(
    v_uv.x + u_a_speed * .3 * .8,
    v_uv.yx + u_random.yz * .8, 
    u_time + pos.x * 0.1
  ));


  v_normal = normal;
  v_ns = ns;
}
