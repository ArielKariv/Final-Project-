import requests  # לשליחת בקשות HTTP ל-API של Alpha Vantage
import time      # לשימוש בפונקציית sleep כדי להימנע מחסימת בקשות
import pandas as pd  # לעיבוד ושמירה של הנתונים בטבלה
from datetime import datetime, timedelta  # לעבודה עם תאריכים

# === מפתח API של Alpha Vantage ===
API_KEY = "SXT9A2VG3ZWIC5DQ"

# === כתובת בסיסית של ה-API ===
BASE_URL = "https://www.alphavantage.co/query"

# === רשימת נושאים (אינדיקטורים כלכליים) שנרצה לשלוף עבורם חדשות ===
topics = [
    "Core CPI", "Average Hourly Earnings", "S&P Global Services PMI",
    "ISM Manufacturing PMI", "CPI", "GDP", "Fed Interest Rate Decision",
    "Core PCE Price Index", "ISM Manufacturing Prices", "Unemployment Rate",
    "ECB Interest Rate Decision", "CB Consumer Confidence", "JOLTS Job Openings",
    "Crude Oil Inventories"
]

# === טווח תאריכים לחיפוש (5 שנים אחורה מהיום) ===
start_date = datetime(2019, 3, 1)  # תאריך התחלה: 1 במרץ 2019
end_date = datetime.today()        # תאריך סיום: היום

# === בניית רשימת טווחי תאריכים חודשיים (כל חודש יהווה batch נפרד ל-API) ===
date_ranges = []
current_date = start_date

while current_date < end_date:
    next_month = current_date + timedelta(days=30)  # קפיצה של חודש קדימה (בערך)
    # הוספת זוג תאריכים בפורמט הדרוש ל-API (YYYYMMDDT0000)
    date_ranges.append((current_date.strftime("%Y%m%dT0000"), next_month.strftime("%Y%m%dT0000")))
    current_date = next_month  # עדכון התאריך לחודש הבא

# === רשימה לשמירת כל הידיעות מכל הבקשות ===
all_articles = []

# === לולאה כפולה: עבור כל נושא -> עבור כל חודש -> שליפת נתונים מה-API ===
for topic in topics:
    for time_from, time_to in date_ranges:
        params = {
            "function": "NEWS_SENTIMENT",  # פונקציה לשליפת חדשות כלכליות עם סנטימנט
            "time_from": time_from,        # תאריך התחלה עבור הבקשה
            "time_to": time_to,            # תאריך סיום עבור הבקשה
            "topics": topic,               # הנושא הספציפי
            "sort": "LATEST",              # מיון החדשות מהחדשות האחרונות לראשונות
            "limit": 1000,                 # מגבלת מקסימום של פריטים (לפי תיעוד API)
            "apikey": API_KEY              # מפתח גישה לחשבון שלך ב-Alpha Vantage
        }

        # === שליחת הבקשה ל-API ===
        response = requests.get(BASE_URL, params=params)

        # === אם התקבלה תשובה תקינה (קוד 200) ויש שדה feed בתוצאה ===
        if response.status_code == 200:
            data = response.json()
            if "feed" in data:
                all_articles.extend(data["feed"])  # הוספת הידיעות לרשימה הראשית

        # === המתנה של שנייה בין כל בקשה כדי להימנע מחסימת המפתח עקב עומס בקשות ===
        time.sleep(1)

# === הפיכת הרשימה לדאטהפריים של pandas ===
df = pd.DataFrame(all_articles)

# === שמירה לקובץ CSV במחשב (שנה נתיב בהתאם למחשב שלך אם צריך) ===
csv_filename = r"C:\Users\Owner\PycharmProjects\פרויקט גמר אריאל ומשי\All_News_Data.csv"
df.to_csv(csv_filename, index=False)

# === הודעה על סיום ===
print(f"Data saved successfully to {csv_filename}")
