import os.path
import pickle
from datetime import datetime, timedelta
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

class GoogleCalendarAuth:
    def __init__(self, credentials_file='credentials.json', token_file='token.pickle'):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.service = None
        self.scopes = ['https://www.googleapis.com/auth/calendar']
        
    def authenticate(self):
        """Autentica com o Google Calendar API"""
        creds = None
        
        # Verifica se existe token salvo
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # Se não houver credenciais válidas, faz login
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    raise FileNotFoundError(
                        f"Arquivo de credenciais '{self.credentials_file}' não encontrado. "
                        "Por favor, baixe as credenciais do Google Cloud Console."
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.scopes)
                creds = flow.run_local_server(port=0)
            
            # Salva as credenciais para próxima execução
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        # Cria o serviço do Calendar
        self.service = build('calendar', 'v3', credentials=creds)
        return self.service
    
    def get_calendars(self):
        """Lista todos os calendários do usuário"""
        if not self.service:
            self.authenticate()
        
        calendar_list = self.service.calendarList().list().execute()
        return calendar_list.get('items', [])
    
    def get_primary_calendar_id(self):
        """Retorna o ID do calendário principal"""
        if not self.service:
            self.authenticate()
        
        calendar_list = self.service.calendarList().list().execute()
        for calendar in calendar_list.get('items', []):
            if calendar.get('primary'):
                return calendar['id']
        
        # Se não encontrar calendário principal, retorna o primeiro
        return calendar_list.get('items', [{}])[0].get('id', 'primary')
    
    def create_event(self, calendar_id, event_data):
        """Cria um evento no calendário especificado"""
        if not self.service:
            self.authenticate()
        
        try:
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_data
            ).execute()
            return event
        except Exception as e:
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
        
        events_result = self.service.events().list(
            calendarId=calendar_id,
            **params,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
    
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
        except Exception as e:
            print(f"Erro ao deletar evento: {e}")
            return False
