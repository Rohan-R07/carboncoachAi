from typing import Dict, List, Tuple
from models.schemas import CarbonData, Recommendation, AssessmentRequest

# Carbon coefficients (kg CO2 per year)
TRANSPORT_FACTORS = {
    "Walk": 0.0,
    "Bicycle": 0.0,
    "Public Transport": 500.0,
    "Car": 3000.0
}

ELECTRICITY_FACTORS = {
    "Rarely": 200.0,
    "1–4 Hours": 800.0,
    "4–8 Hours": 1800.0,
    "8+ Hours": 3500.0
}

DIET_FACTORS = {
    "Vegan": 500.0,
    "Vegetarian": 1000.0,
    "Mixed": 2000.0,
    "Meat Heavy": 4000.0
}

SHOPPING_FACTORS = {
    "Rarely": 100.0,
    "Monthly": 300.0,
    "Weekly": 800.0,
    "Frequently": 2000.0
}

FLIGHT_FACTORS = {
    "0": 0.0,
    "1–2": 1500.0,
    "3–5": 4500.0,
    "5+": 9000.0
}

# Eco Score Deduction Math
# Eco Score starts at 100 and drops based on negative impact behaviors
TRANSPORT_DEDUCTIONS = {
    "Walk": 0,
    "Bicycle": 0,
    "Public Transport": 5,
    "Car": 20
}

ELECTRICITY_DEDUCTIONS = {
    "Rarely": 0,
    "1–4 Hours": 5,
    "4–8 Hours": 15,
    "8+ Hours": 25
}

DIET_DEDUCTIONS = {
    "Vegan": 0,
    "Vegetarian": 5,
    "Mixed": 15,
    "Meat Heavy": 25
}

SHOPPING_DEDUCTIONS = {
    "Rarely": 0,
    "Monthly": 5,
    "Weekly": 15,
    "Frequently": 20
}

FLIGHT_DEDUCTIONS = {
    "0": 0,
    "1–2": 10,
    "3–5": 20,
    "5+": 30
}

def calculate_carbon_footprint(req: AssessmentRequest) -> Tuple[CarbonData, int]:
    """
    Calculates carbon footprint for each category and totals it.
    Also computes the mathematical Eco Score (0-100).
    """
    transport = TRANSPORT_FACTORS.get(req.transportation, 0.0)
    
    # Handle dash variations for electricity
    elec_key = req.electricity.replace("-", "–")
    electricity = ELECTRICITY_FACTORS.get(elec_key, 0.0)
    
    diet = DIET_FACTORS.get(req.diet, 0.0)
    shopping = SHOPPING_FACTORS.get(req.shopping, 0.0)
    
    # Handle dash variations for flights
    flight_key = req.flights.replace("-", "–")
    travel = FLIGHT_FACTORS.get(flight_key, 0.0)
    
    total = transport + electricity + diet + shopping + travel
    
    carbon_data = CarbonData(
        transportation=transport,
        electricity=electricity,
        food=diet,
        shopping=shopping,
        travel=travel,
        total=total
    )
    
    # Calculate Eco Score
    deductions = (
        TRANSPORT_DEDUCTIONS.get(req.transportation, 0) +
        ELECTRICITY_DEDUCTIONS.get(elec_key, 0) +
        DIET_DEDUCTIONS.get(req.diet, 0) +
        SHOPPING_DEDUCTIONS.get(req.shopping, 0) +
        FLIGHT_DEDUCTIONS.get(flight_key, 0)
    )
    eco_score = max(0, 100 - deductions)
    
    return carbon_data, eco_score

def get_emission_contributors(carbon_data: CarbonData) -> Tuple[str, List[str], List[str]]:
    """
    Categorizes contributors into Largest, Medium, and Low based on carbon values.
    """
    categories = [
        ("Transportation Habits", carbon_data.transportation),
        ("Electricity Consumption", carbon_data.electricity),
        ("Dietary Choices", carbon_data.food),
        ("Shopping & Consumer Habits", carbon_data.shopping),
        ("Flight Travel", carbon_data.travel)
    ]
    
    # Sort categories by footprint descending
    sorted_categories = sorted(categories, key=lambda x: x[1], reverse=True)
    
    largest = sorted_categories[0][0]
    medium = [sorted_categories[1][0], sorted_categories[2][0]]
    low = [sorted_categories[3][0], sorted_categories[4][0]]
    
    return largest, medium, low

def generate_recommendations(req: AssessmentRequest) -> List[Recommendation]:
    """
    Generates a prioritized list of recommendations using mathematical ranking.
    Formula: priority_score = (impact_score * 3) + (5 - difficulty_score) * 2
    """
    recommendations_pool = []
    
    # Transportation
    if req.transportation == "Car":
        recommendations_pool.append(Recommendation(
            title="Switch to Public Transit or Active Commuting",
            impact="High",
            difficulty="Medium",
            reduction=1500,
            impact_score=4,
            difficulty_score=3,
            priority_score=0
        ))
        recommendations_pool.append(Recommendation(
            title="Carpool or Practice Eco-Driving Techniques",
            impact="Medium",
            difficulty="Easy",
            reduction=800,
            impact_score=3,
            difficulty_score=2,
            priority_score=0
        ))
    elif req.transportation == "Public Transport":
        recommendations_pool.append(Recommendation(
            title="Adopt Active Transport (Walk/Bicycle) for Short Trips",
            impact="Medium",
            difficulty="Easy",
            reduction=200,
            impact_score=2,
            difficulty_score=2,
            priority_score=0
        ))

    # Electricity
    elec_key = req.electricity.replace("-", "–")
    if elec_key in ["4–8 Hours", "8+ Hours"]:
        recommendations_pool.append(Recommendation(
            title="Adjust Thermostat & Optimize Heating/AC Usage",
            impact="High",
            difficulty="Easy",
            reduction=450,
            impact_score=4,
            difficulty_score=2,
            priority_score=0
        ))
        if elec_key == "8+ Hours":
            recommendations_pool.append(Recommendation(
                title="Transition to Solar Power or Green Energy Tariffs",
                impact="Critical",
                difficulty="Hard",
                reduction=1200,
                impact_score=5,
                difficulty_score=4,
                priority_score=0
            ))
    if elec_key != "Rarely":
        recommendations_pool.append(Recommendation(
            title="Switch to Energy-Efficient LED Bulbs and Unplug Standby Devices",
            impact="Low",
            difficulty="Easy",
            reduction=150,
            impact_score=2,
            difficulty_score=1,
            priority_score=0
        ))

    # Diet
    if req.diet == "Meat Heavy":
        recommendations_pool.append(Recommendation(
            title="Transition Towards a Plant-Based Diet",
            impact="High",
            difficulty="Medium",
            reduction=1800,
            impact_score=4,
            difficulty_score=3,
            priority_score=0
        ))
        recommendations_pool.append(Recommendation(
            title="Implement 'Meatless Mondays' and Halve Red Meat Consumption",
            impact="Medium",
            difficulty="Easy",
            reduction=600,
            impact_score=3,
            difficulty_score=1,
            priority_score=0
        ))
    elif req.diet == "Mixed":
        recommendations_pool.append(Recommendation(
            title="Increase Plant-Based Meals and Choose Local Produce",
            impact="Medium",
            difficulty="Easy",
            reduction=600,
            impact_score=3,
            difficulty_score=2,
            priority_score=0
        ))
        recommendations_pool.append(Recommendation(
            title="Participate in Weekly Vegetarian Challenges",
            impact="Low",
            difficulty="Easy",
            reduction=250,
            impact_score=2,
            difficulty_score=1,
            priority_score=0
        ))

    # Shopping
    if req.shopping in ["Frequently", "Weekly"]:
        recommendations_pool.append(Recommendation(
            title="Buy Pre-Owned Goods and Support Circular Economy",
            impact="Medium",
            difficulty="Easy",
            reduction=500,
            impact_score=3,
            difficulty_score=2,
            priority_score=0
        ))
    recommendations_pool.append(Recommendation(
        title="Reduce Single-Use Plastics and Minimize Packaged Goods",
        impact="Low",
        difficulty="Easy",
        reduction=100,
        impact_score=1,
        difficulty_score=1,
        priority_score=0
    ))

    # Flights
    flight_key = req.flights.replace("-", "–")
    if flight_key in ["3–5", "5+"]:
        recommendations_pool.append(Recommendation(
            title="Minimize Long-Haul Air Travel & Optimize Vacation Travel",
            impact="Critical",
            difficulty="Medium",
            reduction=4000,
            impact_score=5,
            difficulty_score=3,
            priority_score=0
        ))
    if flight_key != "0":
        recommendations_pool.append(Recommendation(
            title="Invest in Gold-Standard Certified Carbon Offsets for Flights",
            impact="Medium",
            difficulty="Easy",
            reduction=400,
            impact_score=3,
            difficulty_score=1,
            priority_score=0
        ))

    # Fallback to ensure we have a robust list of at least 3
    if len(recommendations_pool) < 3:
        recommendations_pool.append(Recommendation(
            title="Start Composting Organic Waste to Lower Landfill Methane",
            impact="Low",
            difficulty="Easy",
            reduction=80,
            impact_score=2,
            difficulty_score=2,
            priority_score=0
        ))
        recommendations_pool.append(Recommendation(
            title="Opt for Digital Invoices & Paperless Deliveries",
            impact="Low",
            difficulty="Easy",
            reduction=20,
            impact_score=1,
            difficulty_score=1,
            priority_score=0
        ))

    # Calculate Priority Score and set it
    # Priority Score = impact_score * 3 + (5 - difficulty_score) * 2
    for r in recommendations_pool:
        r.priority_score = (r.impact_score * 3) + (5 - r.difficulty_score) * 2

    # Sort by priority score descending, then reduction descending
    sorted_recommendations = sorted(recommendations_pool, key=lambda x: (x.priority_score, x.reduction), reverse=True)
    
    return sorted_recommendations
