import requests  # ספרייה לשליחת בקשות HTTP
import time      # ספרייה לעיכוב בין קריאות כדי להימנע ממגבלות API
import pandas as pd  # ספרייה לעיבוד נתונים
from datetime import datetime, timedelta  # לעבודה עם תאריכים

# מפתח ה־API שלך לשירות Alpha Vantage
API_KEY = "SXT9A2VG3ZWIC5DQ"

# כתובת הבסיס של שירות Alpha Vantage
BASE_URL = "https://www.alphavantage.co/query"

# רשימת נושאים כלכליים שרוצים למשוך עבורם כתבות חדשות
topics = [
    "Core CPI", "Average Hourly Earnings", "S&P Global Services PMI",
    "ISM Manufacturing PMI", "CPI", "GDP", "Fed Interest Rate Decision",
    "Core PCE Price Index", "ISM Manufacturing Prices", "Unemployment Rate",
    "ECB Interest Rate Decision", "CB Consumer Confidence", "JOLTS Job Openings",
    "Crude Oil Inventories"
]

# תחילת הטווח – 5 שנים אחורה (1 במרץ 2019)
start_date = datetime(2019, 3, 1)

# תאריך סיום – היום הנוכחי
end_date = datetime.today()

# יצירת רשימת טווחי תאריכים של כחודש כל אחד (נדרש לפי מגבלות ה־API)
date_ranges = []
current_date = start_date
while current_date < end_date:
    next_month = current_date + timedelta(days=30)  # קפיצה של חודש קדימה
    # שמירת הטווח בפורמט הנדרש ע"י ה־API: YYYYMMDDT0000
    date_ranges.append((current_date.strftime("%Y%m%dT0000"), next_month.strftime("%Y%m%dT0000")))
    current_date = next_month  # המשך ללולאה הבאה

# רשימה לאגירת כל הכתבות שיתקבלו מה־API
all_articles = []

# עבור כל נושא כלכלי ברשימה
for topic in topics:
    # ועבור כל טווח תאריכים
    for time_from, time_to in date_ranges:
        # פרמטרים שנשלחים ב־URL של הבקשה
        params = {
            "function": "NEWS_SENTIMENT",  # פונקציית API לקבלת חדשות עם סנטימנט
            "time_from": time_from,        # תאריך התחלה לטווח
            "time_to": time_to,            # תאריך סיום לטווח
            "topics": topic,               # הנושא הכלכלי הנוכחי
            "sort": "LATEST",              # סידור לפי חדשות אחרונות
            "limit": 1000,                 # מספר מקסימלי של חדשות
            "apikey": API_KEY              # מפתח הגישה ל־API
        }

        # שליחת הבקשה ל־API
        response = requests.get(BASE_URL, params=params)

        # אם הבקשה הצליחה (קוד HTTP 200)
        if response.status_code == 200:
            data = response.json()  # המרת תוכן התגובה ל־JSON
            if "feed" in data:  # אם המפתח 'feed' קיים – מכיל חדשות
                all_articles.extend(data["feed"])  # הוספת כל החדשות לרשימה הראשית

        # עיכוב של שנייה בין בקשות כדי לא לעבור את מגבלת השימוש
        time.sleep(1)

# המרה של כל הכתבות שהתקבלו ל־DataFrame של pandas
df = pd.DataFrame(all_articles)

# שמירה לקובץ CSV במחשב – החלף את הנתיב לנתיב המתאים אצלך
csv_filename = r"C:\Users\Dell\finalProject\economic_news_new.csv"
df.to_csv(csv_filename, index=False)

# הדפסת סטטוס הצלחה
print(f"Data saved successfully to {csv_filename}")
