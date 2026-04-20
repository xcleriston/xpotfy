#!/usr/bin/env python3
"""
Script para executar sincronização sem participantes
"""

from main_sem_participantes import CalendarIntegratorNoParticipants

def main():
    print("🚀 EXECUTANDO SINCRONIZAÇÃO SEM PARTICIPANTES")
    print("=" * 60)
    print("📁 Arquivo: data/eventos_com_participantes.csv")
    print("📅 12 eventos de estágio")
    print("🔧 Método: Service Account")
    print("👥 Participantes: Não serão adicionados")
    print()
    
    integrator = CalendarIntegratorNoParticipants()
    
    # Opções para sincronização
    options = {
        'auto_confirm': True,  # Confirmar automaticamente
        'add_travel_time': True,
        'travel_time_minutes': 30,
        'mark_off_days': True,
        'skip_existing': True
    }
    
    print("🔄 Iniciando sincronização automática...")
    print()
    
    success = integrator.run(None, options)  # None usa o arquivo padrão
    
    if success:
        print("\n🎉 SINCRONIZAÇÃO CONCLUÍDA!")
        print("📅 Verifique seu Google Calendar!")
        print("📊 Os eventos foram criados sem participantes.")
    else:
        print("\n💥 FALHA NA SINCRONIZAÇÃO")
        print("🔧 Verifique os erros acima.")

if __name__ == "__main__":
    main()
