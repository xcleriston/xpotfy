import pandas as pd
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class SpreadsheetReader:
    def __init__(self):
        self.required_columns = [
            'Data', 'Hora', 'Título', 'Descrição', 'Local', 'Duração'
        ]
        self.optional_columns = ['Participantes']
        
    def read_spreadsheet(self, file_path: str) -> List[Dict]:
        """
        Lê planilha Excel ou CSV e retorna lista de eventos
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo '{file_path}' não encontrado")
        
        try:
            # Determina o tipo de arquivo pelo nome
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                raise ValueError("Formato de arquivo não suportado. Use .xlsx, .xls ou .csv")
            
            # Verifica colunas obrigatórias
            missing_columns = [col for col in self.required_columns if col not in df.columns]
            if missing_columns:
                raise ValueError(f"Colunas obrigatórias faltando: {', '.join(missing_columns)}")
            
            # Converte DataFrame para lista de dicionários
            events = []
            for index, row in df.iterrows():
                try:
                    event = self._parse_row(row)
                    if event:
                        events.append(event)
                except Exception as e:
                    print(f"Erro ao processar linha {index + 1}: {e}")
                    continue
            
            return events
            
        except Exception as e:
            raise Exception(f"Erro ao ler planilha: {e}")
    
    def _parse_row(self, row) -> Optional[Dict]:
        """
        Converte uma linha do DataFrame para formato de evento
        """
        try:
            # Parse da data
            data_str = str(row['Data']).strip()
            if pd.isna(data_str) or data_str == 'nan':
                return None
            
            # Tenta diferentes formatos de data
            date_formats = ['%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d', '%d/%m/%y']
            data_evento = None
            
            for fmt in date_formats:
                try:
                    data_evento = datetime.strptime(data_str, fmt).date()
                    break
                except ValueError:
                    continue
            
            if not data_evento:
                raise ValueError(f"Formato de data inválido: {data_str}")
            
            # Parse da hora
            hora_str = str(row['Hora']).strip()
            if pd.isna(hora_str) or hora_str == 'nan':
                hora_evento = datetime.strptime('09:00', '%H:%M').time()
            else:
                try:
                    hora_evento = datetime.strptime(hora_str, '%H:%M').time()
                except ValueError:
                    # Tenta formato com segundos
                    try:
                        hora_evento = datetime.strptime(hora_str, '%H:%M:%S').time()
                    except ValueError:
                        raise ValueError(f"Formato de hora inválido: {hora_str}")
            
            # Combina data e hora
            inicio = datetime.combine(data_evento, hora_evento)
            
            # Parse da duração
            duracao_str = str(row['Duração']).strip()
            if pd.isna(duracao_str) or duracao_str == 'nan':
                duracao_minutos = 60  # Padrão 1 hora
            else:
                try:
                    duracao_minutos = int(float(duracao_str))
                except ValueError:
                    raise ValueError(f"Duração inválida: {duracao_str}")
            
            fim = inicio + timedelta(minutes=duracao_minutos)
            
            # Processa participantes se existir
            participantes = []
            if 'Participantes' in row and not pd.isna(row['Participantes']):
                participantes_str = str(row['Participantes']).strip()
                if participantes_str and participantes_str != 'nan':
                    # Divide por ponto e vírgula ou vírgula
                    participantes = [
                        email.strip() for email in participantes_str.replace(',', ';').split(';')
                        if email.strip() and '@' in email
                    ]
            
            # Monta o evento
            event = {
                'summary': str(row['Título']).strip(),
                'description': str(row['Descrição']).strip() if not pd.isna(row['Descrição']) else '',
                'location': str(row['Local']).strip() if not pd.isna(row['Local']) else '',
                'start': {
                    'dateTime': inicio.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'end': {
                    'dateTime': fim.isoformat(),
                    'timeZone': 'America/Sao_Paulo'
                },
                'duration_minutes': duracao_minutos,
                'original_data': data_str,
                'original_hora': hora_str
            }
            
            # Adiciona participantes se houver
            if participantes:
                event['attendees'] = [{'email': email} for email in participantes]
                event['participantes'] = participantes
            
            return event
            
        except Exception as e:
            print(f"Erro ao processar linha: {e}")
            return None
    
    def validate_spreadsheet(self, file_path: str) -> Dict:
        """
        Valida a estrutura da planilha e retorna informações
        """
        if not os.path.exists(file_path):
            return {'valid': False, 'error': 'Arquivo não encontrado'}
        
        try:
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                return {'valid': False, 'error': 'Formato não suportado'}
            
            columns = df.columns.tolist()
            missing_columns = [col for col in self.required_columns if col not in columns]
            optional_found = [col for col in self.optional_columns if col in columns]
            
            if missing_columns:
                return {
                    'valid': False,
                    'error': f'Colunas faltando: {", ".join(missing_columns)}',
                    'found_columns': columns,
                    'required_columns': self.required_columns,
                    'optional_columns': self.optional_columns
                }
            
            return {
                'valid': True,
                'total_rows': len(df),
                'columns': columns,
                'optional_columns_found': optional_found
            }
            
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    
    def create_sample_spreadsheet(self, output_path: str):
        """
        Cria uma planilha de exemplo
        """
        sample_data = {
            'Data': ['10/03/2026', '11/03/2026', '12/03/2026'],
            'Hora': ['09:00', '14:00', '10:30'],
            'Título': ['Reunião de Equipe', 'Apresentação Cliente', 'Workshop'],
            'Descrição': ['Discussão semanal do projeto', 'Apresentação dos resultados', 'Treinamento técnico'],
            'Local': ['Sala de Reuniões A', 'Escritório Cliente', 'Auditório'],
            'Duração': [60, 90, 120],
            'Participantes': ['usuario1@exemplo.com;usuario2@exemplo.com', 'cliente@empresa.com', 'participante@exemplo.com']
        }
        
        df = pd.DataFrame(sample_data)
        
        if output_path.endswith('.xlsx'):
            df.to_excel(output_path, index=False)
        else:
            df.to_csv(output_path, index=False)
        
        return output_path
