import requests
import json

API_URL = "http://localhost:8000/api/v1"

def list_menu_structure():
    print("Fetching categories...")
    categories = requests.get(f"{API_URL}/categories/").json()
    
    print("Fetching menu items...")
    items = requests.get(f"{API_URL}/menu/").json()
    
    print("\n--- Current Menu Structure ---")
    for cat in categories:
        print(f"\nCategory: {cat['name']} (ID: {cat['id']})")
        cat_items = [i for i in items if i['category_id'] == cat['id']]
        for item in cat_items:
            print(f"  - {item['name']}")

if __name__ == "__main__":
    list_menu_structure()
