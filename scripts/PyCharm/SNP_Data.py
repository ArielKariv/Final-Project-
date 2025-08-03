import yfinance as yf  # ספרייה להורדת נתוני שוק היסטוריים מ-Yahoo Finance
import pandas as pd     # ספריית pandas לעיבוד נתונים

# === הגדרת טווח תאריכים עבור הנתונים שנמשוך ===
start_date = "2018-12-10"  # תאריך התחלה – חמש שנים אחורה
end_date = "2025-03-16"    # תאריך סיום

# === הורדת נתוני מדד S&P 500 (באמצעות ETF בשם SPY) ===
symbol = "SPY"  # סימבול של מדד S&P 500 לפי Yahoo Finance
data = yf.download(symbol, start=start_date, end=end_date, interval="1d")  # נתוני יומי

# === בדיקה אם הנתונים התקבלו בהצלחה ===
if data.empty:
    print("No data found. Please check the symbol or date range.")  # אם לא התקבלו נתונים
else:
    print("Data fetched successfully!")  # אם הנתונים ירדו בהצלחה

# === חישוב MACD (Moving Average Convergence Divergence) ===
ema_12 = data['Close'].ewm(span=12, adjust=False).mean()  # ממוצע נע מעריכי ל־12 ימים
ema_26 = data['Close'].ewm(span=26, adjust=False).mean()  # ממוצע נע מעריכי ל־26 ימים
macd = ema_12 - ema_26  # חיסור ביניהם נותן את ערך ה־MACD

# === הוספת עמודת MACD ל־DataFrame ===
data['MACD'] = macd

# === פונקציה לחישוב RSI (Relative Strength Index) ===
def calculate_rsi(data, period=14):
    delta = data.diff()  # שינוי יומי בין מחירי סגירה עוקבים
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()  # ממוצע של הרווחים החיוביים
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()  # ממוצע של ההפסדים (כמויות שליליות)
    rs = gain / loss  # יחס רווח להפסד
    rsi = 100 - (100 / (1 + rs))  # נוסחת RSI לפי הגדרה
    return rsi  # החזרת ערכי RSI

# === חישוב RSI על עמודת מחירי הסגירה והוספתו לטבלה ===
data['RSI'] = calculate_rsi(data['Close'])

# === הצגת 5 שורות ראשונות עם Close, MACD ו־RSI לאימות ===
print(data[['Close', 'MACD', 'RSI']].head())

# === שמירת הנתונים כקובץ CSV ===
output_file = "snp500_data_with_manual_rsi.csv"  # שם הקובץ לשמירה
data.to_csv(output_file)  # כתיבה לקובץ CSV
print(f"Data saved to {output_file}")  # הודעת סיום
