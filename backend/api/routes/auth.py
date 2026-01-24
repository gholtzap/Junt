from fastapi import APIRouter, HTTPException, Depends
from api.schemas import UserCreate, UserLogin, UserResponse, Token
from services.user import create_user, authenticate_user
from services.auth import create_access_token
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    user_doc = await create_user(user.email, user.username, user.password)

    if not user_doc:
        raise HTTPException(status_code=400, detail="Email or username already registered")

    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        username=user_doc["username"]
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await authenticate_user(credentials.email, credentials.password)

    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": str(user["_id"])})

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        username=current_user["username"]
    )
