from fastapi import APIRouter
from app.api.v1.endpoints import menu, orders, categories, options, chat

api_router = APIRouter()
api_router.include_router(menu.router, prefix="/menu", tags=["menu"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(options.router, prefix="/option-groups", tags=["option-groups"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
