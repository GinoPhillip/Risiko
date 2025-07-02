// === Input synchronisation helpers ===
function linkSlider(slider, numberInput) {
    slider.addEventListener('input', () => {
        numberInput.value = slider.value;
    });
    numberInput.addEventListener('input', () => {
        const v = parseInt(numberInput.value, 10);
        if (!isNaN(v)) slider.value = Math.min(v, slider.max);
    });
}

const attackerSlider = document.getElementById('attackerSlider');
const attackerNumber = document.getElementById('attackerNumber');
const defenderSlider = document.getElementById('defenderSlider');
const defenderNumber = document.getElementById('defenderNumber');
const simulationsInput = document.getElementById('simulations');
const calculateBtn = document.getElementById('calculateBtn');
const resultsDiv = document.getElementById('results');

linkSlider(attackerSlider, attackerNumber);
linkSlider(defenderSlider, defenderNumber);

// === Chart setup ===
let lossChart = new Chart(document.getElementById('lossChart').getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Attacker avg. losses',
                data: [],
                borderWidth: 2,
                tension: 0.2,
                pointRadius: 0,
                borderColor: '#ff5252'
            },
            {
                label: 'Defender avg. losses',
                data: [],
                borderWidth: 2,
                tension: 0.2,
                pointRadius: 0,
                borderColor: '#448aff'
            }
        ]
    },
    options: {
        plugins: {
            legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--fg') } }
        },
        scales: {
            x: {
                display: false // Hide x-axis per user request
            },
            y: {
                ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--fg') },
                grid: { color: 'rgba(255,255,255,0.1)' },
                title: { display: true, text: 'Average losses', color: getComputedStyle(document.documentElement).getPropertyValue('--fg') }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    }
});

// === Simulation ===
function rollDie() { return Math.floor(Math.random() * 6) + 1; }

// Accumulate total losses per roll across all simulations
function simulateBattles(initialAtt, initialDef, sims = 10000) {
    let attackerWins = 0;
    let totalAttRem = 0, totalDefRem = 0;

    let attLossesPerRoll = [];
    let defLossesPerRoll = [];

    for (let s = 0; s < sims; s++) {
        let attackers = initialAtt;
        let defenders = initialDef;
        let rollIndex = 0;

        while (attackers > 0 && defenders > 0) {
            const attackerDice = Math.min(3, attackers);
            const defenderDice = Math.min(2, defenders);

            const attackerRolls = Array.from({ length: attackerDice }, rollDie).sort((a, b) => b - a);
            const defenderRolls = Array.from({ length: defenderDice }, rollDie).sort((a, b) => b - a);

            const confrontations = Math.min(attackerDice, defenderDice);
            for (let i = 0; i < confrontations; i++) {
                // Ensure arrays have space
                if (attLossesPerRoll.length <= rollIndex) {
                    attLossesPerRoll.push(0);
                    defLossesPerRoll.push(0);
                }

                if (attackerRolls[i] > defenderRolls[i]) {
                    defenders--;
                    defLossesPerRoll[rollIndex] += 1;
                } else {
                    attackers--;
                    attLossesPerRoll[rollIndex] += 1;
                }
                rollIndex++;
                if (attackers === 0 || defenders === 0) break;
            }
        }

        if (defenders === 0) {
            attackerWins++;
            totalAttRem += attackers;
        } else {
            totalDefRem += defenders;
        }
    }

    // Compute averages
    const avgAttLosses = attLossesPerRoll.map(total => total / sims);
    const avgDefLosses = defLossesPerRoll.map(total => total / sims);

    const attackerWinRate = (attackerWins / sims) * 100;
    const avgAttRem = attackerWins ? (totalAttRem / attackerWins).toFixed(2) : 0;
    const avgDefRem = (sims - attackerWins) ? (totalDefRem / (sims - attackerWins)).toFixed(2) : 0;

    updateChart(avgAttLosses, avgDefLosses);
    displayResults(initialAtt, initialDef, sims, attackerWinRate, avgAttRem, avgDefRem);
}

function updateChart(attData, defData) {
    const length = Math.max(attData.length, defData.length);
    const labels = Array.from({ length }, (_, i) => i + 1);
    lossChart.data.labels = labels;
    lossChart.data.datasets[0].data = attData;
    lossChart.data.datasets[1].data = defData;
    lossChart.update();
}

calculateBtn.addEventListener('click', () => {
    const attackers = parseInt(attackerNumber.value, 10);
    const defenders = parseInt(defenderNumber.value, 10);
    const sims = parseInt(simulationsInput.value, 10);

    if (attackers < 1 || defenders < 1 || sims < 1) {
        alert('Values must be positive.');
        return;
    }
    simulateBattles(attackers, defenders, sims);
});

function displayResults(att, def, sims, winRate, avgAttRem, avgDefRem) {
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = `
        <h3>${sims.toLocaleString()} simulations</h3>
        <p><strong>Armies (A/D):</strong> ${att} / ${def}</p>
        <p><strong>Attacker win chance:</strong> ${winRate.toFixed(2)}%</p>
        <p><strong>Avg. remaining if A wins:</strong> ${avgAttRem}</p>
        <p><strong>Avg. remaining if D wins:</strong> ${avgDefRem}</p>
    `;
}
