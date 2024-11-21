import random
import json
from datetime import datetime, timedelta

# Helper function to calculate category score
def calculate_score(value, ranges):
    for score, (low, high) in ranges.items():
        if low <= value <= high:
            return score
    return 1  # Default to "Unhealthy"

# Generate wellness scores
def generate_wellness_scores(passive_data, workplace_data, active_data, workday):
    # Scoring ranges
    step_ranges = {4: (12000, 20000), 3: (8000, 11999), 2: (5000, 7999), 1: (0, 4999)}
    activity_ranges = {4: (600, 1000), 3: (400, 599), 2: (200, 399), 1: (0, 199)}
    hr_ranges = {4: (50, 70), 3: (71, 85), 2: (86, 100), 1: (101, 120)}
    hrv_ranges = {4: (100, 300), 3: (70, 99), 2: (40, 69), 1: (10, 39)}
    sleep_ranges = {4: (7.5, 9), 3: (6.5, 7.4), 2: (5, 6.4), 1: (0, 4.9)}
    locations_ranges = {4: (3, 5), 3: (2, 6), 2: (1, 1), 1: (0, 0)}
    home_ranges = {4: (8, 14), 3: (15, 18), 2: (19, 22), 1: (23, 24)}

    meetings_ranges = {4: (5, 10), 3: (3, 4), 2: (1, 2), 1: (0, 0)}
    duration_ranges = {4: (15, 30), 3: (10, 14), 2: (5, 9), 1: (0, 4)}
    teams_ranges = {4: (1, 4), 3: (0, 0), 2: (8, 10), 1: (11, 20)}

    stress_ranges = {4: (1, 2), 3: (3, 4), 2: (5, 7), 1: (8, 10)}

    # Calculate Passive Score
    passive_scores = [
        calculate_score(passive_data["step_count"], step_ranges),
        calculate_score(passive_data["physical_activity"], activity_ranges),
        calculate_score(passive_data["heart_rate"], hr_ranges),
        calculate_score(passive_data["heart_rate_variability"], hrv_ranges),
        calculate_score(passive_data["hours_sleep"], sleep_ranges),
        calculate_score(passive_data["locations_visited"], locations_ranges),
        calculate_score(passive_data["time_home"], home_ranges),
    ]
    passive_score = sum(passive_scores) / len(passive_scores)

    # Calculate Workplace App Score (only on workdays)
    workplace_score = None
    if workday:
        workplace_scores = [
            calculate_score(workplace_data["calendar_meetings"], meetings_ranges),
            calculate_score(workplace_data["meeting_duration"], duration_ranges),
            calculate_score(workplace_data["hours_on_teams"], teams_ranges),
        ]
        workplace_score = sum(workplace_scores) / len(workplace_scores)

    # Calculate Active Score
    active_score = calculate_score(active_data["stress_level"], stress_ranges)

    # Calculate Overall Wellness Score
    if workday:
        overall_score = (passive_score + workplace_score + active_score) / 3
    else:
        overall_score = (passive_score + active_score) / 2

    return round(overall_score, 2), round(passive_score, 2), round(workplace_score or 0, 2), round(active_score, 2)

# Generate random UID
def generate_uid(index):
    return f"user_{index:03}"

# Generate demographic data
def generate_demographics():
    genders = ["male", "female"]
    races = ["white", "asian", "black", "native american", "hispanic"]
    departments = ["Corporate Finance", "M&A", "Asset Management", "Research", "Sales"]
    roles = ["Junior", "Mid Level", "Senior"]

    department = random.choice(departments)
    role = random.choice(roles)
    years_worked = random.randint(1, 10)

    # Salary ranges based on department and role
    salary_ranges = {
        "Corporate Finance": {"Junior": (60000, 90000), "Mid Level": (90000, 150000), "Senior": (150000, 300000)},
        "M&A": {"Junior": (80000, 120000), "Mid Level": (120000, 250000), "Senior": (250000, 500000)},
        "Asset Management": {"Junior": (55000, 85000), "Mid Level": (85000, 140000), "Senior": (140000, 300000)},
        "Research": {"Junior": (60000, 100000), "Mid Level": (100000, 180000), "Senior": (180000, 350000)},
        "Sales": {"Junior": (50000, 80000), "Mid Level": (80000, 150000), "Senior": (150000, 400000)},
    }
    salary = random.randint(*salary_ranges[department][role])

    return {
        "gender": random.choice(genders),
        "race": random.choice(races),
        "department": department,
        "role": role,
        "years_worked": years_worked,
        "salary": salary,
    }

# Generate daily data
def generate_daily_data(date):
    day_of_week = date.strftime("%A")
    workday = day_of_week in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    # Passive data
    passive_data = {
        "step_count": random.randint(0, 20000),
        "physical_activity": random.randint(0, 1000),
        "heart_rate": random.randint(50, 120),
        "heart_rate_variability": random.randint(10, 300),
        "hours_sleep": random.uniform(0, 12),
        "locations_visited": random.randint(0, 6),
        "time_home": random.uniform(0, 24),
    }

    # Workplace data
    workplace_data = None
    if workday:
        workplace_data = {
            "calendar_meetings": random.randint(0, 20),
            "meeting_duration": random.randint(0, 120),
            "hours_on_teams": random.uniform(0, 20),
        }

    # Active data
    active_data = {
        "stress_level": random.randint(1, 10),
        "stress_sources": random.sample(
            ["N/A", "Work deadlines", "Meetings", "Coworkers", "Managers", "Friends", "Romantic relationships",
             "Family", "Social events", "Sports", "Health", "News and politics", "Money"], k=random.randint(0, 3)),
    }

    # Generate scores
    overall_score, passive_score, workplace_score, active_score = generate_wellness_scores(passive_data, workplace_data, active_data, workday)

    return {
        "date": date.strftime("%Y-%m-%d"),
        "day_of_week": day_of_week,
        "passive_data": passive_data,
        "workplace_data": workplace_data,
        "active_data": active_data,
        "scores": {
            "overall_score": overall_score,
            "passive_score": passive_score,
            "workplace_score": workplace_score if workplace_data else None,
            "active_score": active_score,
        },
    }

# Generate data for all employees
def generate_employee_data(num_employees):
    employees = []
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 6, 30)
    delta = timedelta(days=1)

    for i in range(num_employees):
        uid = generate_uid(i + 1)
        demographics = generate_demographics()
        daily_data = []
        current_date = start_date
        while current_date <= end_date:
            daily_data.append(generate_daily_data(current_date))
            current_date += delta
        employees.append({
            "uid": uid,
            "demographics": demographics,
            "daily_data": daily_data,
        })
    return employees

# Generate JSON file
def save_to_json(employees, filename="employees.json"):
    with open(filename, "w") as f:
        json.dump(employees, f, indent=4)

# Generate and save data
employees = generate_employee_data(100)
save_to_json(employees)
print("JSON file 'employees.json' generated successfully!")
