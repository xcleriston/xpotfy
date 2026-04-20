#!/usr/bin/env python3
"""
Versão principal usando Service Account para o Integrador de Planilha com Google Agenda
"""

import os
import json
import argparse
from datetime import datetime
from pathlib import Path

from spreadsheet_reader import SpreadsheetReader
from calendar_manager_service import CalendarManagerService

class CalendarIntegratorService:
    def __init__(self, config_file='config.json'):
        self.config_file = config_file
        self.config = self._load_config()
        self.spreadsheet_reader = SpreadsheetReader()
        self.calendar_manager = CalendarManagerService(
            self.config['calendar']['credentials_file']
        )
        
    def _load_config(self):
        """Carrega configurações do arquivo"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Arquivo de configuração '{self.config_file}' não encontrado.")
            print("Usando configurações padrão...")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            print(f"Erro no arquivo de configuração: {e}")
            return self._get_default_config()
    
    def _get_default_config(self):
        """Retorna configurações padrão"""
        return {
            "spreadsheet": {
                "default_file": "data/eventos_com_participantes.csv",
                "auto_backup": True,
                "backup_folder": "backups"
            },
            "calendar": {
                "credentials_file": "credentials.json",
                "token_file": "token.pickle",
                "default_calendar": "primary",
                "timezone": "America/Sao_Paulo"
            },
            "sync_options": {
                "skip_existing": True,
                "add_travel_time": True,
                "travel_time_minutes": 30,
                "mark_off_days": True,
                "auto_confirm": False
            }
        }
    
    def run(self, spreadsheet_file=None, options=None):
        """Executa o processo de sincronização"""
        try:
            # Determina o arquivo da planilha
            if not spreadsheet_file:
                spreadsheet_file = self.config['spreadsheet']['default_file']
            
            print(f"📁 Processando planilha: {spreadsheet_file}")
            
            # Valida a planilha
            validation = self.spreadsheet_reader.validate_spreadsheet(spreadsheet_file)
            if not validation['valid']:
                print(f"❌ Erro na planilha: {validation['error']}")
                return False
            
            print(f"✅ Planilha válida com {validation['total_rows']} eventos")
            
            # Lê os eventos
            events = self.spreadsheet_reader.read_spreadsheet(spreadsheet_file)
            if not events:
                print("⚠️ Nenhum evento encontrado na planilha")
                return False
            
            print(f"📋 {len(events)} eventos lidos da planilha")
            
            # Mostra preview dos eventos
            self._show_events_preview(events)
            
            # Confirmação do usuário
            if not options or not options.get('auto_confirm', False):
                if not self._confirm_sync():
                    print("❌ Sincronização cancelada pelo usuário")
                    return False
            
            # Sincroniza com o calendário
            print("🔄 Sincronizando com Google Agenda (Service Account)...")
            sync_options = self.config.get('sync_options', {})
            if options:
                sync_options.update(options)
            
            result = self.calendar_manager.sync_events(events, sync_options)
            
            # Mostra resultado
            self._show_sync_result(result)
            
            return result.get('success', False)
            
        except Exception as e:
            print(f"❌ Erro durante execução: {e}")
            return False
    
    def _show_events_preview(self, events, max_show=5):
        """Mostra um preview dos eventos que serão sincronizados"""
        print(f"\n📅 Preview dos eventos (primeiros {min(max_show, len(events))}):")
        print("-" * 80)
        
        for i, event in enumerate(events[:max_show]):
            start_time = datetime.fromisoformat(
                event['start']['dateTime'].replace('Z', '+00:00')
            ).strftime('%d/%m/%Y %H:%M')
            
            print(f"{i+1}. {event['summary']}")
            print(f"   📅 {start_time}")
            print(f"   📍 {event.get('location', 'Sem local')}")
            print(f"   ⏱️ {event.get('duration_minutes', 60)} minutos")
            
            # Mostra participantes se houver
            if event.get('participantes'):
                participantes = event['participantes']
                if len(participantes) == 1:
                    print(f"   👤 {participantes[0]}")
                else:
                    print(f"   👥 {len(participantes)} participantes: {', '.join(participantes[:2])}")
                    if len(participantes) > 2:
                        print(f"       e mais {len(participantes) - 2}")
            print()
        
        if len(events) > max_show:
            print(f"... e mais {len(events) - max_show} eventos")
        print("-" * 80)
    
    def _confirm_sync(self):
        """Solicita confirmação do usuário"""
        response = input("\n🤔 Deseja continuar com a sincronização? (S/N): ").strip().upper()
        return response in ['S', 'SIM', 'Y', 'YES']
    
    def _show_sync_result(self, result):
        """Mostra o resultado da sincronização"""
        print("\n" + "="*80)
        print("📊 RESULTADO DA SINCRONIZAÇÃO (Service Account)")
        print("="*80)
        
        if result.get('success'):
            print(f"✅ Eventos criados: {result.get('created', 0)}")
            print(f"⏭️ Eventos pulados: {result.get('skipped', 0)}")
            print(f"🚗 Eventos de deslocamento: {result.get('travel_events', 0)}")
            print(f"🏖️ Dias de folga marcados: {result.get('off_days', 0)}")
            
            if result.get('errors', 0) > 0:
                print(f"❌ Erros: {result.get('errors', 0)}")
            
            # Mostra detalhes
            if result.get('details'):
                print("\n📋 Detalhes:")
                for detail in result['details']:
                    status_emoji = {
                        'created': '✅',
                        'skipped': '⏭️',
                        'error': '❌'
                    }.get(detail['status'], '❓')
                    
                    print(f"  {status_emoji} {detail['event']}")
                    if detail.get('reason'):
                        print(f"     {detail['reason']}")
        else:
            print(f"❌ Falha na sincronização: {result.get('error', 'Erro desconhecido')}")
        
        print("="*80)
    
    def show_calendar_info(self):
        """Mostra informações do calendário"""
        try:
            info = self.calendar_manager.get_calendar_info()
            
            if info.get('success'):
                print("\n📅 INFORMAÇÕES DO CALENDÁRIO (Service Account)")
                print("="*50)
                print(f"Calendário principal ID: {info['primary_id']}")
                print(f"Total de calendários: {info['total_calendars']}")
                
                print("\n📋 Calendários disponíveis:")
                for calendar in info['calendars']:
                    primary = " (Principal)" if calendar.get('primary') else ""
                    print(f"  - {calendar['summary']}{primary}")
                    print(f"    ID: {calendar['id']}")
            else:
                print(f"❌ Erro: {info.get('error')}")
                
        except Exception as e:
            print(f"❌ Erro ao obter informações: {e}")

def main():
    parser = argparse.ArgumentParser(description='Integrador de Planilha com Google Agenda (Service Account)')
    parser.add_argument('--file', '-f', help='Arquivo da planilha (Excel/CSV)')
    parser.add_argument('--config', '-c', default='config.json', help='Arquivo de configuração')
    parser.add_argument('--auto-confirm', action='store_true', help='Confirmar automaticamente')
    parser.add_argument('--no-travel', action='store_true', help='Não adicionar tempo de deslocamento')
    parser.add_argument('--no-off-days', action='store_true', help='Não marcar dias de folga')
    parser.add_argument('--calendar-info', action='store_true', help='Mostra informações do calendário')
    
    args = parser.parse_args()
    
    # Cria instância do integrador
    integrator = CalendarIntegratorService(args.config)
    
    # Mostra informações do calendário se solicitado
    if args.calendar_info:
        integrator.show_calendar_info()
        return
    
    # Prepara opções de sincronização
    options = {}
    if args.auto_confirm:
        options['auto_confirm'] = True
    if args.no_travel:
        options['add_travel_time'] = False
    if args.no_off_days:
        options['mark_off_days'] = False
    
    # Executa a sincronização
    print("🚀 Iniciando Integrador com Service Account")
    print("="*60)
    
    success = integrator.run(args.file, options)
    
    if success:
        print("\n🎉 Sincronização concluída com sucesso!")
        print("📧 Os participantes receberão convites por email.")
    else:
        print("\n💥 Falha na sincronização. Verifique os erros acima.")

if __name__ == "__main__":
    main()
