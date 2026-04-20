#!/usr/bin/env python3
"""
Versão que usa a sessão existente do Chrome (já logado)
"""

import time
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberSession:
    def __init__(self):
        """Inicializa usando perfil do usuário já logado"""
        chrome_options = Options()
        
        # Usa o perfil de usuário existente do Chrome
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Tenta encontrar o perfil do usuário
        try:
            # Windows
            if os.path.exists(os.path.expanduser("~\\AppData\\Local\\Google\\Chrome\\User Data")):
                chrome_options.add_argument("--user-data-dir=" + os.path.expanduser("~\\AppData\\Local\\Google\\Chrome\\User Data"))
                chrome_options.add_argument("--profile-directory=Default")
            # Linux/Mac
            elif os.path.exists(os.path.expanduser("~/.config/google-chrome")):
                chrome_options.add_argument("--user-data-dir=" + os.path.expanduser("~/.config/google-chrome"))
                chrome_options.add_argument("--profile-directory=Default")
        except:
            print("Não foi possível encontrar o perfil do Chrome, usando perfil temporário")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        
    def check_login_status(self):
        """Verifica se está logado no YouTube"""
        try:
            self.driver.get("https://www.youtube.com")
            time.sleep(3)
            
            # Procura por avatar do usuário
            try:
                avatar = self.driver.find_element(By.CSS_SELECTOR, "#avatar-btn, button[aria-label*='avatar']")
                print("✅ Sessão do YouTube detectada!")
                return True
            except:
                print("❌ Não está logado no YouTube")
                return False
                
        except Exception as e:
            print(f"Erro ao verificar status: {e}")
            return False
    
    def get_channel_videos(self, channel_url, max_videos=206):
        """Obtém vídeos do canal"""
        print(f"\n📺 Acessando canal: {channel_url}")
        self.driver.get(channel_url)
        time.sleep(5)
        
        videos = []
        
        # Rola a página para carregar mais vídeos
        print("🔄 Carregando vídeos...")
        for i in range(5):
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
            print(f"   Rolagem {i+1}/5")
        
        # Estratégias para encontrar vídeos
        strategies = [
            ("Links de vídeo padrão", "a#video-title"),
            ("Links em miniaturas", "a.yt-simple-endpoint[href*='/watch?v=']"),
            ("Todos os links de vídeo", "//a[contains(@href, '/watch?v=')]"),
            ("Títulos de vídeo", "h3.ytd-video-renderer a"),
        ]
        
        for name, selector in strategies:
            print(f"🔍 Testando estratégia: {name}")
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                
                print(f"   Encontrados: {len(elements)} elementos")
                
                for elem in elements[:max_videos]:
                    try:
                        url = elem.get_attribute("href")
                        if url and "/watch?v=" in url and url not in [v['url'] for v in videos]:
                            title = elem.get_attribute("title") or elem.text or f"Vídeo {len(videos)+1}"
                            videos.append({
                                "title": title.strip(),
                                "url": url,
                                "transcription": ""
                            })
                            
                    except Exception as e:
                        continue
                        
                if len(videos) >= max_videos:
                    break
                    
            except Exception as e:
                print(f"   Erro: {e}")
                continue
        
        # Se não encontrou vídeos suficientes, tenta aba de vídeos
        if len(videos) < 10:
            print("🔍 Tentando aba 'Vídeos'...")
            try:
                # Procura por diferentes tipos de abas
                tab_selectors = [
                    "//a[contains(@href, '/videos')]",
                    "//tp-yt-paper-tab[contains(., 'Vídeos')]",
                    "//a[contains(., 'Videos')]",
                    "//a[contains(., 'VIDEOS')]",
                    "//button[contains(., 'Vídeos')]"
                ]
                
                for selector in tab_selectors:
                    try:
                        tab = self.driver.find_element(By.XPATH, selector)
                        print(f"   Clicando na aba: {selector}")
                        tab.click()
                        time.sleep(3)
                        
                        # Rola mais para carregar
                        for i in range(3):
                            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                            time.sleep(2)
                        
                        # Busca vídeos novamente
                        elements = self.driver.find_elements(By.CSS_SELECTOR, "a#video-title")
                        print(f"   Encontrados na aba: {len(elements)}")
                        
                        for elem in elements[:max_videos - len(videos)]:
                            try:
                                url = elem.get_attribute("href")
                                if url and "/watch?v=" in url and url not in [v['url'] for v in videos]:
                                    title = elem.get_attribute("title") or elem.text or f"Vídeo {len(videos)+1}"
                                    videos.append({
                                        "title": title.strip(),
                                        "url": url,
                                        "transcription": ""
                                    })
                            except:
                                continue
                        
                        if len(videos) >= 10:
                            break
                            
                    except:
                        continue
                        
            except Exception as e:
                print(f"   Erro ao acessar aba: {e}")
        
        print(f"✅ Total de vídeos encontrados: {len(videos)}")
        return videos[:max_videos]
    
    def get_transcription(self, video_url):
        """Obtém transcrição dos primeiros 5 segundos"""
        try:
            print(f"   🎥 Processando vídeo...")
            self.driver.get(video_url)
            time.sleep(3)
            
            # Aceita cookies se necessário
            try:
                accept_buttons = self.driver.find_elements(By.XPATH, "//button[contains(., 'Accept') or contains(., 'Aceitar')]")
                for btn in accept_buttons:
                    try:
                        btn.click()
                        time.sleep(1)
                        break
                    except:
                        continue
            except:
                pass
            
            # Tenta ativar legendas
            try:
                cc_selectors = [
                    "button[aria-label*='legendas' i]",
                    "button[aria-label*='captions' i]", 
                    "button[aria-label*='cc' i]",
                    ".ytp-subtitles-button"
                ]
                
                for selector in cc_selectors:
                    try:
                        cc_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                        cc_button.click()
                        time.sleep(1)
                        break
                    except:
                        continue
                        
            except:
                pass
            
            # Reproduz 5 segundos
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                play_button.click()
                print("   ⏱️ Aguardando 5 segundos...")
                time.sleep(5)
                play_button.click()  # Pausa
            except:
                print("   ⚠️ Não foi possível reproduzir automaticamente")
                time.sleep(5)  # Espera mesmo assim
            
            # Extrai legendas visíveis
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
            except:
                pass
            
            # Se não encontrou legendas visíveis, tenta painel de transcrição
            if not transcription:
                try:
                    # Botão de mais opções
                    more_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='more' i], button[aria-label*='mais' i], .ytp-settings-button")
                    more_button.click()
                    time.sleep(1)
                    
                    # Procura por transcrição
                    transcript_options = self.driver.find_elements(By.XPATH, "//div[contains(., 'Transcript') or contains(., 'Transcrição')]")
                    for option in transcript_options:
                        try:
                            option.click()
                            time.sleep(2)
                            break
                        except:
                            continue
                    
                    # Extrai texto do painel
                    transcript_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ytd-transcript-segment-renderer .segment-text")
                    if transcript_elements:
                        transcription = " ".join([elem.text for elem in transcript_elements[:3]])  # Primeiras 3 linhas ≈ 5 segundos
                        
                except:
                    pass
            
            return transcription if transcription else "[Transcrição não disponível]"
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            return "[Erro na transcrição]"
    
    def process_channel(self, channel_url, max_videos=206):
        """Processa todo o canal"""
        # Verifica se está logado
        if not self.check_login_status():
            print("❌ Você não está logado no YouTube nesta sessão.")
            print("Por favor, faça login no YouTube no seu Chrome e tente novamente.")
            return []
        
        # Obtém vídeos
        videos = self.get_channel_videos(channel_url, max_videos)
        
        if not videos:
            print("❌ Nenhum vídeo encontrado. Verifique:")
            print("   - Se o canal está acessível")
            print("   - Se você tem permissão para ver os vídeos")
            print("   - Se a URL está correta")
            return []
        
        print(f"\n🎯 Processando {len(videos)} vídeos...")
        
        # Processa cada vídeo
        successful = 0
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {video['title'][:50]}...")
            transcription = self.get_transcription(video['url'])
            video['transcription'] = transcription
            
            if "[Transcrição não disponível]" not in transcription and "[Erro na transcrição]" not in transcription:
                successful += 1
            
            time.sleep(2)  # Pausa entre vídeos
        
        # Salva resultados
        self._save_results(videos)
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   📹 Total de vídeos: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {len(videos) - successful}")
        
        return videos
    
    def _save_results(self, videos):
        """Salva os resultados em arquivos"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES DOS PRIMEIROS 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                f.write(f"{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*60 + "\n\n")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Fecha o navegador"""
        self.driver.quit()

def main():
    print("🎬 YouTube 5 Seconds Transcriber (Sessão Existente)")
    print("="*60)
    print("Usando sua sessão existente do Chrome (já logado)")
    print("="*60)
    
    channel_url = input("\nURL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    transcriber = YouTubeTranscriberSession()
    
    try:
        videos = transcriber.process_channel(channel_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada pelo usuário.")
    except Exception as e:
        print(f"\n❌ Erro durante execução: {e}")
    finally:
        transcriber.close()

if __name__ == "__main__":
    main()
