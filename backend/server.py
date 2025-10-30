from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import subprocess
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class GitPushRequest(BaseModel):
    username: str
    token: str
    repoName: str
    commitMsg: Optional[str] = None
    action: str = "new"  # 'new' or 'overwrite'

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/gitpush")
async def git_push(request: GitPushRequest):
    """
    Execute git push to GitHub using the shell script
    """
    try:
        # Validate action
        if request.action not in ["new", "overwrite"]:
            raise HTTPException(status_code=400, detail="Action must be 'new' or 'overwrite'")
        
        # Set default commit message if not provided
        commit_msg = request.commitMsg or f"Backup - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Path to the shell script
        script_path = "/app/gitpush.sh"
        
        if not os.path.exists(script_path):
            raise HTTPException(status_code=500, detail="Git push script not found")
        
        # Execute the shell script with parameters
        logger.info(f"Executing git push for repo: {request.repoName}")
        
        process = await asyncio.create_subprocess_exec(
            script_path,
            request.username,
            request.token,
            request.repoName,
            request.action,
            commit_msg,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        output = stdout.decode() if stdout else ""
        error_output = stderr.decode() if stderr else ""
        
        if process.returncode == 0:
            logger.info(f"Git push successful for {request.repoName}")
            return {
                "success": True,
                "message": f"Successfully pushed to https://github.com/{request.username}/{request.repoName}",
                "output": output,
                "repo_url": f"https://github.com/{request.username}/{request.repoName}"
            }
        else:
            logger.error(f"Git push failed: {error_output}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Git push failed",
                    "details": error_output or output
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during git push: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()