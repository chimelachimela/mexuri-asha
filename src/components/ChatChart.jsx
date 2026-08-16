import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const COLORS = ["#6d5ef8", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];
const AXIS_COLOR = "rgb(var(--color-ink) / 0.45)";
const GRID_COLOR = "rgb(var(--color-line))";

const tooltipStyle = {
    contentStyle: {
        background: "rgb(var(--color-panel-2))",
        border: "1px solid rgb(var(--color-line))",
        borderRadius: 10,
        fontSize: 12,
        padding: "8px 12px",
    },
    labelStyle: { color: "rgb(var(--color-ink) / 0.7)", marginBottom: 4 },
    itemStyle: { color: "rgb(var(--color-ink))" },
};

const legendStyle = { fontSize: 12, color: "rgb(var(--color-ink) / 0.7)", paddingTop: 12 };

export default function ChatChart({ chart }) {
    if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) return null;

    return (
        <div className="my-5 bg-panel border border-line rounded-xl2 p-5 sm:p-6">
            {chart.title && (
                <p className="text-sm font-semibold text-ink mb-5">{chart.title}</p>
            )}
            <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                    {chart.kind === "pie" ? (
                        <PieChart>
                            <Pie
                                data={chart.data}
                                dataKey="value"
                                nameKey="label"
                                outerRadius={95}
                                labelLine={false}
                                label={({ percent }) => `${Math.round(percent * 100)}%`}
                            >
                                {chart.data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgb(var(--color-panel))" strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                            <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
                        </PieChart>
                    ) : chart.kind === "line" ? (
                        <LineChart data={chart.data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={chart.xKey} tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
                            <Tooltip {...tooltipStyle} />
                            {chart.series?.length > 1 && <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />}
                            {(chart.series || []).map((s, i) => (
                                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            ))}
                        </LineChart>
                    ) : (
                        <BarChart data={chart.data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={chart.xKey} tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
                            <Tooltip {...tooltipStyle} cursor={{ fill: "rgb(var(--color-line) / 0.4)" }} />
                            {chart.series?.length > 1 && <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />}
                            {(chart.series || []).map((s, i) => (
                                <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i % COLORS.length]} radius={[6, 6, 0, 0]} maxBarSize={48} />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}