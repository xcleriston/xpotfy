#!/usr/bin/env python3
"""
Versão manual - usuário faz login no navegador primeiro, depois processa os vídeos
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberManual:
    def __init__(self, headless=False):
        """Inicializa o browser Chrome sem modo headless para login manual"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        
    def check_login_status(self):
        """Verifica se está logado no YouTube"""
        try:
            # Acessa o YouTube
            self.driver.get("https://www.youtube.com")
            time.sleep(3)
            
            # Procura por avatar do usuário (indica login)
            try:
                avatar = self.driver.find_element(By.CSS_SELECTOR, "#avatar-btn")
                print("✅ Login detectado com sucesso!")
                return True
            except:
                print("❌ Não está logado. Por favor, faça login manualmente.")
                return False
                
        except Exception as e:
            print(f"Erro ao verificar status: {e}")
            return False
    
    def manual_login(self):
        """Abre o navegador para login manual"""
        print("\n" + "="*60)
        print("🔐 LOGIN MANUAL NECESSÁRIO")
        print("="*60)
        print("1. Vou abrir o navegador na página de login do Google")
        print("2. Faça login com: despertabm@gmail.com")
        print("3. Depois de logar, pressione Enter aqui para continuar")
        print("="*60)
        
        # Abre página de login
        self.driver.get("https://accounts.google.com/signin")
        
        # Espera o usuário fazer login
        input("\nPressione Enter após fazer o login no navegador...")
        
        # Verifica se login foi bem sucedido
        if self.check_login_status():
            return True
        else:
            print("Tente novamente ou verifique se o login foi concluído.")
            return False
    
    def get_channel_videos(self, channel_url, max_videos=206):
        """Obtém vídeos do canal com múltiplas estratégias"""
        print(f"\n📺 Acessando canal: {channel_url}")
        self.driver.get(channel_url)
        time.sleep(5)  # Mais tempo para carregar
        
        videos = []
        
        # Estratégia 1: Procura na página principal
        print("🔍 Procurando vídeos na página principal...")
        videos.extend(self._find_videos_with_selectors(max_videos))
        
        # Estratégia 2: Tenta acessar aba de vídeos
        if len(videos) < 10:
            print("🔍 Tentando acessar aba 'Vídeos'...")
            videos.extend(self._try_videos_tab(max_videos - len(videos)))
        
        # Estratégia 3: Procura por links de vídeos diretamente
        if len(videos) < 10:
            print("🔍 Buscando todos os links de vídeos...")
            videos.extend(self._find_all_video_links(max_videos - len(videos)))
        
        # Remove duplicatas
        unique_videos = []
        seen_urls = set()
        for video in videos:
            if video['url'] not in seen_urls:
                seen_urls.add(video['url'])
                unique_videos.append(video)
        
        print(f"✅ Encontrados {len(unique_videos)} vídeos únicos")
        return unique_videos[:max_videos]
    
    def _find_videos_with_selectors(self, max_videos):
        """Encontra vídeos usando seletores CSS"""
        videos = []
        selectors = [
            "a#video-title",
            "a.yt-simple-endpoint[href*='/watch?v=']",
            "h3.ytd-video-renderer a",
            ".ytd-video-renderer a[href*='/watch?v=']"
        ]
        
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                print(f"   Seletor '{selector}': {len(elements)} elementos")
                
                for elem in elements[:max_videos]:
                    try:
                        url = elem.get_attribute("href")
                        if url and "/watch?v=" in url:
                            title = elem.get_attribute("title") or elem.text or f"Vídeo {len(videos)+1}"
                            videos.append({
                                "title": title.strip(),
                                "url": url,
                                "transcription": ""
                            })
                    except:
                        continue
                        
                if len(videos) >= max_videos:
                    break
                    
            except Exception as e:
                print(f"   Erro com seletor '{selector}': {e}")
                continue
        
        return videos
    
    def _try_videos_tab(self, max_videos):
        """Tenta acessar aba de vídeos"""
        try:
            # Rola a página para ver se aparece mais conteúdo
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
            
            # Procura por aba de vídeos
            tab_selectors = [
                "//a[contains(@href, '/videos')]",
                "//tp-yt-paper-tab[contains(., 'Vídeos')]",
                "//a[contains(., 'Videos')]",
                "//a[contains(., 'VIDEOS')]"
            ]
            
            for selector in tab_selectors:
                try:
                    tab = self.driver.find_element(By.XPATH, selector)
                    print(f"   Clicando na aba: {selector}")
                    tab.click()
                    time.sleep(3)
                    
                    # Busca vídeos na nova página
                    return self._find_videos_with_selectors(max_videos)
                    
                except:
                    continue
                    
        except Exception as e:
            print(f"   Erro ao acessar aba de vídeos: {e}")
        
        return []
    
    def _find_all_video_links(self, max_videos):
        """Busca todos os links que apontam para vídeos"""
        videos = []
        try:
            # Rola mais para carregar conteúdo
            for _ in range(5):
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(1)
            
            # Encontra todos os links de vídeo
            elements = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/watch?v=')]")
            print(f"   Links totais encontrados: {len(elements)}")
            
            for elem in elements[:max_videos]:
                try:
                    url = elem.get_attribute("href")
                    if url and "/watch?v=" in url:
                        title = elem.get_attribute("title") or elem.text or f"Vídeo {len(videos)+1}"
                        videos.append({
                            "title": title.strip(),
                            "url": url,
                            "transcription": ""
                        })
                except:
                    continue
                    
        except Exception as e:
            print(f"   Erro na busca geral: {e}")
        
        return videos
    
    def get_transcription(self, video_url):
        """Obtém transcrição dos primeiros 5 segundos"""
        try:
            print(f"   🎥 Processando: {video_url}")
            self.driver.get(video_url)
            time.sleep(3)
            
            # Aceita cookies se necessário
            try:
                accept = self.driver.find_element(By.XPATH, "//button[contains(., 'Accept all')]")
                accept.click()
                time.sleep(1)
            except:
                pass
            
            # Tenta ativar legendas
            try:
                cc_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='legendas' i], button[aria-label*='captions' i]")
                cc_button.click()
                time.sleep(1)
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
                pass
            
            # Extrai legendas visíveis
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    text = " ".join([c.text for c in captions if c.text.strip()])
                    return text if text else "[Sem legendas visíveis]"
            except:
                pass
            
            return "[Transcrição não disponível]"
            
        except Exception as e:
            print(f"   ❌ Erro: {e}")
            return "[Erro na transcrição]"
    
    def process_channel(self, channel_url, max_videos=206):
        """Processa todo o canal"""
        # Verifica login
        if not self.check_login_status():
            if not self.manual_login():
                print("❌ Não foi possível fazer login. Encerrando.")
                return []
        
        # Obtém vídeos
        videos = self.get_channel_videos(channel_url, max_videos)
        
        if not videos:
            print("❌ Nenhum vídeo encontrado. Verifique se o canal está acessível.")
            return []
        
        print(f"\n🎯 Processando {len(videos)} vídeos...")
        
        # Processa cada vídeo
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {video['title'][:50]}...")
            transcription = self.get_transcription(video['url'])
            video['transcription'] = transcription
            time.sleep(2)  # Pausa entre vídeos
        
        # Salva resultados
        self._save_results(videos)
        return videos
    
    def _save_results(self, videos):
        """Salva os resultados em arquivos"""
        # JSON
        with open("transcricoes.json", 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        with open("transcricoes.txt", 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES DOS PRIMEIROS 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                f.write(f"{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*60 + "\n\n")
        
        print(f"\n✅ Concluído! Arquivos salvos:")
        print(f"   📄 transcricoes.json")
        print(f"   📄 transcricoes.txt")
    
    def close(self):
        """Fecha o navegador"""
        self.driver.quit()

def main():
    print("🎬 YouTube 5 Seconds Transcriber (Manual Login)")
    print("="*60)
    
    channel_url = input("URL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    transcriber = YouTubeTranscriberManual(headless=False)
    
    try:
        videos = transcriber.process_channel(channel_url, max_videos)
        
        print(f"\n📊 RESUMO:")
        print(f"   Total processados: {len(videos)}")
        print(f"   Com transcrição: {sum(1 for v in videos if '[Transcrição' not in v['transcription'])}")
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        transcriber.close()

if __name__ == "__main__":
    main()
