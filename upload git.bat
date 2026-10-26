
@echo off
setlocal EnableExtensions
title Whatsrion - GitHub Upload

echo ==========================================
echo       Whatsrion Electron - Git Upload
echo ==========================================
echo.

set "REPO=%~dp0"
if exist "%REPO%.git\" goto repo_ok
if exist "%REPO%Whatsrion-Electron\.git\" set "REPO=%REPO%Whatsrion-Electron\"
if exist "%REPO%.git\" goto repo_ok

echo Pasta do Git nao encontrada.
echo Coloque este BAT dentro do repositorio
echo ou na pasta imediatamente acima dele.
pause
exit /b 1

:repo_ok
cd /d "%REPO%"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo Esta pasta nao e um repositorio Git.
    pause
    exit /b 1
)

echo Repositorio: %CD%
echo.

git remote -v
echo.
git branch --show-current
echo.

set /p "TAG=Versao da tag (ex: v1.0.0): "
if not defined TAG goto invalid_tag

git check-ref-format "refs/tags/%TAG%" >nul 2>&1
if errorlevel 1 goto invalid_tag

git show-ref --verify --quiet "refs/tags/%TAG%"
if not errorlevel 1 (
    echo Essa tag ja existe localmente!
    pause
    exit /b 1
)

git ls-remote --exit-code --tags origin "refs/tags/%TAG%" >nul 2>&1
if not errorlevel 1 (
    echo Essa tag ja existe no GitHub!
    pause
    exit /b 1
)

set /p "MSG=Mensagem do commit: "
if not defined MSG set "MSG=Update Whatsrion Electron"

echo.
echo Verificando alteracoes...
git status --short
echo.

set /p "CONF=Continuar com o upload e criar a tag %TAG%? (S/N): "
if /i not "%CONF%"=="S" exit /b 0

git add -A
if errorlevel 1 goto failed

git diff --cached --quiet
if not errorlevel 1 (
    echo.
    echo Nenhuma alteracao nova para commitar.
    echo A tag sera criada no commit atual.
    goto create_tag
)

git commit -m "%MSG%"
if errorlevel 1 goto failed

:create_tag
git tag -a "%TAG%" -m "Whatsrion Electron %TAG%"
if errorlevel 1 goto failed

echo.
echo Enviando branch main...
git push origin HEAD:main
if errorlevel 1 goto failed

echo.
echo Enviando tag %TAG%...
git push origin "refs/tags/%TAG%"
if errorlevel 1 goto failed

echo.
echo ==========================================
echo Upload e tag enviados com sucesso!
echo ==========================================
echo.
echo Repositorio:
echo https://github.com/azurion-dev/Whatsrion-Electron
echo.
echo Tag:
echo https://github.com/azurion-dev/Whatsrion-Electron/releases/tag/%TAG%
pause
exit /b 0

:invalid_tag
echo Nome de tag invalido ou vazio.
pause
exit /b 1

:failed
echo.
echo O Git retornou um erro. Confira as mensagens acima.
echo A tag local pode ter sido criada, mesmo se o push falhou.
echo Nao execute novamente com a mesma tag sem verificar.
pause
exit /b 1
