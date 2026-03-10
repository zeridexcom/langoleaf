@echo off
echo ==========================================
echo LangoLeaf Freelancer Portal - Deploy Script
echo ==========================================
echo.

cd freelancer-portal

echo Step 1: Checking Git status...
git status

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Committing changes...
git commit -m "Update: Freelancer portal ready for deployment"

echo.
echo Step 4: Pushing to GitHub...
git push -u origin master

echo.
echo ==========================================
echo If push failed, try these commands manually:
echo.
echo git remote add origin https://github.com/zeridexcom/langoleaf.git
echo git push -u origin master --force
echo.
echo For Vercel deployment:
echo 1. Go to https://vercel.com/dashboard
echo 2. Click "Add New Project"
echo 3. Import from GitHub: zeridexcom/langoleaf
echo 4. Set environment variables from .env.local
echo ==========================================
pause
