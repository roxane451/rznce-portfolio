export default function AudioReadout() {
  return (
    <div className="readout" aria-hidden="true">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none"><path id="mini" /></svg>
      <b id="noteOut">—</b>
      <span id="hzOut">0 Hz</span>
    </div>
  );
}
