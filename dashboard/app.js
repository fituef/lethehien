/**
 * Saigon Motorbike Tours - Data Mining Dashboard Application
 * Light Theme, Flat Colors, Chart.js Integration
 */

// Application State
const state = {
  brand: 'all',        // 'all' | 'vespa' | 'xo'
  platform: 'all',     // 'all' | 'gm' | 'ta'
  yearRange: 'all',    // 'all' | '2011-2019' | '2020-2023' | '2024-2026'
  data: null
};

// Chart Instances Tracker
const charts = {
  radar: null,
  tourTypes: null,
  timeSeries: null,
  traveler: null
};

// Color Palette (Strictly Flat Solid Colors - NO GRADIENTS)
const COLORS = {
  vespa: '#E8654A',
  vespaLight: '#FDEAE6',
  vespaRgba: 'rgba(232, 101, 74, 0.15)',
  xo: '#2A9D8F',
  xoLight: '#E0F5F1',
  xoRgba: 'rgba(42, 157, 143, 0.15)',
  gm: '#4285F4',
  gmRgba: 'rgba(66, 133, 244, 0.15)',
  ta: '#00AF87',
  taRgba: 'rgba(0, 175, 135, 0.15)',
  border: '#E2E8F0',
  textMain: '#1A1A2E',
  textMuted: '#6B7280'
};

// Document Ready Initializer
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupFilterControls();
  renderAll();
});

/**
 * Load Data from JSON file with fallback to window.MINING_INSIGHTS
 */
async function loadData() {
  try {
    const response = await fetch('../data/clean/mining_insights.json');
    if (response.ok) {
      state.data = await response.json();
      console.log('Loaded data from JSON via fetch');
      return;
    }
  } catch (err) {
    console.warn('Fetch failed (likely file:// protocol). Falling back to window.MINING_INSIGHTS', err);
  }

  if (window.MINING_INSIGHTS) {
    state.data = window.MINING_INSIGHTS;
    console.log('Loaded data from window.MINING_INSIGHTS');
  } else {
    console.error('Could not load mining insights data.');
  }
}

/**
 * Setup Button Click Listeners for Interactive Filtering
 */
function setupFilterControls() {
  // Brand Filter
  document.querySelectorAll('[data-brand]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-brand]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.brand = btn.getAttribute('data-brand');
      renderAll();
    });
  });

  // Platform Filter
  document.querySelectorAll('[data-platform]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-platform]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.platform = btn.getAttribute('data-platform');
      renderAll();
    });
  });

  // Year Range Filter
  document.querySelectorAll('[data-year-range]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-year-range]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.yearRange = btn.getAttribute('data-year-range');
      renderAll();
    });
  });

  // Reset Button
  const resetBtn = document.getElementById('btnResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-brand="all"]').classList.add('active');
      document.querySelector('[data-platform="all"]').classList.add('active');
      document.querySelector('[data-year-range="all"]').classList.add('active');
      state.brand = 'all';
      state.platform = 'all';
      state.yearRange = 'all';
      renderAll();
    });
  }
}

/**
 * Helper to determine current segment key
 */
function getActiveSegmentKey() {
  const { brand, platform } = state;
  if (brand === 'all' && platform === 'all') return 'all';
  if (brand === 'vespa' && platform === 'all') return 'vespa_all';
  if (brand === 'xo' && platform === 'all') return 'xo_all';
  if (brand === 'all' && platform === 'gm') return 'gm_all';
  if (brand === 'all' && platform === 'ta') return 'ta_all';
  if (brand === 'vespa' && platform === 'gm') return 'vespa_gm';
  if (brand === 'vespa' && platform === 'ta') return 'vespa_ta';
  if (brand === 'xo' && platform === 'gm') return 'xo_gm';
  if (brand === 'xo' && platform === 'ta') return 'xo_ta';
  return 'all';
}

/**
 * Main Render Pipeline
 */
function renderAll() {
  if (!state.data) return;
  renderKPIs();
  render2x2Matrix();
  renderRadarChart();
  renderTourTypesChart();
  renderTimeSeriesChart();
  renderTravelerProfileChart();
  renderPainPointsSection();
}

/**
 * 1. Render KPI Cards
 */
function renderKPIs() {
  const segKey = getActiveSegmentKey();
  const seg = state.data.segments[segKey] || state.data.segments['all'];

  // Card 1: Total Reviews
  document.getElementById('kpiTotalReviews').textContent = Number(seg.total_reviews).toLocaleString();

  // Card 2: Avg Rating
  document.getElementById('kpiAvgRating').textContent = `${seg.avg_rating.toFixed(2)} / 5.00`;

  // Card 3: 5-Star Ratio
  document.getElementById('kpiFiveStarPct').textContent = `${seg.five_star_pct}%`;
  document.getElementById('kpiFiveStarCount').textContent = `${Number(seg.five_star_count).toLocaleString()} / ${Number(seg.total_reviews).toLocaleString()}`;

  // Card 4: Avg Word Count
  document.getElementById('kpiAvgWords').textContent = `${seg.avg_word_count} từ`;

  // Dynamic Sub-items Breakdown based on active filters
  const { brand, platform } = state;
  const segments = state.data.segments;

  if (brand !== 'all' && platform === 'all') {
    // A single brand is selected: show platform breakdown
    const gmSub = segments[`${brand}_gm`];
    const taSub = segments[`${brand}_ta`];

    document.getElementById('kpiTotalSubVespa').textContent = `Google Maps: ${Number(gmSub.total_reviews).toLocaleString()} mẫu`;
    document.getElementById('kpiTotalSubXo').textContent = `Tripadvisor: ${Number(taSub.total_reviews).toLocaleString()} mẫu`;

    document.getElementById('kpiRatingSubVespa').textContent = `GM: ${gmSub.avg_rating.toFixed(2)} / 5.00`;
    document.getElementById('kpiRatingSubXo').textContent = `TA: ${taSub.avg_rating.toFixed(2)} / 5.00`;

    document.getElementById('kpiWordsSubGm').textContent = `Google Maps: ${gmSub.avg_word_count} từ`;
    document.getElementById('kpiWordsSubTa').textContent = `Tripadvisor: ${taSub.avg_word_count} từ`;
  } else if (brand === 'all' && platform !== 'all') {
    // A single platform is selected: show brand breakdown on this platform
    const vSub = segments[`vespa_${platform}`];
    const xSub = segments[`xo_${platform}`];

    document.getElementById('kpiTotalSubVespa').textContent = `Vespa: ${Number(vSub.total_reviews).toLocaleString()} mẫu`;
    document.getElementById('kpiTotalSubXo').textContent = `XO: ${Number(xSub.total_reviews).toLocaleString()} mẫu`;

    document.getElementById('kpiRatingSubVespa').textContent = `Vespa: ${vSub.avg_rating.toFixed(2)} / 5.00`;
    document.getElementById('kpiRatingSubXo').textContent = `XO: ${xSub.avg_rating.toFixed(2)} / 5.00`;

    document.getElementById('kpiWordsSubGm').textContent = `Vespa: ${vSub.avg_word_count} từ`;
    document.getElementById('kpiWordsSubTa').textContent = `XO: ${xSub.avg_word_count} từ`;
  } else if (brand !== 'all' && platform !== 'all') {
    // Specific segment active (e.g., Vespa Google Maps)
    const brandAll = segments[`${brand}_all`];
    const platAll = segments[`${platform}_all`];
    const brandPct = ((seg.total_reviews / brandAll.total_reviews) * 100).toFixed(1);
    const platPct = ((seg.total_reviews / platAll.total_reviews) * 100).toFixed(1);

    document.getElementById('kpiTotalSubVespa').textContent = `% của đơn vị: ${brandPct}%`;
    document.getElementById('kpiTotalSubXo').textContent = `% của kênh: ${platPct}%`;

    const diff = (seg.avg_rating - segments['all'].avg_rating).toFixed(2);
    const sign = diff >= 0 ? '+' : '';
    document.getElementById('kpiRatingSubVespa').textContent = `Độ lệch TB: ${sign}${diff}`;
    document.getElementById('kpiRatingSubXo').textContent = `TB toàn ngành: ${segments['all'].avg_rating.toFixed(2)} / 5.00`;

    document.getElementById('kpiWordsSubGm').textContent = `TB Phân khúc: ${seg.avg_word_count} từ`;
    document.getElementById('kpiWordsSubTa').textContent = `TB Toàn ngành: ${segments['all'].avg_word_count} từ`;
  } else {
    // Both are 'all': standard comparison Vespa vs XO, GM vs TA
    const vespaSeg = segments['vespa_all'];
    const xoSeg = segments['xo_all'];
    const gmSeg = segments['gm_all'];
    const taSeg = segments['ta_all'];

    document.getElementById('kpiTotalSubVespa').textContent = `Vespa: ${Number(vespaSeg.total_reviews).toLocaleString()} mẫu`;
    document.getElementById('kpiTotalSubXo').textContent = `XO: ${Number(xoSeg.total_reviews).toLocaleString()} mẫu`;

    document.getElementById('kpiRatingSubVespa').textContent = `Vespa: ${vespaSeg.avg_rating.toFixed(2)} / 5.00`;
    document.getElementById('kpiRatingSubXo').textContent = `XO: ${xoSeg.avg_rating.toFixed(2)} / 5.00`;

    document.getElementById('kpiWordsSubGm').textContent = `Google Maps: ${gmSeg.avg_word_count} từ`;
    document.getElementById('kpiWordsSubTa').textContent = `Tripadvisor: ${taSeg.avg_word_count} từ`;
  }
}

/**
 * 2. Render 2x2 Matrix Cards
 */
function render2x2Matrix() {
  const matrixContainer = document.getElementById('matrixGrid');
  if (!matrixContainer) return;
  const matrix = state.data.matrix_2x2;
  const currentKey = getActiveSegmentKey();

  const cardsHtml = Object.keys(matrix).map(key => {
    const item = matrix[key];
    const isVespa = item.brand === 'Vespa Adventures';
    const borderClass = isVespa ? 'vespa-border' : 'xo-border';
    const badgeClass = isVespa ? 'badge-vespa' : 'badge-xo';
    const isSelected = (currentKey === key) || (state.brand === 'all' && state.platform === 'all');
    const opacityStyle = isSelected ? '' : 'style="opacity: 0.65;"';

    return `
      <div class="matrix-card ${borderClass}" ${opacityStyle}>
        <div class="matrix-card-header">
          <div>
            <div class="matrix-card-title">${item.name}</div>
            <span class="badge ${badgeClass}" style="margin-top: 6px;">${item.platform}</span>
          </div>
          <div class="matrix-stat" style="text-align: right;">
            <div class="matrix-stat-val" style="color: ${isVespa ? COLORS.vespa : COLORS.xo};">${item.rating} / 5.00</div>
            <div class="matrix-stat-lbl">${Number(item.records).toLocaleString()} bản ghi</div>
          </div>
        </div>

        <div class="matrix-stats-row">
          <div class="matrix-stat">
            <span class="matrix-stat-val">${item.avg_words} từ</span>
            <span class="matrix-stat-lbl">Độ dài trung bình</span>
          </div>
          <div class="matrix-stat" style="margin-left: auto; text-align: right;">
            <span class="matrix-stat-val" style="font-size: 13px;">${item.peak_period}</span>
            <span class="matrix-stat-lbl">Chu kỳ trọng tâm</span>
          </div>
        </div>

        <div class="matrix-content-row">
          <strong>Đặc trưng phản hồi văn bản:</strong> ${item.key_characteristics}
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: auto; padding-top: 8px;">
          <div class="matrix-highlight-tag" style="background-color: ${isVespa ? COLORS.vespaLight : COLORS.xoLight}; color: ${isVespa ? COLORS.vespa : COLORS.xo};">
            Thuộc tính chiếm ưu thế: ${item.top_aspect}
          </div>
        </div>

        <div style="font-size: 12px; color: var(--text-muted); border-top: 1px dashed var(--border-color); padding-top: 8px;">
          Phản hồi bất lợi ghi nhận: ${item.pain_point_summary}
        </div>
      </div>
    `;
  }).join('');

  matrixContainer.innerHTML = cardsHtml;
}

/**
 * 3. Render Radar Chart (Aspects Comparison)
 */
function renderRadarChart() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  const aspectLabels = [
    'Safety & Riding',
    'Food & Culinary',
    'Tour Guide & Staff',
    'Vehicles & Vibe',
    'Value for Money'
  ];

  let datasets = [];

  if (state.brand === 'all' && state.platform === 'all') {
    // Show Vespa vs XO overall
    const vAspects = state.data.segments['vespa_all'].aspects;
    const xAspects = state.data.segments['xo_all'].aspects;

    datasets = [
      {
        label: 'Vespa Adventures (Toàn bộ)',
        data: aspectLabels.map(l => vAspects[l]?.pct || 0),
        borderColor: COLORS.vespa,
        backgroundColor: COLORS.vespaRgba,
        borderWidth: 2,
        pointBackgroundColor: COLORS.vespa,
        pointRadius: 4
      },
      {
        label: 'XO Tours (Toàn bộ)',
        data: aspectLabels.map(l => xAspects[l]?.pct || 0),
        borderColor: COLORS.xo,
        backgroundColor: COLORS.xoRgba,
        borderWidth: 2,
        pointBackgroundColor: COLORS.xo,
        pointRadius: 4
      }
    ];
  } else if (state.platform !== 'all' && state.brand === 'all') {
    // Compare Vespa vs XO on selected platform
    const vKey = state.platform === 'gm' ? 'vespa_gm' : 'vespa_ta';
    const xKey = state.platform === 'gm' ? 'xo_gm' : 'xo_ta';
    const platName = state.platform === 'gm' ? 'Google Maps' : 'Tripadvisor';

    datasets = [
      {
        label: `Vespa Adventures (${platName})`,
        data: aspectLabels.map(l => state.data.segments[vKey].aspects[l]?.pct || 0),
        borderColor: COLORS.vespa,
        backgroundColor: COLORS.vespaRgba,
        borderWidth: 2,
        pointBackgroundColor: COLORS.vespa,
        pointRadius: 4
      },
      {
        label: `XO Tours (${platName})`,
        data: aspectLabels.map(l => state.data.segments[xKey].aspects[l]?.pct || 0),
        borderColor: COLORS.xo,
        backgroundColor: COLORS.xoRgba,
        borderWidth: 2,
        pointBackgroundColor: COLORS.xo,
        pointRadius: 4
      }
    ];
  } else {
    // Specific segment active
    const segKey = getActiveSegmentKey();
    const seg = state.data.segments[segKey];
    const isVespa = segKey.startsWith('vespa');
    const color = isVespa ? COLORS.vespa : COLORS.xo;
    const bgRgba = isVespa ? COLORS.vespaRgba : COLORS.xoRgba;

    datasets = [
      {
        label: `${segKey.toUpperCase()} (% đề cập)`,
        data: aspectLabels.map(l => seg.aspects[l]?.pct || 0),
        borderColor: color,
        backgroundColor: bgRgba,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointRadius: 4
      }
    ];
  }

  if (charts.radar) charts.radar.destroy();

  charts.radar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: aspectLabels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: 'Inter', size: 12, weight: 600 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}% mẫu đề cập`
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 90,
          ticks: {
            stepSize: 20,
            backdropColor: 'transparent',
            font: { size: 10 }
          },
          grid: { color: COLORS.border },
          angleLines: { color: COLORS.border },
          pointLabels: {
            font: { family: 'Inter', size: 12, weight: 600 },
            color: COLORS.textMain
          }
        }
      }
    }
  });
}

/**
 * 4. Render Tour Types Chart (Horizontal Grouped Bar)
 */
function renderTourTypesChart() {
  const ctx = document.getElementById('tourTypesChart');
  if (!ctx) return;

  const tourTypes = ['Foodie Tour', 'Night Tour', 'City / Sightseeing', 'Custom / Private'];
  let datasets = [];

  if (state.brand === 'all') {
    const vSeg = state.platform === 'gm' ? state.data.segments['vespa_gm'] :
                 state.platform === 'ta' ? state.data.segments['vespa_ta'] : state.data.segments['vespa_all'];
    const xSeg = state.platform === 'gm' ? state.data.segments['xo_gm'] :
                 state.platform === 'ta' ? state.data.segments['xo_ta'] : state.data.segments['xo_all'];

    datasets = [
      {
        label: 'Vespa Adventures',
        data: tourTypes.map(t => vSeg.tour_types[t]?.pct || 0),
        backgroundColor: COLORS.vespa,
        borderRadius: 4
      },
      {
        label: 'XO Tours',
        data: tourTypes.map(t => xSeg.tour_types[t]?.pct || 0),
        backgroundColor: COLORS.xo,
        borderRadius: 4
      }
    ];
  } else {
    const activeSeg = state.data.segments[getActiveSegmentKey()];
    const isVespa = state.brand === 'vespa';
    datasets = [
      {
        label: isVespa ? 'Vespa Adventures' : 'XO Tours',
        data: tourTypes.map(t => activeSeg.tour_types[t]?.pct || 0),
        backgroundColor: isVespa ? COLORS.vespa : COLORS.xo,
        borderRadius: 4
      }
    ];
  }

  if (charts.tourTypes) charts.tourTypes.destroy();

  charts.tourTypes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tourTypes,
      datasets: datasets
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: 'Inter', size: 12, weight: 600 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}% mẫu khảo sát`
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 80,
          grid: { color: COLORS.border },
          ticks: {
            callback: (v) => `${v}%`,
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Inter', size: 12, weight: 600 },
            color: COLORS.textMain
          }
        }
      }
    }
  });
}

/**
 * 5. Render Time Series Line Chart (2011 - 2026)
 */
function renderTimeSeriesChart() {
  const ctx = document.getElementById('timeSeriesChart');
  if (!ctx) return;

  const ts = state.data.time_series;
  let years = ts.years;
  let yearIndices = years.map((y, idx) => idx);

  // Filter year range if selected
  if (state.yearRange === '2011-2019') {
    yearIndices = yearIndices.filter(i => years[i] <= 2019);
  } else if (state.yearRange === '2020-2023') {
    yearIndices = yearIndices.filter(i => years[i] >= 2020 && years[i] <= 2023);
  } else if (state.yearRange === '2024-2026') {
    yearIndices = yearIndices.filter(i => years[i] >= 2024);
  }

  const filteredYears = yearIndices.map(i => years[i]);

  const datasets = [
    {
      label: 'Vespa – Tripadvisor',
      data: yearIndices.map(i => ts.series['vespa_ta'].counts[i]),
      borderColor: COLORS.vespa,
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 3,
      tension: 0.2
    },
    {
      label: 'Vespa – Google Maps',
      data: yearIndices.map(i => ts.series['vespa_gm'].counts[i]),
      borderColor: COLORS.vespa,
      borderDash: [5, 4],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      tension: 0.2
    },
    {
      label: 'XO Tours – Tripadvisor',
      data: yearIndices.map(i => ts.series['xo_ta'].counts[i]),
      borderColor: COLORS.xo,
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 3,
      tension: 0.2
    },
    {
      label: 'XO Tours – Google Maps',
      data: yearIndices.map(i => ts.series['xo_gm'].counts[i]),
      borderColor: COLORS.xo,
      borderDash: [5, 4],
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      tension: 0.2
    }
  ];

  // Filter datasets if specific brand or platform selected
  let visibleDatasets = datasets;
  if (state.brand === 'vespa') {
    visibleDatasets = visibleDatasets.filter(d => d.label.startsWith('Vespa'));
  } else if (state.brand === 'xo') {
    visibleDatasets = visibleDatasets.filter(d => d.label.startsWith('XO'));
  }

  if (state.platform === 'gm') {
    visibleDatasets = visibleDatasets.filter(d => d.label.includes('Google Maps'));
  } else if (state.platform === 'ta') {
    visibleDatasets = visibleDatasets.filter(d => d.label.includes('Tripadvisor'));
  }

  if (charts.timeSeries) charts.timeSeries.destroy();

  charts.timeSeries = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredYears,
      datasets: visibleDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 16,
            font: { family: 'Inter', size: 12, weight: 600 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} bản ghi`
          }
        }
      },
      scales: {
        x: {
          grid: { color: COLORS.border },
          ticks: { font: { family: 'Inter', size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: COLORS.border },
          ticks: {
            font: { family: 'Inter', size: 11 },
            callback: (v) => Number(v).toLocaleString()
          }
        }
      }
    }
  });
}

/**
 * 6. Render Traveler Profile Doughnut Chart (Tripadvisor Data)
 */
function renderTravelerProfileChart() {
  const canvas = document.getElementById('travelerChart');
  const alertBox = document.getElementById('travelerAlertBox');
  if (!canvas || !alertBox) return;

  // If user filtered only Google Maps, show notice that travel_type is only on Tripadvisor
  if (state.platform === 'gm') {
    canvas.style.display = 'none';
    alertBox.style.display = 'flex';
    if (charts.traveler) {
      charts.traveler.destroy();
      charts.traveler = null;
    }
    return;
  }

  canvas.style.display = 'block';
  alertBox.style.display = 'none';

  const categories = ['Couple', 'Friends', 'Solo', 'Business'];
  let counts = [0, 0, 0, 0];

  if (state.brand === 'vespa') {
    const tt = state.data.segments['vespa_ta'].travel_types;
    counts = categories.map(c => tt[c] || 0);
  } else if (state.brand === 'xo') {
    const tt = state.data.segments['xo_ta'].travel_types;
    counts = categories.map(c => tt[c] || 0);
  } else {
    // Both brands combined on TA
    const vTt = state.data.segments['vespa_ta'].travel_types;
    const xTt = state.data.segments['xo_ta'].travel_types;
    counts = categories.map(c => (vTt[c] || 0) + (xTt[c] || 0));
  }

  const bgColors = [
    '#3B82F6', // Blue for Couple
    '#10B981', // Emerald for Friends
    '#F59E0B', // Amber for Solo
    '#8B5CF6'  // Purple for Business
  ];

  if (charts.traveler) charts.traveler.destroy();

  charts.traveler = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Cặp đôi (Couples)', 'Bạn bè (Friends)', 'Cá nhân (Solo)', 'Công tác (Business)'],
      datasets: [
        {
          data: counts,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 14,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return `${ctx.label}: ${Number(ctx.raw).toLocaleString()} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * 7. Render Pain Points Accordion Table
 */
function renderPainPointsSection() {
  const container = document.getElementById('painTableBody');
  if (!container) return;

  const categories = state.data.pain_points.categories;
  const totalNeg = state.data.pain_points.total_negative_reviews;

  const rowsHtml = Object.keys(categories).map((catName, index) => {
    const cat = categories[catName];
    const pct = cat.pct_of_neg;
    const fillClass = catName.includes('Environmental') ? 'env' :
                      catName.includes('Guide') ? 'guide' : 'price';

    // Quote cards html
    const quotesHtml = cat.sample_quotes.map(q => `
      <div class="quote-card">
        <div class="quote-header">
          <span class="quote-brand">${q.place_name} (${q.platform})</span>
          <span>Năm ${q.year} &bull; Đánh giá: ${q.rating} / 5.00</span>
        </div>
        <div class="quote-text">"${q.comment}"</div>
      </div>
    `).join('');

    return `
      <tr class="pain-row" data-target="quote-row-${index}">
        <td class="cat-title-cell">
          <span>${catName}</span>
          <span class="cat-subtitle">${cat.label_vi} &bull; ${cat.description}</span>
        </td>
        <td style="font-weight: 700; text-align: center;">${cat.total_count}</td>
        <td style="text-align: center;">${pct}%</td>
        <td>
          <div class="progress-track">
            <div class="progress-fill ${fillClass}" style="width: ${Math.min(pct * 1.8, 100)}%;"></div>
          </div>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">
          <span style="color: ${COLORS.vespa}; font-weight: 600;">Vespa: ${cat.vespa_count}</span> | 
          <span style="color: ${COLORS.xo}; font-weight: 600;">XO: ${cat.xo_count}</span>
        </td>
        <td style="text-align: right;">
          <span class="expand-btn-text">Minh chứng</span>
        </td>
      </tr>
      <tr class="pain-detail-row" id="quote-row-${index}">
        <td colspan="6">
          <div class="quotes-container">
            <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;">
              Các trích dẫn nguyên văn từ tập dữ liệu quan sát (Đánh giá 1–3 / 5.00):
            </div>
            ${quotesHtml}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = rowsHtml;

  // Add click listeners to toggle accordion
  document.querySelectorAll('.pain-row').forEach(row => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');
      const detailRow = document.getElementById(targetId);
      const isOpen = detailRow.classList.contains('open');

      // Close all other rows
      document.querySelectorAll('.pain-detail-row').forEach(r => r.classList.remove('open'));
      document.querySelectorAll('.pain-row').forEach(r => r.classList.remove('active'));

      if (!isOpen) {
        detailRow.classList.add('open');
        row.classList.add('active');
      }
    });
  });
}
