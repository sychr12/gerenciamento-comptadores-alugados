@echo off
setlocal
pushd "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
    echo ERRO: Docker nao foi encontrado no PATH.
    echo Instale e inicie o Docker Desktop e tente novamente.
    pause
    popd
    exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
    echo ERRO: o Docker Desktop nao esta em execucao.
    echo Inicie o Docker Desktop e tente novamente.
    pause
    popd
    exit /b 1
)

if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo Arquivo .env criado a partir do modelo. Altere a senha do banco antes de uso compartilhado.
)

echo Iniciando a aplicacao e o PostgreSQL com Docker Compose...
echo Acesse http://127.0.0.1:8000 quando os servicos estiverem prontos.
echo Pressione Ctrl+C para encerrar os containers.
docker compose up --build

if errorlevel 1 (
    echo O Docker Compose terminou com erro. Confira as mensagens acima.
    pause
)

popd
endlocal
