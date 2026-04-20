import os.path
import json
from datetime import datetime, timedelta
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class GoogleCalendarServiceAuth:
    def __init__(self, credentials_file='credentials.json'):
        self.credentials_file = credentials_file
        self.service = None
        self.scopes = ['https://www.googleapis.com/auth/calendar']
        
    def authenticate(self):
        """Autentica com Service Account"""
        try:
            # Carrega credenciais do service account
            creds = service_account.Credentials.from_service_account_file(
                self.credentials_file, 
                scopes=self.scopes
            )
            
            # Cria o serviço do Calendar
            self.service = build('calendar', 'v3', credentials=creds)
            return self.service
            
        except Exception as e:
            print(f"Erro na autenticação com Service Account: {e}")
            return None
    
    def get_calendars(self):
        """Lista todos os calendários do usuário"""
        if not self.service:
            self.authenticate()
        
        try:
            calendar_list = self.service.calendarList().list().execute()
            return calendar_list.get('items', [])
        except HttpError as e:
            print(f"Erro ao listar calendários: {e}")
            # Tenta usar o calendário principal diretamente
            return [{'id': 'primary', 'summary': 'Calendário Principal'}]
    
    def get_primary_calendar_id(self):
        """Retorna o ID do calendário principal"""
        if not self.service:
            self.authenticate()
        
        try:
            calendar_list = self.service.calendarList().list().execute()
            for calendar in calendar_list.get('items', []):
                if calendar.get('primary'):
                    return calendar['id']
            
            # Se não encontrar calendário principal, retorna o primeiro
            return calendar_list.get('items', [{}])[0].get('id', 'primary')
        except:
            return 'primary'
    
    def create_event(self, calendar_id, event_data):
        """Cria um evento no calendário especificado"""
        if not self.service:
            self.authenticate()
        
        try:
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_data,
                sendUpdates='all'  # Envia convites para participantes
            ).execute()
            return event
        except HttpError as e:
            print(f"Erro ao criar evento: {e}")
            return None
    
    def get_events(self, calendar_id, time_min=None, time_max=None):
        """Lista eventos do calendário em um período"""
        if not self.service:
            self.authenticate()
        
        params = {}
        if time_min:
            params['timeMin'] = time_min
        if time_max:
            params['timeMax'] = time_max
        
        try:
            events_result = self.service.events().list(
                calendarId=calendar_id,
                **params,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return events_result.get('items', [])
        except HttpError as e:
            print(f"Erro ao listar eventos: {e}")
            return []
    
    def delete_event(self, calendar_id, event_id):
        """Deleta um evento do calendário"""
        if not self.service:
            self.authenticate()
        
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            return True
        except HttpError as e:
            print(f"Erro ao deletar evento: {e}")
            return False
    
    def share_calendar_with_user(self, calendar_id, user_email, role='writer'):
        """Compartilha calendário com um usuário"""
        if not self.service:
            self.authenticate()
        
        try:
            rule = {
                'scope': {
                    'type': 'user',
                    'value': user_email
                },
                'role': role
            }
            
            self.service.acl().insert(
                calendarId=calendar_id,
                body=rule
            ).execute()
            
            print(f"✅ Calendário compartilhado com {user_email}")
            return True
            
        except HttpError as e:
            print(f"Erro ao compartilhar calendário: {e}")
            return False
