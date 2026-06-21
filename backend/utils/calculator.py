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
            priority_score=0,
            explanation="Car commuting is your largest emission source. Swapping to public transit or cycling could save 1,500 kg CO2/year.",
            why_recommended="Your assessment indicates high vehicle usage as a primary mode of daily travel.",
            expected_impact="Reduces transportation emissions by up to 50% through shared transit integration.",
            confidence_level="High"
        ))
        recommendations_pool.append(Recommendation(
            title="Carpool or Practice Eco-Driving Techniques",
            impact="Medium",
            difficulty="Easy",
            reduction=800,
            impact_score=3,
            difficulty_score=2,
            priority_score=0,
            explanation="Since you rely on a car, carpooling and maintaining steady speeds can reduce your fuel usage and emissions by up to 25%.",
            why_recommended="You commute via Car, presenting a solid opportunity to share rides or drive more efficiently.",
            expected_impact="Carpooling halves single-rider emissions, saving up to 800 kg CO2/year.",
            confidence_level="Medium"
        ))
    elif req.transportation == "Public Transport":
        recommendations_pool.append(Recommendation(
            title="Adopt Active Transport (Walk/Bicycle) for Short Trips",
            impact="Medium",
            difficulty="Easy",
            reduction=200,
            impact_score=2,
            difficulty_score=2,
            priority_score=0,
            explanation="Using active transport like walking or biking for short trips is a low-difficulty habit that eliminates localized car start emissions.",
            why_recommended="You use Public Transport but short trips can be converted to zero-emission active transit.",
            expected_impact="Reduces short-distance transit footprints to zero.",
            confidence_level="High"
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
            priority_score=0,
            explanation="Your high electricity usage (4-8+ hours of peak appliances) can be reduced easily by setting your thermostat 2°C higher in summer or lower in winter.",
            why_recommended="You run active climate control devices (AC/heating) for 4+ hours daily.",
            expected_impact="Lowers heating/cooling electricity load by up to 15% immediately.",
            confidence_level="High"
        ))
        if elec_key == "8+ Hours":
            recommendations_pool.append(Recommendation(
                title="Transition to Solar Power or Green Energy Tariffs",
                impact="Critical",
                difficulty="Hard",
                reduction=1200,
                impact_score=5,
                difficulty_score=4,
                priority_score=0,
                explanation="With more than 8 hours of high electricity usage daily, transitioning to solar power or a green tariff eliminates grid-based fossil fuel emissions.",
                why_recommended="Your daily AC/heating run time exceeds 8 hours, placing you in the highest household energy bracket.",
                expected_impact="Offsets fossil fuel grid consumption with 100% renewable power generation.",
                confidence_level="High"
            ))
    if elec_key != "Rarely":
        recommendations_pool.append(Recommendation(
            title="Switch to Energy-Efficient LED Bulbs and Unplug Standby Devices",
            impact="Low",
            difficulty="Easy",
            reduction=150,
            impact_score=2,
            difficulty_score=1,
            priority_score=0,
            explanation="Switching to LED bulbs and shutting down standby devices eliminates 'vampire draw', which accounts for up to 10% of household power.",
            why_recommended="You use household electricity daily and have room to optimize standby consumption.",
            expected_impact="Reduces ambient standby power (vampire load) and lighting energy usage.",
            confidence_level="High"
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
            priority_score=0,
            explanation="Meat-heavy diets have a very high methane footprint. Shifting to plant-based options significantly lowers land and water use impact.",
            why_recommended="You specified a meat-heavy diet, which generates high methane and agricultural footprint.",
            expected_impact="Halves food-related emissions by replacing intensive animal protein with plants.",
            confidence_level="High"
        ))
        recommendations_pool.append(Recommendation(
            title="Implement 'Meatless Mondays' and Halve Red Meat Consumption",
            impact="Medium",
            difficulty="Easy",
            reduction=600,
            impact_score=3,
            difficulty_score=1,
            priority_score=0,
            explanation="Reducing red meat consumption by half or dedicating one day a week to plant meals is an easy gateway to low-emission eating.",
            why_recommended="You listed a meat-heavy diet; implementing a single vegetarian day is a low-barrier start.",
            expected_impact="Lowers weekly diet-associated greenhouse gas outputs by 15%.",
            confidence_level="High"
        ))
    elif req.diet == "Mixed":
        recommendations_pool.append(Recommendation(
            title="Increase Plant-Based Meals and Choose Local Produce",
            impact="Medium",
            difficulty="Easy",
            reduction=600,
            impact_score=3,
            difficulty_score=2,
            priority_score=0,
            explanation="Adding more plant meals and purchasing locally produced ingredients reduces transportation emissions associated with food shipping.",
            why_recommended="You have a mixed diet; swapping some items for local plants reduces logistics emissions.",
            expected_impact="Reduces food miles and supports low-emission farming methods.",
            confidence_level="Medium"
        ))
        recommendations_pool.append(Recommendation(
            title="Participate in Weekly Vegetarian Challenges",
            impact="Low",
            difficulty="Easy",
            reduction=250,
            impact_score=2,
            difficulty_score=1,
            priority_score=0,
            explanation="Joining weekly vegetarian challenges builds habits while saving about 250 kg CO2/year over mixed diets.",
            why_recommended="You have a mixed diet and can transition further into low-impact vegetarian meals.",
            expected_impact="Gamifies sustainability to steadily reduce diet footprint.",
            confidence_level="Medium"
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
            priority_score=0,
            explanation="Weekly or frequent shopping increases production emissions. Buying pre-owned extends product lifespans and reduces demand for new manufacturing.",
            why_recommended="You shop weekly or frequently, resulting in high packaging and manufacturing emissions.",
            expected_impact="Prevents emissions from new production cycles by reusing goods.",
            confidence_level="High"
        ))
    recommendations_pool.append(Recommendation(
        title="Reduce Single-Use Plastics and Minimize Packaged Goods",
        impact="Low",
        difficulty="Easy",
        reduction=100,
        impact_score=1,
        difficulty_score=1,
        priority_score=0,
        explanation="Minimizing packaged goods reduces manufacturing and waste emissions, helping lower your overall consumer footprint.",
        why_recommended="Your shopping choices indicate regular purchases of consumer goods.",
        expected_impact="Prevents plastics waste and upstream chemical production emissions.",
        confidence_level="Medium"
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
            priority_score=0,
            explanation="Frequent flights (3+ per year) contribute immensely to your footprint. Reducing one long-haul flight yields the largest single carbon saving.",
            why_recommended="You take 3+ flights per year, which is a major driver of high-altitude greenhouse gas emissions.",
            expected_impact="Directly removes high-altitude radiative forcing emissions.",
            confidence_level="High"
        ))
    if flight_key != "0":
        recommendations_pool.append(Recommendation(
            title="Invest in Gold-Standard Certified Carbon Offsets for Flights",
            impact="Medium",
            difficulty="Easy",
            reduction=400,
            impact_score=3,
            difficulty_score=1,
            priority_score=0,
            explanation="Since you fly, buying gold-standard carbon offsets helps fund renewable projects that balance out your high-altitude flight emissions.",
            why_recommended="You take annual flights; offsetting balances residual high-altitude emissions.",
            expected_impact="Finances certified carbon sink or renewable projects globally.",
            confidence_level="Medium"
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
            priority_score=0,
            explanation="Composting organic waste prevents anaerobic decomposition in landfills, reducing methane emissions.",
            why_recommended="Organic waste handling was not optimized in your profile.",
            expected_impact="Eliminates landfill methane outputs from organic decay.",
            confidence_level="High"
        ))
        recommendations_pool.append(Recommendation(
            title="Opt for Digital Invoices & Paperless Deliveries",
            impact="Low",
            difficulty="Easy",
            reduction=20,
            impact_score=1,
            difficulty_score=1,
            priority_score=0,
            explanation="Choosing paperless billing is a simple, zero-effort adjustment that reduces paper manufacturing waste and logistics emissions.",
            why_recommended="Standard housekeeping recommendation for low-effort carbon reduction.",
            expected_impact="Conserves timber resources and prevents delivery transport mileage.",
            confidence_level="High"
        ))

    # Calculate Priority Score and set it
    # Priority Score = impact_score * 3 + (5 - difficulty_score) * 2
    for r in recommendations_pool:
        r.priority_score = (r.impact_score * 3) + (5 - r.difficulty_score) * 2

    # Sort by priority score descending, then reduction descending
    sorted_recommendations = sorted(recommendations_pool, key=lambda x: (x.priority_score, x.reduction), reverse=True)
    
    return sorted_recommendations
