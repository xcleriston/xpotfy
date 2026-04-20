#!/usr/bin/env python3
"""
Versão que se conecta a uma janela do Chrome já aberta (remote debugging)
"""

import time
import json
import subprocess
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberRemote:
    def __init__(self):
        """Conecta a uma instância do Chrome já aberta"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 15)
            print("✅ Conectado ao Chrome existente!")
        except Exception as e:
            print(f"❌ Erro ao conectar ao Chrome: {e}")
            print("\n📋 INSTRUÇÕES PARA CONECTAR AO CHROME EXISTENTE:")
            print("1. Feche todas as janelas do Chrome")
            print("2. Abra o Chrome com modo debug:")
            print("   chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\\temp\\chrome_debug")
            print("3. Faça login no YouTube normalmente")
            print("4. Execute este script novamente")
            raise e
    
    def check_login_status(self):
        """Verifica se está logado no YouTube"""
        try:
            # Verifica abas existentes primeiro
            handles = self.driver.window_handles
            youtube_tab = None
            
            for handle in handles:
                self.driver.switch_to.window(handle)
                if "youtube.com" in self.driver.current_url:
                    youtube_tab = handle
                    break
            
            # Se não encontrar aba do YouTube, abre uma nova
            if not youtube_tab:
                self.driver.execute_script("window.open('https://www.youtube.com', '_blank');")
                time.sleep(2)
                handles = self.driver.window_handles
                self.driver.switch_to.window(handles[-1])
            
            # Verifica se está logado
            time.sleep(3)
            try:
                avatar = self.driver.find_element(By.CSS_SELECTOR, "#avatar-btn, button[aria-label*='avatar']")
                print("✅ Logado no YouTube!")
                return True
            except:
                print("❌ Não está logado no YouTube nesta janela")
                return False
                
        except Exception as e:
            print(f"Erro ao verificar login: {e}")
            return False
    
    def get_channel_videos(self, channel_url, max_videos=206):
        """Obtém vídeos do canal"""
        print(f"\n📺 Acessando canal: {channel_url}")
        
        # Abre nova aba para o canal
        self.driver.execute_script(f"window.open('{channel_url}', '_blank');")
        time.sleep(2)
        
        # Muda para a nova aba
        handles = self.driver.window_handles
        self.driver.switch_to.window(handles[-1])
        time.sleep(5)
        
        videos = []
        
        # Rola a página para carregar mais vídeos
        print("🔄 Carregando vídeos...")
        for i in range(5):
            try:
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(2)
                print(f"   Rolagem {i+1}/5")
            except:
                continue
        
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
            
            # Abre nova aba para o vídeo
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(2)
            
            # Muda para a nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
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
            
            # Fecha a aba do vídeo
            self.driver.close()
            time.sleep(1)
            
            # Volta para a aba anterior
            handles = self.driver.window_handles
            if handles:
                self.driver.switch_to.window(handles[-1])
            
            return transcription if transcription else "[Transcrição não disponível]"
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            # Tenta fechar a aba em caso de erro
            try:
                self.driver.close()
                handles = self.driver.window_handles
                if handles:
                    self.driver.switch_to.window(handles[-1])
            except:
                pass
            return "[Erro na transcrição]"
    
    def process_channel(self, channel_url, max_videos=206):
        """Processa todo o canal"""
        # Verifica se está logado
        if not self.check_login_status():
            print("❌ Você não está logado no YouTube nesta janela.")
            return []
        
        # Obtém vídeos
        videos = self.get_channel_videos(channel_url, max_videos)
        
        if not videos:
            print("❌ Nenhum vídeo encontrado.")
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
        """Não fecha o navegador (já estava aberto)"""
        print("🔗 Mantendo janela do Chrome aberta")

def main():
    print("🎬 YouTube 5 Seconds Transcriber (Chrome Remoto)")
    print("="*60)
    print("Conectando à sua janela do Chrome já aberta...")
    print("="*60)
    
    channel_url = input("\nURL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    try:
        transcriber = YouTubeTranscriberRemote()
        videos = transcriber.process_channel(channel_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada pelo usuário.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        print("\n💡 DICA: Execute o Chrome com:")
        print("   chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\\temp\\chrome_debug")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
