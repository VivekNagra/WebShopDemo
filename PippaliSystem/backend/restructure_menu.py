import requests
import json

API_URL = "http://localhost:8000/api/v1"

def restructure_menu():
    # 1. Define New Categories
    new_categories = [
        {"name": "Chicken Dishes", "slug": "chicken-dishes", "sort_order": 2},
        {"name": "Lamb Dishes", "slug": "lamb-dishes", "sort_order": 3},
        {"name": "Vegetarian Dishes", "slug": "vegetarian-dishes", "sort_order": 4}
    ]

    category_ids = {}

    # 2. Create Categories
    print("Creating New Categories...")
    existing_cats = requests.get(f"{API_URL}/categories/").json()
    
    for cat_data in new_categories:
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

    # 3. Move Existing Items
    print("\nMoving Existing Items...")
    items = requests.get(f"{API_URL}/menu/").json()
    
    moves = {
        "Butter Chicken": "Chicken Dishes",
        "Lamb Rogan Josh": "Lamb Dishes",
        "Paneer Tikka Masala": "Vegetarian Dishes"
    }

    for item_name, target_cat in moves.items():
        item = next((i for i in items if i['name'] == item_name), None)
        if item:
            target_cat_id = category_ids.get(target_cat)
            if target_cat_id:
                print(f"Moving '{item_name}' to '{target_cat}'...")
                
                # Prepare update data (full object required for PUT)
                update_data = {
                    "name": item['name'],
                    "description": item.get('description', ""),
                    "base_price": item['base_price'],
                    "category_id": target_cat_id, # NEW CATEGORY
                    "is_vegetarian": item.get('is_vegetarian', False),
                    "is_vegan": item.get('is_vegan', False),
                    "is_gluten_free": item.get('is_gluten_free', False),
                    "is_available": item.get('is_available', True),
                    "spice_level": item.get('spice_level', 0),
                    "sort_order": item.get('sort_order', 0),
                    "option_group_ids": [g['id'] for g in item.get('option_groups', [])]
                }
                
                res = requests.put(f"{API_URL}/menu/{item['id']}", json=update_data)
                if res.status_code == 200:
                    print("  -> Success")
                else:
                    print(f"  -> Failed: {res.text}")
            else:
                print(f"Target category '{target_cat}' not found.")
        else:
            print(f"Item '{item_name}' not found.")

    # 4. Add New Placeholder Items
    print("\nAdding New Items...")
    new_items = [
        {"name": "Chicken Tikka Masala", "category": "Chicken Dishes", "base_price": 129.0, "description": "Grilled chicken in spicy tomato gravy", "is_vegetarian": False},
        {"name": "Chicken Korma", "category": "Chicken Dishes", "base_price": 129.0, "description": "Mild creamy chicken curry with nuts", "is_vegetarian": False},
        {"name": "Lamb Korma", "category": "Lamb Dishes", "base_price": 139.0, "description": "Mild creamy lamb curry", "is_vegetarian": False},
        {"name": "Lamb Spinach", "category": "Lamb Dishes", "base_price": 139.0, "description": "Lamb cooked with fresh spinach", "is_vegetarian": False},
        {"name": "Palak Paneer", "category": "Vegetarian Dishes", "base_price": 119.0, "description": "Cottage cheese in spinach gravy", "is_vegetarian": True},
        {"name": "Dal Makhani", "category": "Vegetarian Dishes", "base_price": 109.0, "description": "Creamy black lentils", "is_vegetarian": True}
    ]

    # Get option groups to link automatically
    rice_group_id = next((g['id'] for g in requests.get(f"{API_URL}/option-groups/").json() if g['slug'] == 'rice'), None)
    naan_group_id = next((g['id'] for g in requests.get(f"{API_URL}/option-groups/").json() if g['slug'] == 'naan-breads'), None)
    
    option_group_ids = []
    if rice_group_id: option_group_ids.append(rice_group_id)
    if naan_group_id: option_group_ids.append(naan_group_id)

    existing_names = [i['name'] for i in items] # Refresh list? No, just use what we fetched earlier + check manually

    for item in new_items:
        # Check if exists (simple check against initial fetch, might miss if run multiple times without refresh, but okay for now)
        # Better: check against current DB state
        # For simplicity, let's just try to create and ignore if duplicate name error (or check manually)
        
        # Actually, let's just check against the list we have, assuming no one else is editing
        if item['name'] in existing_names:
             print(f"Item '{item['name']}' already exists. Skipping.")
             continue

        cat_id = category_ids.get(item['category'])
        if not cat_id:
            print(f"Category '{item['category']}' not found. Skipping.")
            continue

        item_data = {
            "name": item['name'],
            "description": item['description'],
            "base_price": item['base_price'],
            "category_id": cat_id,
            "is_vegetarian": item['is_vegetarian'],
            "is_vegan": False,
            "is_gluten_free": False,
            "is_available": True,
            "spice_level": 0,
            "option_group_ids": option_group_ids
        }

        print(f"Creating '{item['name']}'...")
        res = requests.post(f"{API_URL}/menu/", json=item_data)
        if res.status_code == 200:
            print("  -> Success")
        else:
            print(f"  -> Failed: {res.text}")

    # 5. Delete Old "Mains" Category
    print("\nCleaning up...")
    mains_cat = next((c for c in existing_cats if c['name'] == "Mains"), None)
    if mains_cat:
        # Check if empty? We moved the known items. If there are others, they will be orphaned or deleted?
        # Let's just delete the category.
        print(f"Deleting 'Mains' category (ID: {mains_cat['id']})...")
        res = requests.delete(f"{API_URL}/categories/{mains_cat['id']}")
        if res.status_code == 200:
            print("  -> Success")
        else:
            print(f"  -> Failed: {res.text}")
    else:
        print("'Mains' category not found.")

if __name__ == "__main__":
    restructure_menu()
