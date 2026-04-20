#!/usr/bin/env python3
"""
Script para executar sincronização com participantes
"""

from main import CalendarIntegrator

def main():
    print("🚀 INICIANDO SINCRONIZAÇÃO COM PARTICIPANTES")
    print("=" * 60)
    
    integrator = CalendarIntegrator()
    
    # Opções para sincronização
    options = {
        'auto_confirm': False,  # Vai pedir confirmação
        'add_travel_time': True,
        'travel_time_minutes': 30,
        'mark_off_days': True,
        'skip_existing': True
    }
    
    # Executa sincronização com a planilha de participantes
    spreadsheet_file = 'data/eventos_com_participantes.csv'
    
    print(f"📁 Arquivo: {spreadsheet_file}")
    print(f"👥 Participantes: Fabricioluiz518@gmail.com, eliasdmngs@gmail.com")
    print(f"🚗 Tempo de deslocamento: {options['travel_time_minutes']} minutos")
    print(f"🏖️ Marcar dias de folga: {options['mark_off_days']}")
    print()
    
    success = integrator.run(spreadsheet_file, options)
    
    if success:
        print("\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!")
        print("📧 Os participantes receberão convites por email.")
    else:
        print("\n💥 FALHA NA SINCRONIZAÇÃO")
        print("Verifique as credenciais do Google e a conexão com a internet.")

if __name__ == "__main__":
    main()
