export default function AdminPage() {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm">
      <h1 className="font-display text-2xl text-cardinal">Admin Console</h1>
      <p className="text-sm text-ink/85">Resolve disputes, manage locations, and trigger emergency marketplace pause controls.</p>
      <p className="mt-2 text-xs text-ink/75">
        Implementation note: admin actions are enforced at API level via profiles.is_admin.
      </p>
    </section>
  );
}
