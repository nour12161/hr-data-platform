import React, { useEffect, useState } from "react";
import axios from "axios";
import CountUp from "react-countup";
import {
  PieChart, Pie, Tooltip, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
  ResponsiveContainer
} from "recharts";
import "./DashboardRH.css";

const COLORS = ['#7E57C2', '#42A5F5', '#90A4AE', '#FF7043', '#26C6DA'];

const champLabels = {
  genre: "Genre",
  direction_id: "Direction",
  filiere_id: "Filière",
  grade_actuel: "Grade",
  site_affectation_id: "Site d'affectation",
};

const DashboardRH = () => {
  const [selectedAnnee, setSelectedAnnee] = useState("2025");
  const [selectedMois, setSelectedMois] = useState("2");
  const [total, setTotal] = useState(0);
  const [nouveaux, setNouveaux] = useState(0);
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [chartTypes, setChartTypes] = useState({});
  const [effectifParMois, setEffectifParMois] = useState([]);

  const champsAutorises = [
    { champ: "genre", label: "Genre" },
    { champ: "direction_id", label: "Direction" },
    { champ: "filiere_id", label: "Filière" },
    { champ: "grade_actuel", label: "Grade" },
    { champ: "site_affectation_id", label: "Site d'affectation" },
  ];

  // Chargement des KPI mensuels
  useEffect(() => {
    if (selectedAnnee && selectedMois) {
      setLoading(true);
      const promises = champsAutorises.map(({ champ }) =>
        axios.get(`http://localhost:5000/api/kpi/calculate/${champ}?annee=${selectedAnnee}&mois=${selectedMois}`)
          .then(res => ({ champ, data: res.data.data, total: res.data.total, nouveaux: res.data.nouveaux }))
      );

      Promise.all(promises)
        .then(results => {
          const global = results.find(r => r.total !== undefined);
          if (global) {
            setTotal(global.total);
            setNouveaux(global.nouveaux);
          }
          setGraphData(results.map(r => ({ champ: r.champ, data: r.data })));
        })
        .catch(err => console.error("Erreur chargement KPI:", err))
        .finally(() => setLoading(false));
    }
  }, [selectedAnnee, selectedMois]);

  // Chargement de l’évolution de l’effectif par mois
  useEffect(() => {
    axios.get(`http://localhost:5000/api/kpi/evolution/effectif?annee=${selectedAnnee}`)
      .then(res => setEffectifParMois(res.data))
      .catch(err => console.error("Erreur chargement effectif :", err));
  }, [selectedAnnee]);

  const moisNom = new Date(0, selectedMois - 1).toLocaleString('fr-FR', { month: 'long' });

  const handleChartTypeChange = (champ, type) => {
    setChartTypes(prev => ({ ...prev, [champ]: type }));
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📊 Dashboard RH - Vue globale pour {moisNom} {selectedAnnee}</h2>

      <div className="filter-bar">
        <div>
          <label>Mois :</label>
          <select value={selectedMois} onChange={e => setSelectedMois(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Année :</label>
          <select value={selectedAnnee} onChange={e => setSelectedAnnee(e.target.value)}>
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h5 className="kpi-title">✅ Collaborateurs actifs</h5>
          <div className="kpi-value">
            <CountUp end={total} duration={1.5} separator=" " decimals={0} />
          </div>
        </div>
        <div className="kpi-card">
          <h5 className="kpi-title">👥 Nouveaux collaborateurs</h5>
          <div className="kpi-value">
            <CountUp end={nouveaux} duration={1.5} separator=" " decimals={0} />
          </div>
        </div>
      </div>

      {/* 🔄 Graphique évolutif */}
      <div className="evolution-box">
        <h3>📈 Évolution de l’effectif total - {selectedAnnee}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={effectifParMois}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" tickFormatter={(m) => new Date(0, m - 1).toLocaleString('fr-FR', { month: 'short' })} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#7E57C2" strokeWidth={2} name="Collaborateurs actifs" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {loading ? (
        <p className="loading-text">Chargement des données...</p>
      ) : (
        <div className="chart-grid">
          {graphData.map(({ champ, data }, i) => {
            const chartType = chartTypes[champ] || "bar";
            return (
              <div key={i} className="chart-box">
                <h4 className="chart-title">Répartition par "{champLabels[champ] || champ}"</h4>
                <div style={{ marginBottom: "0.5rem" }}>
                  <label style={{ marginRight: "0.5rem" }}>Type de graphe :</label>
                  <select
                    value={chartType}
                    onChange={e => handleChartTypeChange(champ, e.target.value)}
                  >
                    <option value="bar">Histogramme</option>
                    <option value="pie">Camembert</option>
                    <option value="line">Ligne</option>
                  </select>
                </div>

                {data && data.length > 0 && (
                  chartType === "pie" ? (
                    <div style={{ width: "100%", height: 240 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === "bar" ? (
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      ) : (
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardRH;
