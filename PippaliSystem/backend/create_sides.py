import requests

API_URL = "http://localhost:8000/api/v1"

def create_sides_group():
    # 1. Create Option Group
    group_data = {
        "name": "Accompaniments",
        "is_required": False,
        "allows_multiple": True, # Multi-select!
        "options": [
            {"name": "Extra Rice", "price_modifier": 20.0},
            {"name": "Butter Naan", "price_modifier": 35.0},
            {"name": "Garlic Naan", "price_modifier": 40.0},
            {"name": "Raita", "price_modifier": 25.0}
        ]
    }
    
    print("Creating 'Accompaniments' group...")
    response = requests.post(f"{API_URL}/option-groups/", json=group_data)
    if response.status_code != 200:
        print(f"Error creating group: {response.text}")
        return
    
    group = response.json()
    group_id = group['id']
    print(f"Group created! ID: {group_id}")

    # 2. Find a Menu Item to attach to (e.g., a Curry)
    # Let's fetch all items and find one with 'Chicken' or 'Curry'
    print("Fetching menu items...")
    items_res = requests.get(f"{API_URL}/menu/")
    items = items_res.json()
    
    target_item = None
    for item in items:
        if "Chicken" in item['name'] or "Curry" in item['name'] or "Tikka" in item['name']:
            target_item = item
            break
    
    if not target_item:
        print("No suitable menu item found to attach options to.")
        return

    print(f"Attaching to item: {target_item['name']} (ID: {target_item['id']})")
    
    # 3. Update Menu Item with new Option Group
    # We need to preserve existing option groups if any
    existing_group_ids = [g['id'] for g in target_item.get('option_groups', [])]
    if group_id not in existing_group_ids:
        existing_group_ids.append(group_id)
    
    update_data = {
        "option_group_ids": existing_group_ids
    }
    
    update_res = requests.put(f"{API_URL}/menu/{target_item['id']}", json=update_data)
    
    if update_res.status_code == 200:
        print("Successfully linked 'Accompaniments' to menu item!")
    else:
        print(f"Error updating menu item: {update_res.text}")

if __name__ == "__main__":
    create_sides_group()
