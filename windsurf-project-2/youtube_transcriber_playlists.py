#!/usr/bin/env python3
"""
Versão que processa playlists e extrai transcrições de cada vídeo
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberPlaylists:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        
    def get_playlist_videos(self, playlist_url):
        """Obtém todos os vídeos de uma playlist"""
        print(f"\n📋 Processando playlist: {playlist_url}")
        self.driver.get(playlist_url)
        time.sleep(3)
        
        videos = []
        
        # Rola a página para carregar todos os vídeos da playlist
        print("🔄 Carregando vídeos da playlist...")
        last_height = self.driver.execute_script("return document.documentElement.scrollHeight")
        
        while True:
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
            
            new_height = self.driver.execute_script("return document.documentElement.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
            print(f"   Rolando... ({len(videos)} vídeos encontrados)")
        
        # Encontra todos os vídeos da playlist
        try:
            # Vários seletores para vídeos de playlist
            video_selectors = [
                "a.ytd-playlist-video-renderer[href*='/watch?v=']",
                "ytd-playlist-video-renderer a[href*='/watch?v=']",
                "a[href*='/watch?v=']",
                "#video-title[href*='/watch?v=']"
            ]
            
            all_videos = []
            for selector in video_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    all_videos.extend(elements)
                except:
                    continue
            
            # Remove duplicatas
            seen_urls = set()
            unique_videos = []
            
            for elem in all_videos:
                try:
                    url = elem.get_attribute("href")
                    if url and "/watch?v=" in url and url not in seen_urls:
                        seen_urls.add(url)
                        unique_videos.append(elem)
                except:
                    continue
            
            print(f"📺 Encontrados {len(unique_videos)} vídeos na playlist")
            
            # Extrai informações de cada vídeo
            for i, elem in enumerate(unique_videos):
                try:
                    url = elem.get_attribute("href")
                    title = elem.get_attribute("title") or elem.text or f"Vídeo {i+1}"
                    
                    videos.append({
                        "title": title.strip(),
                        "url": url,
                        "transcription": ""
                    })
                    
                    print(f"   {i+1}. {title[:50]}")
                    
                except Exception as e:
                    print(f"   Erro no vídeo {i+1}: {e}")
                    continue
            
        except Exception as e:
            print(f"❌ Erro ao processar playlist: {e}")
        
        return videos
    
    def get_transcription(self, video_url):
        """Obtém transcrição dos primeiros 5 segundos de um vídeo"""
        try:
            print(f"   🎥 Processando: {video_url}")
            
            # Abre em nova aba
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(2)
            
            # Muda para nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
            time.sleep(3)
            
            # Aceita cookies
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
                print("      ⏱️ Aguardando 5 segundos...")
                time.sleep(5)
                play_button.click()  # Pausa
            except:
                print("      ⚠️ Não foi possível reproduzir")
                time.sleep(5)
            
            # Extrai legendas
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
            except:
                pass
            
            # Se não encontrou, tenta painel de transcrição
            if not transcription:
                try:
                    more_button = self.driver.find_element(By.CSS_SELECTOR, "button[aria-label*='more' i], button[aria-label*='mais' i]")
                    more_button.click()
                    time.sleep(1)
                    
                    transcript_options = self.driver.find_elements(By.XPATH, "//div[contains(., 'Transcript') or contains(., 'Transcrição')]")
                    for option in transcript_options:
                        try:
                            option.click()
                            time.sleep(2)
                            break
                        except:
                            continue
                    
                    transcript_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ytd-transcript-segment-renderer .segment-text")
                    if transcript_elements:
                        transcription = " ".join([elem.text for elem in transcript_elements[:3]])
                        
                except:
                    pass
            
            # Fecha aba
            self.driver.close()
            time.sleep(1)
            
            # Volta para aba anterior
            handles = self.driver.window_handles
            if handles:
                self.driver.switch_to.window(handles[-1])
            
            return transcription if transcription else "[Transcrição não disponível]"
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            try:
                self.driver.close()
                handles = self.driver.window_handles
                if handles:
                    self.driver.switch_to.window(handles[-1])
            except:
                pass
            return "[Erro na transcrição]"
    
    def process_all_playlists(self, channel_url, max_videos=206):
        """Processa todas as playlists do canal"""
        print("🎬 YouTube Playlist Transcriber")
        print("="*60)
        
        # Vai para a página do canal
        self.driver.get(channel_url)
        time.sleep(3)
        
        # Encontra todas as playlists
        print("🔍 Procurando playlists...")
        
        # Rola para carregar conteúdo
        for i in range(3):
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
        
        # Encontra links de playlists
        playlist_selectors = [
            "a[href*='/playlist?list=']",
            "ytd-grid-playlist-renderer a[href*='/playlist?list=']",
            "a[href*='playlist']"
        ]
        
        playlist_links = []
        for selector in playlist_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements:
                    href = elem.get_attribute("href")
                    if href and "playlist?list=" in href and href not in [link['url'] for link in playlist_links]:
                        title = elem.text.strip() or elem.get_attribute("title") or f"Playlist {len(playlist_links)+1}"
                        playlist_links.append({
                            "title": title,
                            "url": href
                        })
            except:
                continue
        
        print(f"📋 Encontradas {len(playlist_links)} playlists:")
        for i, playlist in enumerate(playlist_links):
            print(f"   {i+1}. {playlist['title']}")
        
        if not playlist_links:
            print("❌ Nenhuma playlist encontrada!")
            return []
        
        # Processa cada playlist
        all_videos = []
        total_processed = 0
        
        for i, playlist in enumerate(playlist_links):
            if total_processed >= max_videos:
                break
                
            print(f"\n📋 [{i+1}/{len(playlist_links)}] Processando: {playlist['title']}")
            
            # Obtém vídeos da playlist
            videos = self.get_playlist_videos(playlist['url'])
            
            # Processa transcrições
            for j, video in enumerate(videos):
                if total_processed >= max_videos:
                    break
                    
                print(f"\n[{total_processed+1}/{min(max_videos, len(all_videos))}] {video['title'][:50]}...")
                transcription = self.get_transcription(video['url'])
                video['transcription'] = transcription
                all_videos.append(video)
                total_processed += 1
                
                time.sleep(2)  # Pausa entre vídeos
        
        # Salva resultados
        self._save_results(all_videos)
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   📋 Playlists processadas: {len(playlist_links)}")
        print(f"   🎥 Vídeos processados: {len(all_videos)}")
        successful = sum(1 for v in all_videos if "[Transcrição" not in v['transcription'])
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {len(all_videos) - successful}")
        
        return all_videos
    
    def _save_results(self, videos):
        """Salva os resultados"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"playlist_transcriptions_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"playlist_transcriptions_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES DE VÍDEOS (PLAYLISTS)\n")
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
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Playlist Transcriber")
    print("="*60)
    print("Processa todas as playlists e extrai transcrições")
    print("="*60)
    
    channel_url = input("\nURL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    try:
        transcriber = YouTubeTranscriberPlaylists()
        videos = transcriber.process_all_playlists(channel_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
