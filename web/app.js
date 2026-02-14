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
        dateFormat: "Ski Touring Conditions & Advice",
        lastUpdated: "Last updated",
        cloudCover: "Cloud Cover",
        fog: "Fog",
        rimeFog: "Rime fog",
        weekHistory: "7-Day History"
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
        dateFormat: "Conditii Schi-Tura & Sfaturi",
        lastUpdated: "Ultima actualizare",
        cloudCover: "Acoperire Nori",
        fog: "Ceață",
        rimeFog: "Chiciură",
        weekHistory: "Istoric 7 Zile"
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
        dateFormat: "Situra Feltetelek & Tanacsok",
        lastUpdated: "Utolso frissites",
        cloudCover: "Felhozet",
        fog: "Köd",
        rimeFog: "Zúzmara",
        weekHistory: "7 Napos Előzmény"
    }
};

let currentLanguage = localStorage.getItem('language') || 'en';

// ============================================
// CLOTHING & EQUIPMENT DATA
// ============================================
const CLOTHING_DATA = {
    equipment: {
        mandatory_safety_kit: [
            "Avalanche transceiver (3-antenna)",
            "Avalanche probe (240-300 cm)",
            "Avalanche shovel (metal blade)",
            "Airbag backpack (recommended)"
        ],
        ski_touring_system: [
            "Touring skis & bindings",
            "Climbing skins",
            "Ski crampons",
            "Adjustable poles"
        ],
        navigation_communication: [
            "Offline maps / GPS",
            "Phone + power bank",
            "Headlamp"
        ],
        emergency_repair: [
            "First aid kit",
            "Emergency bivy",
            "Repair kit & multitool"
        ],
        food_hydration: [
            "High-calorie food",
            "Insulated water bottle",
            "Electrolytes"
        ]
    },
    clothing: {
        always_carried: {
            windstopper: ["Windproof shell jacket OR hardshell"],
            hands: ["Liner gloves", "Insulated gloves/mittens", "Spare dry pair"],
            head_face: ["Helmet", "Beanie", "Buff/gaiter", "Sunglasses", "Goggles"],
            feet: ["Touring boots", "Merino ski socks"]
        },
        temperature_intervals: [
            {
                range: "below_-20",
                label: "Extreme Cold (below -20°C)",
                base_layer: { torso: "Heavy merino long-sleeve", legs: "Heavy merino bottoms" },
                mid_layers: { active: "Fleece or active insulation", static: "Down/synthetic puffy for stops" },
                outer: { jacket: "Hardshell jacket (windproof)", legs: "Hardshell pants" },
                accessories: { hands: "Mittens + liners; spare mandatory", head: "Warm hat + buff; goggles recommended" },
                notes: "Frostbite risk: cover all skin; limit stops"
            },
            {
                range: "-20_to_-10",
                label: "Very Cold (-20 to -10°C)",
                base_layer: { torso: "Warm merino long-sleeve", legs: "Medium-warm bottoms" },
                mid_layers: { active: "Light fleece or active insulation", static: "Packable puffy recommended" },
                outer: { jacket: "Windproof shell OR hardshell", legs: "Windproof pants" },
                accessories: { hands: "Insulated gloves/mittens + spare", head: "Buff + beanie; goggles if wind/snow" },
                notes: "Start cool; vent early to prevent sweat freezing"
            },
            {
                range: "-10_to_0",
                label: "Cold (-10 to 0°C)",
                base_layer: { torso: "Medium merino/synthetic", legs: "Light to medium bottoms" },
                mid_layers: { active: "Light fleece", static: "Packable puffy for long breaks" },
                outer: { jacket: "Windproof shell ALWAYS", legs: "Wind-resistant touring pants" },
                accessories: { hands: "Liner + insulated gloves", head: "Beanie + buff; goggles if snow" },
                notes: "Typical touring zone: breathable layers, add windstopper for descents"
            },
            {
                range: "0_to_10",
                label: "Cool (0 to 10°C)",
                base_layer: { torso: "Lightweight wicking base", legs: "Thin tights or none" },
                mid_layers: { active: "Optional thin fleece", static: "Light puffy for remote tours" },
                outer: { jacket: "Windproof shell (carried/worn when exposed)", legs: "Breathable touring pants" },
                accessories: { hands: "Liners for ascent; insulated for descent", head: "Sun hat + sunglasses" },
                notes: "Overheating common: prioritize venting"
            },
            {
                range: "above_10",
                label: "Warm (above 10°C)",
                base_layer: { torso: "Very light base + sun protection", legs: "Light touring pants" },
                mid_layers: { active: "None typically", static: "Thin emergency insulation in pack" },
                outer: { jacket: "Packable windproof shell ALWAYS", legs: "Light wind-resistant pants" },
                accessories: { hands: "Thin gloves optional", head: "Sun hat + sunscreen mandatory" },
                notes: "Sun/dehydration risks; windstopper still vital for descents"
            }
        ],
        precipitation_overrides: {
            heavy_snow: {
                additions: ["Waterproof hardshell jacket", "Waterproof pants", "Goggles (storm lens)"],
                notes: "Keep insulation dry; use vents"
            },
            wet_precip: {
                additions: ["Fully waterproof hardshell", "Waterproof pants", "Waterproof gloves + spare", "Pack liner for insulation"],
                notes: "Highest hypothermia risk; avoid long stops"
            }
        }
    }
};

// Determine temperature range key
function getTempRangeKey(tempFeelMin) {
    if (tempFeelMin < -20) return "below_-20";
    if (tempFeelMin < -10) return "-20_to_-10";
    if (tempFeelMin < 0) return "-10_to_0";
    if (tempFeelMin < 10) return "0_to_10";
    return "above_10";
}

// Generate clothing & equipment advice from hourly data
function generateClothingAdvice(hourlyData) {
    if (!hourlyData || hourlyData.length === 0) {
        return { sections: [], tempHeader: '' };
    }

    // Calculate temperature feel stats
    const tempFeels = hourlyData.map(d => d.temperature_feel);
    const tempFeelMin = Math.min(...tempFeels);
    const tempFeelMax = Math.max(...tempFeels);
    const tempFeelAvg = tempFeels.reduce((a, b) => a + b, 0) / tempFeels.length;

    // Check precipitation
    const totalPrecip = hourlyData.reduce((sum, d) => sum + d.precipitation, 0);
    const { isSnowByHour } = calculateSnowInfo(hourlyData);
    const hasSnow = isSnowByHour.some(s => s);
    const hasHeavySnow = hasSnow && totalPrecip > 5;
    const hasWetPrecip = totalPrecip > 3 && !hasSnow;

    // Get temperature interval
    const tempRangeKey = getTempRangeKey(tempFeelMin);
    const tempInterval = CLOTHING_DATA.clothing.temperature_intervals.find(i => i.range === tempRangeKey);

    if (!tempInterval) {
        return { sections: [], tempHeader: '' };
    }

    const sections = [];

    // Temperature header
    const tempHeader = `Temperature (feels like): ${tempFeelMin.toFixed(0)}°C to ${tempFeelMax.toFixed(0)}°C`;

    // Base Layers
    sections.push({
        title: "Base Layers",
        items: [
            `Torso: ${tempInterval.base_layer.torso}`,
            `Legs: ${tempInterval.base_layer.legs}`
        ]
    });

    // Mid Layers
    sections.push({
        title: "Mid Layers",
        items: [
            `Active: ${tempInterval.mid_layers.active}`,
            `For stops: ${tempInterval.mid_layers.static}`
        ]
    });

    // Outer Layers
    sections.push({
        title: "Outer Layers",
        items: [
            `Jacket: ${tempInterval.outer.jacket}`,
            `Legs: ${tempInterval.outer.legs}`
        ]
    });

    // Accessories
    sections.push({
        title: "Accessories",
        items: [
            `Hands: ${tempInterval.accessories.hands}`,
            `Head/Face: ${tempInterval.accessories.head}`,
            tempInterval.notes ? `Note: ${tempInterval.notes}` : null
        ].filter(Boolean)
    });

    // Precipitation overrides
    if (hasHeavySnow) {
        sections.push({
            title: "⚠️ Heavy Snow",
            items: [
                ...CLOTHING_DATA.clothing.precipitation_overrides.heavy_snow.additions,
                CLOTHING_DATA.clothing.precipitation_overrides.heavy_snow.notes
            ]
        });
    } else if (hasWetPrecip) {
        sections.push({
            title: "⚠️ Wet Conditions",
            items: [
                ...CLOTHING_DATA.clothing.precipitation_overrides.wet_precip.additions,
                CLOTHING_DATA.clothing.precipitation_overrides.wet_precip.notes
            ]
        });
    }

    // Always carried
    sections.push({
        title: "Always Carried",
        items: [
            `Shell: ${CLOTHING_DATA.clothing.always_carried.windstopper.join(', ')}`,
            `Hands: ${CLOTHING_DATA.clothing.always_carried.hands.join(', ')}`,
            `Head: ${CLOTHING_DATA.clothing.always_carried.head_face.join(', ')}`
        ]
    });

    // Equipment sections
    sections.push({
        title: "🎿 Avalanche Safety",
        items: CLOTHING_DATA.equipment.mandatory_safety_kit
    });

    sections.push({
        title: "🎿 Ski Touring Gear",
        items: CLOTHING_DATA.equipment.ski_touring_system
    });

    sections.push({
        title: "🧭 Navigation",
        items: CLOTHING_DATA.equipment.navigation_communication
    });

    sections.push({
        title: "🚑 Emergency",
        items: CLOTHING_DATA.equipment.emergency_repair
    });

    sections.push({
        title: "🍫 Food & Water",
        items: CLOTHING_DATA.equipment.food_hydration
    });

    return { sections, tempHeader };
}

// Render advice section HTML
function renderAdviceSection(section) {
    const itemsHtml = section.items.map(item => `<li>${item}</li>`).join('');
    return `
        <div class="advice-section">
            <h4>${section.title}</h4>
            <ul>${itemsHtml}</ul>
        </div>
    `;
}

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

// Add cache-busting parameter to URL to bypass browser/CDN caching
function cacheBust(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
}

// Global variable to store selected date
let selectedForecastDate = null;

// Generate card-level date selector HTML
function createCardDateSelector(currentDate, cardId) {
    const dates = getDateRange();
    let html = '<div class="card-date-selector">';

    dates.forEach(dateInfo => {
        const isActive = dateInfo.date === currentDate ? 'active' : '';
        const isPast = dateInfo.isPast ? 'past' : '';
        const isFuture = dateInfo.isFuture ? 'future' : '';
        const shortDate = formatDate(dateInfo.date).slice(0, 5); // DD-MM

        html += `
            <button class="card-date-btn ${isActive} ${isPast} ${isFuture}"
                    data-date="${dateInfo.date}"
                    data-card-id="${cardId}"
                    onclick="updateCardDate('${cardId}', '${dateInfo.date}')">
                <span class="card-date-day">${dateInfo.label}</span>
                <span class="card-date-num">${shortDate}</span>
            </button>
        `;
    });

    html += '</div>';
    return html;
}

// Update a single card with new date data
async function updateCardDate(cardId, newDate) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const location = JSON.parse(card.dataset.location);
    const useLocalPath = true; // Always use local path for specific dates

    // Update active state on date buttons
    card.querySelectorAll('.card-date-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.date === newDate);
    });

    // Show loading state
    const chartContainer = card.querySelector('.chart-container');
    const originalChartHtml = chartContainer.innerHTML;
    chartContainer.innerHTML = '<div class="chart-loading">Loading...</div>';

    // Create filenames
    const safeName = location.name.replace(/ /g, '_').replace(/,/g, '').replace(/\(/g, '').replace(/\)/g, '').toLowerCase();
    const baseFilename = `${location.mountain_range.replace(/ /g, '_').toLowerCase()}_${safeName}`;
    const hourlyDataFilename = `${baseFilename}_hourly_data_full_day.json`;
    const windAnalysisFilename = `${baseFilename}_wind_analysis.json`;
    const canvasId = `chart-${baseFilename}`;

    try {
        // Load wind analysis (cache-bust to get fresh data)
        const windResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${newDate}/${windAnalysisFilename}`));
        if (windResponse.ok) {
            const windData = await windResponse.json();
            const windSection = card.querySelector('.wind-analysis-section');
            if (windSection) {
                windSection.outerHTML = createWindAnalysisHtml(windData);
            }
        }

        // Load hourly data and recreate chart (cache-bust to get fresh data)
        const hourlyResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${newDate}/${hourlyDataFilename}`));
        if (hourlyResponse.ok) {
            const hourlyDataRaw = await hourlyResponse.json();
            const normalized = normalizeHourlyData(hourlyDataRaw);
            const hourlyData = normalized.data;
            const fetchedAt = normalized.fetchedAt;

            chartContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;

            // Store hourly data in card for lazy advice generation (store normalized data array)
            card.dataset.hourlyData = JSON.stringify(hourlyData);

            // Reset advice generated flag so it regenerates on next click
            const adviceSectionsEl = card.querySelector('.advice-sections');
            if (adviceSectionsEl) {
                delete adviceSectionsEl.dataset.generated;
                adviceSectionsEl.innerHTML = '<!-- Advice will be regenerated on click -->';
            }

            // Collapse advice section if expanded
            const adviceToggle = card.querySelector('.advice-toggle');
            const adviceWrapper = card.querySelector('.advice-sections-wrapper');
            if (adviceToggle && !adviceToggle.classList.contains('collapsed')) {
                adviceToggle.classList.add('collapsed');
                adviceWrapper.classList.remove('expanded');
            }

            // Update temperature header with feels-like range
            const tempFeels = hourlyData.map(d => d.temperature_feel);
            const tempFeelMin = Math.min(...tempFeels);
            const tempFeelMax = Math.max(...tempFeels);
            const tempHeader = card.querySelector('.temp-header');
            if (tempHeader) {
                tempHeader.innerHTML = `<h3>Temperature (feels like): ${tempFeelMin.toFixed(0)}°C to ${tempFeelMax.toFixed(0)}°C</h3><div class="weather-badges"><span class="snow-accumulation"></span><span class="fog-warning"></span></div>`;
            }

            // Update snow accumulation in header
            const { totalSnowCm } = calculateSnowInfo(hourlyData);
            const snowEl = card.querySelector('.snow-accumulation');
            if (snowEl) {
                const snowFormatted = formatSnowAmount(totalSnowCm);
                snowEl.innerHTML = snowFormatted
                    ? `<span class="snow-badge">❄ ${snowFormatted}cm snow</span>`
                    : '';
            }

            // Update fog warning in header (simple indicator with total hours, details in cloud chart)
            const fogInfo = calculateFogInfo(hourlyData);
            const fogEl = card.querySelector('.fog-warning');
            if (fogEl) {
                const fogHoursCount = fogInfo.fogHours.length;
                fogEl.innerHTML = fogInfo.hasFog
                    ? `<span class="fog-badge">${fogInfo.hasRimeFog ? '🧊 ' + translations[currentLanguage].rimeFog : '🌫️ ' + translations[currentLanguage].fog} ${fogHoursCount}h</span>`
                    : '';
            }

            // Wait for canvas to be ready
            requestAnimationFrame(() => {
                createWeatherChart(canvasId, hourlyData, fetchedAt);
                initChartToggles(canvasId);
                createCloudChart(`${canvasId}-clouds`, hourlyData);
            });

            // Load and update 7-day history chart
            const historyFilename = `${baseFilename}_7day_history.json`;
            try {
                const historyResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${newDate}/${historyFilename}`));
                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    createHistoryChart(`${canvasId}-history`, historyData);
                }
            } catch (historyError) {
                console.warn(`Could not load history:`, historyError);
            }
        } else {
            chartContainer.innerHTML = `<div class="chart-error">${translations[currentLanguage].chartNotAvailable}</div>`;
        }

    } catch (error) {
        console.error(`Error updating card ${cardId}:`, error);
        chartContainer.innerHTML = originalChartHtml;
    }
}

// Generate array of dates from past 6 days to future 3 days
function getDateRange() {
    const dates = [];
    for (let offset = -6; offset <= 5; offset++) {
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

// Setup sticky navigation behavior
function initStickyNav() {
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
                // Don't set spacer height if collapsed
                if (!stickyNav.classList.contains('collapsed')) {
                    spacer.style.height = navHeight + 'px';
                }
            }
        } else {
            if (stickyNav.classList.contains('sticky')) {
                stickyNav.classList.remove('sticky');
                stickyNav.classList.remove('collapsed'); // Reset collapsed state when not sticky
                spacer.style.height = '0';
                // Reset toggle button text
                const toggleText = document.querySelector('.sticky-nav-toggle .toggle-text');
                if (toggleText) toggleText.textContent = 'Hide';
            }
        }
    });

    window.addEventListener('resize', updateStickyThreshold);
}

// Toggle sticky nav collapsed/expanded state
function toggleStickyNav() {
    const stickyNav = document.getElementById('sticky-nav');
    const toggleBtn = document.getElementById('sticky-nav-toggle');

    if (!stickyNav || !toggleBtn) return;

    const isCollapsed = stickyNav.classList.toggle('collapsed');

    // Update button text and icon
    const toggleText = toggleBtn.querySelector('.toggle-text');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');

    if (toggleText) {
        toggleText.textContent = isCollapsed ? 'Show' : 'Hide';
    }

    // Update spacer height when collapsed
    const spacer = document.querySelector('.sticky-nav-spacer');
    if (spacer && stickyNav.classList.contains('sticky')) {
        spacer.style.height = isCollapsed ? '0' : stickyNav.querySelector('.sticky-nav-content').offsetHeight + 'px';
    }

    // Track event
    trackEvent('sticky_nav_toggle', { action: isCollapsed ? 'collapse' : 'expand' });
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
        const windDataset = chart.data.datasets[2]; // Wind Speed dataset (index 2)
        const meta = chart.getDatasetMeta(2);

        // Don't draw if wind dataset is hidden or missing (check both dataset.hidden and meta.hidden)
        if (!meta || !windDataset || !windDataset.windDirections) return;
        if (windDataset.hidden || meta.hidden) return;

        const windDirections = windDataset.windDirections;
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

// Snow weather codes from Open-Meteo
const SNOW_WEATHER_CODES = [71, 73, 75, 77, 85, 86]; // Snow fall, snow grains, snow showers

// Format snow amount for display
// Returns null if too small to show, otherwise formatted string
function formatSnowAmount(cm) {
    if (cm < 0.1) return null; // Don't show if less than 0.1cm
    if (cm < 1) return cm.toFixed(1); // Show decimal for small amounts (e.g., "0.3")
    return cm.toFixed(0); // Show integer for larger amounts (e.g., "5")
}

// Calculate snow accumulation from hourly data
// Returns { totalSnowCm: number, isSnowByHour: boolean[] }
function calculateSnowInfo(hourlyData) {
    let totalPrecipMm = 0;
    const isSnowByHour = hourlyData.map(d => {
        // Consider it snow if:
        // 1. Weather code indicates snow, OR
        // 2. Temperature is below 2°C and there's precipitation
        const isSnow = SNOW_WEATHER_CODES.includes(d.weather_code) ||
                       (d.temperature < 2 && d.precipitation > 0);

        if (isSnow && d.precipitation > 0) {
            totalPrecipMm += d.precipitation;
        }
        return isSnow;
    });

    // Convert mm precipitation to cm snow (typical ratio 1mm water = 1cm snow)
    const totalSnowCm = totalPrecipMm;

    return { totalSnowCm, isSnowByHour };
}

// Fog weather codes (WMO codes 45 = fog, 48 = depositing rime fog / freezing fog)
const FOG_WEATHER_CODES = [45, 48];

// Calculate fog info from hourly data
// Returns { hasFog: boolean, hasRimeFog: boolean, fogHours: number[], fogStartHour: number|null, fogEndHour: number|null }
function calculateFogInfo(hourlyData) {
    const fogHours = [];
    let hasRimeFog = false;

    hourlyData.forEach(d => {
        if (FOG_WEATHER_CODES.includes(d.weather_code)) {
            fogHours.push(d.hour);
            if (d.weather_code === 48) {
                hasRimeFog = true; // Depositing rime fog (freezing fog) - more dangerous
            }
        }
    });

    const hasFog = fogHours.length > 0;
    const fogStartHour = hasFog ? Math.min(...fogHours) : null;
    const fogEndHour = hasFog ? Math.max(...fogHours) : null;

    return { hasFog, hasRimeFog, fogHours, fogStartHour, fogEndHour };
}

// Format fog warning text
function formatFogWarning(fogInfo, lang = currentLanguage) {
    if (!fogInfo.hasFog) return null;

    const { hasRimeFog, fogHours, fogStartHour, fogEndHour } = fogInfo;
    const fogType = hasRimeFog ? translations[lang].rimeFog : translations[lang].fog;

    if (fogHours.length === 1) {
        return `${fogType} ${String(fogStartHour).padStart(2, '0')}:00`;
    } else if (fogHours.length <= 3) {
        return `${fogType} ${fogHours.map(h => String(h).padStart(2, '0') + ':00').join(', ')}`;
    } else {
        return `${fogType} ${String(fogStartHour).padStart(2, '0')}:00-${String(fogEndHour).padStart(2, '0')}:00`;
    }
}

// Chart.js plugin to draw snowflakes on snow precipitation bars
const snowflakePlugin = {
    id: 'snowflakePlugin',
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        const precipDatasetIndex = chart.data.datasets.findIndex(ds => ds.label && ds.label.includes('Precipitation'));
        if (precipDatasetIndex === -1) return;

        const precipDataset = chart.data.datasets[precipDatasetIndex];
        const meta = chart.getDatasetMeta(precipDatasetIndex);

        // Don't draw if precipitation dataset is hidden (check both dataset.hidden and meta.hidden)
        if (!precipDataset || !precipDataset.isSnowByHour) return;
        if (precipDataset.hidden || meta.hidden) return;

        ctx.save();
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        meta.data.forEach((bar, index) => {
            const value = precipDataset.data[index];
            const isSnow = precipDataset.isSnowByHour[index];

            if (value > 0 && isSnow) {
                // Draw snowflake above the bar
                const x = bar.x;
                const y = bar.y - 5;
                ctx.fillText('❄', x, y);
            }
        });

        ctx.restore();
    }
};

// Chart.js plugin to draw wind direction arrows on history chart (7-day)
const historyWindDirectionPlugin = {
    id: 'historyWindDirectionPlugin',
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        const windDatasetIndex = chart.data.datasets.findIndex(ds => ds.windDirections);
        if (windDatasetIndex === -1) return;

        const windDataset = chart.data.datasets[windDatasetIndex];
        const meta = chart.getDatasetMeta(windDatasetIndex);

        // Don't draw if wind dataset is hidden (check both dataset.hidden and meta.hidden)
        if (!windDataset || !windDataset.windDirections) return;
        if (windDataset.hidden || meta.hidden) return;

        ctx.save();
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        meta.data.forEach((point, index) => {
            const direction = windDataset.windDirections[index];
            if (direction === null || direction === undefined) return;

            const x = point.x;
            const y = point.y - 15;

            // Draw arrow showing where wind is blowing TO (add 180 to direction)
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(((direction + 180) * Math.PI) / 180);

            // Draw arrow pointing in direction wind is blowing
            ctx.beginPath();
            ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
            ctx.moveTo(0, -6);
            ctx.lineTo(-4, 4);
            ctx.lineTo(0, 2);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();
    }
};

// Chart.js plugin to draw snowflakes on history chart (7-day)
const historySnowflakePlugin = {
    id: 'historySnowflakePlugin',
    afterDatasetsDraw(chart, args, options) {
        const { ctx } = chart;
        const precipDatasetIndex = chart.data.datasets.findIndex(ds => ds.hasSnowByDay);
        if (precipDatasetIndex === -1) return;

        const precipDataset = chart.data.datasets[precipDatasetIndex];
        const meta = chart.getDatasetMeta(precipDatasetIndex);

        // Don't draw if precip dataset is hidden (check both dataset.hidden and meta.hidden)
        if (!precipDataset || !precipDataset.hasSnowByDay) return;
        if (precipDataset.hidden || meta.hidden) return;

        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#a8d5e5';

        meta.data.forEach((bar, index) => {
            const hasSnow = precipDataset.hasSnowByDay[index];
            const value = precipDataset.data[index];

            if (value > 0 && hasSnow) {
                // Draw snowflake above the bar
                const x = bar.x;
                const y = bar.y - 5;
                ctx.fillText('❄', x, y);
            }
        });

        ctx.restore();
    }
};

// Chart.js plugin to draw rime fog indicator on history chart (7-day)
const historyRimeFogPlugin = {
    id: 'historyRimeFogPlugin',
    afterDraw(chart, args, options) {
        const { ctx } = chart;
        const cloudDatasetIndex = chart.data.datasets.findIndex(ds => ds.hasRimeFogByDay);
        if (cloudDatasetIndex === -1) return;

        const cloudDataset = chart.data.datasets[cloudDatasetIndex];

        // Always draw rime fog indicators (important safety info), regardless of cloud visibility
        if (!cloudDataset || !cloudDataset.hasRimeFogByDay) return;

        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Get the x-axis scale for positioning - draw below the x-axis labels
        const xScale = chart.scales.x;
        const chartBottom = chart.chartArea.bottom;

        chart.data.labels.forEach((label, index) => {
            const hasRimeFog = cloudDataset.hasRimeFogByDay[index];

            if (hasRimeFog) {
                // Draw rime fog indicator below x-axis labels
                const x = xScale.getPixelForValue(index);
                const y = chartBottom + 28; // Below the date labels
                ctx.fillText('🧊', x, y);
            }
        });

        ctx.restore();
    }
};

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Chart dataset configuration (wind toggle controls both wind speed and gusts)
const CHART_DATASETS = [
    { key: 'temp', label: 'Temp', color: 'rgb(239, 68, 68)', fullLabel: 'Temperature (C)' },
    { key: 'feel', label: 'Feels', color: 'rgb(251, 146, 60)', fullLabel: 'Feels Like (C)' },
    { key: 'wind', label: 'Wind', color: 'rgb(14, 165, 233)', fullLabel: 'Wind Speed & Gusts (km/h)' },
    { key: 'precip', label: 'Precip', color: 'rgb(59, 130, 246)', fullLabel: 'Precipitation (mm)' }
];

// Generate chart toggle buttons HTML
function createChartToggles(canvasId) {
    const mobile = isMobile();
    // On mobile, only "Feels Like" is on by default; on desktop all are on
    const defaultOn = mobile ? ['feel'] : ['temp', 'feel', 'wind', 'precip'];

    return CHART_DATASETS.map(ds => {
        const isChecked = defaultOn.includes(ds.key);
        return `
            <label class="chart-toggle ${isChecked ? 'active' : ''}" data-dataset="${ds.key}" data-canvas="${canvasId}">
                <span class="chart-toggle-dot" style="background: ${ds.color}"></span>
                <span class="chart-toggle-label">${ds.label}</span>
            </label>
        `;
    }).join('');
}

// Toggle chart dataset visibility
function toggleChartDataset(toggleEl) {
    const canvasId = toggleEl.dataset.canvas;
    const datasetKey = toggleEl.dataset.dataset;
    const chart = chartInstances[canvasId];

    if (!chart) return;

    toggleEl.classList.toggle('active');
    const isVisible = toggleEl.classList.contains('active');

    // Map key to dataset indices (wind controls both wind speed and gusts)
    const keyToIndices = { temp: [0], feel: [1], wind: [2, 3], precip: [4] };
    const indices = keyToIndices[datasetKey] || [];

    indices.forEach(index => {
        if (chart.data.datasets[index]) {
            chart.data.datasets[index].hidden = !isVisible;
        }
    });
    chart.update();
}

// Initialize chart toggles after chart is created
function initChartToggles(canvasId) {
    const container = document.querySelector(`[data-toggles-for="${canvasId}"]`);
    if (!container) return;

    const chart = chartInstances[canvasId];
    if (!chart) return;

    // Map key to dataset indices (wind controls both wind speed and gusts)
    const keyToIndices = { temp: [0], feel: [1], wind: [2, 3], precip: [4] };

    // Check if already initialized (has event listeners)
    if (!container.dataset.initialized) {
        const mobile = isMobile();
        const defaultOn = mobile ? ['feel'] : ['temp', 'feel', 'wind', 'precip'];

        // Set initial toggle states based on defaults
        container.querySelectorAll('.chart-toggle').forEach(toggle => {
            const key = toggle.dataset.dataset;
            if (defaultOn.includes(key)) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        });

        // Add click handlers (only once)
        container.querySelectorAll('.chart-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => toggleChartDataset(toggle));
        });

        container.dataset.initialized = 'true';
    }

    // Sync chart visibility with current toggle states
    container.querySelectorAll('.chart-toggle').forEach(toggle => {
        const key = toggle.dataset.dataset;
        const indices = keyToIndices[key] || [];
        const isActive = toggle.classList.contains('active');

        indices.forEach(index => {
            if (chart.data.datasets[index]) {
                chart.data.datasets[index].hidden = !isActive;
            }
        });
    });
    chart.update();
}

// Normalize hourly data - handles both old array format and new object format with fetched_at
function normalizeHourlyData(hourlyData) {
    // New format: { fetched_at: "...", forecast_date: "...", location: "...", data: [...] }
    if (hourlyData && typeof hourlyData === 'object' && !Array.isArray(hourlyData) && hourlyData.data) {
        return {
            data: hourlyData.data,
            fetchedAt: hourlyData.fetched_at || null,
            forecastDate: hourlyData.forecast_date || null,
            location: hourlyData.location || null
        };
    }
    // Old format: direct array
    return {
        data: hourlyData || [],
        fetchedAt: null,
        forecastDate: null,
        location: null
    };
}

// Format fetched_at timestamp for display
function formatFetchedAt(fetchedAt, lang = currentLanguage) {
    if (!fetchedAt) return null;
    try {
        const date = new Date(fetchedAt);
        const options = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        return date.toLocaleString(lang === 'ro' ? 'ro-RO' : lang === 'hu' ? 'hu-HU' : 'en-US', options);
    } catch (e) {
        return fetchedAt;
    }
}

// Create a weather chart
function createWeatherChart(canvasId, hourlyData, fetchedAt = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // If a chart instance already exists for this canvas, destroy it
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');

    // Normalize data (handle both old array and new object format)
    const normalized = normalizeHourlyData(hourlyData);
    const dataArray = normalized.data;
    const actualFetchedAt = fetchedAt || normalized.fetchedAt;

    // On mobile, filter to daytime hours (8am-6pm) for better usability
    let filteredData = dataArray;
    if (isMobile()) {
        filteredData = dataArray.filter(d => d.hour >= 8 && d.hour <= 18);
    }

    // Extract data
    const hours = filteredData.map(d => `${String(d.hour).padStart(2, '0')}:00`);
    const temperatures = filteredData.map(d => d.temperature);
    const temperaturesFeel = filteredData.map(d => d.temperature_feel);
    const precipitation = filteredData.map(d => d.precipitation);
    const windSpeed = filteredData.map(d => d.wind_speed);
    const windGust = filteredData.map(d => d.wind_gusts || d.wind_speed);
    const windDirections = filteredData.map(d => d.wind_direction || 0);

    // Calculate snow info for precipitation bars (use filtered data for chart)
    const { isSnowByHour } = calculateSnowInfo(filteredData);

    // Create background colors for precipitation bars (light blue for snow, blue for rain)
    const precipColors = isSnowByHour.map(isSnow =>
        isSnow ? 'rgba(173, 216, 230, 0.7)' : 'rgba(59, 130, 246, 0.5)'
    );

    const newChart = new Chart(ctx, {
        type: 'line',
        plugins: [windDirectionPlugin, snowflakePlugin],
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
                    backgroundColor: precipColors,
                    yAxisID: 'y2',
                    order: 1,
                    isSnowByHour: isSnowByHour, // Custom property for snowflake plugin
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
                subtitle: actualFetchedAt ? {
                    display: true,
                    text: `${translations[currentLanguage].lastUpdated}: ${formatFetchedAt(actualFetchedAt)}`,
                    color: 'rgb(148, 163, 184)',
                    font: {
                        size: 11,
                        style: 'italic'
                    },
                    padding: {
                        bottom: 10
                    }
                } : { display: false },
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
                    min: 0,
                    suggestedMax: 5, // Minimum 5mm scale so small amounts don't appear maxed out
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

// Create cloud cover chart with all 4 layers
function createCloudChart(canvasId, hourlyData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // If a chart instance already exists for this canvas, destroy it
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = canvas.getContext('2d');

    // Normalize data (handle both old array and new object format)
    const normalized = normalizeHourlyData(hourlyData);
    const dataArray = normalized.data;

    // On mobile, filter to daytime hours (8am-6pm) for better usability
    let filteredData = dataArray;
    if (isMobile()) {
        filteredData = dataArray.filter(d => d.hour >= 8 && d.hour <= 18);
    }

    // Extract cloud data
    const hours = filteredData.map(d => `${String(d.hour).padStart(2, '0')}:00`);
    const cloudTotal = filteredData.map(d => d.cloud_cover ?? null);
    const cloudLow = filteredData.map(d => d.cloud_cover_low ?? null);
    const cloudMid = filteredData.map(d => d.cloud_cover_mid ?? null);
    const cloudHigh = filteredData.map(d => d.cloud_cover_high ?? null);

    // Extract fog data (weather codes 45 = fog, 48 = rime fog)
    const fogData = filteredData.map(d => {
        const code = d.weather_code;
        if (code === 45) return 100; // Regular fog - show at 100%
        if (code === 48) return 100; // Rime fog - show at 100%
        return null;
    });
    const isRimeFogByHour = filteredData.map(d => d.weather_code === 48);
    const hasFog = fogData.some(v => v !== null);

    // Check if we have any cloud data
    const hasCloudData = cloudTotal.some(v => v !== null);
    if (!hasCloudData) {
        canvas.parentElement.innerHTML = '<div class="chart-error">Cloud data not available</div>';
        return null;
    }

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Total',
                    data: cloudTotal,
                    borderColor: 'rgb(107, 114, 128)',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                },
                {
                    label: 'Low (<3km)',
                    data: cloudLow,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.05)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
                {
                    label: 'Mid (3-8km)',
                    data: cloudMid,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
                {
                    label: 'High (>8km)',
                    data: cloudHigh,
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.05)',
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
                // Fog dataset - shown as bars at bottom
                ...(hasFog ? [{
                    label: 'Fog',
                    data: fogData,
                    type: 'bar',
                    backgroundColor: fogData.map((v, i) =>
                        isRimeFogByHour[i] ? 'rgba(100, 200, 255, 0.4)' : 'rgba(156, 163, 175, 0.3)'
                    ),
                    borderColor: fogData.map((v, i) =>
                        isRimeFogByHour[i] ? 'rgba(100, 200, 255, 0.8)' : 'rgba(156, 163, 175, 0.6)'
                    ),
                    borderWidth: 1,
                    barPercentage: 0.9,
                    categoryPercentage: 0.9,
                    order: 1,
                    isRimeFogByHour: isRimeFogByHour,
                }] : [])
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
                        padding: 10,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        boxWidth: 12,
                        boxHeight: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: 'rgb(248, 250, 252)',
                    bodyColor: 'rgb(203, 213, 225)',
                    borderColor: 'rgb(51, 65, 85)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const dataset = context.dataset;
                            let label = dataset.label || '';

                            // Special handling for fog dataset
                            if (label === 'Fog' && context.parsed.y !== null) {
                                const isRimeFog = dataset.isRimeFogByHour && dataset.isRimeFogByHour[context.dataIndex];
                                return isRimeFog ? '🧊 Rime Fog' : '🌫️ Fog';
                            }

                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(0) + '%';
                            } else {
                                label += 'N/A';
                            }
                            return label;
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
                            size: 10
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: '%',
                        color: 'rgb(156, 163, 175)',
                        font: {
                            size: 11,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                    },
                    ticks: {
                        color: 'rgb(156, 163, 175)',
                        font: {
                            size: 10
                        },
                        stepSize: 25
                    }
                }
            }
        }
    });

    chartInstances[canvasId] = newChart;
    return newChart;
}

// Create 7-day history chart showing daily aggregates
function createHistoryChart(canvasId, historyData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // If a chart instance already exists for this canvas, destroy it
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    // Check if we have valid data
    if (!historyData || !historyData.daily_data || historyData.daily_data.length === 0) {
        canvas.parentElement.innerHTML = '<div class="chart-error">No historical data available yet</div>';
        return null;
    }

    const ctx = canvas.getContext('2d');
    const dailyData = historyData.daily_data;
    const mobile = isMobile();

    // Format dates for labels (e.g., "Feb 10")
    const labels = dailyData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString(currentLanguage === 'ro' ? 'ro-RO' : currentLanguage === 'hu' ? 'hu-HU' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    });

    // Extract data arrays
    const tempMin = dailyData.map(d => d.temp_min);
    const tempMax = dailyData.map(d => d.temp_max);
    const precipTotal = dailyData.map(d => d.precip_total);
    const windAvg = dailyData.map(d => d.wind_avg);
    const gustMax = dailyData.map(d => d.gust_max);
    const cloudAvg = dailyData.map(d => d.cloud_avg);
    const windDirections = dailyData.map(d => d.wind_direction);
    const hasSnowByDay = dailyData.map(d => d.has_snow || false);
    const snowPrecipByDay = dailyData.map(d => d.snow_precip_mm || 0);
    const hasRimeFogByDay = dailyData.map(d => d.has_rime_fog || false);
    const fogHoursByDay = dailyData.map(d => d.fog_hours || 0);
    const rimeFogVsSnowByDay = dailyData.map(d => d.rime_fog_vs_snow || null);
    const rimeFogVsWindByDay = dailyData.map(d => d.rime_fog_vs_wind || null);

    // Create bar colors based on snow (light blue for snow, blue for rain)
    const precipColors = hasSnowByDay.map(isSnow =>
        isSnow ? 'rgba(173, 216, 230, 0.7)' : 'rgba(59, 130, 246, 0.6)'
    );

    const newChart = new Chart(ctx, {
        type: 'line',
        plugins: [historyWindDirectionPlugin, historySnowflakePlugin, historyRimeFogPlugin],
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temp Max',
                    data: tempMax,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                },
                {
                    label: 'Temp Min',
                    data: tempMin,
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    tension: 0.4,
                    fill: '-1',
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                },
                {
                    label: 'Precip',
                    data: precipTotal,
                    type: 'bar',
                    backgroundColor: precipColors,
                    yAxisID: 'y2',
                    order: 1,
                    hasSnowByDay: hasSnowByDay, // Custom property for snowflake plugin
                    snowPrecipByDay: snowPrecipByDay,
                },
                {
                    label: 'Wind Avg',
                    data: windAvg,
                    borderColor: 'rgb(14, 165, 233)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    hidden: mobile, // Hidden only on mobile
                    windDirections: windDirections, // Custom property for wind direction plugin
                },
                {
                    label: 'Gust Max',
                    data: gustMax,
                    borderColor: 'rgba(14, 165, 233, 0.5)',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 1.5,
                    borderDash: [3, 3],
                    hidden: mobile, // Hidden only on mobile
                },
                {
                    label: 'Cloud %',
                    data: cloudAvg,
                    borderColor: 'rgb(156, 163, 175)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y3',
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 1.5,
                    hidden: mobile, // Hidden only on mobile
                    hasRimeFogByDay: hasRimeFogByDay, // Custom property for rime fog plugin
                    fogHoursByDay: fogHoursByDay,
                    rimeFogVsSnowByDay: rimeFogVsSnowByDay,
                    rimeFogVsWindByDay: rimeFogVsWindByDay,
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
            layout: {
                padding: {
                    bottom: 22 // Space for rime fog indicators below x-axis
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'rgb(248, 250, 252)',
                        padding: 8,
                        font: {
                            size: 10,
                            weight: '500'
                        },
                        boxWidth: 10,
                        boxHeight: 10
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);

                        // Calculate new hidden state
                        const newHidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                        meta.hidden = newHidden;

                        // Link Wind Avg (index 3) and Gust Max (index 4) together
                        if (index === 3 || index === 4) {
                            const otherIndex = index === 3 ? 4 : 3;
                            const otherMeta = ci.getDatasetMeta(otherIndex);
                            otherMeta.hidden = newHidden;
                        }

                        ci.update();
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: 'rgb(248, 250, 252)',
                    bodyColor: 'rgb(203, 213, 225)',
                    borderColor: 'rgb(51, 65, 85)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (label.includes('Temp') || label.includes('Feel')) {
                                    label += context.parsed.y.toFixed(1) + '°C';
                                } else if (label.includes('Wind') || label.includes('Gust')) {
                                    label += context.parsed.y.toFixed(0) + ' km/h';
                                } else if (label.includes('Precip')) {
                                    const index = context.dataIndex;
                                    const hasSnow = context.dataset.hasSnowByDay && context.dataset.hasSnowByDay[index];
                                    if (hasSnow && context.parsed.y > 0) {
                                        // 1mm precipitation = 1cm snow - show only snow amount
                                        const snowCm = context.parsed.y;
                                        label += `❄ ~${formatSnowAmount(snowCm)}cm snow`;
                                    } else {
                                        label += context.parsed.y.toFixed(1) + ' mm';
                                    }
                                } else if (label.includes('Cloud')) {
                                    label += context.parsed.y.toFixed(0) + '%';
                                }
                            }
                            return label;
                        },
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            // Show wind direction for Wind Avg dataset
                            if (context.dataset.windDirections && context.dataIndex !== undefined) {
                                const direction = context.dataset.windDirections[index];
                                if (direction !== null && direction !== undefined) {
                                    const cardinalDir = getCardinalDirection(direction);
                                    return `Direction: from ${cardinalDir} (${direction}°)`;
                                }
                            }
                            return null;
                        },
                        footer: function(tooltipItems) {
                            if (!tooltipItems.length) return null;
                            const index = tooltipItems[0].dataIndex;
                            // Find the dataset with rime fog data
                            const cloudDataset = tooltipItems[0].chart.data.datasets.find(ds => ds.hasRimeFogByDay);
                            if (cloudDataset && cloudDataset.hasRimeFogByDay[index]) {
                                const fogHours = cloudDataset.fogHoursByDay ? cloudDataset.fogHoursByDay[index] : 0;
                                const snowTiming = cloudDataset.rimeFogVsSnowByDay ? cloudDataset.rimeFogVsSnowByDay[index] : null;
                                const windTiming = cloudDataset.rimeFogVsWindByDay ? cloudDataset.rimeFogVsWindByDay[index] : null;

                                // Build timing details
                                const timingParts = [];
                                if (snowTiming === 'before') {
                                    timingParts.push('before snow');
                                } else if (snowTiming === 'after') {
                                    timingParts.push('after snow');
                                } else if (snowTiming === 'during') {
                                    timingParts.push('during snow');
                                }
                                if (windTiming === 'before') {
                                    timingParts.push('before winds');
                                } else if (windTiming === 'after') {
                                    timingParts.push('after winds');
                                } else if (windTiming === 'during') {
                                    timingParts.push('during winds');
                                }

                                const timingText = timingParts.length > 0 ? ` - ${timingParts.join(', ')}` : '';
                                return `🧊 Rime fog (${fogHours}h${timingText})`;
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
                        font: { size: 10 }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '°C',
                        color: 'rgb(239, 68, 68)',
                        font: { size: 11, weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                    },
                    ticks: {
                        color: 'rgb(239, 68, 68)',
                        font: { size: 10 }
                    }
                },
                y1: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: 'rgb(14, 165, 233)',
                        font: { size: 10 }
                    }
                },
                y2: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    min: 0,
                    suggestedMax: 10,
                    grid: { drawOnChartArea: false },
                },
                y3: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: { drawOnChartArea: false },
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

    // Create unique card ID and store location data for date switching
    const safeName = location.name.replace(/ /g, '_').replace(/,/g, '').replace(/\(/g, '').replace(/\)/g, '').toLowerCase();
    const cardId = `card-${location.mountain_range.replace(/ /g, '_').toLowerCase()}_${safeName}`;
    card.id = cardId;
    card.dataset.location = JSON.stringify(location);
    card.dataset.currentDate = forecastDate;

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

    // Create unique filename using mountain range and location name (safeName already defined above)
    const baseFilename = `${location.mountain_range.replace(/ /g, '_').toLowerCase()}_${safeName}`;
    const hourlyDataFilename = `${baseFilename}_hourly_data_full_day.json`;
    const windAnalysisFilename = `${baseFilename}_wind_analysis.json`;

    // Generate unique canvas ID
    const canvasId = `chart-${baseFilename}`;

    // Load wind analysis data (cache-bust to get fresh data)
    let windAnalysisHtml = '';
    try {
        let windResponse;
        if (useLocalPath) {
            windResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${windAnalysisFilename}`));
        } else {
            windResponse = await fetch(cacheBust(`./${windAnalysisFilename}`));
            if (!windResponse.ok) {
                windResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${windAnalysisFilename}`));
            }
        }

        if (windResponse.ok) {
            const windData = await windResponse.json();
            windAnalysisHtml = createWindAnalysisHtml(windData);
        }
    } catch (error) {
        console.warn(`Could not load wind analysis for ${location.name}:`, error);
    }

    // Generate card-level date selector
    const cardDateSelectorHtml = createCardDateSelector(forecastDate, cardId);

    // Temperature header placeholder - will be populated when advice is generated
    const tempHeader = `<div class="temp-header"><h3>Loading temperature...</h3><div class="weather-badges"><span class="snow-accumulation" id="snow-${baseFilename}"></span><span class="fog-warning" id="fog-${baseFilename}"></span></div></div>`;

    card.innerHTML = `
        <div class="card-header">
            <h3>${location.name}</h3>
            <div class="location-meta">
                <div class="meta-item"><strong>${location.elevation}m</strong></div>
                <div class="meta-item">${location.latitude.toFixed(3)}N, ${location.longitude.toFixed(3)}E</div>
            </div>
            ${cardDateSelectorHtml}
        </div>
        <div class="card-body">
            ${tempHeader}
            <div class="chart-section">
                <div class="chart-header" data-i18n="weatherForecast">${translations[currentLanguage].weatherForecast}</div>
                <div class="chart-toggles" data-toggles-for="${canvasId}">
                    ${createChartToggles(canvasId)}
                </div>
                <div class="chart-container">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
            <div class="chart-section cloud-chart-section">
                <div class="chart-header" data-i18n="cloudCover">${translations[currentLanguage].cloudCover}</div>
                <div class="chart-container chart-container-small">
                    <canvas id="${canvasId}-clouds"></canvas>
                </div>
            </div>
            <div class="chart-section history-chart-section">
                <div class="chart-header" data-i18n="weekHistory">${translations[currentLanguage].weekHistory || '7-Day History'}</div>
                <div class="chart-container chart-container-medium">
                    <canvas id="${canvasId}-history"></canvas>
                </div>
            </div>
            ${windAnalysisHtml}
            <div class="advice-sections-container">
                <button class="advice-toggle collapsed" onclick="toggleAdvice(this)" data-i18n="equipmentClothing">
                    ${translations[currentLanguage].equipmentClothing}
                </button>
                <div class="advice-sections-wrapper">
                    <div class="advice-sections">
                        <!-- Advice will be generated on click -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load hourly data and create chart (wait for canvas to be in DOM)
    const loadChartWhenReady = async (retries = 10) => {
        const canvas = document.getElementById(canvasId);

        // Wait for canvas to be in the DOM
        if (!canvas || !canvas.isConnected) {
            if (retries > 0) {
                requestAnimationFrame(() => loadChartWhenReady(retries - 1));
            }
            return;
        }

        try {
            let response;

            // Use local path with date directory or S3 (cache-bust to get fresh data)
            if (useLocalPath) {
                response = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`));
            } else {
                // Try S3 first (only works for current/latest forecast)
                response = await fetch(cacheBust(`./${hourlyDataFilename}`));

                // If S3 fails, try local path
                if (!response.ok) {
                    console.log(`S3 not found, trying local: ../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`);
                    response = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${hourlyDataFilename}`));
                }
            }

            if (response.ok) {
                const hourlyDataRaw = await response.json();
                const normalized = normalizeHourlyData(hourlyDataRaw);
                const hourlyData = normalized.data;
                const fetchedAt = normalized.fetchedAt;

                console.log(`Loaded hourly data for ${location.name}, ${hourlyData.length} data points`);
                createWeatherChart(canvasId, hourlyData, fetchedAt);
                initChartToggles(canvasId);
                createCloudChart(`${canvasId}-clouds`, hourlyData);

                // Load and create 7-day history chart
                const historyFilename = `${baseFilename}_7day_history.json`;
                try {
                    let historyResponse;
                    if (useLocalPath) {
                        historyResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${historyFilename}`));
                    } else {
                        historyResponse = await fetch(cacheBust(`./${historyFilename}`));
                        if (!historyResponse.ok) {
                            historyResponse = await fetch(cacheBust(`../tomorrow_mountain_forecast_data/date=${forecastDate}/${historyFilename}`));
                        }
                    }
                    if (historyResponse.ok) {
                        const historyData = await historyResponse.json();
                        createHistoryChart(`${canvasId}-history`, historyData);
                    }
                } catch (historyError) {
                    console.warn(`Could not load history for ${location.name}:`, historyError);
                }

                // Store hourly data in card for lazy advice generation (store normalized data array)
                card.dataset.hourlyData = JSON.stringify(hourlyData);

                // Update temperature header with feels-like range
                const tempFeels = hourlyData.map(d => d.temperature_feel);
                const tempFeelMin = Math.min(...tempFeels);
                const tempFeelMax = Math.max(...tempFeels);
                const tempHeaderEl = card.querySelector('.temp-header h3');
                if (tempHeaderEl) {
                    tempHeaderEl.textContent = `Temperature (feels like): ${tempFeelMin.toFixed(0)}°C to ${tempFeelMax.toFixed(0)}°C`;
                }

                // Update snow accumulation in header
                const { totalSnowCm } = calculateSnowInfo(hourlyData);
                const snowEl = document.getElementById(`snow-${baseFilename}`);
                if (snowEl) {
                    const snowFormatted = formatSnowAmount(totalSnowCm);
                    snowEl.innerHTML = snowFormatted
                        ? `<span class="snow-badge">❄ ${snowFormatted}cm snow</span>`
                        : '';
                }

                // Update fog warning in header (simple indicator with total hours, details in cloud chart)
                const fogInfo = calculateFogInfo(hourlyData);
                const fogEl = document.getElementById(`fog-${baseFilename}`);
                if (fogEl) {
                    const fogHoursCount = fogInfo.fogHours.length;
                    fogEl.innerHTML = fogInfo.hasFog
                        ? `<span class="fog-badge">${fogInfo.hasRimeFog ? '🧊 ' + translations[currentLanguage].rimeFog : '🌫️ ' + translations[currentLanguage].fog} ${fogHoursCount}h</span>`
                        : '';
                }

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
            const container = document.querySelector(`#${canvasId}`)?.parentElement;
            if (container) {
                container.innerHTML = `<div class="chart-error">${translations[currentLanguage].chartNotAvailable}</div>`;
            }

            // Track chart load failure
            trackEvent('chart_load_failed', {
                location_name: location.name,
                mountain_range: location.mountain_range,
                error: error.message
            });
        }
    };

    requestAnimationFrame(() => loadChartWhenReady());

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
            // Try S3 first (cache-bust to get fresh metadata)
            let metadataResponse = await fetch(cacheBust('./forecast_metadata.json'));

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

        // Create range filter buttons
        createRangeFilters(Object.keys(groupedLocations));

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
        const stickyNav = document.getElementById('sticky-nav');
        const offset = stickyNav && stickyNav.classList.contains('sticky') ? stickyNav.offsetHeight + 20 : 20;
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

// Track active range filters
let activeRangeFilters = new Set();

// Merge similar range names into groups
const RANGE_GROUPS = {
    'retezat': ['muntii retezat', 'muntii retezat-godeanu']
};

// Get the filter key for a range name (handles merging)
function getRangeFilterKey(rangeName) {
    const lowerName = rangeName.toLowerCase();
    for (const [groupKey, members] of Object.entries(RANGE_GROUPS)) {
        if (members.includes(lowerName)) {
            return groupKey;
        }
    }
    // Default: use shortened name as key
    return lowerName.replace(/^muntii\s+/i, '').replace(/-.*$/, '');
}

// Create range filter buttons
function createRangeFilters(rangeNames) {
    const container = document.getElementById('range-filters');
    if (!container) return;

    // Clear active filters when recreating buttons
    activeRangeFilters.clear();
    container.innerHTML = '';

    // Group ranges and create unique filter buttons
    const filterButtons = new Map(); // filterKey -> [rangeNames]

    rangeNames.forEach(rangeName => {
        const filterKey = getRangeFilterKey(rangeName);
        if (!filterButtons.has(filterKey)) {
            filterButtons.set(filterKey, []);
        }
        filterButtons.get(filterKey).push(rangeName.toLowerCase());
    });

    filterButtons.forEach((ranges, filterKey) => {
        const btn = document.createElement('button');
        btn.className = 'range-filter-btn';
        // Capitalize first letter
        btn.textContent = filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
        btn.dataset.ranges = JSON.stringify(ranges);
        btn.onclick = () => toggleRangeFilter(btn, ranges);
        container.appendChild(btn);
    });
}

// Toggle range filter
function toggleRangeFilter(btn, ranges) {
    btn.classList.toggle('active');
    const isActive = btn.classList.contains('active');

    ranges.forEach(rangeName => {
        if (isActive) {
            activeRangeFilters.add(rangeName);
        } else {
            activeRangeFilters.delete(rangeName);
        }
    });

    // Track filter toggle
    trackEvent('range_filter_toggle', {
        ranges: ranges.join(', '),
        action: isActive ? 'activated' : 'deactivated',
        active_filters_count: activeRangeFilters.size
    });

    // Re-apply filters
    applyFilters();
}

// Apply combined search text and range filters
function applyFilters() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('locations-container');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const sections = container.querySelectorAll('.mountain-range-section');
    let visibleCount = 0;

    sections.forEach(section => {
        const rangeHeader = section.querySelector('.range-header h2');
        const rangeName = rangeHeader.textContent.toLowerCase();
        const cards = section.querySelectorAll('.location-card');
        let visibleCardsInSection = 0;

        // Check if range filter applies
        const rangeFilterActive = activeRangeFilters.size > 0;
        const rangeMatches = !rangeFilterActive || activeRangeFilters.has(rangeName);

        cards.forEach(card => {
            const locationName = card.querySelector('.card-header h3').textContent.toLowerCase();

            // Text search matches
            const textMatches = searchTerm === '' ||
                              rangeName.includes(searchTerm) ||
                              locationName.includes(searchTerm);

            // Combined filter: must match both range filter (if active) AND text search
            const matches = rangeMatches && textMatches;

            if (matches) {
                card.style.display = '';
                visibleCardsInSection++;
                visibleCount++;
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

    // Show "no results" message if nothing matches
    let noResultsMsg = container.querySelector('.no-results');
    if (visibleCount === 0 && (searchTerm !== '' || activeRangeFilters.size > 0)) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results';
            container.appendChild(noResultsMsg);
        }
        const filterInfo = activeRangeFilters.size > 0
            ? `filters: ${[...activeRangeFilters].join(', ')}${searchTerm ? ` + "${searchTerm}"` : ''}`
            : `"${searchTerm}"`;
        noResultsMsg.innerHTML = `
            <div>No locations found matching ${filterInfo}</div>
            <div style="margin-top: 10px; font-size: 0.9em;">Try adjusting your filters or search term</div>
        `;
        noResultsMsg.style.display = '';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Setup search/filter functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        applyFilters();

        const searchTerm = e.target.value.toLowerCase().trim();

        // Track search with debounce
        if (searchTerm !== '') {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                trackEvent('search', {
                    search_term: searchTerm,
                    active_filters: [...activeRangeFilters].join(', ')
                });
            }, 1000);
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
    const card = button.closest('.location-card');
    const adviceSections = wrapper.querySelector('.advice-sections');
    const location = card.dataset.location ? JSON.parse(card.dataset.location) : {};

    button.classList.toggle('collapsed');
    wrapper.classList.toggle('expanded');

    const isExpanded = wrapper.classList.contains('expanded');

    // Track equipment/clothing section toggle
    trackEvent('equipment_clothing_toggle', {
        location_name: location.name || 'unknown',
        mountain_range: location.mountain_range || 'unknown',
        action: isExpanded ? 'opened' : 'closed'
    });

    // Generate advice on first expand (lazy loading)
    if (isExpanded && adviceSections && !adviceSections.dataset.generated) {
        // Show loading state
        adviceSections.innerHTML = `
            <div class="advice-loading">
                <div class="advice-loading-spinner"></div>
                <div class="advice-loading-text">Analyzing weather conditions...</div>
                <div class="advice-loading-bar"><div class="advice-loading-progress"></div></div>
            </div>
        `;

        // Get hourly data from card dataset
        const hourlyDataStr = card.dataset.hourlyData;
        if (hourlyDataStr) {
            // Small delay to show the loading animation
            setTimeout(() => {
                try {
                    const hourlyData = JSON.parse(hourlyDataStr);
                    const { sections, tempHeader } = generateClothingAdvice(hourlyData);

                    // Update temp header if exists
                    const tempHeaderEl = card.querySelector('.temp-header h3');
                    if (tempHeaderEl && tempHeader) {
                        // Keep the snow badge, update temperature text
                        const snowBadge = card.querySelector('.snow-accumulation');
                        const snowHtml = snowBadge ? snowBadge.outerHTML : '<span class="snow-accumulation"></span>';
                        tempHeaderEl.parentElement.innerHTML = `<h3>${tempHeader}</h3>${snowHtml}`;
                    }

                    // Render advice sections
                    const sectionsHtml = sections.map(s => renderAdviceSection(s)).join('');
                    const duplicatedHtml = sectionsHtml + sectionsHtml; // For infinite scroll effect
                    adviceSections.innerHTML = duplicatedHtml;
                    adviceSections.dataset.generated = 'true';

                    // Enable drag scroll
                    enableDragScroll(adviceSections);
                    updateScrollIndicator(adviceSections, wrapper);
                    adviceSections.addEventListener('scroll', () => updateScrollIndicator(adviceSections, wrapper));
                } catch (error) {
                    console.error('Error generating advice:', error);
                    adviceSections.innerHTML = '<div class="advice-error">Could not generate recommendations</div>';
                }
            }, 300);
        } else {
            adviceSections.innerHTML = '<div class="advice-error">Weather data not available</div>';
        }
    } else if (wrapper.classList.contains('expanded') && adviceSections) {
        // Already generated, just update scroll indicators
        updateScrollIndicator(adviceSections, wrapper);
        adviceSections.addEventListener('scroll', () => updateScrollIndicator(adviceSections, wrapper));
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

    // Setup sticky navigation
    initStickyNav();

    // Auto-select tomorrow if available, otherwise today
    const tomorrow = getTomorrowDate();
    selectedForecastDate = tomorrow;
    selectDate(tomorrow);
});
