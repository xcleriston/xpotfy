#!/usr/bin/env python3
"""
Script para extrair transcrições dos primeiros 5 segundos de vídeos de um canal do YouTube
Usa automação de browser para acessar os vídeos diretamente sem necessidade de download
"""

import time
import json
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriber:
    def __init__(self, headless=True, email=None, password=None):
        """Inicializa o browser Chrome com opções otimizadas"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        self.email = email
        self.password = password
        self.logged_in = False
        
    def login_to_youtube(self):
        """
        Realiza login no YouTube com as credenciais fornecidas
        
        Returns:
            bool: True se login bem sucedido, False caso contrário
        """
        if not self.email or not self.password:
            print("Credenciais não fornecidas. Continuando sem login.")
            return False
            
        if self.logged_in:
            print("Já está logado.")
            return True
            
        try:
            print("Fazendo login no YouTube...")
            
            # Acessa página de login do Google
            self.driver.get("https://accounts.google.com/signin")
            time.sleep(3)
            
            # Preenche email
            try:
                email_input = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='identifier']"))
                )
                email_input.clear()
                email_input.send_keys(self.email)
                time.sleep(1)
                
                # Clica em próximo - tenta múltiplos seletores
                next_button = None
                selectors = [
                    "//button[contains(., 'Next') or contains(., 'Próxima')]",
                    "//button[@id='identifierNext']",
                    "//button[contains(@class, 'VfPpkd-LgbsSe')]",
                    ".VfPpkd-LgbsSe-OWXEXe-k8QpJ"
                ]
                
                for selector in selectors:
                    try:
                        if selector.startswith('//'):
                            next_button = self.driver.find_element(By.XPATH, selector)
                        else:
                            next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                if next_button:
                    next_button.click()
                    time.sleep(3)
                else:
                    print("Botão Next não encontrado. Tentando continuar...")
                    
            except Exception as e:
                print(f"Erro ao preencher email: {e}")
                
            # Preenche senha
            try:
                password_input = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password'], input[name='password']"))
                )
                password_input.clear()
                password_input.send_keys(self.password)
                time.sleep(1)
                
                # Clica em próximo - tenta múltiplos seletores
                next_button = None
                selectors = [
                    "//button[contains(., 'Next') or contains(., 'Próxima')]",
                    "//button[@id='passwordNext']",
                    "//button[contains(@class, 'VfPpkd-LgbsSe')]",
                    ".VfPpkd-LgbsSe-OWXEXe-k8QpJ"
                ]
                
                for selector in selectors:
                    try:
                        if selector.startswith('//'):
                            next_button = self.driver.find_element(By.XPATH, selector)
                        else:
                            next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                if next_button:
                    next_button.click()
                    time.sleep(3)
                else:
                    print("Botão Next não encontrado. Tentando continuar...")
                    
            except Exception as e:
                print(f"Erro ao preencher senha: {e}")
            
            # Verifica se precisa de verificação em duas etapas
            if "challenge" in self.driver.current_url or "signin/v2/challenge" in self.driver.current_url:
                print("Verificação em duas etapas detectada. Por favor, complete manualmente.")
                input("Pressione Enter após completar a verificação...")
            
            # Acessa o YouTube para verificar login
            self.driver.get("https://www.youtube.com")
            time.sleep(5)
            
            # Verifica se está logado (procura por avatar do usuário)
            try:
                avatar = self.driver.find_element(By.CSS_SELECTOR, "#avatar-btn, ytd-topbar-menu-renderer button")
                self.logged_in = True
                print("Login realizado com sucesso!")
                return True
            except:
                print("Não foi possível confirmar o login.")
                return False
                
        except Exception as e:
            print(f"Erro durante o login: {e}")
            return False
    
    def get_channel_videos(self, channel_url, max_videos=10):
        """
        Obtém lista de vídeos de um canal do YouTube
        
        Args:
            channel_url (str): URL do canal do YouTube
            max_videos (int): Número máximo de vídeos para processar
            
        Returns:
            list: Lista de dicionários com informações dos vídeos
        """
        # Tenta fazer login se tiver credenciais
        if self.email and self.password and not self.logged_in:
            self.login_to_youtube()
            
        print(f"Acessando canal: {channel_url}")
        self.driver.get(channel_url)
        time.sleep(3)
        
        videos = []
        
        # Rola a página para carregar mais vídeos
        for _ in range(3):
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
        
        # Encontra links de vídeos - múltiplas estratégias
        try:
            # Estratégia 1: Links de vídeos padrão
            video_elements = self.driver.find_elements(By.CSS_SELECTOR, "a#video-title")
            
            if not video_elements:
                # Estratégia 2: Links dentro de miniaturas
                video_elements = self.driver.find_elements(By.CSS_SELECTOR, "a.yt-simple-endpoint[href*='/watch?v=']")
            
            if not video_elements:
                # Estratégia 3: Todos os links que apontam para vídeos
                video_elements = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/watch?v=')]")
            
            print(f"Encontrados {len(video_elements)} elementos de vídeo")
            
            for i, element in enumerate(video_elements[:max_videos]):
                try:
                    video_url = element.get_attribute("href")
                    
                    # Pega o título de várias formas
                    video_title = None
                    title_selectors = [
                        "#video-title",
                        "span#video-title",
                        ".ytd-video-meta-block",
                        "yt-formatted-string#video-title"
                    ]
                    
                    for selector in title_selectors:
                        try:
                            title_elem = element.find_element(By.CSS_SELECTOR, selector)
                            video_title = title_elem.get_attribute("title") or title_elem.text
                            if video_title:
                                break
                        except:
                            continue
                    
                    # Se não encontrou título, usa o texto do elemento ou URL
                    if not video_title:
                        video_title = element.get_attribute("title") or element.text or f"Vídeo {i+1}"
                    
                    if video_url and "/watch?v=" in video_url:
                        # Remove duplicatas
                        if not any(v['url'] == video_url for v in videos):
                            videos.append({
                                "title": video_title.strip(),
                                "url": video_url,
                                "transcription": ""
                            })
                            print(f"Vídeo {len(videos)}: {video_title[:50]}...")
                        
                except Exception as e:
                    print(f"Erro ao processar vídeo {i}: {e}")
                    continue
                    
            if not videos:
                print("Nenhum vídeo encontrado. Tentando acessar aba 'Vídeos'...")
                # Tenta acessar aba de vídeos
                try:
                    videos_tab = self.driver.find_element(By.XPATH, "//a[contains(@href, '/videos') or contains(., 'Vídeos')]")
                    videos_tab.click()
                    time.sleep(3)
                    
                    # Tenta novamente encontrar vídeos
                    video_elements = self.driver.find_elements(By.CSS_SELECTOR, "a#video-title")
                    
                    for i, element in enumerate(video_elements[:max_videos]):
                        try:
                            video_url = element.get_attribute("href")
                            video_title = element.get_attribute("title") or element.text
                            
                            if video_url and "/watch?v=" in video_url:
                                videos.append({
                                    "title": video_title.strip(),
                                    "url": video_url,
                                    "transcription": ""
                                })
                                print(f"Vídeo {len(videos)}: {video_title[:50]}...")
                        except:
                            continue
                except Exception as e:
                    print(f"Não foi possível acessar aba de vídeos: {e}")
                    
        except Exception as e:
            print(f"Erro ao encontrar vídeos: {e}")
            
        return videos
    
    def get_first_5_seconds_transcription(self, video_url):
        """
        Obtém transcrição dos primeiros 5 segundos de um vídeo
        
        Args:
            video_url (str): URL do vídeo do YouTube
            
        Returns:
            str: Transcrição dos primeiros 5 segundos
        """
        try:
            print(f"Processando vídeo: {video_url}")
            self.driver.get(video_url)
            
            # Aceita cookies se necessário
            try:
                accept_button = self.wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Accept all')]"))
                )
                accept_button.click()
                time.sleep(1)
            except:
                pass
            
            # Clica no botão de legendas para ativar
            try:
                # Tenta encontrar o botão de legendas (cc)
                cc_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[aria-label*='legendas' i], button[aria-label*='captions' i], button[aria-label*='cc' i]"))
                )
                cc_button.click()
                time.sleep(1)
            except:
                print("Não foi possível ativar legendas automaticamente")
            
            # Inicia o vídeo
            try:
                play_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button.ytp-play-button"))
                )
                play_button.click()
                time.sleep(1)
            except:
                print("Não foi possível iniciar o vídeo automaticamente")
            
            # Aguarda 5 segundos
            print("Aguardando 5 segundos do vídeo...")
            time.sleep(5)
            
            # Pausa o vídeo
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                play_button.click()
            except:
                pass
            
            # Tenta obter transcrição das legendas
            transcription = self._extract_captions()
            
            if not transcription:
                # Tenta abrir o painel de transcrição
                try:
                    # Procura pelo botão de mais opções
                    more_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='more' i], button[aria-label*='mais' i]")
                    more_button.click()
                    time.sleep(1)
                    
                    # Procura pela opção de transcrição
                    transcript_button = self.driver.find_element(By.XPATH, "//yt-formatted-string[contains(., 'Transcript') or contains(., 'Transcrição')]")
                    transcript_button.click()
                    time.sleep(2)
                    
                    # Extrai texto da transcrição
                    transcription = self._extract_transcript_text()
                    
                except Exception as e:
                    print(f"Não foi possível obter transcrição completa: {e}")
            
            return transcription if transcription else "[Transcrição não disponível]"
            
        except Exception as e:
            print(f"Erro ao processar vídeo {video_url}: {e}")
            return "[Erro na transcrição]"
    
    def _extract_captions(self):
        """Extrai texto das legendas visíveis na tela"""
        try:
            caption_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
            if caption_elements:
                return " ".join([elem.text for elem in caption_elements if elem.text.strip()])
        except:
            pass
        return ""
    
    def _extract_transcript_text(self):
        """Extrai texto do painel de transcrição"""
        try:
            transcript_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ytd-transcript-segment-renderer .segment-timestamp")
            if transcript_elements:
                # Pega apenas os primeiros 5 segundos (geralmente as primeiras 2-3 linhas)
                transcript_text = []
                for elem in transcript_elements[:3]:
                    parent = elem.find_element(By.XPATH, "..")
                    text_element = parent.find_element(By.CSS_SELECTOR, ".segment-text")
                    transcript_text.append(text_element.text)
                
                return " ".join(transcript_text)
        except:
            pass
        return ""
    
    def process_channel(self, channel_url, max_videos=10, output_file="transcricoes.json"):
        """
        Processa todos os vídeos de um canal e gera arquivo com transcrições
        
        Args:
            channel_url (str): URL do canal do YouTube
            max_videos (int): Número máximo de vídeos para processar
            output_file (str): Nome do arquivo de saída
        """
        # Garante que está logado para acessar vídeos privados
        if self.email and self.password and not self.logged_in:
            if not self.login_to_youtube():
                print("Não foi possível fazer login. Alguns vídeos podem não estar acessíveis.")
        
        videos = self.get_channel_videos(channel_url, max_videos)
        
        print(f"\nProcessando {len(videos)} vídeos...")
        
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] Processando: {video['title'][:50]}...")
            transcription = self.get_first_5_seconds_transcription(video['url'])
            video['transcription'] = transcription
            time.sleep(2)  # Pausa entre vídeos
        
        # Salva resultados
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # Gera arquivo de texto formatado
        txt_file = output_file.replace('.json', '.txt')
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES DOS PRIMEIROS 5 SEGUNDOS\n")
            f.write("=" * 50 + "\n\n")
            
            for i, video in enumerate(videos):
                f.write(f"{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-" * 50 + "\n\n")
        
        print(f"\nConcluído! Arquivos salvos:")
        print(f"- JSON: {output_file}")
        print(f"- TXT: {txt_file}")
        
        return videos
    
    def close(self):
        """Fecha o browser"""
        self.driver.quit()

def main():
    """Função principal para execução do script"""
    print("=== YouTube 5 Seconds Transcriber ===\n")
    
    # Configuração
    channel_url = input("Digite a URL do canal do YouTube: ").strip()
    
    if not channel_url:
        print("URL inválida!")
        return
    
    # Pergunta sobre credenciais para vídeos privados
    use_login = input("O canal tem vídeos privados? (s/n): ").strip().lower() == 's'
    
    email = None
    password = None
    
    if use_login:
        email = input("Digite o email do Google: ").strip()
        password = input("Digite a senha: ").strip()
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 10): ") or "10")
    except:
        max_videos = 10
    
    # Inicia o transcritor
    transcriber = YouTubeTranscriber(headless=False, email=email, password=password)
    
    try:
        videos = transcriber.process_channel(channel_url, max_videos)
        
        print(f"\nResumo:")
        print(f"- Total de vídeos processados: {len(videos)}")
        print(f"- Transcrições obtidas: {sum(1 for v in videos if v['transcription'] and '[Transcrição não disponível]' not in v['transcription'])}")
        
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")
    except Exception as e:
        print(f"\nErro durante a execução: {e}")
    finally:
        transcriber.close()

if __name__ == "__main__":
    main()
