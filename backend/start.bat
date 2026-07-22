@echo off
REM ============================================================
REM  VCET Hall Reservation — Backend Startup Script
REM
REM  USAGE:
REM    1. Get Session Pooler connection string from:
REM       https://supabase.com/dashboard/project/jwsngfryxtrlkhcxbjhy/settings/database
REM    2. Set SPRING_DATASOURCE_URL below, OR run as-is (direct connection)
REM    3. Double-click this file OR run from cmd:  start.bat
REM ============================================================

REM --- Option A: Use Session Pooler (paste your URL from Supabase dashboard here) ---
REM SET SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
REM SET SPRING_DATASOURCE_USERNAME=postgres.jwsngfryxtrlkhcxbjhy
REM SET SPRING_DATASOURCE_PASSWORD=Erlinghaaland

REM --- Option B: Direct connection (requires IPv6 network support) ---
REM The default in application.properties (db.jwsngfryxtrlkhcxbjhy.supabase.co)

echo Starting VCET Hall Reservation Backend...
echo Backend will be available at: http://localhost:8080
echo.

java -jar target\hall-reservation-1.0.0.jar

pause
