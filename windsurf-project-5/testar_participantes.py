#!/usr/bin/env python3
"""
Script para testar a planilha com participantes
"""

from spreadsheet_reader import SpreadsheetReader

def test_spreadsheet():
    reader = SpreadsheetReader()
    
    # Testa a planilha com participantes
    file_path = 'data/eventos_com_participantes.csv'
    
    print("🔍 Validando planilha...")
    validation = reader.validate_spreadsheet(file_path)
    
    if validation['valid']:
        print(f"✅ Planilha válida!")
        print(f"📊 Total de linhas: {validation['total_rows']}")
        print(f"📋 Colunas encontradas: {', '.join(validation['columns'])}")
        if validation.get('optional_columns_found'):
            print(f"🎯 Colunas opcionais: {', '.join(validation['optional_columns_found'])}")
        
        print("\n📖 Lendo eventos...")
        events = reader.read_spreadsheet(file_path)
        
        print(f"📅 {len(events)} eventos encontrados:")
        print("-" * 60)
        
        for i, event in enumerate(events[:3]):  # Mostra só os 3 primeiros
            print(f"\n{i+1}. {event['summary']}")
            print(f"   📅 {event['start']['dateTime']}")
            print(f"   📍 {event['location']}")
            print(f"   ⏱️ {event['duration_minutes']} minutos")
            
            if event.get('participantes'):
                participantes = event['participantes']
                print(f"   👥 Participantes: {', '.join(participantes)}")
                print(f"   📧 Emails no formato Google: {len([p for p in participantes if 'attendees' in event])}")
        
        if len(events) > 3:
            print(f"\n... e mais {len(events) - 3} eventos")
            
    else:
        print(f"❌ Erro na validação: {validation['error']}")

if __name__ == "__main__":
    test_spreadsheet()
