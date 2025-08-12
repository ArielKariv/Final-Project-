// פונקציה שמחליפה הצגה של תיבת הסבר (נראות כן/לא)
function toggleExplanation() {
  const el = document.getElementById('explanation');
  el.style.display = (el.style.display === 'block') ? 'none' : 'block';
}

// שליטה על כפתור החלפת מצב תאורה (לילה/יום)
const modeBtn = document.getElementById('modeToggle');
modeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode'); // מצב יום
  document.body.classList.toggle('dark-mode');  // מצב לילה
  modeBtn.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
});

// משתנים גלובליים עבור הגרף
let forecastChart;
const forecastSelect = document.getElementById("forecastSelect");  // הרשימה הנפתחת של התחזיות
const ctx = document.getElementById("previewChart").getContext("2d");  // קנבס לגרף

// פונקציה לטעינת התחזית, ברירת מחדל: 'latest'
async function loadForecast(which = "latest") {
  // מיפוי של מזהים לקבצי JSON
  const fileMap = {
    latest: "data/forecast_latest.json",
    week1: "data/forecast_week1.json",
    week2: "data/forecast_week2.json",
    week3: "data/forecast_week3.json"
  };

  const file = fileMap[which]; // בחר את הקובץ לפי מה שנבחר

  try {
    // טעינת נתוני התחזית
    const response = await fetch(file);
    const data = await response.json();

    // שליפת התאריכים וערכי התחזית
    const labels = data.data.map(row => row.Date);
    const predicted = data.data.map(row => row.Predicted_Close);

    // טעינת מחירי סגירה אמיתיים
    const actuals = await fetch("data/actual_data.json").then(res => res.json());
    const actualMap = new Map(actuals.map(row => [row.Date, row.Close]));
    const actualSeries = labels.map(date => actualMap.get(date) || null);

    // אם יש גרף קיים – מחק אותו כדי לא ליצור שכפול
    if (forecastChart) forecastChart.destroy();

    // יצירת הגרף החדש עם שני קווים: תחזית מול בפועל
    forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // תאריכים
        datasets: [
          {
            label: "Predicted",
            data: predicted,
            borderColor: "#26DE81", // ירוק
            backgroundColor: "rgba(38,222,129,0.2)",
            tension: 0.3,
            fill: true
          },
          {
            label: "Actual (S&P 500)",
            data: actualSeries,
            borderColor: "#888", // אפור
            borderDash: [4, 4], // קו מקווקו
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: { enabled: true }
        }
      }
    });

    // הסקת המלצה על בסיס אחוז השינוי הצפוי
    const change = data.expectedChange || '0.00%';
    const changeNum = parseFloat(change.replace('%', '')); // המרה למספר

    let rec = '';  // BUY / SELL / HOLD
    let text = ''; // טקסט נלווה

    if (changeNum >= 1.0) {
      rec = "BUY";
      text = "Market shows strong upside potential.";
    } else if (changeNum <= -1.0) {
      rec = "SELL";
      text = "Forecast suggests downward movement.";
    } else {
      rec = "HOLD";
      text = "Stability expected. Holding is safe for now.";
    }

    // הצגת המלצה ותיאור למשתמש
    document.getElementById("homeForecastExplanation").innerHTML = `
      <p class="recommendation-text">${text}</p>
      <p class="recommendation"><strong>${rec}</strong></p>
      <p class="expected-change">Forecasted change: ${change}</p>
    `;

    // הצגת תאריך התחזית האחרון ועדכון אייקון מגמה
    document.getElementById("updateTime").textContent = `Forecast ends: ${labels[labels.length - 1] || ''}`;
    document.getElementById("marketIcon").textContent = changeNum >= 0 ? '🟢 Up' : '🔴 Down';

  } catch (err) {
    // במקרה של שגיאה – הצגת הודעה וכתיבה לקונסול
    console.error("Error loading forecast:", err);
    document.getElementById('previewChart').parentElement.innerHTML =
      '<p style="color:red;">Could not display chart – check your data.</p>';
  }
}

// כשהמשתמש משנה את הבחירה ברשימה – טען תחזית מתאימה
if (forecastSelect) {
  forecastSelect.addEventListener("change", () => {
    loadForecast(forecastSelect.value);
  });
}

// טעינה אוטומטית כשנכנסים לעמוד – טען את התחזית האחרונה
window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("fade-in");
  loadForecast(); // ברירת מחדל: latest
});
