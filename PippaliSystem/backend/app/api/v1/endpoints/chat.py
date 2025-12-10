from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import google.generativeai as genai
from datetime import datetime
from app.db.session import get_db
from app.models.menu import MenuItem
from app.core.config import settings

router = APIRouter()

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("", response_model=ChatResponse)
def chat_with_menu(request: ChatRequest, db: Session = Depends(get_db)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    # 1. Fetch Menu Data
    items = db.query(MenuItem).filter(MenuItem.is_active == True).all()
    
    # 2. Format Context
    menu_context = "Here is the current menu for Pippali:\n\n"
    for item in items:
        tags = []
        if item.is_vegetarian: tags.append("Vegetarian")
        if item.is_vegan: tags.append("Vegan")
        if item.is_gluten_free: tags.append("GF")
        if item.dish_type: tags.append(item.dish_type)
        
        tag_str = f"[{', '.join(tags)}]" if tags else ""
        menu_context += f"- {item.name} ({item.base_price} kr) {tag_str}: {item.description or ''}\n"


    
    current_time = datetime.now().strftime("%A, %B %d, %Y at %H:%M")

    # 3. System Prompt
    system_prompt = f"""
    You are a helpful, friendly waiter at Pippali, an Indian restaurant.
    Your goal is to help customers choose dishes from the menu.
    
    CURRENT TIME: {current_time}
    
    RULES:
    - Only recommend items from the menu provided below.
    - If a user asks for something not on the menu, politely say we don't have it.
    - Be concise and enthusiastic.
    - If asked about dietary restrictions (vegan, gluten-free), check the tags carefully.
    - IMPORTANT: All meat served at Pippali is Halal.
    - Prices are in Danish Krone (kr).
    
    BUSINESS INFO:
    - Name: Pippali
    - Address: Herlev Bygade 34, 2730 Herlev
    - Phone: +45 44 42 99 99
    - Email: kontakt@pippali.dk
    - Opening Hours: 
        Monday - Thursday: 16:00 - 22:00
        Friday - Sunday: 12:00 - 22:00
    
    MENU:
    {menu_context}
    """

    # 4. Call Gemini
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_prompt]},
            {"role": "model", "parts": ["Understood! I am ready to help customers with the Pippali menu."]}
        ])
        
        response = chat.send_message(request.message)
        return {"response": response.text}
        
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service unavailable")
