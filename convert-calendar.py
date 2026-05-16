from icalendar import Calendar
import recurring_ical_events
import json
from datetime import datetime

INPUT_FILE = "calendar-data/tridentine_1962.ics"
OUTPUT_FILE = "calendar-data/tridentine_1962.json"

START_YEAR = 2000
END_YEAR = 2050

with open(INPUT_FILE, "rb") as f:
    calendar = Calendar.from_ical(f.read())

start_date = datetime(START_YEAR, 1, 1)
end_date = datetime(END_YEAR + 1, 1, 1)

events = recurring_ical_events.of(calendar).between(start_date, end_date)

calendar_data = {}

for event in events:
    summary = str(event.get("SUMMARY", "")).strip()
    dtstart = event.get("DTSTART").dt

    if hasattr(dtstart, "date"):
        event_date = dtstart.date()
    else:
        event_date = dtstart

    date_key = event_date.strftime("%Y-%m-%d")

    if summary:
        if date_key not in calendar_data:
            calendar_data[date_key] = []

        calendar_data[date_key].append(summary)


def choose_best_feast_name(summaries):
    cleaned = []

    for summary in summaries:
        summary = summary.replace("›", "").strip()
        cleaned.append(summary)

    priority_words = [
        "Sunday",
        "Easter",
        "Pentecost",
        "Ash Wednesday",
        "Good Friday",
        "Holy Thursday",
        "Holy Saturday",
        "Christmas",
        "Nativity",
        "Epiphany",
        "Ascension",
        "Corpus Christi",
        "Christ the King",
        "Sacred Heart",
        "Immaculate Conception",
        "Assumption",
        "All Saints",
        "All Souls",
    ]

    for word in priority_words:
        for summary in cleaned:
            if word.lower() in summary.lower():
                return summary

    return cleaned[0] if cleaned else ""


for date_key, summaries in calendar_data.items():
    calendar_data[date_key] = choose_best_feast_name(summaries)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(calendar_data, f, indent=2, ensure_ascii=False)

print(f"Created {OUTPUT_FILE}")
print(f"Total dates: {len(calendar_data)}")
