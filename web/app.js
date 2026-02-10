// ============================================
// TRANSLATIONS / INTERNATIONALIZATION (i18n)
// ============================================
const translations = {
    en: {
        title: "Romanian Mountains: Ski Touring & Weather Guide",
        loading: "Loading forecast data...",
        searchPlaceholder: "Search by mountain range or location name...",
        loadingForecasts: "Loading mountain forecasts",
        equipmentClothing: "Equipment & Clothing",
        weatherForecast: "Weather Forecast",
        chartNotAvailable: "Weather chart data not available",
        adviceNotAvailable: "Clothing advice not available",
        noAdviceFound: "No advice sections found",
        noData: "No Data",
        temperature: "Temperature",
        precipitation: "Precipitation",
        wind: "Wind",
        dateFormat: "Ski Touring Conditions & Advice"
    },
    ro: {
        title: "Vreme Muntii Romaniei",
        loading: "Se incarca datele prognozei...",
        searchPlaceholder: "Cautare dupa lant muntos sau locatie...",
        loadingForecasts: "Se incarca prognozele montane",
        equipmentClothing: "Echipament & Imbracaminte",
        weatherForecast: "Prognoza Meteo",
        chartNotAvailable: "Graficul meteo indisponibil",
        adviceNotAvailable: "Sfaturi de imbracaminte indisponibile",
        noAdviceFound: "Nu s-au gasit sectiuni de sfaturi",
        noData: "Fara Date",
        temperature: "Temperatura",
        precipitation: "Precipitatii",
        wind: "Vant",
        dateFormat: "Conditii Schi-Tura & Sfaturi"
    },
    hu: {
        title: "Roman Hegyi Idojaras",
        loading: "Elorejelzesi adatok betoltese...",
        searchPlaceholder: "Kereses hegyseg vagy helyszin szerint...",
        loadingForecasts: "Hegyi elorejelzesek betoltese",
        equipmentClothing: "Felszereles & Oltozet",
        weatherForecast: "Idojaras Elorejelzes",
        chartNotAvailable: "Idojarasi grafikon nem elerheto",
        adviceNotAvailable: "Oltozkodesi tanacsok nem elerhetok",
        noAdviceFound: "Nem talalhatok tanacskodo szakaszok",
        noData: "Nincs Adat",
        temperature: "Homerseklet",
        precipitation: "Csapadek",
        wind: "Szel",
        dateFormat: "Situra Feltetelek & Tanacsok"
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// Switch language function
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });

    // Update page title
    if (translations[lang].title) {
        document.title = translations[lang].title;
    }

    // Trigger reload of locations to update dynamic content with selected date
    if (typeof loadLocations === 'function' && selectedForecastDate) {
        loadLocations(selectedForecastDate);
    }
}

// Initialize language on page load
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    switchLanguage(savedLang);
}

/*
 * Google Analytics Event Tracking
 * ===============================
 *
 * This page tracks the following events:
 *
 * 1. safety_modal_shown - When safety popup is displayed
 * 2. safety_modal_closed - Which button/method closed the modal (Understood, Just checking, Escape, Backdrop)
 * 3. search - User searches with term, results count, matched locations/ranges
 * 4. search_no_results - Failed searches for optimization
 * 5. location_viewed - Specific location cards viewed (scroll into view)
 * 6. mountain_range_viewed - Mountain range sections viewed
 * 7. chart_loaded - Successful chart data loading
 * 8. chart_load_failed - Failed chart loads (debugging)
 * 9. avalanche_bulletin_click - Outbound link to bulletin
 * 10. page_loaded - Successful page load with metadata
 * 11. page_load_failed - Page load errors
 * 12. user_engaged - User stays 30+ seconds
 * 13. session_end - Time spent on page
 * 14. return_visitor - Returning visitors count
 *
 * All events include relevant context (location names, search terms, etc.)
 */

// Format date as DD-MM-YYYY
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Get tomorrow's date
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Get date offset by N days from today in YYYY-MM-DD format
function getDateOffset(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
}

// Global variable to store selected date
let selectedForecastDate = null;

// Generate array of dates from past 6 days to future 3 days
function getDateRange() {
    const dates = [];
    for (let offset = -6; offset <= 3; offset++) {
        const date = getDateOffset(offset);
        const dateObj = new Date(date);
        const label = offset === 0 ? 'Today' :
                     offset === 1 ? 'Tomorrow' :
                     offset === -1 ? 'Yesterday' :
                     dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        dates.push({
            date: date,
            offset: offset,
            label: label,
            isPast: offset < 0,
            isFuture: offset > 0,
            isToday: offset === 0
        });
    }
    return dates;
}

// Create date selector buttons
function createDateSelector() {
    const container = document.getElementById('date-selector');
    const dates = getDateRange();

    container.innerHTML = '';

    dates.forEach(dateInfo => {
        const button = document.createElement('button');
        button.className = 'date-btn';
        if (dateInfo.isPast) button.classList.add('past');
        if (dateInfo.isFuture) button.classList.add('future');

        const dateLabel = formatDate(dateInfo.date);
        button.innerHTML = `
            <div>${dateInfo.label}</div>
            <div class="date-label">${dateLabel}</div>
        `;

        button.onclick = () => selectDate(dateInfo.date);
        button.dataset.date = dateInfo.date;

        container.appendChild(button);
    });

    // Setup sticky date selector behavior
    setupStickyDateSelector();
}

// Setup sticky navigation on scroll
function setupStickyDateSelector() {
    const stickyNav = document.getElementById('sticky-nav');
    const header = document.querySelector('.header');

    if (!stickyNav) return;

    // Create spacer element if it doesn't exist
    let spacer = document.querySelector('.sticky-nav-spacer');
    if (!spacer) {
        spacer = document.createElement('div');
        spacer.className = 'sticky-nav-spacer';
        stickyNav.parentNode.insertBefore(spacer, stickyNav);
    }

    let stickyThreshold = 0;
    let navHeight = 0;

    const updateStickyThreshold = () => {
        if (header) {
            stickyThreshold = header.offsetTop + header.offsetHeight;
        }
        navHeight = stickyNav.offsetHeight;
    };

    updateStickyThreshold();

    window.addEventListener('scroll', () => {
        if (window.scrollY > stickyThreshold) {
            if (!stickyNav.classList.contains('sticky')) {
                stickyNav.classList.add('sticky');
                spacer.style.height = navHeight + 'px';
            }
        } else {
            if (stickyNav.classList.contains('sticky')) {
                stickyNav.classList.remove('sticky');
                spacer.style.height = '0';
            }
        }
    });

    window.addEventListener('resize', updateStickyThreshold);
}

// Select a date and reload data
// Get the currently visible location card
function getCurrentVisibleLocation() {
    const cards = document.querySelectorAll('.location-card');
    const viewportMiddle = window.innerHeight / 2;

    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        // Check if card is in the middle of viewport
        if (rect.top <= viewportMiddle && rect.bottom >= viewportMiddle) {
            const header = card.querySelector('.card-header h3');
            if (header) {
                return header.textContent.trim();
            }
        }
    }

    // Fallback: find first card that's visible
    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight) {
            const header = card.querySelector('.card-header h3');
            if (header) {
                return header.textContent.trim();
            }
        }
    }

    return null;
}

// Scroll to a specific location card by name
function scrollToLocation(locationName) {
    if (!locationName) return;

    const cards = document.querySelectorAll('.location-card');
    for (const card of cards) {
        const header = card.querySelector('.card-header h3');
        if (header && header.textContent.trim() === locationName) {
            // Account for sticky nav height
            const stickyNav = document.getElementById('sticky-nav');
            const offset = stickyNav ? stickyNav.offsetHeight + 20 : 100;

            const cardTop = card.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: cardTop, behavior: 'instant' });
            return;
        }
    }
}

// Variable to store location to restore after date change
let locationToRestore = null;

function selectDate(date) {
    selectedForecastDate = date;

    // Remember current location before reloading
    locationToRestore = getCurrentVisibleLocation();

    // Update active button
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.date === date);
    });

    // Update subtitle to show loading state
    const subtitle = document.getElementById('subtitle');
    subtitle.textContent = `Loading forecast for ${formatDate(date)}...`;

    // Reload locations with selected date
    loadLocations(date);
}

// Detect available local forecast date by trying multiple dates
async function detectLocalForecastDate() {
    // Try dates in order: tomorrow, today, yesterday, +2 days, -2 days, etc.
    const dateOffsets = [1, 0, -1, 2, -2, 3, -3, 4, -4, 5, -5];

    for (const offset of dateOffsets) {
        const testDate = getDateOffset(offset);
        const testPath = `../tomorrow_mountain_forecast_data/date=${testDate}/forecast_metadata.json`;

        try {
            const response = await fetch(testPath);
            if (response.ok) {
                console.log(`Found local forecast data for date: ${testDate} (${offset > 0 ? '+' : ''}${offset} days from today)`);
                return testDate;
            }
        } catch (error) {
            // Continue trying other dates
        }
    }

    // If no local data found, fall back to tomorrow
    console.warn('No local forecast data found, falling back to tomorrow');
    return getTomorrowDate();
}

let chartInstances = {};

// Helper function to convert degrees to cardinal direction
function getCardinalDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees % 360) / 22.5) % 16;
    return directions[index];
}

// Get risk color based on wind loading percentage
function getRiskColor(percentage) {
    if (percentage >= 30) return '#dc2626'; // High risk - dark red
    if (percentage >= 20) return '#ef4444'; // Elevated risk - red
    if (percentage >= 15) return '#f97316'; // Moderate risk - orange
    if (percentage >= 10) return '#f59e0b'; // Low-moderate risk - amber
    if (percentage >= 5) return '#eab308';  // Low risk - yellow
    return '#10b981'; // Minimal risk - green
}

// Create SVG aspect diagram showing avalanche risk by slope direction
function createAspectDiagram(windData) {
    const directionMap = {
        'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW',
        'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'
    };

    // Calculate risk for each aspect based on opposite wind direction
    const aspects = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const aspectRisks = {};

    aspects.forEach(aspect => {
        // Find wind from opposite direction
        const oppositeDir = directionMap[aspect];
        const windFromOpposite = windData.direction_stats.find(s => s.direction === oppositeDir);
        aspectRisks[aspect] = windFromOpposite ? windFromOpposite.percentage : 0;
    });

    // Create SVG with 8 segments
    const centerX = 140;
    const centerY = 140;
    const radius = 120;
    const segmentAngle = 45; // 360 / 8

    let svgPaths = '';

    aspects.forEach((aspect, index) => {
        const startAngle = (index * segmentAngle - 90 - segmentAngle / 2) * Math.PI / 180;
        const endAngle = (index * segmentAngle - 90 + segmentAngle / 2) * Math.PI / 180;

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const risk = aspectRisks[aspect];
        const color = getRiskColor(risk);

        // Create path for segment
        const pathData = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} Z`;

        svgPaths += `
            <path class="aspect-segment" d="${pathData}" fill="${color}"
                  data-aspect="${aspect}" data-risk="${risk.toFixed(1)}"
                  title="${aspect} facing slopes: ${risk.toFixed(1)}% wind loading">
            </path>
        `;

        // Add label
        const labelAngle = (index * segmentAngle - 90) * Math.PI / 180;
        const labelX = centerX + (radius * 0.75) * Math.cos(labelAngle);
        const labelY = centerY + (radius * 0.75) * Math.sin(labelAngle);

        svgPaths += `
            <text class="aspect-label" x="${labelX}" y="${labelY + 5}">
                ${aspect}
            </text>
        `;
    });

    return `
        <svg viewBox="0 0 280 280">
            ${svgPaths}
            <circle cx="${centerX}" cy="${centerY}" r="40" fill="rgba(15, 23, 42, 0.9)" stroke="var(--border)" stroke-width="2"/>
            <text class="aspect-center-label" x="${centerX}" y="${centerY - 5}">Avalanche</text>
            <text class="aspect-center-label" x="${centerX}" y="${centerY + 10}">Risk</text>
            <text class="aspect-center-label" x="${centerX}" y="${centerY + 25}" style="font-size: 11px;">by Aspect</text>
        </svg>
    `;
}

// Create HTML for wind analysis display
function createWindAnalysisHtml(windData) {
    const directionMap = {
        'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW',
        'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE'
    };

    const topDirections = windData.direction_stats.slice(0, 3);
    const leeSlopes = topDirections.map(s => directionMap[s.direction] || '?').join(', ');

    let html = `
        <div class="wind-analysis-section">
            <div class="wind-analysis-header">
                7-DAY WIND ANALYSIS - AVALANCHE RISK ASSESSMENT
            </div>
            <div style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 12px;">
                Period: ${windData.date_analyzed} (recent wind patterns for snow transport & avalanche risk)
            </div>

            <div class="wind-analysis-summary">
                <div class="wind-stat">
                    <div class="wind-stat-label">Dominant Direction</div>
                    <div class="wind-stat-value">${windData.dominant_direction}</div>
                </div>
                <div class="wind-stat">
                    <div class="wind-stat-label">Avg Wind Speed</div>
                    <div class="wind-stat-value">${windData.avg_wind_speed} km/h</div>
                </div>
                <div class="wind-stat">
                    <div class="wind-stat-label">Max Gust</div>
                    <div class="wind-stat-value">${windData.max_gust} km/h</div>
                </div>
                <div class="wind-stat">
                    <div class="wind-stat-label">Hours Analyzed</div>
                    <div class="wind-stat-value">${windData.total_hours}h</div>
                </div>
            </div>

            <div class="aspect-diagram-container">
                <div class="aspect-diagram">
                    ${createAspectDiagram(windData)}
                </div>
            </div>

            <div class="risk-legend">
                <div class="risk-legend-item">
                    <div class="risk-color-box" style="background: #10b981;"></div>
                    <span>Minimal</span>
                </div>
                <div class="risk-legend-item">
                    <div class="risk-color-box" style="background: #eab308;"></div>
                    <span>Low</span>
                </div>
                <div class="risk-legend-item">
                    <div class="risk-color-box" style="background: #f59e0b;"></div>
                    <span>Moderate</span>
                </div>
                <div class="risk-legend-item">
                    <div class="risk-color-box" style="background: #f97316;"></div>
                    <span>Elevated</span>
                </div>
                <div class="risk-legend-item">
                    <div class="risk-color-box" style="background: #dc2626;"></div>
                    <span>High</span>
                </div>
            </div>

            <div class="wind-directions-grid">
    `;

    windData.direction_stats.forEach(stat => {
        html += `
            <div class="wind-direction-card">
                <div class="wind-direction-name">${stat.direction}</div>
                <div class="wind-direction-details">
                    <div><strong>${stat.percentage}%</strong> of time</div>
                    <div>${stat.avg_speed} km/h avg</div>
                    <div>${stat.max_gust} km/h gust</div>
                </div>
            </div>
        `;
    });

    html += `
            </div>

            <div class="avalanche-warning">
                <strong>AVALANCHE CONSIDERATIONS:</strong><br>
                Wind primarily from: <strong>${topDirections.map(s => s.direction).join(', ')}</strong><br>
                Snow deposits on <strong>LEE SLOPES</strong> (opposite of wind direction)<br>
                Higher avalanche risk on slopes facing: <strong>${leeSlopes}</strong><br>
                Check official avalanche bulletin before touring
            </div>
        </div>
    `;

    return html;
}

// Chart.js plugin to draw wind direction arrows
const windDirectionPlugin = {
    id: 'windDirectionArrows',
    afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(2); // Wind Speed dataset (index 2)

        if (!meta || !chart.data.datasets[2].windDirections) return;

        const windDirections = chart.data.datasets[2].windDirections;
        const windColor = 'rgb(14, 165, 233)';

        meta.data.forEach((point, index) => {
            const direction = windDirections[index];
            if (direction === undefined || direction === null) return;

            const x = point.x;
            const y = point.y - 20; // Offset 20px above the data point for better visibility

            ctx.save();
            ctx.translate(x, y);
            // Rotate by direction + 180 to show where wind is blowing TO (not FROM)
            ctx.rotate(((direction + 180) * Math.PI) / 180);

            // Draw arrow (larger and more visible)
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(-5, -2);
            ctx.lineTo(0, -4);
            ctx.lineTo(5, -2);
            ctx.closePath();
            ctx.fillStyle = windColor;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        });
    }
};

// Create a weather chart
function createWeatherChart(canvasId, hourlyData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // If a chart instance already exists for this canvas, destroy it
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');

    // Extract data
    const hours = hourlyData.map(d => `${String(d.hour).padStart(2, '0')}:00`);
    const temperatures = hourlyData.map(d => d.temperature);
    const temperaturesFeel = hourlyData.map(d => d.temperature_feel);
    const precipitation = hourlyData.map(d => d.precipitation);
    const windSpeed = hourlyData.map(d => d.wind_speed);
    const windGust = hourlyData.map(d => d.wind_gusts || d.wind_speed);
    const windDirections = hourlyData.map(d => d.wind_direction || 0);

    const newChart = new Chart(ctx, {
        type: 'line',
        plugins: [windDirectionPlugin],
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Temperature (C)',
                    data: temperatures,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
                {
                    label: 'Feels Like (C)',
                    data: temperaturesFeel,
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                },
                {
                    label: 'Wind Speed (km/h)',
                    data: windSpeed,
                    borderColor: 'rgb(14, 165, 233)',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    windDirections: windDirections,
                },
                {
                    label: 'Wind Gusts (km/h)',
                    data: windGust,
                    borderColor: 'rgba(14, 165, 233, 0.5)',
                    backgroundColor: 'rgba(14, 165, 233, 0.05)',
                    borderDash: [3, 3],
                    tension: 0.4,
                    fill: '-1',
                    yAxisID: 'y1',
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Precipitation (mm)',
                    data: precipitation,
                    type: 'bar',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    yAxisID: 'y2',
                    order: 1,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'rgb(248, 250, 252)',
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: 'rgb(248, 250, 252)',
                    bodyColor: 'rgb(203, 213, 225)',
                    borderColor: 'rgb(51, 65, 85)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(1);
                            if (context.dataset.label.includes('Temperature')) {
                                label += ' C';
                            } else if (context.dataset.label.includes('Wind')) {
                                label += ' km/h';
                            } else if (context.dataset.label.includes('Precipitation')) {
                                label += ' mm';
                            }
                            return label;
                        },
                        afterLabel: function(context) {
                            // Only add direction info for Wind Speed dataset
                            if (context.dataset.windDirections && context.dataIndex !== undefined) {
                                const direction = context.dataset.windDirections[context.dataIndex];
                                const cardinalDir = getCardinalDirection(direction);
                                return `Direction: from ${cardinalDir} (${direction})`;
                            }
                            return null;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)',
                    },
                    ticks: {
                        color: 'rgb(203, 213, 225)',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (C)',
                        color: 'rgb(239, 68, 68)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                    },
                    ticks: {
                        color: 'rgb(239, 68, 68)',
                        font: {
                            size: 11
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Wind Speed (km/h)',
                        color: 'rgb(14, 165, 233)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: 'rgb(14, 165, 233)',
                        font: {
                            size: 11
                        }
                    }
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });

    chartInstances[canvasId] = newChart;
    return newChart;
}

// Create location card
async function createLocationCard(location, forecastDate, useLocalPath = false) {
    const card = document.createElement('div');
    card.className = 'location-card';

    // Track location card view with Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackEvent('location_viewed', {
                    location_name: location.name,
                    mountain_range: location.mountain_range,
                    elevation: location.elevation,
                    zone: location.zone
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    setTimeout(() => observer.observe(card), 100);

    const baseFilename = `${location.mountain_range.replace(/ /g, '_').toLowerCase()}_${location.zone.replace(/ /g, '_')}`;
    const adviceFilename = `${baseFilename}_model_advice_${currentLanguage}.md`;
    const hourlyDataFilename = `${baseFilename}_hourly_data_full_day.json`;
    const windAnalysisFilename = `${baseFilename}_wind_analysis.json`;

    // Load advice markdown
    let adviceMarkdown = '';
    let adviceSections = [];
    try {
        let response;

        // Use local path with date directory or S3
        if (useLocalPath) {
            response = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${adviceFilename}`);
            console.log(`Fetching advice (local): ../tomorrow_mountain_forecast_data/date=${forecastDate}/${adviceFilename}`);
        } else {
            // Try S3 first (only works for current/latest forecast)
            response = await fetch(`./${adviceFilename}`);
            console.log(`Fetching advice (S3): ./${adviceFilename}`);

            // If S3 fails, try local path
            if (!response.ok) {
                console.log(`S3 not found (${response.status}), trying local: ../tomorrow_mountain_forecast_data/date=${forecastDate}/${adviceFilename}`);
                response = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${adviceFilename}`);
            }
        }

        if (response.ok) {
            adviceMarkdown = await response.text();
            console.log(`Loaded advice for ${location.name} (${currentLanguage}), length: ${adviceMarkdown.length}`);

            if (adviceMarkdown.trim().length === 0) {
                console.warn(`Advice file is empty for ${location.name}`);
                throw new Error('Empty advice file');
            }

            adviceSections = parseAdviceMarkdown(adviceMarkdown);
            console.log(`Parsed ${adviceSections.length} sections for ${location.name}`);
        } else {
            console.error(`Failed to fetch advice for ${location.name}: HTTP ${response.status}`);
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`Error loading advice for ${location.name}:`, error);
        adviceSections = [{
            title: 'Loading Error',
            content: [
                `Could not load advice for ${location.name}`,
                `Language: ${currentLanguage}`,
                `Date: ${forecastDate}`,
                'Try refreshing the page or selecting a different date'
            ],
            subsections: []
        }];
    }

    if (adviceSections.length === 0) {
        console.warn(`No sections parsed for ${location.name}, creating fallback`);
        adviceSections = [{
            title: 'No Advice Available',
            content: [
                `Advice data not available for ${location.name}`,
                'This may be due to missing forecast data',
                'Try selecting a different date or mountain range'
            ],
            subsections: []
        }];
    }

    // Generate unique canvas ID
    const canvasId = `chart-${baseFilename}`;

    // Load wind analysis data
    let windAnalysisHtml = '';
    try {
        let windResponse;
        if (useLocalPath) {
            windResponse = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${windAnalysisFilename}`);
        } else {
            windResponse = await fetch(`./${windAnalysisFilename}`);
            if (!windResponse.ok) {
                windResponse = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${windAnalysisFilename}`);
            }
        }

        if (windResponse.ok) {
            const windData = await windResponse.json();
            windAnalysisHtml = createWindAnalysisHtml(windData);
        }
    } catch (error) {
        console.warn(`Could not load wind analysis for ${location.name}:`, error);
    }

    // Extract temperature header if present
    let tempHeader = '';
    if (adviceSections.length > 0 && adviceSections[0].title.includes('Temperature')) {
        tempHeader = `<div class="temp-header"><h3>${adviceSections[0].title}</h3></div>`;
        adviceSections = adviceSections.slice(1); // Remove temperature section from cards
    }

    // Render advice sections as horizontal cards (duplicate for seamless infinite scroll)
    const adviceCardsHtml = adviceSections.map(section => renderSection(section)).join('');
    const duplicatedCardsHtml = adviceCardsHtml + adviceCardsHtml; // Duplicate for seamless loop
    console.log(`Generated HTML length for ${location.name}: ${adviceCardsHtml.length} chars`);

    card.innerHTML = `
        <div class="card-header">
            <h3>${location.name}</h3>
            <div class="location-meta">
<!--                        <div class="meta-item"> <strong>${location.zone}</strong></div>-->
                <div class="meta-item"><strong>${location.elevation}m</strong></div>
                <div class="meta-item">${location.latitude.toFixed(3)}N, ${location.longitude.toFixed(3)}E</div>
            </div>
        </div>
        <div class="card-body">
            ${tempHeader}
            <div class="chart-section">
                <div class="chart-header" data-i18n="weatherForecast">${translations[currentLanguage].weatherForecast}</div>
                <div class="chart-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
            ${windAnalysisHtml}
            <div class="advice-sections-container">
                <button class="advice-toggle collapsed" onclick="toggleAdvice(this)" data-i18n="equipmentClothing">
                    ${translations[currentLanguage].equipmentClothing}
                </button>
                <div class="advice-sections-wrapper">
                    <div class="advice-sections">
                        ${duplicatedCardsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Enable drag scrolling on advice sections
    const adviceSectionsEl = card.querySelector('.advice-sections');
    if (adviceSectionsEl) {
        enableDragScroll(adviceSectionsEl);
    }

    // Load hourly data and create chart
    setTimeout(async () => {
        try {
            let response;

            // Use local path with date directory or S3
            if (useLocalPath) {
                response = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`);
            } else {
                // Try S3 first (only works for current/latest forecast)
                response = await fetch(`./${hourlyDataFilename}`);

                // If S3 fails, try local path
                if (!response.ok) {
                    console.log(`S3 not found, trying local: ../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`);
                    response = await fetch(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`);
                }
            }

            if (response.ok) {
                const hourlyData = await response.json();
                console.log(`Loaded hourly data for ${location.name}, ${hourlyData.length} data points`);
                createWeatherChart(canvasId, hourlyData);

                // Track successful chart load
                trackEvent('chart_loaded', {
                    location_name: location.name,
                    mountain_range: location.mountain_range,
                    data_points: hourlyData.length
                });
            } else {
                throw new Error('Failed to load hourly data');
            }
        } catch (error) {
            console.warn(`Could not load chart for ${location.name}:`, error);
            const container = document.querySelector(`#${canvasId}`).parentElement;
            container.innerHTML = `<div class="chart-error">${translations[currentLanguage].chartNotAvailable}</div>`;

            // Track chart load failure
            trackEvent('chart_load_failed', {
                location_name: location.name,
                mountain_range: location.mountain_range,
                error: error.message
            });
        }
    }, 100);

    return card;
}

// Load and display locations
async function loadLocations(selectedDate = null) {
    const container = document.getElementById('locations-container');
    const subtitle = document.getElementById('subtitle');

    // Determine which date to load
    let forecastDate = selectedDate;
    let useLocalPath = false;

    if (!selectedDate) {
        // No date selected, try to load the latest available (S3 or local)
        try {
            // Try S3 first
            let metadataResponse = await fetch('./forecast_metadata.json');

            if (metadataResponse.ok) {
                const metadata = await metadataResponse.json();
                forecastDate = metadata.forecast_date;
                console.log('Loaded forecast date from S3:', forecastDate);
                useLocalPath = false;
            } else {
                throw new Error('S3 metadata not found');
            }
        } catch (error) {
            // S3 failed, try to detect local data
            console.log('S3 not accessible, searching for local forecast data...');
            useLocalPath = true;
            forecastDate = await detectLocalForecastDate();
        }
    } else {
        // Specific date selected, always use local path
        useLocalPath = true;
        console.log(`Loading data for selected date: ${selectedDate}`);
    }

    subtitle.textContent = translations[currentLanguage].dateFormat;

    try {
        // Load mountain locations (always from root, not date-specific)
        let response;

        if (useLocalPath) {
            response = await fetch('../mountain_locations.json');
        } else {
            // Try S3 first
            response = await fetch('./mountain_locations.json');

            // If S3 fails, try local path
            if (!response.ok) {
                console.log('S3 not found, trying local: ../mountain_locations.json');
                response = await fetch('../mountain_locations.json');
            }
        }

        if (!response.ok) {
            throw new Error(`Failed to load mountain_locations.json: ${response.status}`);
        }

        const locations = await response.json();
        console.log(`Loaded ${locations.length} mountain locations`);

        // Group by mountain range
        const groupedLocations = {};
        locations.forEach(loc => {
            if (!groupedLocations[loc.mountain_range]) {
                groupedLocations[loc.mountain_range] = [];
            }
            groupedLocations[loc.mountain_range].push(loc);
        });

        container.innerHTML = '';

        // Create sections
        for (const [rangeName, rangeLocations] of Object.entries(groupedLocations)) {
            const section = document.createElement('div');
            section.className = 'mountain-range-section';
            section.id = `range-${rangeName.replace(/\s+/g, '-').toLowerCase()}`;

            const rangeHeader = document.createElement('div');
            rangeHeader.className = 'range-header';
            rangeHeader.innerHTML = `<h2>${rangeName}</h2>`;
            rangeHeader.onclick = () => toggleRangeCollapse(rangeHeader);
            section.appendChild(rangeHeader);

            // Track mountain range view
            const rangeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        trackEvent('mountain_range_viewed', {
                            mountain_range: rangeName,
                            locations_count: rangeLocations.length
                        });
                        rangeObserver.unobserve(entry.target);

                        // Update bottom nav active state
                        updateBottomNavActive(rangeName);
                    }
                });
            }, { threshold: 0.3 });

            setTimeout(() => rangeObserver.observe(section), 100);

            const grid = document.createElement('div');
            grid.className = 'locations-grid';

            for (const location of rangeLocations) {
                const card = await createLocationCard(location, forecastDate, useLocalPath);
                grid.appendChild(card);
            }

            section.appendChild(grid);
            container.appendChild(section);
        }

        // Setup search functionality
        setupSearch();

        // Create bottom navigation
        createBottomNav(Object.keys(groupedLocations));

        // Track successful page load with metadata
        trackEvent('page_loaded', {
            forecast_date: forecastDate,
            total_locations: locations.length,
            mountain_ranges: Object.keys(groupedLocations).length,
            ranges_list: Object.keys(groupedLocations).join(', ')
        });

        // Restore scroll position to previously viewed location
        if (locationToRestore) {
            setTimeout(() => {
                scrollToLocation(locationToRestore);
                locationToRestore = null;
            }, 100);
        }
    } catch (error) {
        const dateStr = formatDate(forecastDate);
        container.innerHTML = `
            <div class="chart-error" style="padding: 60px 20px;">
                No forecast data available for ${dateStr}.<br><br>
                This date may not have been generated yet, or the data may be unavailable.<br>
                Try selecting a different date from the options above.
            </div>
        `;
        console.error('Error loading data:', error);

        // Track page load failure
        trackEvent('page_load_failed', {
            error: error.message,
            forecast_date: forecastDate
        });
    }
}

// Toggle mountain range collapse
function toggleRangeCollapse(header) {
    header.classList.toggle('collapsed');
}

// Create bottom navigation bar for quick jump between mountain ranges
function createBottomNav(rangeNames) {
    // Remove existing bottom nav if present
    const existingNav = document.querySelector('.bottom-nav');
    if (existingNav) {
        existingNav.remove();
    }

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    rangeNames.forEach(rangeName => {
        const btn = document.createElement('button');
        btn.className = 'bottom-nav-btn';
        btn.textContent = rangeName;
        btn.onclick = () => scrollToRange(rangeName);
        nav.appendChild(btn);
    });

    document.body.appendChild(nav);
}

// Scroll to mountain range section
function scrollToRange(rangeName) {
    const sectionId = `range-${rangeName.replace(/\s+/g, '-').toLowerCase()}`;
    const section = document.getElementById(sectionId);
    if (section) {
        const dateSelector = document.querySelector('.date-selector');
        const offset = dateSelector && dateSelector.classList.contains('sticky') ? 80 : 20;
        const y = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

// Update bottom nav active state
function updateBottomNavActive(rangeName) {
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === rangeName);
    });
}

// Setup search/filter functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('locations-container');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const sections = container.querySelectorAll('.mountain-range-section');
        let visibleCount = 0;
        let matchedLocations = [];
        let matchedRanges = [];

        sections.forEach(section => {
            const rangeHeader = section.querySelector('.range-header h2');
            const rangeName = rangeHeader.textContent.toLowerCase();
            const cards = section.querySelectorAll('.location-card');
            let visibleCardsInSection = 0;

            cards.forEach(card => {
                const locationName = card.querySelector('.card-header h3').textContent.toLowerCase();
                const matches = searchTerm === '' ||
                              rangeName.includes(searchTerm) ||
                              locationName.includes(searchTerm);

                if (matches) {
                    card.style.display = '';
                    visibleCardsInSection++;
                    visibleCount++;

                    if (searchTerm !== '') {
                        matchedLocations.push(locationName);
                        if (!matchedRanges.includes(rangeName)) {
                            matchedRanges.push(rangeName);
                        }
                    }
                } else {
                    card.style.display = 'none';
                }
            });

            // Hide entire section if no cards are visible
            if (visibleCardsInSection === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
            }
        });

        // Track search with debounce (wait 1 second after user stops typing)
        if (searchTerm !== '') {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                trackEvent('search', {
                    search_term: searchTerm,
                    results_count: visibleCount,
                    matched_locations: matchedLocations.slice(0, 5).join(', '),
                    matched_ranges: matchedRanges.join(', ')
                });
            }, 1000);
        }

        // Show "no results" message if nothing matches
        let noResultsMsg = container.querySelector('.no-results');
        if (visibleCount === 0 && searchTerm !== '') {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results';
                noResultsMsg.innerHTML = `
                    <div>No locations found matching "<strong>${e.target.value}</strong>"</div>
                    <div style="margin-top: 10px; font-size: 0.9em;">Try searching by mountain range (e.g., "Fagaras") or location name (e.g., "Balea")</div>
                `;
                container.appendChild(noResultsMsg);
            } else {
                noResultsMsg.style.display = '';
                noResultsMsg.innerHTML = `
                    <div>No locations found matching "<strong>${e.target.value}</strong>"</div>
                    <div style="margin-top: 10px; font-size: 0.9em;">Try searching by mountain range (e.g., "Fagaras") or location name (e.g., "Balea")</div>
                `;
            }

            // Track failed search
            trackEvent('search_no_results', {
                search_term: searchTerm
            });
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    });
}

// Google Analytics Event Tracking
function trackEvent(eventName, eventParams = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventParams);
    }
}

// Parse markdown advice into structured sections
function parseAdviceMarkdown(markdown) {
    const lines = markdown.trim().split('\n');
    const sections = [];
    let currentSection = null;
    let currentSubsection = null;

    console.log(`Parsing ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (!trimmedLine) continue;

        // Main section header (e.g., **Base Layers:** or **Temperature...**)
        if (trimmedLine.match(/^\*\*[^*]+\*\*/)) {
            // Save previous section
            if (currentSection) {
                console.log(`Saving section: ${currentSection.title}, items: ${currentSection.content.length}`);

                // Special handling for Essential Equipment - promote subsections to separate cards
                if (currentSection.title === 'Essential Equipment' && currentSection.subsections.length > 0) {
                    currentSection.subsections.forEach(subsection => {
                        sections.push({
                            title: subsection.title,
                            content: subsection.items,
                            subsections: []
                        });
                    });
                } else {
                    sections.push(currentSection);
                }
            }

            // Extract everything between the first ** and closing **
            const match = trimmedLine.match(/^\*\*([^*]+)\*\*(.*)/);
            if (match) {
                let title = match[1].trim();
                // Remove trailing colon if present
                title = title.replace(/:$/, '');

                currentSection = {
                    title: title,
                    content: [],
                    subsections: []
                };
                currentSubsection = null;

                // If there's text after the closing **, add it
                const afterText = match[2].trim();
                if (afterText) {
                    currentSection.content.push(afterText);
                }

                console.log(`New section: ${title}`);
            }
        }
        // Subsection header (e.g., *Mandatory Safety (Avalanche):*)
        else if (trimmedLine.match(/^\*[^*]+\*:?$/)) {
            const match = trimmedLine.match(/^\*([^*]+)\*:?$/);
            if (match && currentSection) {
                let title = match[1].trim();
                title = title.replace(/:$/, '');

                currentSubsection = {
                    title: title,
                    items: []
                };
                currentSection.subsections.push(currentSubsection);
                console.log(`New subsection: ${title}`);
            }
        }
        // List item
        else if (trimmedLine.startsWith('- ')) {
            const item = trimmedLine.substring(2).trim();
            if (currentSubsection) {
                currentSubsection.items.push(item);
            } else if (currentSection) {
                currentSection.content.push(item);
            }
        }
    }

    // Save last section
    if (currentSection) {
        console.log(`Saving final section: ${currentSection.title}`);

        // Special handling for Essential Equipment - promote subsections to separate cards
        if (currentSection.title === 'Essential Equipment' && currentSection.subsections.length > 0) {
            currentSection.subsections.forEach(subsection => {
                sections.push({
                    title: subsection.title,
                    content: subsection.items,
                    subsections: []
                });
            });
        } else {
            sections.push(currentSection);
        }
    }

    console.log(`Total sections parsed: ${sections.length}`);
    return sections;
}

// Toggle advice sections visibility
function toggleAdvice(button) {
    const wrapper = button.nextElementSibling;
    button.classList.toggle('collapsed');
    wrapper.classList.toggle('expanded');

    // Update scroll indicator classes
    if (wrapper.classList.contains('expanded')) {
        const adviceSections = wrapper.querySelector('.advice-sections');
        if (adviceSections) {
            updateScrollIndicator(adviceSections, wrapper);
            adviceSections.addEventListener('scroll', () => updateScrollIndicator(adviceSections, wrapper));
        }
    }
}

// Update scroll indicator/fade effect based on scroll position
function updateScrollIndicator(element, wrapper) {
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    wrapper.classList.remove('scroll-start', 'scroll-end', 'scroll-middle');

    if (scrollLeft <= 10) {
        wrapper.classList.add('scroll-start');
    } else if (scrollLeft >= maxScroll - 10) {
        wrapper.classList.add('scroll-end');
    } else {
        wrapper.classList.add('scroll-middle');
    }
}

// Enable drag scrolling and infinite loop for advice sections
function enableDragScroll(element) {
    let isDown = false;
    let startX;
    let scrollLeft;
    let isPaused = false;
    let autoScrollInterval = null;

    // Calculate the scroll width of one full set (half of total since we duplicated)
    const getHalfWidth = () => element.scrollWidth / 2;

    // Initialize scroll position to prevent flickering
    // Wait a moment for layout to complete, then set initial position
    setTimeout(() => {
        const halfWidth = getHalfWidth();
        if (halfWidth > 0) {
            element.scrollLeft = 1; // Start at 1px (not 0) to avoid immediate jump
            element.classList.add('ready'); // Fade in after positioning
        }
    }, 50);

    // Handle infinite scroll looping
    const handleInfiniteScroll = () => {
        const halfWidth = getHalfWidth();
        const currentScroll = element.scrollLeft;

        // If scrolled past the halfway point (end of first set), jump back to start
        if (currentScroll >= halfWidth - 10) {
            element.scrollLeft = currentScroll - halfWidth;
        }
        // If scrolled to beginning, jump to halfway point
        else if (currentScroll <= 0) {
            element.scrollLeft = halfWidth;
        }
    };

    // Auto-scroll animation (smooth continuous scrolling)
    const autoScroll = () => {
        if (!isDown && !isPaused) {
            element.scrollLeft += 1; // Scroll 1px at a time for smooth animation
            handleInfiniteScroll();
        }
    };

    // Start auto-scrolling (60fps = ~16ms interval, but slower speed)
    autoScrollInterval = setInterval(autoScroll, 30); // 30ms for moderate speed

    // Pause on hover
    element.addEventListener('mouseenter', () => {
        isPaused = true;
    });

    element.addEventListener('mouseleave', () => {
        if (!isDown) {
            isPaused = false;
        }
    });

    // Drag scrolling functionality
    element.addEventListener('mousedown', (e) => {
        isDown = true;
        isPaused = true;
        element.style.cursor = 'grabbing';
        startX = e.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
    });

    element.addEventListener('mouseleave', () => {
        if (isDown) {
            isDown = false;
            element.style.cursor = 'grab';
            isPaused = false;
        }
    });

    element.addEventListener('mouseup', () => {
        isDown = false;
        element.style.cursor = 'grab';
        isPaused = false;
    });

    element.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = (x - startX) * 2;
        element.scrollLeft = scrollLeft - walk;
    });

    // Manual scroll also triggers infinite loop
    element.addEventListener('scroll', handleInfiniteScroll);
}

// Render section as HTML
function renderSection(section) {
    if (!section || !section.title) return '';

    let html = `<div class="advice-section">`;
    html += `<h4>${section.title}</h4>`;

    // Render main content
    if (section.content && section.content.length > 0) {
        html += '<ul>';
        section.content.forEach(item => {
            if (item) {
                html += `<li>${item}</li>`;
            }
        });
        html += '</ul>';
    }

    // Render subsections
    if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(sub => {
            if (sub && sub.title) {
                html += `<h5>${sub.title}</h5>`;
                if (sub.items && sub.items.length > 0) {
                    html += '<ul>';
                    sub.items.forEach(item => {
                        if (item) {
                            html += `<li>${item}</li>`;
                        }
                    });
                    html += '</ul>';
                }
            }
        });
    }

    html += '</div>';
    return html;
}

// Safety Modal Functions
async function loadSafetyModal() {
    try {
        // Try to load popup text from S3 or local
        let response;
        try {
            response = await fetch('./popup_advice.txt');
        } catch {
            response = await fetch('../popup_advice.txt');
        }

        if (response.ok) {
            const text = await response.text();
            const modalBody = document.getElementById('modal-text');

            // Split text into paragraphs and format
            const paragraphs = text.trim().split('\n\n').filter(p => p.trim());
            modalBody.innerHTML = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
        }
    } catch (error) {
        console.warn('Could not load safety notice:', error);
        // Keep default text if loading fails
    }

    // Show modal after brief delay
    setTimeout(() => {
        const modal = document.getElementById('safety-modal');
        modal.classList.add('show');

        // Track modal view
        trackEvent('safety_modal_shown', {
            event_category: 'engagement',
            event_label: 'Safety Notice Displayed'
        });
    }, 500);
}

function closeModal() {
    const modal = document.getElementById('safety-modal');
    const clickedButton = event.target.textContent.trim();

    modal.classList.remove('show');

    // Store in sessionStorage to not show again this session
    sessionStorage.setItem('safetyModalShown', 'true');

    // Track which button was clicked
    trackEvent('safety_modal_closed', {
        event_category: 'engagement',
        event_label: clickedButton,
        button_type: clickedButton
    });
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('safety-modal');
        if (modal.classList.contains('show')) {
            // Track escape key close
            trackEvent('safety_modal_closed', {
                event_category: 'engagement',
                event_label: 'Escape Key',
                button_type: 'Escape Key'
            });
            modal.classList.remove('show');
            sessionStorage.setItem('safetyModalShown', 'true');
        }
    }
});

// Close modal when clicking outside content area
document.addEventListener('click', (e) => {
    const modal = document.getElementById('safety-modal');
    if (e.target === modal && modal.classList.contains('show')) {
        // Track backdrop click close
        trackEvent('safety_modal_closed', {
            event_category: 'engagement',
            event_label: 'Backdrop Click',
            button_type: 'Backdrop Click'
        });
        modal.classList.remove('show');
        sessionStorage.setItem('safetyModalShown', 'true');
    }
});

// Check if modal should be shown (once per session)
function checkSafetyModal() {
    const hasSeenModal = sessionStorage.getItem('safetyModalShown');
    if (!hasSeenModal) {
        loadSafetyModal();
        sessionStorage.setItem('safetyModalShown', 'true');
    }
}

// Track user engagement time
let pageLoadTime = Date.now();
let engagementTracked = false;

// Track engagement after 30 seconds
setTimeout(() => {
    if (!engagementTracked) {
        trackEvent('user_engaged', {
            event_category: 'engagement',
            event_label: '30+ seconds',
            engagement_time_seconds: 30
        });
        engagementTracked = true;
    }
}, 30000);

// Track before user leaves
window.addEventListener('beforeunload', () => {
    const timeSpent = Math.round((Date.now() - pageLoadTime) / 1000);
    if (timeSpent > 5) {
        trackEvent('session_end', {
            time_spent_seconds: timeSpent,
            time_spent_minutes: Math.round(timeSpent / 60)
        });
    }
});

// Track return visitors
const visitCount = parseInt(localStorage.getItem('visitCount') || '0') + 1;
localStorage.setItem('visitCount', visitCount.toString());
if (visitCount > 1) {
    trackEvent('return_visitor', {
        visit_number: visitCount
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    initLanguage();
    checkSafetyModal();

    // Create date selector
    createDateSelector();

    // Auto-select tomorrow if available, otherwise today
    const tomorrow = getTomorrowDate();
    selectedForecastDate = tomorrow;
    selectDate(tomorrow);
});
