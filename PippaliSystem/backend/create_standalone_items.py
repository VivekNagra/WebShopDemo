import requests
import json

API_URL = "http://localhost:8000/api/v1"

def create_standalone_items():
    # 1. Define Categories
    categories = [
        {"name": "Breads", "slug": "breads", "sort_order": 5},
        {"name": "Rice", "slug": "rice", "sort_order": 6}
    ]

    category_ids = {}

    # 2. Get or Create Categories
    print("Checking Categories...")
    existing_cats = requests.get(f"{API_URL}/categories/").json()
    
    for cat_data in categories:
        found = False
        for existing in existing_cats:
            if existing['name'] == cat_data['name']:
                category_ids[cat_data['name']] = existing['id']
                print(f"Category '{cat_data['name']}' exists (ID: {existing['id']})")
                found = True
                break
        
        if not found:
            print(f"Creating Category '{cat_data['name']}'...")
            res = requests.post(f"{API_URL}/categories/", json=cat_data)
            if res.status_code == 200:
                new_id = res.json()['id']
                category_ids[cat_data['name']] = new_id
                print(f"Created (ID: {new_id})")
            else:
                print(f"Error creating category: {res.text}")
                return

    # 3. Define Items
    bread_items = [
        {"name": "Chapati", "base_price": 29.0, "description": "Traditional flatbread"},
        {"name": "Plain Naan", "base_price": 35.0, "description": "Soft Indian bread baked in tandoor"},
        {"name": "Butter Naan", "base_price": 39.0, "description": "Naan topped with butter"},
        {"name": "Garlic Naan", "base_price": 39.0, "description": "Naan topped with garlic and coriander"},
        {"name": "Kashmiri Naan", "base_price": 49.0, "description": "Sweet naan with dried fruits and nuts"},
        {"name": "Special Denmark Nut Naan", "base_price": 49.0, "description": "Special naan with nuts"},
        {"name": "Cheese Naan", "base_price": 59.0, "description": "Naan stuffed with cheese"},
        {"name": "Paneer Naan", "base_price": 59.0, "description": "Naan stuffed with cottage cheese"}
    ]

    rice_items = [
        {"name": "Plain White Rice", "base_price": 19.0, "description": "Steamed basmati rice"},
        {"name": "Pulao Rice", "base_price": 39.0, "description": "Basmati rice cooked with aromatic spices"}
    ]

    # 4. Create Items
    def create_items(items, cat_name):
        cat_id = category_ids.get(cat_name)
        if not cat_id:
            print(f"Skipping {cat_name} items (Category ID not found)")
            return

        print(f"\nCreating items for {cat_name}...")
        # Get existing items to avoid duplicates
        existing_items = requests.get(f"{API_URL}/menu/").json()
        existing_names = [i['name'] for i in existing_items]

        for item in items:
            if item['name'] in existing_names:
                print(f"Item '{item['name']}' already exists. Skipping.")
                continue

            item_data = {
                **item,
                "category_id": cat_id,
                "is_vegetarian": True,
                "is_vegan": "Butter" not in item['name'] and "Cheese" not in item['name'] and "Paneer" not in item['name'],
                "is_gluten_free": False, # Naan is usually not GF
                "is_available": True,
                "spice_level": 0,
                "option_group_ids": [] # Standalone items usually don't have these specific options, or maybe they do? keeping empty for now
            }

            print(f"Creating '{item['name']}'...")
            res = requests.post(f"{API_URL}/menu/", json=item_data)
            if res.status_code == 200:
                print("  -> Success")
            else:
                print(f"  -> Failed: {res.text}")

    create_items(bread_items, "Breads")
    create_items(rice_items, "Rice")

if __name__ == "__main__":
    create_standalone_items()
