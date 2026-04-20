from datetime import datetime, timedelta
from typing import List, Dict, Optional
from google_auth import GoogleCalendarAuth
import json

class CalendarManager:
    def __init__(self, credentials_file='credentials.json'):
        self.auth = GoogleCalendarAuth(credentials_file)
        self.service = None
        self.calendar_id = None
        
    def initialize(self):
        """Inicializa a conexão com o Google Calendar"""
        try:
            self.service = self.auth.authenticate()
            self.calendar_id = self.auth.get_primary_calendar_id()
            return True
        except Exception as e:
            print(f"Erro ao inicializar calendário: {e}")
            return False
    
    def sync_events(self, events: List[Dict], options: Dict = None) -> Dict:
        """
        Sincroniza eventos da planilha com o calendário
        
        Args:
            events: Lista de eventos da planilha
            options: Opções de sincronização
            
        Returns:
            Dict com resultado da sincronização
        """
        if not self.service:
            if not self.initialize():
                return {'success': False, 'error': 'Falha na inicialização'}
        
        if options is None:
            options = {
                'skip_existing': True,
                'add_travel_time': True,
                'travel_time_minutes': 30,
                'mark_off_days': True
            }
        
        result = {
            'success': True,
            'created': 0,
            'skipped': 0,
            'errors': 0,
            'travel_events': 0,
            'off_days': 0,
            'details': []
        }
        
        try:
            # Ordena eventos por data e hora
            sorted_events = sorted(events, key=lambda x: x['start']['dateTime'])
            
            # Obtém eventos existentes para evitar duplicatas
            existing_events = self._get_existing_events(sorted_events)
            
            for i, event in enumerate(sorted_events):
                try:
                    # Verifica se evento já existe
                    if options.get('skip_existing') and self._event_exists(event, existing_events):
                        result['skipped'] += 1
                        result['details'].append({
                            'event': event['summary'],
                            'status': 'skipped',
                            'reason': 'Evento já existe'
                        })
                        continue
                    
                    # Adiciona tempo de deslocamento se necessário
                    if options.get('add_travel_time') and i > 0:
                        travel_event = self._create_travel_event(
                            sorted_events[i-1], event, 
                            options.get('travel_time_minutes', 30)
                        )
                        if travel_event:
                            created = self.auth.create_event(self.calendar_id, travel_event)
                            if created:
                                result['travel_events'] += 1
                    
                    # Cria o evento principal
                    created_event = self.auth.create_event(self.calendar_id, event)
                    if created_event:
                        result['created'] += 1
                        result['details'].append({
                            'event': event['summary'],
                            'status': 'created',
                            'id': created_event.get('id')
                        })
                    else:
                        result['errors'] += 1
                        result['details'].append({
                            'event': event['summary'],
                            'status': 'error',
                            'reason': 'Falha ao criar evento'
                        })
                        
                except Exception as e:
                    result['errors'] += 1
                    result['details'].append({
                        'event': event.get('summary', 'Evento sem título'),
                        'status': 'error',
                        'reason': str(e)
                    })
            
            # Marca dias de folga se solicitado
            if options.get('mark_off_days'):
                off_days = self._mark_off_days(sorted_events)
                result['off_days'] = len(off_days)
                result['details'].extend(off_days)
            
            return result
            
        except Exception as e:
            return {'success': False, 'error': f'Erro na sincronização: {e}'}
    
    def _get_existing_events(self, events: List[Dict]) -> List[Dict]:
        """Obtém eventos existentes no período dos novos eventos"""
        if not events:
            return []
        
        # Define o período
        start_dates = [datetime.fromisoformat(e['start']['dateTime'].replace('Z', '+00:00')) for e in events]
        end_dates = [datetime.fromisoformat(e['end']['dateTime'].replace('Z', '+00:00')) for e in events]
        
        time_min = min(start_dates).isoformat()
        time_max = max(end_dates).isoformat()
        
        return self.auth.get_events(self.calendar_id, time_min, time_max)
    
    def _event_exists(self, new_event: Dict, existing_events: List[Dict]) -> bool:
        """Verifica se um evento já existe no calendário"""
        new_start = datetime.fromisoformat(new_event['start']['dateTime'].replace('Z', '+00:00'))
        new_summary = new_event['summary'].lower().strip()
        
        for existing in existing_events:
            if 'summary' not in existing:
                continue
                
            existing_start = datetime.fromisoformat(existing['start']['dateTime'].replace('Z', '+00:00'))
            existing_summary = existing['summary'].lower().strip()
            
            # Compara data/hora e título
            if (abs((new_start - existing_start).total_seconds()) < 60 and 
                new_summary == existing_summary):
                return True
        
        return False
    
    def _create_travel_event(self, previous_event: Dict, next_event: Dict, 
                           travel_minutes: int) -> Optional[Dict]:
        """Cria um evento de deslocamento entre dois eventos"""
        try:
            prev_end = datetime.fromisoformat(previous_event['end']['dateTime'].replace('Z', '+00:00'))
            next_start = datetime.fromisoformat(next_event['start']['dateTime'].replace('Z', '+00:00'))
            
            # Verifica se há tempo suficiente para deslocamento
            time_diff = (next_start - prev_end).total_seconds() / 60
            
            if time_diff <= travel_minutes:
                return None
            
            # Cria evento de deslocamento
            travel_start = prev_end
            travel_end = travel_start + timedelta(minutes=travel_minutes)
            
            travel_event = {
                'summary': f'🚗 Deslocamento: {previous_event["location"]} → {next_event["location"]}',
                'description': f'Tempo de deslocamento entre eventos.\n'
                             f'De: {previous_event["summary"]}\n'
                             f'Para: {next_event["summary"]}',
                'location': 'Em trânsito',
                'start': {
                    'dateTime': travel_start.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'end': {
                    'dateTime': travel_end.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'colorId': '8'  # Cor cinza para eventos de deslocamento
            }
            
            return travel_event
            
        except Exception as e:
            print(f"Erro ao criar evento de deslocamento: {e}")
            return None
    
    def _mark_off_days(self, events: List[Dict]) -> List[Dict]:
        """Identifica e marca dias de folga"""
        if not events:
            return []
        
        # Obtém todas as datas dos eventos
        event_dates = set()
        for event in events:
            date_str = datetime.fromisoformat(
                event['start']['dateTime'].replace('Z', '+00:00')
            ).date()
            event_dates.add(date_str)
        
        # Identifica períodos sem eventos (finais de semana e gaps)
        off_days = []
        sorted_dates = sorted(event_dates)
        
        for i in range(len(sorted_dates) - 1):
            current_date = sorted_dates[i]
            next_date = sorted_dates[i + 1]
            
            # Verifica dias entre eventos
            days_diff = (next_date - current_date).days
            
            if days_diff > 1:
                # Marca dias intermediários como folga
                for j in range(1, days_diff):
                    off_day = current_date + timedelta(days=j)
                    
                    # Pula finais de semana (já são folga naturalmente)
                    if off_day.weekday() >= 5:  # Sábado=5, Domingo=6
                        continue
                    
                    off_event = self._create_off_day_event(off_day)
                    if off_event:
                        created = self.auth.create_event(self.calendar_id, off_event)
                        if created:
                            off_days.append({
                                'event': f'Folga - {off_day.strftime("%d/%m/%Y")}',
                                'status': 'created',
                                'id': created.get('id'),
                                'type': 'off_day'
                            })
        
        return off_days
    
    def _create_off_day_event(self, date) -> Optional[Dict]:
        """Cria um evento de dia de folga"""
        try:
            off_event = {
                'summary': '🏖️ Dia de Folga',
                'description': 'Dia sem compromissos agendados',
                'start': {
                    'date': date.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'end': {
                    'date': date.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'colorId': '2'  # Cor verde para dias de folga
            }
            
            return off_event
            
        except Exception as e:
            print(f"Erro ao criar evento de folga: {e}")
            return None
    
    def get_calendar_info(self) -> Dict:
        """Obtém informações do calendário"""
        if not self.service:
            if not self.initialize():
                return {'success': False, 'error': 'Falha na inicialização'}
        
        try:
            calendars = self.auth.get_calendars()
            primary_id = self.auth.get_primary_calendar_id()
            
            return {
                'success': True,
                'calendars': calendars,
                'primary_id': primary_id,
                'total_calendars': len(calendars)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
