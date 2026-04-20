@echo off
echo 🎨 ABRINDO PROPOSTA COMERCIAL ESTÚDIO 33
echo =====================================
echo.
echo ✅ Arquivo: proposta-estudio33.html
echo 📁 Local: %~dp0
echo.
echo 🔄 Abrindo no navegador padrão...
echo.

REM Tenta abrir com diferentes métodos
start "" "%~dp0proposta-estudio33.html" 2>nul
if errorlevel 1 (
    echo 🔄 Tentando método alternativo...
    explorer "%~dp0proposta-estudio33.html" 2>nul
    if errorlevel 1 (
        echo 🔄 Tentando PowerShell...
        powershell -Command "Start-Process '%~dp0proposta-estudio33.html'" 2>nul
        if errorlevel 1 (
            echo ❌ Erro ao abrir arquivo
            echo 📋 Abra manualmente: %~dp0proposta-estudio33.html
            pause
        ) else (
            echo ✅ Aberto com PowerShell!
        )
    ) else (
        echo ✅ Aberto com Explorer!
    )
) else (
    echo ✅ Aberto com sucesso!
)

echo.
echo 📄 Para gerar PDF:
echo 1. Pressione Ctrl+P no navegador
echo 2. Selecione "Salvar como PDF"
echo 3. Configure margens: Nenhuma
echo 4. Salve com nome: PROPOSTA_ESTUDIO33.pdf
echo.
echo 🎯 Estúdio 33 - Tecnologia que Inspira!
echo.
pause
