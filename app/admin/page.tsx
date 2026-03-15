export default function AdminPage() {
  return (
    <section className="card" style={{ maxWidth: "40rem" }}>
      <h1 className="font-serif text-2xl font-bold text-red mb-2">Admin Console</h1>
      <p className="text-sm text-muted mb-4">
        Resolve disputes, manage locations, and trigger emergency marketplace pause controls.
      </p>
      <p className="text-xs text-muted">
        Implementation note: admin actions are enforced at API level via profiles.is_admin.
      </p>
    </section>
  );
}
