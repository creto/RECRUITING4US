import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function Bars({ title, rows }: { title: string; rows: { name: string; n: number }[] }) {
  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <h2 className="text-2xl">{title}</h2>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
            <Bar dataKey="n" fill="var(--color-accent)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
