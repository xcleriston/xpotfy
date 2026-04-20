#!/usr/bin/env python3
"""
Script final que processa as playlists encontradas e extrai transcrições
"""

import time
import json
import glob
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberFinal:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)
        
    def load_playlist_urls(self):
        """Carrega URLs das playlists do arquivo mais recente"""
        try:
            # Encontra o arquivo mais recente de playlist URLs
            playlist_files = glob.glob("playlist_urls_*.json")
            if not playlist_files:
                print("❌ Nenhum arquivo de playlist URLs encontrado!")
                return []
            
            latest_file = max(playlist_files)
            print(f"📁 Carregando playlists de: {latest_file}")
            
            with open(latest_file, 'r', encoding='utf-8') as f:
                playlists = json.load(f)
            
            # Filtra playlists do sistema (Watch later, Liked videos)
            filtered_playlists = []
            for playlist in playlists:
                if playlist['url'] not in ['https://www.youtube.com/playlist?list=WL', 
                                          'https://www.youtube.com/playlist?list=LL']:
                    filtered_playlists.append(playlist)
            
            print(f"📋 Playlists válidas: {len(filtered_playlists)}")
            return filtered_playlists
            
        except Exception as e:
            print(f"❌ Erro ao carregar playlists: {e}")
            return []
    
    def get_videos_from_playlist(self, playlist_url, playlist_name):
        """Obtém vídeos de uma playlist específica"""
        print(f"\n📋 Processando playlist: {playlist_name}")
        print(f"🔗 URL: {playlist_url}")
        
        self.driver.get(playlist_url)
        time.sleep(5)
        
        videos = []
        
        # Rola a página para carregar todos os vídeos
        print("🔄 Carregando vídeos...")
        last_count = 0
        
        for i in range(20):  # Máximo 20 rolagens
            try:
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(2)
                
                # Conta vídeos atuais
                current_videos = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/watch?v=']")
                current_count = len(current_videos)
                
                print(f"   Rolagem {i+1}: {current_count} vídeos")
                
                # Se não encontrar mais vídeos após 3 rolagens, para
                if i > 2 and current_count == last_count:
                    print(f"   📦 Estabilizado em {current_count} vídeos")
                    break
                
                last_count = current_count
                
                # Se já encontrou muitos vídeos, pode parar
                if current_count >= 100:
                    print(f"   📦 Limite de 100 vídeos alcançado")
                    break
                    
            except Exception as e:
                print(f"   Erro na rolagem {i+1}: {e}")
                continue
        
        # Processa vídeos encontrados
        processed_videos = []
        seen_urls = set()
        
        # Tenta diferentes seletores para vídeos de playlist
        video_selectors = [
            "ytd-playlist-video-renderer a[href*='/watch?v=']",
            ".ytd-playlist-video-renderer a[href*='/watch?v=']",
            "a[href*='/watch?v=']",
            "#video-title[href*='/watch?v=']"
        ]
        
        all_video_elements = []
        for selector in video_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                all_video_elements.extend(elements)
            except:
                continue
        
        # Remove duplicatas
        unique_elements = []
        for elem in all_video_elements:
            try:
                url = elem.get_attribute("href")
                if url and "/watch?v=" in url and url not in seen_urls:
                    seen_urls.add(url)
                    unique_elements.append(elem)
            except:
                continue
        
        print(f"📺 Encontrados {len(unique_elements)} vídeos únicos")
        
        # Extrai informações de cada vídeo
        for i, elem in enumerate(unique_videos):
            try:
                url = elem.get_attribute("href")
                
                # Tenta diferentes métodos para pegar título
                title = None
                title_selectors = [
                    "#video-title",
                    "span#video-title", 
                    ".ytd-video-meta-block",
                    "#byline",
                    "yt-formatted-string",
                    "#video-title yt-formatted-string"
                ]
                
                for selector in title_selectors:
                    try:
                        title_elem = elem.find_element(By.CSS_SELECTOR, selector)
                        title = title_elem.text.strip() or title_elem.get_attribute("title")
                        if title and len(title.strip()) > 0:
                            break
                    except:
                        continue
                
                # Se não encontrou título, usa texto do elemento
                if not title:
                    title = elem.text.strip() or elem.get_attribute("title") or f"Vídeo {i+1}"
                
                # Remove "View full playlist" e outros textos indesejados
                if "view full playlist" in title.lower() or len(title) < 3:
                    title = f"Vídeo {i+1} da playlist"
                
                processed_videos.append({
                    "title": title,
                    "url": url,
                    "transcription": "",
                    "playlist": playlist_name
                })
                
                print(f"   {len(processed_videos)}. {title[:50]}")
                
            except Exception as e:
                print(f"   Erro no vídeo {i+1}: {e}")
                continue
        
        return processed_videos
    
    def get_transcription_robust(self, video_url):
        """Obtém transcrição com máxima robustez"""
        try:
            print(f"   🎥 {video_url}")
            
            # Abre em nova aba
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(3)
            
            # Muda para nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
            time.sleep(8)  # Tempo generoso para carregar
            
            # Espera o vídeo carregar
            try:
                WebDriverWait(self.driver, 15).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
            except:
                print("      ⚠️ Timeout esperando carregamento")
            
            # Tenta ativar legendas antes de reproduzir
            try:
                cc_selectors = [
                    "button[aria-label*='legendas' i]",
                    "button[aria-label*='captions' i]", 
                    "button[aria-label*='cc' i]",
                    ".ytp-subtitles-button",
                    ".ytp-caption-settings-button"
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
            
            # Tenta reproduzir
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                play_button.click()
                print("      ▶️ Reproduzindo...")
                time.sleep(7)  # 5 segundos + margem
                
                # Pausa
                try:
                    pause_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                    pause_button.click()
                except:
                    pass
                    
            except Exception as e:
                print(f"      ⚠️ Erro ao reproduzir: {e}")
                time.sleep(7)  # Espera mesmo assim
            
            # Extrai legendas
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 Legendas: {len(captions)} segmentos")
            except:
                pass
            
            # Fecha aba
            try:
                self.driver.close()
                time.sleep(1)
            except:
                pass
            
            # Volta para aba anterior
            handles = self.driver.window_handles
            if handles:
                self.driver.switch_to.window(handles[-1])
            
            return transcription if transcription else "[Sem transcrição]"
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            # Tenta fechar aba em caso de erro
            try:
                self.driver.close()
                handles = self.driver.window_handles
                if handles:
                    self.driver.switch_to.window(handles[-1])
            except:
                pass
            return "[Erro]"
    
    def process_all_playlists(self, max_videos=206):
        """Processa todas as playlists"""
        print("🎬 YouTube Transcriber - Versão Final")
        print("="*60)
        
        # Carrega playlists
        playlists = self.load_playlist_urls()
        if not playlists:
            return []
        
        print(f"\n📋 Processando {len(playlists)} playlists...")
        
        all_videos = []
        total_processed = 0
        
        for i, playlist in enumerate(playlists):
            if total_processed >= max_videos:
                print(f"\n📦 Limite de {max_videos} vídeos alcançado!")
                break
            
            print(f"\n📋 [{i+1}/{len(playlists)}] {playlist['title']}")
            
            # Obtém vídeos da playlist
            videos = self.get_videos_from_playlist(playlist['url'], playlist['title'])
            
            if not videos:
                print("   ⚠️ Nenhum vídeo encontrado na playlist")
                continue
            
            # Processa transcrições
            for j, video in enumerate(videos):
                if total_processed >= max_videos:
                    break
                
                print(f"\n[{total_processed+1}/{max_videos}] {video['title'][:50]}...")
                transcription = self.get_transcription_robust(video['url'])
                video['transcription'] = transcription
                all_videos.append(video)
                total_processed += 1
                
                time.sleep(4)  # Pausa entre vídeos
        
        # Salva resultados
        self._save_results(all_videos)
        return all_videos
    
    def _save_results(self, videos):
        """Salva os resultados finais"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_finais_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_finais_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES FINAIS - PRIMEIROS 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            current_playlist = ""
            for i, video in enumerate(videos):
                # Mostra nome da playlist se mudou
                if video.get('playlist') != current_playlist:
                    current_playlist = video.get('playlist', 'Sem playlist')
                    f.write(f"\n📋 PLAYLIST: {current_playlist}\n")
                    f.write("="*60 + "\n")
                
                f.write(f"\n{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*40 + "\n")
        
        # Estatísticas
        successful = sum(1 for v in videos if "[Transcrição" not in v['transcription'] and "[Erro]" not in v['transcription'])
        failed = len(videos) - successful
        
        # Estatísticas por playlist
        playlist_stats = {}
        for video in videos:
            playlist = video.get('playlist', 'Sem playlist')
            if playlist not in playlist_stats:
                playlist_stats[playlist] = {'total': 0, 'success': 0}
            playlist_stats[playlist]['total'] += 1
            if "[Transcrição" not in video['transcription'] and "[Erro]" not in video['transcription']:
                playlist_stats[playlist]['success'] += 1
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   🎥 Total processados: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {failed}")
        print(f"\n📋 Por playlist:")
        for playlist, stats in playlist_stats.items():
            success_rate = (stats['success'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"   📁 {playlist[:40]}: {stats['success']}/{stats['total']} ({success_rate:.1f}%)")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Transcriber - Versão Final")
    print("="*60)
    print("Processa todas as playlists com transcrições")
    print("="*60)
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    try:
        transcriber = YouTubeTranscriberFinal()
        videos = transcriber.process_all_playlists(max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
