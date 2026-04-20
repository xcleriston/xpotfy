#!/usr/bin/env python3
"""
Script final para executar sincronização completa com Service Account
"""

from main_service import CalendarIntegratorService

def main():
    print("🚀 EXECUTANDO SINCRONIZAÇÃO FINAL")
    print("=" * 60)
    print("📁 Arquivo: data/eventos_com_participantes.csv")
    print("👥 Participantes: Fabricioluiz518@gmail.com, eliasdmngs@gmail.com")
    print("🔧 Método: Service Account")
    print("📧 Email: eventos@games-417200.iam.gserviceaccount.com")
    print()
    
    integrator = CalendarIntegratorService()
    
    # Opções para sincronização
    options = {
        'auto_confirm': True,  # Confirmar automaticamente
        'add_travel_time': True,
        'travel_time_minutes': 30,
        'mark_off_days': True,
        'skip_existing': True
    }
    
    print("🔄 Iniciando sincronização automática...")
    print("⚠️ Certifique-se de que compartilhou o calendário com o Service Account!")
    print()
    
    success = integrator.run(None, options)  # None usa o arquivo padrão
    
    if success:
        print("\n🎉 SINCRONIZAÇÃO CONCLUÍDA!")
        print("📧 Verifique seu email e o Google Calendar!")
        print("📊 Os participantes receberão convites automaticamente.")
    else:
        print("\n💥 FALHA NA SINCRONIZAÇÃO")
        print("📋 Verifique as instruções em instrucoes_compartilhamento.md")
        print("🔧 Execute: python testar_service_account.py para diagnosticar")

if __name__ == "__main__":
    main()
