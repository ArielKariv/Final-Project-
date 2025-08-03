let newsOffset = 0; // מצביע למיקום ההתחלתי של החדשות ברשימה
const PAGE_SIZE = 5;// מספר החדשות המוצגות בכל עמוד

// טוען את ערכת הנושא מה-localStorage
function loadTheme() {
  const t = localStorage.getItem('theme') || 'dark'; // כברירת מחדל 'dark'
  document.body.classList.add(t + '-mode');// מוסיף class בהתאם
  document.getElementById('modeToggle').textContent = t === 'dark' ? '🌙' : '☀️';
}

// מחליף בין ערכת נושא כהה ובהירה
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');// אם true, עברנו לבהיר
  document.body.classList.toggle('dark-mode', !isLight);// מבטל כהה
  localStorage.setItem('theme', isLight ? 'light' : 'dark');// שמירה בזיכרון
  document.getElementById('modeToggle').textContent = isLight ? '☀️' : '🌙';
}

// אתחול ממשק המשתמש - קישור כפתורים לפונקציות
function initUI() {
  document.getElementById('modeToggle').onclick = toggleTheme; // כפתור מצב
  const newsButton = document.getElementById('loadMoreNews');
  if (newsButton) {
    newsButton.onclick = () => loadNews(false);// כפתור טעינת חדשות נוספות
  }
}
// טוען את התחזית העדכנית ומצייר גרף עם Chart.js
async function loadForecast() {
  const raw = await fetch('data/forecast_latest.json');
  const { data, recommendation: originalReco, expectedChange } = await raw.json();

  const arr = data.slice(-7);// 7 ימים אחרונים
  const dates = arr.map(d => d.Date);
  const closes = arr.map(d => d.Predicted_Close);
  const ctx = document.getElementById('forecastChart').getContext('2d');

    // יצירת גרף קווים של תחזית הסגירה
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        data: closes,
        borderColor: '#26DE81',
        backgroundColor: 'rgba(38,222,129,0.2)',
        pointRadius: 4,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: i => 'Close: ' + i.parsed.y.toFixed(2)
          }
        }
      },
      scales: {
        x: { display: true, title: { display: true, text: 'Date' }},
        y: { display: true, title: { display: true, text: 'Close Value' }}
      }
    }
  });

  // קביעת המלצה (BUY/SELL/HOLD) לפי אחוז שינוי חזוי
  const changeValue = parseFloat(expectedChange.replace('%', '')) || 0;
  let recommendation = '';
  let recText = '';

  if (changeValue >= 1.0) {
    recommendation = 'BUY';
    recText = 'Market shows strong upside potential. Consider buying.';
  } else if (changeValue <= -1.0) {
    recommendation = 'SELL';
    recText = 'Forecast suggests downward pressure. Selling may be advisable.';
  } else {
    recommendation = 'HOLD';
    recText = 'Low volatility expected. Holding is likely safest for now.';
  }

  // תצוגה על המסך
  document.getElementById('forecastExplanation').innerHTML = `
    <div class="forecast-box">
      <p class="recommendation-text">${recText}</p>
      <p class="recommendation"><strong>${recommendation}</strong></p>
      <p class="expected-change">Forecasted change: ${expectedChange}</p>
    </div>
  `;

    // עדכון זמן התחזית האחרון
  document.getElementById('updateTime').textContent = `Last updated: ${arr[arr.length - 1]?.Date}`;
}

// פונקציה לטעינת פרטי שוק אחרונים
async function loadMarketDetails() {
  const { analysis } = await (await fetch('data/market_dashboard_data.json')).json(); // טוען את קובץ ה־JSON ומחלץ את השדה "analysis"
  const latest = analysis.slice(-1)[0]; // לוקח את הרשומה האחרונה מתוך רשימת הניתוחים
  const container = document.getElementById('marketDetails');  // מאתר את האלמנט בדף שבו תוצג רשימת הפרטים
  container.innerHTML = ''; // מנקה את התוכן הקיים בתיבה
  if (latest) {   // אם יש רשומה אחרונה (כלומר קיימים נתונים)
    [['RSI','RSI'],['MA20','MA20'],['Volume','Volume'],['Recommendation','Recommendation']].forEach(([k, label]) => {  // עבור כל פריט שוק נבחר (RSI, MA20, Volume, Recommendation)
      const d = document.createElement('div'); // יוצר אלמנט div חדש
      d.classList.add('market-detail'); // מוסיף מחלקת עיצוב
      d.innerHTML = `<strong>${label}:</strong><br>${latest[k] || '-'}`; // קובע את תוכן התצוגה
      container.appendChild(d); // מוסיף את האלמנט החדש לקונטיינר
    });
  }
}

// פונקציה שמחזירה צבע בהתאם לסנטימנט של החדשות
function getSentimentColor(label) {
  switch (label?.toLowerCase()) {
    case 'bullish': return '#26DE81'; // ירוק - חיובי
    case 'bearish': return '#FC5C65'; // אדום - שלילי
    case 'neutral': return '#F7B731'; // צהוב - ניטרלי
    default: return '#888';  // אפור - ברירת מחדל
  }
}

// טעינת חדשות, reset=true מאפס את הרשימה
async function loadNews(reset = false) {
  try {
    if (reset) { // מתחיל מההתחלה
      newsOffset = 0;
      document.getElementById('newsList').innerHTML = ''; // מנקה תצוגת חדשות
    }

    // טוען את קובץ החדשות
    const raw = await fetch('data/news_data.json');
    const json = await raw.json();
    const news = json.news || json; // תמיכה בשני פורמטים

    const list = document.getElementById('newsList');
    const slice = news.slice(newsOffset, newsOffset + PAGE_SIZE); // מקטע חדשות להצגה
 
    // יצירת כרטיס חדשות עבור כל ידיעה
    slice.forEach(n => {
      const li = document.createElement('li');
      li.className = 'news-item';

      const sentimentColor = getSentimentColor(n.Sentiment_Label);
      const sentimentLabel = n.Sentiment_Label?.charAt(0).toUpperCase() + n.Sentiment_Label?.slice(1);

      // תוכן הכרטיס
      li.innerHTML = `
        <div class="news-card">
          <div class="news-header">
            <span class="news-source">${n.Source || 'Unknown'}</span>
            <span class="news-date">${n.Date || '-'}</span>
          </div>
          <div class="news-title"><strong>${n.title || '[No Title]'}</strong></div>
          <div class="news-sentiment" style="background-color: ${sentimentColor}">${sentimentLabel || 'N/A'}</div>
        </div>
      `;
      list.appendChild(li); // הוספה לרשימת החדשות
    });

    newsOffset += PAGE_SIZE;  // עדכון אינדקס לקריאה הבאה
  } catch (e) {
    console.error('News loading error:', e);
    document.getElementById('newsList').innerHTML =
      `<p style="color: red; text-align: center;">News data could not be loaded.</p>`;
  }
}

// פתיחת מודאל של גרפי מדדים
function openMetricsModal() {
  document.getElementById('metricsModal').style.display = 'flex';
  loadMetricsCharts();
}

// סגירת מודאל של גרפים
function closeMetricsModal() {
  document.getElementById('metricsModal').style.display = 'none';
}

// טעינת הגרפים של RSI, MACD ונפח
async function loadMetricsCharts() {
  const raw = await fetch('data/market_dashboard_data.json');
  const data = await raw.json();
  const last5 = data.slice(-5); // לוקח את 5 הרשומות האחרונות

   // חילוץ עמודות נתונים מהקובץ
  const dates = last5.map(r => r.date);
  const rsi = last5.map(r => r.rsi);
  const macd = last5.map(r => r.macd);
  const volume = last5.map(r => r.volatility);

  // חישוב ערכים מקסימליים ומינימליים עבור נפח כדי לצבוע
  const maxVol = Math.max(...volume);
  const minVol = Math.min(...volume);

  // פונקציה שיוצרת צבע לפי עוצמת נפח
  const getColor = v => {
    const ratio = (v - minVol) / (maxVol - minVol); // שיעור נפח
    const r = Math.round(255 - ratio * 155); // יותר ירוק = יותר נפח
    const g = Math.round(100 + ratio * 100);
    return `rgb(${r},${g},100)`; // החזרת צבע דינמי
  };

  new Chart(document.getElementById('rsiChart'), {
    type: 'line', // סוג הגרף – קו
    data: {
      labels: dates, // תוויות על ציר X – תאריכים
      datasets: [{
        label: 'RSI', // תווית לגרף
        data: rsi, // הנתונים לגרף (ערכי RSI)
        borderColor: '#FFD460', // צבע קו
        backgroundColor: 'rgba(255,212,96,0.2)', // צבע רקע שקוף מתחת לקו
        fill: true, // מילוי מתחת לקו
        tension: 0.4, // עיקול של הקו
        pointRadius: 5 // גודל הנקודות על הקו
      }] 
    },
    options: {
      responsive: true, // הסתגלות למסך
      plugins: {
        legend: { display: false }, // הסתרת המקרא (תווית למעלה)
        tooltip: {
          enabled: true,
          callbacks: {
             // תצוגת ערך ה־RSI בעת מעבר עם העכבר
            label: context => `RSI: ${context.parsed.y.toFixed(2)}`
          }
        }
      },
      interaction: { 
        mode: 'index', // אינטראקציה לפי אינדקס
        intersect: false // לא מחייב הצטלבות בין סמן לגרף
      },
      scales: {
        x: { ticks: { color: '#ccc' } }, // צבע טיקים על ציר X
        y: { ticks: { color: '#ccc' } }  // צבע טיקים על ציר Y
      }
    }
  });

 // יצירת גרף MACD
  new Chart(document.getElementById('macdChart'), {
    type: 'line', // סוג גרף – קו
    data: {
      labels: dates, // תאריכים בציר X
      datasets: [{
        label: 'MACD', // נתוני MACD
        data: macd,
        borderColor: '#3A99FF', // כחול
        backgroundColor: 'rgba(58,153,255,0.2)', // כחול שקוף
        fill: true,
        tension: 0.4,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: context => `MACD: ${context.parsed.y.toFixed(2)}`
          }
        }
      },
      // הגדרות אינטראקציה וסקיילים (המשך מגרף MACD)
      interaction: {  
        mode: 'index',// אינטראקציה לפי אינדקס – מאפשר להשוות ערכים בכל הגרפים לפי אותו תאריך
        intersect: false // לא מחייב חפיפה עם הנקודה עצמה לצורך תצוגה
      },
      scales: {
        x: { ticks: { color: '#ccc' } }, // צבע של הטקסט בציר X
        y: { ticks: { color: '#ccc' } }  // צבע של הטקסט בציר Y
      }
    }
  });

  // גרף ברים לנפח מסחר
  new Chart(document.getElementById('volumeChart'), {
    type: 'bar', // סוג גרף – עמודות (ברים)
    data: {
      labels: dates, // תאריכים בציר X
      datasets: [{
        label: 'נפח מסחר', // תווית לגרף
        data: volume, // נתוני נפח המסחר
        backgroundColor: volume.map(getColor), // מיפוי צבעים לפי עוצמת נפח המסחר (בהיר–כהה / ירוק–אדום)
        borderRadius: 6  // פינות מעוגלות לעמודות
      }]
    },
    options: {
      responsive: true, // התאמה לכל סוג מסך
      plugins: {
        legend: { display: false }, // לא להציג מקרא למעלה
        tooltip: {
          enabled: true, // להפעיל tooltip
          callbacks: { // מה שיוצג ב-tooltip כשעוברים עם העכבר
            label: context => `Volume: ${context.parsed.y.toLocaleString()}`
          } // להציג את המספר בפורמט עם פסיקים (1,000,000)
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#ccc' } }, // צבע טיקים בציר Y
        x: { ticks: { color: '#ccc' } } // צבע טיקים בציר X
      }
    }
  });
}

// כשהדף נטען לחלוטין (DOMContentLoaded), מפעילים מספר פונקציות אתחול
window.addEventListener('DOMContentLoaded', () => { // מוסיף אנימציית הופעה חלקה לגוף הדף
  document.body.classList.add('fade-in'); // טוען את ערכת הנושא (מצב כהה/בהיר) מה-localStorage
  loadTheme(); 
  initUI();// מאתחל כפתורים ואירועים בדף
  loadForecast(); // טוען את נתוני התחזית
  loadMarketDetails();  // טוען נתוני שוק עכשוויים (RSI, MA20 וכו')
  loadNews(true); // טוען חדשות עם איפוס (reset = true)
});

// מאזין לשינוי בתאריך שנבחר ברשימת התאריכים (input[type="date"])
document.getElementById("datePicker").addEventListener("change", handleDatePick);
// פונקציה לטיפול בבחירת תאריך – תציג תחזית וערך בפועל (אם קיים)
async function handleDatePick(e) {
  const selected = e.target.value; // התאריך שנבחר
  const resultBox = document.getElementById("dailyForecastResult"); // אלמנט להצגת התוצאה
  resultBox.innerHTML = "<p>Loading...</p>"; // מציג הודעת טעינה

  try {
    // טוען את כל התחזיות היומיות
    const raw = await fetch("data/forecast_all.json");
    const data = await raw.json();

    // מחפש את הרשומה שמתאימה לתאריך שנבחר
    const day = data.find(row => row.Date === selected);

     // אם אין נתונים לאותו תאריך
    if (!day) {
      resultBox.innerHTML = `<p style="color:red;">אין מסחר בתאריך זה או שאין נתונים זמינים.</p>`;
      return;
    }

     // מתחיל לבנות HTML להצגה
    let html = `<p><strong>Date:</strong> ${day.Date}</p>`;

     // אם קיימת תחזית – מציג אותה
    if (day.predicted !== undefined)
      html += `<p><strong>Prediction:</strong> ${day.predicted.toFixed(2)}</p>`;

    // אם קיים ערך בפועל – מציג אותו
    if (day.actual !== undefined)
      html += `<p><strong>Actual:</strong> ${day.actual.toFixed(2)}</p>`;

    // אם קיימים גם תחזית וגם ערך בפועל – מחשב הפרש באחוזים
    if (day.predicted !== undefined && day.actual !== undefined) {
      const diff = day.actual - day.predicted; // הפרש אבסולוטי
      const perc = ((diff / day.predicted) * 100).toFixed(2); // אחוז ההפרש
      const sign = diff >= 0 ? "+" : ""; // מוסיף סימן חיובי אם צריך
      html += `<p><strong>Difference:</strong> ${sign}${diff.toFixed(2)} (${sign}${perc}%)</p>`;
    }

    resultBox.innerHTML = html; // מציג את התוצאה
    // טיפול בשגיאה – תצוגה ו-Console
  } catch (err) {
    resultBox.innerHTML = `<p style="color:red;">שגיאה בטעינת הנתונים.</p>`;
    console.error(err);
  }
}

// פונקציה להפעלת חיפוש תחזיות בטווח תאריכים שנבחר
async function handleRangePick() {
  const from = document.getElementById("rangeStart").value; // תאריך התחלה
  const to = document.getElementById("rangeEnd").value; // תאריך סיום
  const box = document.getElementById("rangeResult"); // אלמנט להצגת התוצאה

  // בדיקה אם נבחרו שני תאריכים
  if (!from || !to) {
    box.innerHTML = "<p style='color:orange;'>Please select both start and end dates.</p>";
    return;
  }

  // מציג הודעת טעינה
  box.innerHTML = "<p>Loading...</p>";

  try {
    // טען תחזיות ונתונים אמיתיים
    const forecastRaw = await fetch("data/forecast_all.json");
    const forecastData = await forecastRaw.json();

    const actualRaw = await fetch("data/actual_data.json");
    const actualData = await actualRaw.json();

    // סנן לפי טווח
    const range = forecastData.filter(row => row.Date >= from && row.Date <= to);
    if (range.length === 0) {
      box.innerHTML = "<p style='color:red;'>No trading data found in selected range.</p>";
      return;
    }

    // התחלת בניית טבלה להצגת התוצאות
    let html = `
      <table class="range-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Prediction</th>
            <th>Actual</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
    `;

    // לכל יום בטווח מחשב ומציג תחזית, ערך אמיתי, והפרש באחוזים
    for (const row of range) {
      const pred = row.Predicted_Close?.toFixed(2) || "-"; // תחזית מעוגלת
      const actualObj = actualData.find(r => r.Date === row.Date); // ערך בפועל
      const act = actualObj?.Close?.toFixed(2) || "-"; // סגירה בפועל

      let diff = "-";
      if (actualObj && row.Predicted_Close !== undefined) {
        const change = actualObj.Close - row.Predicted_Close; // הפרש מוחלט
        const perc = ((change / row.Predicted_Close) * 100).toFixed(2); // אחוז שינוי
        const sign = change >= 0 ? "+" : ""; // סימן שינוי
        diff = `${sign}${change.toFixed(2)} (${sign}${perc}%)`;
      }

      html += `
        <tr>
          <td>${row.Date}</td>
          <td>${pred}</td>
          <td>${act}</td>
          <td>${diff}</td>
        </tr>
      `;
    }

    html += "</tbody></table>"; // סיום טבלה
    box.innerHTML = html; // הצגת טבלה למשתמש

    // ציור גרף
    const chartEl = document.getElementById("rangeChart");
    if (window.rangeChartInstance) window.rangeChartInstance.destroy(); // הורס גרף קודם אם קיים

    const labels = range.map(r => r.Date); // תוויות ציר X
    const predVals = range.map(r => r.Predicted_Close ?? null); // ערכי תחזית
    const actVals = labels.map(date => {
      const match = actualData.find(r => r.Date === date);
      return match?.Close ?? null; // ערכים אמיתיים
    });

       // יצירת גרף עם שני קווים – תחזית מול ערכים אמיתיים
    window.rangeChartInstance = new Chart(chartEl, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Prediction',
            data: predVals,
            borderColor: '#26DE81',
            backgroundColor: 'rgba(38,222,129,0.2)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Actual',
            data: actVals,
            borderColor: '#888',
            borderDash: [4, 4], // קו מקווקו לערכים האמיתיים
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }, // מיקום מקרא
          tooltip: { mode: 'index', intersect: false } // תצוגת מידע
        }
      }
    });

  } catch (err) {
     // טיפול בשגיאות (למשל קובץ חסר)
    box.innerHTML = "<p style='color:red;'>Error loading range data.</p>";
    console.error(err);
  }
}
