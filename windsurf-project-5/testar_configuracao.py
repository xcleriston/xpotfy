#!/usr/bin/env python3
"""
Script para testar a configuração da API e credenciais
"""

import json
import os
from google_auth import GoogleCalendarAuth

def test_configuration():
    print("🔍 TESTANDO CONFIGURAÇÃO")
    print("=" * 50)
    
    # 1. Verificar arquivo de configuração
    config_file = 'config.json'
    if os.path.exists(config_file):
        print("✅ Arquivo config.json encontrado")
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        if 'google_api_key' in config:
            api_key = config['google_api_key']
            print(f"✅ Chave API encontrada: {api_key[:20]}...")
        else:
            print("⚠️ Chave API não encontrada no config.json")
    else:
        print("❌ Arquivo config.json não encontrado")
        return False
    
    # 2. Verificar arquivo de credenciais OAuth
    credentials_file = config.get('calendar', {}).get('credentials_file', 'credentials.json')
    if os.path.exists(credentials_file):
        print(f"✅ Arquivo {credentials_file} encontrado")
    else:
        print(f"❌ Arquivo {credentials_file} não encontrado")
        print("   Você precisa baixar as credenciais OAuth do Google Cloud Console")
        return False
    
    # 3. Testar autenticação
    print("\n🔐 Testando autenticação com Google...")
    try:
        auth = GoogleCalendarAuth(credentials_file)
        service = auth.authenticate()
        
        if service:
            print("✅ Autenticação bem-sucedida!")
            
            # Testar obter informações do calendário
            calendars = auth.get_calendars()
            primary_id = auth.get_primary_calendar_id()
            
            print(f"📅 Calendário principal: {primary_id}")
            print(f"📊 Total de calendários: {len(calendars)}")
            
            return True
        else:
            print("❌ Falha na autenticação")
            return False
            
    except Exception as e:
        print(f"❌ Erro na autenticação: {e}")
        return False

def show_next_steps():
    print("\n🚀 PRÓXIMOS PASSOS")
    print("=" * 50)
    print("1. Execute o teste da planilha:")
    print("   python testar_participantes.py")
    print()
    print("2. Execute a sincronização:")
    print("   python executar_sincronizacao.py")
    print()
    print("3. Ou execute diretamente:")
    print("   python main.py --file data/eventos_com_participantes.csv")

if __name__ == "__main__":
    success = test_configuration()
    
    if success:
        print("\n🎉 CONFIGURAÇÃO OK! Sistema pronto para usar.")
        show_next_steps()
    else:
        print("\n💥 CONFIGURAÇÃO COM PROBLEMAS")
        print("Verifique os itens acima e tente novamente.")
