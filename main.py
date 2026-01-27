import ollama
from rich.console import Console
from rich.markdown import Markdown
from location import get_current_location
from weather import get_tomorrow_8_to_5_weather_report, _get_tomorrow_weather_report_internal
import json

def query_model(system_prompt: str, user_prompt: str) -> str:
    """
    Interacts with a locally running Ollama model to generate a response.

    Args:
        system_prompt: The system prompt to set the context for the model.
        user_prompt: The user's query or prompt.

    Returns:
        The content of the model's response.
    """
    messages = [
        {'role': 'system', 'content': system_prompt},
        {'role': 'user', 'content': user_prompt},
    ]
    print("Asking model...")
    response = ollama.chat(model='gpt-oss:20b', messages=messages)
    return response['message']['content']


def main():
    console = Console()
    print("Starting the clothing agent...")

    with open('locations.json', 'r') as f:
        locations = json.load(f)

    location_options = "(1) Current Location (by IP)\n"
    for i, loc in enumerate(locations):
        location_options += f"        ({i+2}) {loc['name']}\n"

    choice = input(f"Choose location: \n{location_options}")

    altitude = 0
    try:
        choice_int = int(choice)
        if choice_int == 1:
            print("Detecting your location...")
            latitude, longitude, state = get_current_location()
            if not latitude:
                print("Could not detect your location. Please restart and try again.")
                return
            name = "Current Location"
            # We don't have elevation for current location, so we assume it's below 1200m
        elif 2 <= choice_int <= len(locations) + 1:
            selected_loc = locations[choice_int - 2]
            latitude = selected_loc['latitude']
            longitude = selected_loc['longitude']
            name = selected_loc['name']
            state = selected_loc['state']
            altitude = selected_loc.get('elevation', 0)
        else:
            raise ValueError
    except (ValueError, IndexError):
        print("Invalid choice. Please restart and try again.")
        return

    outing_type = input("Is this for a (1) kid's outing or (2) an adult's outing? ")
    
    print(f"Latitude, longitude, altitude: {latitude}, {longitude}, {altitude}m")
    print(f"Location: {name}")

    # --- Step 2: Get Weather ---
    print("Checking the weather near you...")
    
    is_adult_high_elevation = outing_type == '2' and altitude > 1200
    
    snow_weather_codes = {71, 73, 75, 77, 85, 86}
    
    if is_adult_high_elevation:
        report, summary, points = _get_tomorrow_weather_report_internal(latitude, longitude, 0, 23) # Get full day to check for snow
        is_snowy = any(p.weather_code in snow_weather_codes for p in points)
        if is_snowy:
            report, summary, points = _get_tomorrow_weather_report_internal(latitude, longitude, 7, 18)
            time_window = "7am-6pm"
        else:
            report, summary, points = _get_tomorrow_weather_report_internal(latitude, longitude, 0, 23)
            time_window = "full day"
    else:
        report, summary, points = get_tomorrow_8_to_5_weather_report(latitude, longitude)
        is_snowy = any(p.weather_code in snow_weather_codes for p in points) # Still check for snow for general advice
        time_window = "8am-5pm"

    print(f"Weather Report Tomorrow {time_window}: {report}")
    
    # --- Reflection
    if is_adult_high_elevation and is_snowy:
        weather_system_prompt = (
            "You are an assistant that determines what clothing and layering should we wear for ski touring in certain weather conditions."
        )
        weather_prompt = (
            f"Based on this forecast, how should we be dressed for ski touring between 7am-6pm? Write a short and concise list of clothes. Limit response to 5 sentences."
            f"Weather Report: {report}"
        )
    else:
        weather_system_prompt = (
            "You are an assistant that determines what clothing and layering should we wear outdoors in certain weather conditions."
        )
        weather_prompt = (
            f"Based on this forecast, how should we be dressed for outdoor activities during the {time_window}? Write a short and concise list of clothes. Limit response to 5 sentences."
            f"Weather Report: {report}"
        )

    model_decision = query_model(
        weather_system_prompt,
        weather_prompt
    ).lower()

    console.print(Markdown(model_decision))



if __name__ == "__main__":
    main()