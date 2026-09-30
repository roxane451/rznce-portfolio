export default function AmbientBackground() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <i className="g1" />
        <i className="g2" />
      </div>
      <canvas id="skybg" aria-hidden="true" />
      <div className="cols" aria-hidden="true" />
    </>
  );
}
