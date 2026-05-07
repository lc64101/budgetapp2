export default function GoalsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <h1>Goals</h1>
        <p className="muted">Turn savings intentions into clear milestones.</p>
      </div>

      <article className="card highlight-card">
        <span className="stat-label">Primary Goal</span>
        <p className="highlight-value">$0.00 / $0.00</p>
        <p className="muted">Name one short-term goal and fund it automatically each cycle.</p>
      </article>

      <article className="card list-card">
        <h2 className="calc-section-title">Goal Stack</h2>
        <div className="list-item">
          <div>
            <span className="list-title">Emergency Cushion</span>
            <span className="list-subtle">1 month of core expenses</span>
          </div>
          <span className="chip">Essential</span>
        </div>
        <div className="list-item">
          <div>
            <span className="list-title">Travel Fund</span>
            <span className="list-subtle">Build gradually with weekly transfers</span>
          </div>
          <span className="chip">Lifestyle</span>
        </div>
      </article>
    </section>
  );
}
