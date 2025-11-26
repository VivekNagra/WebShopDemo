import requests
import json

API_URL = "http://localhost:8000/api/v1"

def create_refined_options():
    # 1. Define the Groups
    rice_group_data = {
        "name": "Rice",
        "slug": "rice",
        "is_required": False,
        "allows_multiple": True,
        "options": [
            {"name": "Plain White Rice", "price_delta": 19.0},
            {"name": "Pulao Rice", "price_delta": 39.0}
        ]
    }

    naan_group_data = {
        "name": "Naan Breads",
        "slug": "naan-breads",
        "is_required": False,
        "allows_multiple": True,
        "options": [
            {"name": "Chapati", "price_delta": 29.0},
            {"name": "Plain Naan", "price_delta": 35.0},
            {"name": "Butter Naan", "price_delta": 39.0},
            {"name": "Garlic Naan", "price_delta": 39.0},
            {"name": "Kashmiri Naan", "price_delta": 49.0},
            {"name": "Special Denmark Nut Naan", "price_delta": 49.0},
            {"name": "Cheese Naan", "price_delta": 59.0},
            {"name": "Paneer Naan", "price_delta": 59.0}
        ]
    }

    # Helper to get or create group
    def get_or_create_group(group_data):
        # 1. Try to find existing group
        groups_res = requests.get(f"{API_URL}/option-groups/")
        if groups_res.status_code == 200:
            for g in groups_res.json():
                if g['slug'] == group_data['slug']:
                    print(f"Group '{group_data['name']}' already exists (ID: {g['id']})")
                    return g['id']
        
        # 2. Create if not found
        print(f"Creating '{group_data['name']}' group...")
        res = requests.post(f"{API_URL}/option-groups/", json=group_data)
        if res.status_code == 200:
            gid = res.json()['id']
            print(f"Group Created: {gid}")
            return gid
        else:
            print(f"Error creating group: {res.text}")
            return None

    rice_group_id = get_or_create_group(rice_group_data)
    naan_group_id = get_or_create_group(naan_group_data)

    if not rice_group_id or not naan_group_id:
        print("Failed to get group IDs. Aborting.")
        return

    # 3. Link to Curries
    print("Fetching menu items...")
    items_res = requests.get(f"{API_URL}/menu/")
    items = items_res.json()
    
    keywords = ["Curry", "Masala", "Korma", "Butter Chicken", "Vindaloo", "Madras", "Bhuna", "Saag"]
    
    count = 0
    for item in items:
        # Check if item name contains any of the keywords (case insensitive)
        if any(k.lower() in item['name'].lower() for k in keywords):
            print(f"Updating {item['name']}...")
            
            # Get existing groups
            existing_group_ids = [g['id'] for g in item.get('option_groups', [])]
            
            # Add new groups if not present
            if rice_group_id not in existing_group_ids:
                existing_group_ids.append(rice_group_id)
            if naan_group_id not in existing_group_ids:
                existing_group_ids.append(naan_group_id)
            
            # Prepare Update Data (Must include all required fields for PUT)
            update_data = {
                "name": item['name'],
                "description": item.get('description', ""),
                "base_price": item['base_price'],
                "category_id": item['category_id'],
                "is_vegetarian": item.get('is_vegetarian', False),
                "is_vegan": item.get('is_vegan', False),
                "is_gluten_free": item.get('is_gluten_free', False),
                "is_available": item.get('is_available', True),
                "spice_level": item.get('spice_level', 0),
                "sort_order": item.get('sort_order', 0),
                "option_group_ids": existing_group_ids
            }
            
            update_res = requests.put(f"{API_URL}/menu/{item['id']}", json=update_data)
            if update_res.status_code == 200:
                print(f"  -> Success")
                count += 1
            else:
                print(f"  -> Failed: {update_res.text}")

    print(f"Finished! Updated {count} items.")

if __name__ == "__main__":
    create_refined_options()
