from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Olá, mundo! Esta é uma API de teste."}

if __name__ == "__main__":
    print("Iniciando servidor de teste na porta 8000...")
    uvicorn.run("simple_api:app", host="0.0.0.0", port=8000, reload=True)
