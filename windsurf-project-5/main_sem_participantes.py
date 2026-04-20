#!/usr/bin/env python3
"""
Versão principal sem participantes para Service Account
"""

import os
import json
import argparse
from datetime import datetime
from pathlib import Path

from spreadsheet_reader import SpreadsheetReader
from calendar_manager_service import CalendarManagerService

class CalendarIntegratorNoParticipants:
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
        """Executa o processo de sincronização sem participantes"""
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
            
            # Lê os eventos e remove participantes
            events = self.spreadsheet_reader.read_spreadsheet(spreadsheet_file)
            if not events:
                print("⚠️ Nenhum evento encontrado na planilha")
                return False
            
            # Remove participantes dos eventos
            clean_events = self._remove_participants(events)
            print(f"📋 {len(clean_events)} eventos preparados (sem participantes)")
            
            # Mostra preview dos eventos
            self._show_events_preview(clean_events)
            
            # Confirmação do usuário
            if not options or not options.get('auto_confirm', False):
                if not self._confirm_sync():
                    print("❌ Sincronização cancelada pelo usuário")
                    return False
            
            # Sincroniza com o calendário
            print("🔄 Sincronizando com Google Agenda (sem participantes)...")
            sync_options = self.config.get('sync_options', {})
            if options:
                sync_options.update(options)
            
            result = self.calendar_manager.sync_events(clean_events, sync_options)
            
            # Mostra resultado
            self._show_sync_result(result)
            
            return result.get('success', False)
            
        except Exception as e:
            print(f"❌ Erro durante execução: {e}")
            return False
    
    def _remove_participants(self, events):
        """Remove participantes dos eventos"""
        clean_events = []
        for event in events:
            clean_event = event.copy()
            # Remove campos relacionados a participantes
            clean_event.pop('attendees', None)
            clean_event.pop('participantes', None)
            clean_events.append(clean_event)
        return clean_events
    
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
        print("📊 RESULTADO DA SINCRONIZAÇÃO (Sem Participantes)")
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

def main():
    parser = argparse.ArgumentParser(description='Integrador de Planilha com Google Agenda (Sem Participantes)')
    parser.add_argument('--file', '-f', help='Arquivo da planilha (Excel/CSV)')
    parser.add_argument('--config', '-c', default='config.json', help='Arquivo de configuração')
    parser.add_argument('--auto-confirm', action='store_true', help='Confirmar automaticamente')
    parser.add_argument('--no-travel', action='store_true', help='Não adicionar tempo de deslocamento')
    parser.add_argument('--no-off-days', action='store_true', help='Não marcar dias de folga')
    
    args = parser.parse_args()
    
    # Cria instância do integrador
    integrator = CalendarIntegratorNoParticipants(args.config)
    
    # Prepara opções de sincronização
    options = {}
    if args.auto_confirm:
        options['auto_confirm'] = True
    if args.no_travel:
        options['add_travel_time'] = False
    if args.no_off_days:
        options['mark_off_days'] = False
    
    # Executa a sincronização
    print("🚀 Iniciando Integrador (Sem Participantes)")
    print("="*60)
    
    success = integrator.run(args.file, options)
    
    if success:
        print("\n🎉 Sincronização concluída com sucesso!")
        print("📅 Eventos criados no calendário!")
    else:
        print("\n💥 Falha na sincronização. Verifique os erros acima.")

if __name__ == "__main__":
    main()
