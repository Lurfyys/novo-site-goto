import React from "react";
import type {
  CycleMetrics,
  PreviewInsights,
  CopsoqRadarPoint,
} from "../services/reportsService";

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function cleanBullet(text: string) {
  return String(text ?? "").replace(/^•\s*/, "").trim();
}

function riskLabel(value: number) {
  if (value > 3.8) return "ALTO";
  if (value > 2.8) return "ATENÇÃO";
  return "BAIXO";
}

function riskClass(value: number) {
  if (value > 3.8) return "danger";
  if (value > 2.8) return "warn";
  return "ok";
}

function formatPct(value: number) {
  return `${safeNum(value).toFixed(1)}%`;
}

function getCopsoqScore5(radar: CopsoqRadarPoint[] | null, metaAvg: number) {
  if (radar && radar.length) {
    const valid = radar.filter((r) => r.hasData);
    if (valid.length) {
      return valid.reduce((sum, r) => sum + safeNum(r.value), 0) / valid.length;
    }
  }

  if (metaAvg > 5) return metaAvg / 20;
  return metaAvg;
}

function DonutChart({
  title,
  subtitle,
  items,
  centerLabel,
  centerSubLabel = "Total",
}: {
  title: string;
  subtitle?: string;
  centerLabel?: string;
  centerSubLabel?: string;
  items: Array<{
    label: string;
    value: number;
    color: string;
    suffix?: string;
  }>;
}) {
  const total = items.reduce((sum, item) => sum + safeNum(item.value), 0);

  let acc = 0;
  const gradient =
    total <= 0
      ? "#e2e8f0 0deg 360deg"
      : items
          .map((item) => {
            const start = acc;
            const deg = (safeNum(item.value) / total) * 360;
            acc += deg;
            return `${item.color} ${start}deg ${acc}deg`;
          })
          .join(", ");

  return (
    <div className="pdf-card">
      <div className="pdf-small-title">{title}</div>
      {subtitle && <div className="pdf-muted">{subtitle}</div>}

      <div className="pdf-donut-container">
        <div
          className="pdf-donut"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="pdf-donut-hole">
            <strong>{centerLabel ?? (total > 0 ? total : "—")}</strong>
            <span>{centerSubLabel}</span>
          </div>
        </div>
      </div>

      <div className="pdf-legend">
        {items.map((item) => (
          <div key={item.label} className="pdf-legend-item">
            <span style={{ color: item.color }}>●</span>
            <em>{item.label}</em>
            <strong>
              {safeNum(item.value)}
              {item.suffix ?? ""}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChartPdf({
  data,
  size = 640,
}: {
  data: CopsoqRadarPoint[];
  size?: number;
}) {
  if (!data || data.length < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.29;
  const maxVal = 5;
  const levels = 5;
  const n = data.length;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const toXY = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(value, maxVal)) / maxVal) * radius;
    return {
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    };
  };

  const polygonPoints = data
    .map((d, i) => {
      const p = toXY(i, d.hasData ? d.value : 0);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      className="pdf-radar"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {Array.from({ length: levels }, (_, levelIndex) => {
        const level = levelIndex + 1;
        const r = (level / levels) * radius;

        const points = data
          .map((_, i) => {
            return `${cx + r * Math.cos(angle(i))},${
              cy + r * Math.sin(angle(i))
            }`;
          })
          .join(" ");

        return (
          <polygon
            key={level}
            points={points}
            fill={levelIndex % 2 === 0 ? "#f8fafc" : "#ffffff"}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        );
      })}

      {data.map((_, i) => {
        const p = toXY(i, maxVal);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      <polygon
        points={polygonPoints}
        fill="rgba(37, 99, 235, 0.18)"
        stroke="#2563eb"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const p = toXY(i, d.hasData ? d.value : 0);
        const lp = toXY(i, 6.05);
        const label = d.label.split(" ").slice(0, 2).join(" ");

        return (
          <g key={d.label}>
            {d.hasData && (
              <>
                <circle cx={p.x} cy={p.y} r="7" fill="#2563eb" />
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="900"
                  fill="#0f172a"
                >
                  {d.value.toFixed(1)}
                </text>
              </>
            )}

            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="900"
              fill="#334155"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportPdfContent({
  metrics,
  insights,
  aiBullets,
}: {
  metrics: CycleMetrics;
  insights: PreviewInsights | null;
  aiBullets: string[];
}) {
  const mood = insights?.moodDonut;
  const copsoq = insights?.copsoqDonut;
  const radar = insights?.copsoqRadar;
  const meta = insights?.copsoqMeta;

  const copsoqScore5 = getCopsoqScore5(radar ?? null, safeNum(meta?.avgScore));
  const generalRisk = meta ? riskLabel(copsoqScore5) : "SEM DADOS";

  return (
    <div className="pdf-root">
      <section className="pdf-cover">
        <div className="pdf-brand">GNR1</div>

        <div className="pdf-cover-content">
          <div className="pdf-cover-kicker">
            NR-01 • COPSOQ • Saúde Mental Corporativa
          </div>

          <h1>Relatório de Riscos Psicossociais</h1>

          <h2>{metrics.cycleLabel}</h2>

          <div className="pdf-cover-line" />

          <div className="pdf-cover-grid">
            <div>
              <span>Funcionários analisados</span>
              <strong>{metrics.employeesAnalyzed}</strong>
            </div>

            <div>
              <span>Alertas críticos</span>
              <strong>{metrics.criticalAlerts}</strong>
            </div>

            <div>
              <span>Burnout 7 dias</span>
              <strong>{safeNum(metrics.burnoutAvg7d).toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="pdf-cover-footer">
          Documento executivo gerado automaticamente para apoio à gestão de
          riscos psicossociais.
        </div>
      </section>

      <section className="pdf-page">
        <header className="pdf-header">
          <div>
            <div className="pdf-kicker">Resumo executivo</div>
            <h2>Leitura gerencial do ciclo</h2>
          </div>

          <div className="pdf-period">{metrics.cycleLabel}</div>
        </header>

        <div className="pdf-summary-box">
          {aiBullets.length ? (
            aiBullets.slice(0, 4).map((bullet, index) => (
              <p key={index}>{cleanBullet(bullet)}</p>
            ))
          ) : (
            <p>O resumo executivo ainda não foi gerado para este relatório.</p>
          )}
        </div>

        <div className="pdf-kpi-grid">
          <div className="pdf-kpi">
            <span>Analisados</span>
            <strong>{metrics.employeesAnalyzed}</strong>
          </div>

          <div className="pdf-kpi">
            <span>Alertas críticos</span>
            <strong>{metrics.criticalAlerts}</strong>
          </div>

          <div className="pdf-kpi">
            <span>Burnout 7d</span>
            <strong>{safeNum(metrics.burnoutAvg7d).toFixed(2)}</strong>
          </div>

          <div className={`pdf-kpi ${meta ? riskClass(copsoqScore5) : ""}`}>
            <span>Risco COPSOQ</span>
            <strong>{generalRisk}</strong>
          </div>
        </div>

        <div className="pdf-two-columns">
          <DonutChart
            title="Distribuição de humor"
            subtitle="Classificação das entradas emocionais do ciclo"
            items={[
              { label: "Feliz", value: mood?.happy ?? 0, color: "#22c55e" },
              { label: "Ok", value: mood?.ok ?? 0, color: "#3b82f6" },
              { label: "Triste", value: mood?.sad ?? 0, color: "#ef4444" },
            ]}
          />

          <DonutChart
            title="Distribuição de risco COPSOQ"
            subtitle="Percentual agregado por faixa de risco"
            centerLabel={meta ? copsoqScore5.toFixed(1) : "—"}
            centerSubLabel="Escala 1-5"
            items={[
              {
                label: "Alto",
                value: copsoq?.alto ?? 0,
                color: "#f43f5e",
                suffix: "%",
              },
              {
                label: "Atenção",
                value: copsoq?.atencao ?? 0,
                color: "#eab308",
                suffix: "%",
              },
              {
                label: "Baixo",
                value: copsoq?.baixo ?? 0,
                color: "#10b981",
                suffix: "%",
              },
            ]}
          />
        </div>

        {meta && (
          <div className="pdf-risk-strip">
            <div>
              <span>Respostas COPSOQ</span>
              <strong>{meta.responseCount}</strong>
            </div>

            <div>
              <span>Score médio</span>
              <strong>{copsoqScore5.toFixed(2)} / 5</strong>
            </div>

            <div className="danger">
              <span>Alto risco</span>
              <strong>{formatPct(meta.pctAlto)}</strong>
            </div>

            <div className="warn">
              <span>Atenção</span>
              <strong>{formatPct(meta.pctAtencao)}</strong>
            </div>

            <div className="ok">
              <span>Baixo risco</span>
              <strong>{formatPct(meta.pctBaixo)}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="pdf-page pdf-page-copsoq pdf-page-break">
        <header className="pdf-header">
          <div>
            <div className="pdf-kicker">COPSOQ / NR-01</div>
            <h2>Perfil por dimensão psicossocial</h2>
          </div>

          {meta && (
            <div className="pdf-score-badge">
              Score geral: {copsoqScore5.toFixed(2)} / 5
            </div>
          )}
        </header>

        {radar ? (
          <div className="pdf-copsoq-layout">
            <div className="pdf-radar-card">
              <RadarChartPdf data={radar} size={620} />
            </div>

            <div className="pdf-dimension-grid">
              {radar.map((d) => {
                const value = safeNum(d.value);
                const label = d.hasData ? riskLabel(value) : "SEM DADOS";
                const cls = d.hasData ? riskClass(value) : "";

                return (
                  <div key={d.label} className={`pdf-dimension-card ${cls}`}>
                    <div className="pdf-dimension-top">
                      <span>{d.label}</span>
                      <em>{label}</em>
                    </div>

                    <strong>{d.hasData ? value.toFixed(1) : "—"}</strong>

                    <div className="pdf-bar">
                      <div
                        style={{
                          width: d.hasData ? `${(value / 5) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pdf-empty">
            Perfil COPSOQ por dimensão indisponível para este ciclo.
          </div>
        )}
      </section>

      <section className="pdf-page pdf-page-break">
        <header className="pdf-header">
          <div>
            <div className="pdf-kicker">Plano de ação</div>
            <h2>Recomendações prioritárias</h2>
          </div>
        </header>

        <div className="pdf-action-list">
          {aiBullets.length ? (
            aiBullets.slice(0, 5).map((bullet, index) => (
              <div key={index} className="pdf-action-item">
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <p>{cleanBullet(bullet)}</p>
              </div>
            ))
          ) : (
            <div className="pdf-empty">
              Nenhuma recomendação foi gerada para este relatório.
            </div>
          )}
        </div>

        <div className="pdf-final-note">
          <h3>Observação técnica</h3>
          <p>
            Este relatório organiza indicadores de humor, alertas críticos e
            resultados COPSOQ para apoio à gestão de riscos psicossociais. As
            informações devem ser interpretadas em conjunto com avaliação técnica
            responsável e políticas internas de saúde ocupacional.
          </p>
        </div>
      </section>
    </div>
  );
}