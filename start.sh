#!/bin/bash

# Album Previewer Full Stack - Startup Script
# This script starts both the backend and frontend servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to prompt user for yes/no
prompt_yes_no() {
    local prompt_message="$1"
    while true; do
        read -p "$(echo -e ${YELLOW}${prompt_message}${NC}) (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Album Previewer Full Stack - Starting Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}ffmpeg is not installed${NC}"
    echo -e "${YELLOW}Installation commands:${NC}"
    echo "  macOS: brew install ffmpeg"
    echo "  Linux: sudo apt install ffmpeg"
    echo ""
    if prompt_yes_no "Have you installed ffmpeg and want to continue?"; then
        if ! command -v ffmpeg &> /dev/null; then
            echo -e "${RED}ffmpeg still not found. Please install it and try again.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Cannot continue without ffmpeg${NC}"
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}Virtual environment not found${NC}"
    if prompt_yes_no "Would you like to set up the Python virtual environment now?"; then
        echo -e "${YELLOW}Setting up virtual environment...${NC}"
        cd backend
        python3 -m venv venv || { echo -e "${RED}Failed to create virtual environment${NC}"; exit 1; }
        source venv/bin/activate
        echo -e "${YELLOW}Installing Python dependencies...${NC}"
        pip install -r requirements.txt || { echo -e "${RED}Failed to install dependencies${NC}"; exit 1; }
        cd ..
        echo -e "${GREEN}✓ Virtual environment set up successfully${NC}"
    else
        echo -e "${RED}Cannot continue without virtual environment${NC}"
        exit 1
    fi
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}Frontend dependencies not installed${NC}"
    if prompt_yes_no "Would you like to install frontend dependencies now?"; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        cd frontend
        npm install || { echo -e "${RED}Failed to install frontend dependencies${NC}"; exit 1; }
        cd ..
        echo -e "${GREEN}✓ Frontend dependencies installed successfully${NC}"
    else
        echo -e "${RED}Cannot continue without frontend dependencies${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check for processes using required ports and clean them up
echo -e "${YELLOW}Checking for port conflicts...${NC}"

# Check port 8000 (backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Port 8000 is already in use. Stopping existing processes...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Check port 5173 (frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Port 5173 is already in use. Stopping existing processes...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✓ Ports are available${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"

    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}Error: Backend failed to start${NC}"
    echo -e "${YELLOW}Last 10 lines of backend.log:${NC}"
    echo ""
    tail -n 10 backend.log
    echo ""
    echo -e "${YELLOW}Full log available at: backend.log${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}  API: http://localhost:8000${NC}"
echo -e "${BLUE}  Docs: http://localhost:8000/docs${NC}"
echo ""

# Start frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}Error: Frontend failed to start${NC}"
    echo -e "${YELLOW}Last 10 lines of frontend.log:${NC}"
    echo ""
    tail -n 10 frontend.log
    echo ""
    echo -e "${YELLOW}Full log available at: frontend.log${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}  App: http://localhost:5173${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Both services are running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Backend logs: ${NC}tail -f backend.log"
echo -e "${YELLOW}Frontend logs: ${NC}tail -f frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
