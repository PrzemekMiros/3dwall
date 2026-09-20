// Analytic critically damped spring: continuous velocity, no bouncing,
// consistent response at different display refresh rates.
export function smoothStep(state, target, dt, reduced = false) {
  if (reduced) { state.value = target; state.velocity = 0; return target; }
  const omega = 3.4;
  const offset = state.value - target;
  const impulse = state.velocity + omega * offset;
  const decay = Math.exp(-omega * dt);
  state.value = target + (offset + impulse * dt) * decay;
  state.velocity = (state.velocity - omega * impulse * dt) * decay;
  if (Math.abs(state.value - target) < 0.000001 && Math.abs(state.velocity) < 0.000001) {
    state.value = target; state.velocity = 0;
  }
  return state.value;
}
