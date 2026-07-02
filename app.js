// ============================================================
// 1. MOCK DATA (имитация базы данных)
// ============================================================
const DB = {
    stats: {
        pressure: '2.4 атм',
        temperature: '22°C',
        consumption: '184 м³',
        valvesCount: 4
    },
    valves: [
        { id: 1, name: 'Кухонная плита', status: 'open' },
        { id: 2, name: 'Отопление (котёл)', status: 'open' },
        { id: 3, name: 'Газовая колонка', status: 'closed' },
        { id: 4, name: 'Уличный гриль', status: 'closed' }
    ],
    history: [
        { id: 1, date: '2026-06-30 14:20', amount: '12.4 м³', action: 'Открыт клапан "Кухня"' },
        { id: 2, date: '2026-06-30 11:05', amount: '8.1 м³', action: 'Закрыт клапан "Отопление"' },
        { id: 3, date: '2026-06-29 22:15', amount: '5.7 м³', action: 'Открыт клапан "Колонка"' },
        { id: 4, date: '2026-06-29 18:40', amount: '3.2 м³', action: 'Закрыт клапан "Гриль"' },
        { id: 5, date: '2026-06-29 12:00', amount: '9.0 м³', action: 'Автоматическая проверка' }
    ]
};

// ============================================================
// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ============================================================
let currentPage = 'dashboard';
let appData = {
    stats: { ...DB.stats },
    valves: DB.valves.map(v => ({ ...v })),
    history: [...DB.history]
};

// ============================================================
// 3. РЕНДЕРИНГ СТРАНИЦ
// ============================================================
function renderDashboard() {
    const s = appData.stats;
    const openValves = appData.valves.filter(v => v.status === 'open').length;
    const totalValves = appData.valves.length;

    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label"><i class="fas fa-arrow-up"></i> Давление</div>
                <div class="value">${s.pressure}</div>
                <div class="change">стабильно</div>
            </div>
            <div class="stat-card">
                <div class="label"><i class="fas fa-thermometer-half"></i> Температура</div>
                <div class="value">${s.temperature}</div>
                <div class="change">норма</div>
            </div>
            <div class="stat-card">
                <div class="label"><i class="fas fa-gas-pump"></i> Расход (сегодня)</div>
                <div class="value">${s.consumption}</div>
                <div class="change">+5% к вчера</div>
            </div>
            <div class="stat-card">
                <div class="label"><i class="fas fa-shield-alt"></i> Клапаны</div>
                <div class="value">${openValves}/${totalValves}</div>
                <div class="change">${openValves} открыто</div>
            </div>
        </div>
        <div class="chart-placeholder">
            <i class="fas fa-chart-area" style="font-size: 40px; margin-right: 16px;"></i> 
            График расхода газа за последние 7 дней
        </div>
    `;
}

function renderValves() {
    return `
        <div class="valves-grid">
            ${appData.valves.map(v => `
                <div class="valve-card" data-id="${v.id}">
                    <div class="valve-header">
                        <span>${v.name}</span>
                        <span class="valve-status">
                            <span class="dot ${v.status}"></span>
                            ${v.status === 'open' ? 'Открыт' : 'Закрыт'}
                        </span>
                    </div>
                    <div class="valve-controls">
                        <button class="btn-toggle ${v.status === 'open' ? 'open' : 'closed'}" 
                                data-action="toggle" data-id="${v.id}">
                            ${v.status === 'open' ? 'Закрыть' : 'Открыть'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderHistory() {
    return `
        <div class="history-list">
            ${appData.history.map(item => `
                <div class="history-item">
                    <div>
                        <strong>${item.action}</strong>
                        <div class="date"><i class="far fa-clock"></i> ${item.date}</div>
                    </div>
                    <span class="amount">${item.amount}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================
// 4. УПРАВЛЕНИЕ СТРАНИЦАМИ
// ============================================================
const pageRenderers = {
    dashboard: renderDashboard,
    valves: renderValves,
    history: renderHistory
};

const pageTitles = {
    dashboard: 'Обзор системы',
    valves: 'Управление клапанами',
    history: 'История расходов'
};

function navigateTo(page) {
    currentPage = page;
    
    // Обновляем активный пункт меню
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Обновляем заголовок
    document.getElementById('page-title').textContent = pageTitles[page];

    // Рендерим контент
    const container = document.getElementById('page-content');
    container.innerHTML = pageRenderers[page]();

    // Навешиваем события (если есть интерактив)
    attachPageEvents(page);
}

// ============================================================
// 5. ОБРАБОТЧИКИ СОБЫТИЙ (клики на клапанах и т.д.)
// ============================================================
function attachPageEvents(page) {
    if (page === 'valves') {
        document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const id = parseInt(this.dataset.id);
                const valve = appData.valves.find(v => v.id === id);
                if (!valve) return;

                // Переключаем статус
                const newStatus = valve.status === 'open' ? 'closed' : 'open';
                valve.status = newStatus;

                // Добавляем запись в историю
                const actionText = newStatus === 'open' 
                    ? `Открыт клапан "${valve.name}"` 
                    : `Закрыт клапан "${valve.name}"`;
                appData.history.unshift({
                    id: Date.now(),
                    date: new Date().toLocaleString('ru-RU', { hour12: false }),
                    amount: '—',
                    action: actionText
                });

                // Обновляем статистику (расход меняем случайно для демо)
                const currentConsumption = parseFloat(appData.stats.consumption) || 180;
                const delta = (Math.random() * 4 - 2).toFixed(1);
                appData.stats.consumption = (currentConsumption + parseFloat(delta)).toFixed(1) + ' м³';

                // Перерендериваем только страницу клапанов (без полной перезагрузки)
                // Но проще — обновить всю страницу, чтобы статистика тоже обновилась
                navigateTo('valves');
            });
        });
    }
}

// ============================================================
// 6. ОБНОВЛЕНИЕ ДАННЫХ (кнопка Refresh)
// ============================================================
function refreshData() {
    // Имитация обновления с сервера
    const pressureVal = (2.0 + Math.random() * 1.0).toFixed(1);
    appData.stats.pressure = pressureVal + ' атм';
    appData.stats.temperature = (18 + Math.floor(Math.random() * 10)) + '°C';
    
    // Добавляем системное событие в историю
    appData.history.unshift({
        id: Date.now(),
        date: new Date().toLocaleString('ru-RU', { hour12: false }),
        amount: '—',
        action: '🔄 Обновление показаний датчиков'
    });

    // Перерендериваем текущую страницу
    navigateTo(currentPage);
}

// ============================================================
// 7. ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Навигация по меню
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', function() {
            navigateTo(this.dataset.page);
        });
    });

    // Кнопка обновления
    document.getElementById('refreshBtn').addEventListener('click', refreshData);

    // Стартовая страница
    navigateTo('dashboard');
});

// ============================================================
// 8. АВТООБНОВЛЕНИЕ (опционально, каждые 30 секунд)
// ============================================================
setInterval(() => {
    // Только если страница активна, не перегружаем интерфейс
    if (document.visibilityState === 'visible') {
        refreshData();
    }
}, 30000);