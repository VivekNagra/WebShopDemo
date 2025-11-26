import requests
import json

API_URL = "http://localhost:8000/api/v1"

def verify_menu_options():
    print("Fetching menu items...")
    items_res = requests.get(f"{API_URL}/menu/")
    items = items_res.json()
    
    keywords = ["Butter Chicken", "Paneer Tikka Masala"]
    
    for item in items:
        if any(k.lower() in item['name'].lower() for k in keywords):
            print(f"\nItem: {item['name']} (ID: {item['id']})")
            print("Option Groups:")
            if item.get('option_groups'):
                for group in item['option_groups']:
                    print(f"  - {group['name']} (ID: {group['id']})")
                    for opt in group['options']:
                        print(f"    * {opt['name']} (+{opt['price_delta']})")
            else:
                print("  [NO OPTION GROUPS LINKED]")

if __name__ == "__main__":
    verify_menu_options()
