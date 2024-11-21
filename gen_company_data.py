import json
import random
from datetime import datetime

def generate_monthly_data(start_month, end_month):
    data = []
    current_month = start_month

    while current_month <= end_month:
        month_name = current_month.strftime("%B %Y")
        monthly_entry = {
            "month": month_name,
            "wellness_usage_rates": {
                "health_plus_app": random.randint(10, 50),  # %
                "wellness_programs": random.randint(1, 40),  # %
                "eap": random.randint(1, 40)  # %
            },
            "retention_rates": {
                "turnover_rate": round(random.uniform(10, 20), 2),  # %
                "absenteeism_rate": round(random.uniform(2, 5), 2)  # %
            },
            "medical_claims": {
                "mental_health_claims": round(random.uniform(5, 15), 2),  # %
                "health_insurance_claims_related_to_stress": round(random.uniform(5, 15), 2)  # %
            }
        }
        data.append(monthly_entry)
        current_month = current_month.replace(month=current_month.month + 1) if current_month.month < 12 else current_month.replace(year=current_month.year + 1, month=1)

    return data

def generate_organizational_data():
    # Fixed data
    org_info = {
        "company_size": 500,
        "industry": "Investment Bank",
        "location": "New York"
    }

    annual_costs = {
        "wellness_program_total_costs": 100000,
        "eap_costs": 10000,
        "turnover_costs": 15800000,
        "absenteeism_cost": 1800000,
        "mental_health_claims_cost": 500000,
        "health_insurance_claims_related_to_stress_cost": 500000
    }

    # Monthly data
    start_month = datetime(2024, 1, 1)
    end_month = datetime(2024, 6, 1)
    monthly_data = generate_monthly_data(start_month, end_month)

    # Combine all data
    org_data = {
        "organization_info": org_info,
        "annual_costs": annual_costs,
        "monthly_data": monthly_data
    }

    return org_data

def save_to_json(data, filename="company.json"):
    with open(filename, "w") as file:
        json.dump(data, file, indent=4)
    print(f"JSON file '{filename}' generated successfully!")

# Generate and save the data
organizational_data = generate_organizational_data()
save_to_json(organizational_data)
