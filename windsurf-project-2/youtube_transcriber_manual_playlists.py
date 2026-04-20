#!/usr/bin/env python3
"""
Versão manual que usa as playlists encontradas e processa com mais robustez
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberManualPlaylists:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)  # Aumenta timeout
        
    def get_playlist_videos_manual(self, playlist_url):
        """Obtém vídeos de playlist com método manual"""
        print(f"\n📋 Acessando playlist: {playlist_url}")
        self.driver.get(playlist_url)
        time.sleep(5)
        
        videos = []
        
        # Tenta diferentes métodos de rolagem
        print("🔄 Carregando vídeos...")
        
        # Método 1: Rola várias vezes
        for i in range(10):
            try:
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(2)
                
                # Verifica quantos vídeos encontrados
                current_videos = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/watch?v=']")
                print(f"   Rolagem {i+1}: {len(current_videos)} vídeos")
                
                # Se não encontrar mais vídeos após 3 rolagens, para
                if i > 2 and len(current_videos) == len(videos):
                    break
                    
                videos = current_videos
                
            except Exception as e:
                print(f"   Erro na rolagem {i+1}: {e}")
                continue
        
        # Método 2: Procura por elementos específicos de playlist
        if len(videos) < 5:
            print("🔍 Tentando seletores específicos de playlist...")
            selectors = [
                "ytd-playlist-video-renderer a[href*='/watch?v=']",
                ".ytd-playlist-video-renderer a[href*='/watch?v=']",
                "#playlist-items a[href*='/watch?v=']",
                "a.ytd-playlist-video-renderer"
            ]
            
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    print(f"   Seletor '{selector}': {len(elements)} vídeos")
                    if len(elements) > len(videos):
                        videos = elements
                        break
                except:
                    continue
        
        # Processa vídeos encontrados
        processed_videos = []
        seen_urls = set()
        
        for i, elem in enumerate(videos):
            try:
                url = elem.get_attribute("href")
                if url and "/watch?v=" in url and url not in seen_urls:
                    seen_urls.add(url)
                    
                    # Tenta diferentes métodos para pegar título
                    title = None
                    title_selectors = [
                        "#video-title",
                        "span#video-title",
                        ".ytd-video-meta-block",
                        "#byline",
                        "yt-formatted-string"
                    ]
                    
                    for selector in title_selectors:
                        try:
                            title_elem = elem.find_element(By.CSS_SELECTOR, selector)
                            title = title_elem.text.strip() or title_elem.get_attribute("title")
                            if title:
                                break
                        except:
                            continue
                    
                    if not title:
                        title = elem.text.strip() or elem.get_attribute("title") or f"Vídeo {i+1}"
                    
                    processed_videos.append({
                        "title": title,
                        "url": url,
                        "transcription": ""
                    })
                    
                    print(f"   {len(processed_videos)}. {title[:50]}")
                    
            except Exception as e:
                print(f"   Erro processando vídeo {i+1}: {e}")
                continue
        
        print(f"✅ Total de vídeos processados: {len(processed_videos)}")
        return processed_videos
    
    def get_transcription_safe(self, video_url):
        """Obtém transcrição com tratamento robusto de erros"""
        try:
            print(f"   🎥 {video_url}")
            
            # Abre em nova aba
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(3)
            
            # Muda para nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
            time.sleep(5)  # Mais tempo para carregar
            
            # Verifica se carregou
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "video, .ytp-player"))
                )
            except:
                print("      ⚠️ Tempo esgotado esperando vídeo")
            
            # Tenta reproduzir
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                play_button.click()
                print("      ▶️ Reproduzindo...")
                time.sleep(6)  # 5 segundos + margem
                
                # Pausa
                try:
                    pause_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                    pause_button.click()
                except:
                    pass
                    
            except Exception as e:
                print(f"      ⚠️ Erro ao reproduzir: {e}")
                time.sleep(6)  # Espera mesmo assim
            
            # Extrai legendas
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 Legendas encontradas: {len(captions)}")
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
    
    def process_from_debug_file(self):
        """Usa os dados do arquivo debug para processar playlists"""
        try:
            # Lê o arquivo debug mais recente
            import glob
            debug_files = glob.glob("debug_videos_*.json")
            if not debug_files:
                print("❌ Nenhum arquivo debug encontrado!")
                return []
            
            latest_file = max(debug_files)
            print(f"📁 Usando arquivo: {latest_file}")
            
            with open(latest_file, 'r', encoding='utf-8') as f:
                playlists = json.load(f)
            
            print(f"📋 Encontradas {len(playlists)} playlists no arquivo debug")
            
            all_videos = []
            total_processed = 0
            max_videos = 206
            
            for i, playlist in enumerate(playlists):
                if total_processed >= max_videos:
                    break
                
                print(f"\n📋 [{i+1}/{len(playlists)}] {playlist['title']}")
                
                # Tenta extrair URL da playlist se for um link
                playlist_url = playlist.get('url', '')
                if 'playlist?list=' in playlist_url:
                    # Processa como playlist
                    videos = self.get_playlist_videos_manual(playlist_url)
                else:
                    # Se não for URL de playlist, pula
                    print("   ⚠️ Não é uma URL de playlist válida")
                    continue
                
                # Processa transcrições
                for j, video in enumerate(videos):
                    if total_processed >= max_videos:
                        break
                    
                    print(f"\n[{total_processed+1}/{max_videos}] {video['title'][:50]}...")
                    transcription = self.get_transcription_safe(video['url'])
                    video['transcription'] = transcription
                    all_videos.append(video)
                    total_processed += 1
                    
                    time.sleep(3)  # Pausa maior entre vídeos
            
            # Salva resultados
            self._save_results(all_videos)
            return all_videos
            
        except Exception as e:
            print(f"❌ Erro ao processar do arquivo debug: {e}")
            return []
    
    def process_manual_playlists(self):
        """Processa as playlists que você encontrou manualmente"""
        print("🎬 Processamento Manual de Playlists")
        print("="*60)
        
        # Lista das playlists que você encontrou
        manual_playlists = [
            {
                "name": "Design de Sobrancelhas Masculino",
                "url": "https://www.youtube.com/playlist?list=PLk2k4NOTj3fIXmyIO87FAktAVtXFoSSVA"  # Exemplo - você precisa fornecer as URLs reais
            },
            # Adicione mais playlists conforme necessário
        ]
        
        print("\n📋 Playlists para processar:")
        for i, playlist in enumerate(manual_playlists):
            print(f"   {i+1}. {playlist['name']}")
        
        # Pergunta se quer usar arquivo debug ou playlists manuais
        choice = input("\nUsar arquivo debug (d) ou playlists manuais (m)? ").strip().lower()
        
        if choice == 'd':
            return self.process_from_debug_file()
        else:
            # Processa playlists manuais (você precisa fornecer as URLs)
            print("\n⚠️ Você precisa fornecer as URLs reais das playlists")
            print("Use o modo debug para encontrar as URLs corretas")
            return []
    
    def _save_results(self, videos):
        """Salva os resultados"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_finais_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_finais_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES FINAIS - 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                f.write(f"{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*60 + "\n\n")
        
        successful = sum(1 for v in videos if "[Transcrição" not in v['transcription'] and "[Erro]" not in v['transcription'])
        
        print(f"\n📊 RESUMO FINAL:")
        print(f"   🎥 Total processados: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {len(videos) - successful}")
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Transcriber - Playlists Manual")
    print("="*60)
    print("Usa playlists encontradas manualmente com mais robustez")
    print("="*60)
    
    try:
        transcriber = YouTubeTranscriberManualPlaylists()
        videos = transcriber.process_manual_playlists()
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
