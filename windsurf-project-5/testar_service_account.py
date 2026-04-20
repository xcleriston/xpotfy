#!/usr/bin/env python3
"""
Script para testar a configuração com Service Account
"""

import json
import os
from google_auth_service import GoogleCalendarServiceAuth
from main_service import CalendarIntegratorService

def test_service_account():
    print("🔍 TESTANDO SERVICE ACCOUNT")
    print("=" * 50)
    
    # 1. Verificar arquivo de credenciais
    credentials_file = 'credentials.json'
    if os.path.exists(credentials_file):
        print(f"✅ Arquivo {credentials_file} encontrado")
        
        # Verificar se é service account
        try:
            with open(credentials_file, 'r') as f:
                creds = json.load(f)
            
            if 'type' in creds and creds['type'] == 'service_account':
                print("✅ Credenciais de Service Account detectadas")
                print(f"📧 Email: {creds.get('client_email', 'N/A')}")
                print(f"🔑 Project ID: {creds.get('project_id', 'N/A')}")
            else:
                print("⚠️ Não é um arquivo de Service Account")
                return False
        except Exception as e:
            print(f"❌ Erro ao ler credenciais: {e}")
            return False
    else:
        print(f"❌ Arquivo {credentials_file} não encontrado")
        return False
    
    # 2. Testar autenticação
    print("\n🔐 Testando autenticação com Service Account...")
    try:
        auth = GoogleCalendarServiceAuth(credentials_file)
        service = auth.authenticate()
        
        if service:
            print("✅ Autenticação bem-sucedida!")
            
            # Testar obter informações do calendário
            calendars = auth.get_calendars()
            primary_id = auth.get_primary_calendar_id()
            
            print(f"📅 Calendário principal: {primary_id}")
            print(f"📊 Total de calendários acessíveis: {len(calendars)}")
            
            return True
        else:
            print("❌ Falha na autenticação")
            return False
            
    except Exception as e:
        print(f"❌ Erro na autenticação: {e}")
        return False

def test_full_integration():
    print("\n🚀 TESTANDO INTEGRAÇÃO COMPLETA")
    print("=" * 50)
    
    try:
        integrator = CalendarIntegratorService()
        
        # Testar validação da planilha
        validation = integrator.spreadsheet_reader.validate_spreadsheet('data/eventos_com_participantes.csv')
        if validation['valid']:
            print(f"✅ Planilha válida: {validation['total_rows']} eventos")
        else:
            print(f"❌ Erro na planilha: {validation['error']}")
            return False
        
        # Testar leitura dos eventos
        events = integrator.spreadsheet_reader.read_spreadsheet('data/eventos_com_participantes.csv')
        print(f"✅ {len(events)} eventos lidos")
        
        # Mostrar primeiro evento como exemplo
        if events:
            event = events[0]
            print(f"\n📋 Exemplo de evento:")
            print(f"   Título: {event['summary']}")
            print(f"   Data: {event['start']['dateTime']}")
            print(f"   Local: {event['location']}")
            if event.get('participantes'):
                print(f"   Participantes: {', '.join(event['participantes'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na integração: {e}")
        return False

def show_instructions():
    print("\n📋 INSTRUÇÕES FINAIS")
    print("=" * 50)
    print("1. Para executar a sincronização completa:")
    print("   python main_service.py --auto-confirm")
    print()
    print("2. Para ver informações do calendário:")
    print("   python main_service.py --calendar-info")
    print()
    print("3. Para executar com opções específicas:")
    print("   python main_service.py --file data/eventos_com_participantes.csv")
    print()
    print("🎉 Sistema pronto para usar com Service Account!")

if __name__ == "__main__":
    auth_success = test_service_account()
    
    if auth_success:
        integration_success = test_full_integration()
        
        if integration_success:
            print("\n🎉 TODOS OS TESTES PASSARAM!")
            show_instructions()
        else:
            print("\n💥 PROBLEMAS NA INTEGRAÇÃO")
    else:
        print("\n💥 PROBLEMAS NA AUTENTICAÇÃO")
        print("Verifique as permissões do Service Account no Google Cloud Console")
