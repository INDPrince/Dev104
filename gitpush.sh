#!/bin/bash

# Fix HOME path (important for Git in some servers)
export HOME=/root

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get parameters from command line
USERNAME="$1"
TOKEN="$2"
REPO_NAME="$3"
ACTION="$4"  # 'new' or 'overwrite'
COMMIT_MSG="${5:-Backup - $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   GitHub Auto Push Tool${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Validate inputs
if [ -z "$USERNAME" ] || [ -z "$TOKEN" ] || [ -z "$REPO_NAME" ]; then
    echo -e "${RED}❌ Missing required parameters!${NC}"
    echo "Usage: $0 <username> <token> <repo_name> <action> [commit_msg]"
    exit 1
fi

echo -e "${BLUE}🚀 Starting process...${NC}\n"
echo -e "Username: ${YELLOW}$USERNAME${NC}"
echo -e "Repository: ${YELLOW}$REPO_NAME${NC}"
echo -e "Action: ${YELLOW}$([ "$ACTION" = "overwrite" ] && echo "Overwrite existing" || echo "Create new")${NC}\n"

# Navigate to app directory
cd /app

# Clear .git folder if pushing to new repo to avoid conflicts
if [ "$ACTION" = "new" ]; then
    if [ -d ".git" ]; then
        echo -e "${YELLOW}🗑️  Removing old .git folder for fresh push...${NC}"
        rm -rf .git
        echo -e "${GREEN}✅ Old git data cleared${NC}\n"
    fi
fi

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}📦 Initializing git...${NC}"
    git init
    echo -e "${GREEN}✅ Git initialized${NC}\n"
fi

# Add all files
echo -e "${YELLOW}📁 Adding all files...${NC}"
git add .
echo -e "${GREEN}✅ Files added${NC}\n"

# Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Changes committed${NC}\n"

# Create new repo if needed
if [ "$ACTION" = "new" ]; then
    echo -e "${YELLOW}🔨 Creating new repository on GitHub...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"private\":false}")
    
    if echo "$RESPONSE" | grep -q '"id"'; then
        echo -e "${GREEN}✅ Repository created: https://github.com/$USERNAME/$REPO_NAME${NC}\n"
    else
        echo -e "${RED}⚠️  Repository might already exist or error occurred${NC}"
        echo -e "${YELLOW}Continuing with push...${NC}\n"
    fi
fi

# Set up remote
REPO_URL="https://$TOKEN@github.com/$USERNAME/$REPO_NAME.git"

if git remote | grep -q "origin"; then
    echo -e "${YELLOW}🔗 Updating remote URL...${NC}"
    git remote set-url origin "$REPO_URL"
else
    echo -e "${YELLOW}🔗 Adding remote...${NC}"
    git remote add origin "$REPO_URL"
fi
echo -e "${GREEN}✅ Remote configured${NC}\n"

# Set main branch
echo -e "${YELLOW}🌿 Setting main branch...${NC}"
git branch -M main
echo -e "${GREEN}✅ Branch set to main${NC}\n"

# Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
if [ "$ACTION" = "overwrite" ]; then
    git push -f origin main
else
    git push -u origin main
fi

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ SUCCESS!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Repository: https://github.com/$USERNAME/$REPO_NAME${NC}"
    echo -e "${GREEN}Action: $([ "$ACTION" = "new" ] && echo "New repo created" || echo "Repo overwritten")${NC}"
    echo -e "${GREEN}========================================${NC}\n"
    exit 0
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}❌ PUSH FAILED!${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Check your token permissions or network${NC}\n"
    exit 1
fi
