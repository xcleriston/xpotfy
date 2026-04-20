#!/usr/bin/env python3
"""
Versão otimizada que extrai transcrições exatamente em 5 segundos
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeOptimizedTranscriber:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)
        
    def extract_playlist_urls(self, channel_url):
        """Extrai URLs das playlists do canal"""
        print(f"🔍 Extraindo playlists: {channel_url}")
        self.driver.get(channel_url)
        time.sleep(3)
        
        # Rola a página para carregar mais conteúdo
        print("🔄 Carregando conteúdo...")
        for i in range(5):
            self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
            time.sleep(2)
        
        # Encontra todos os links de playlists
        playlists = []
        
        try:
            elements = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/playlist?list=']")
            print(f"   Encontrados {len(elements)} elementos de playlist")
            
            for elem in elements:
                try:
                    href = elem.get_attribute("href")
                    if href and "playlist?list=" in href:
                        title = elem.text.strip() or elem.get_attribute("title") or "Sem título"
                        
                        # Remove duplicatas e playlists do sistema
                        if (not any(p['url'] == href for p in playlists) and 
                            href not in ['https://www.youtube.com/playlist?list=WL', 
                                       'https://www.youtube.com/playlist?list=LL']):
                            playlists.append({
                                "title": title,
                                "url": href
                            })
                            print(f"      📋 {title[:50]}")
                            
                except Exception as e:
                    continue
                    
        except Exception as e:
            print(f"   Erro ao encontrar playlists: {e}")
        
        print(f"\n✅ Encontradas {len(playlists)} playlists válidas")
        return playlists
    
    def get_videos_from_playlist(self, playlist_url, playlist_name):
        """Obtém vídeos de uma playlist específica"""
        print(f"\n📋 Processando: {playlist_name}")
        
        self.driver.get(playlist_url)
        time.sleep(5)
        
        videos = []
        
        # Rola a página para carregar todos os vídeos
        print("🔄 Carregando vídeos...")
        last_count = 0
        
        for i in range(10):
            try:
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(2)
                
                # Conta vídeos atuais
                current_videos = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/watch?v=']")
                current_count = len(current_videos)
                
                print(f"   Rolagem {i+1}: {current_count} vídeos")
                
                if i > 2 and current_count == last_count:
                    print(f"   📦 Estabilizado em {current_count} vídeos")
                    break
                
                last_count = current_count
                
                if current_count >= 50:
                    print(f"   📦 Limite de 50 vídeos alcançado")
                    break
                    
            except Exception as e:
                print(f"   Erro na rolagem {i+1}: {e}")
                continue
        
        # Encontra todos os elementos de vídeo
        try:
            video_elements = []
            selectors = [
                "ytd-playlist-video-renderer a[href*='/watch?v=']",
                ".ytd-playlist-video-renderer a[href*='/watch?v=']",
                "a[href*='/watch?v=']"
            ]
            
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    video_elements.extend(elements)
                except:
                    continue
            
            # Remove duplicatas
            seen_urls = set()
            unique_videos = []
            
            for elem in video_elements:
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
                            "#byline"
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
                            title = elem.text.strip() or elem.get_attribute("title") or f"Vídeo {len(unique_videos)+1}"
                        
                        # Remove textos indesejados
                        if "view full playlist" in title.lower() or len(title) < 3 or title.replace(":", "").replace(" ", "").isdigit():
                            title = f"Vídeo {len(unique_videos)+1} da playlist"
                        
                        unique_videos.append({
                            "title": title,
                            "url": url,
                            "transcription": "",
                            "playlist": playlist_name
                        })
                        
                        print(f"   {len(unique_videos)}. {title[:50]}")
                        
                except Exception as e:
                    continue
            
            print(f"📺 Processados {len(unique_videos)} vídeos únicos")
            return unique_videos
            
        except Exception as e:
            print(f"❌ Erro ao processar vídeos: {e}")
            return []
    
    def get_transcription_optimized(self, video_url):
        """Obtém transcrição exatamente em 5 segundos"""
        try:
            print(f"   🎥 Processando...")
            start_time = time.time()
            
            # Abre em nova aba
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(2)
            
            # Muda para nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
            
            # Espera rápida para carregar
            load_start = time.time()
            try:
                WebDriverWait(self.driver, 8).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
            except:
                pass  # Ignora timeout
            
            load_time = time.time() - load_start
            print(f"      📥 Carregou em {load_time:.1f}s")
            
            # Tenta ativar legendas rapidamente
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
                        break
                    except:
                        continue
            except:
                pass
            
            # Reproduz exatamente por 5 segundos
            play_start = time.time()
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo 5 segundos...")
                
                # Espera exatamente 5 segundos
                time.sleep(5.0)
                
                # Pausa
                try:
                    pause_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                    pause_button.click()
                except:
                    pass
                    
            except Exception as e:
                print(f"      ⚠️ Erro ao reproduzir: {e}")
                # Se não conseguiu reproduzir, espera mesmo assim
                elapsed = time.time() - play_start
                if elapsed < 5.0:
                    time.sleep(5.0 - elapsed)
            
            play_time = time.time() - play_start
            print(f"      ⏱️ Reprodução: {play_time:.1f}s")
            
            # Extrai legendas enquanto fecha
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos")
            except:
                pass
            
            # Fecha aba rapidamente
            try:
                self.driver.close()
                time.sleep(0.5)
            except:
                pass
            
            # Volta para aba anterior
            handles = self.driver.window_handles
            if handles:
                self.driver.switch_to.window(handles[-1])
            
            total_time = time.time() - start_time
            print(f"      ⚡ Total: {total_time:.1f}s")
            
            return transcription if transcription else "[Sem transcrição]"
            
        except Exception as e:
            print(f"      ❌ Erro: {e}")
            # Tenta fechar aba em caso de erro
            try:
                self.driver.close()
                time.sleep(0.5)
                handles = self.driver.window_handles
                if handles:
                    self.driver.switch_to.window(handles[-1])
            except:
                pass
            return "[Erro]"
    
    def process_complete(self, channel_url, max_videos=206):
        """Processa completo otimizado"""
        print("🎬 YouTube Optimized Transcriber")
        print("="*60)
        print("Versão otimizada: exatamente 5 segundos por vídeo")
        print("="*60)
        
        # 1. Extrai playlists
        playlists = self.extract_playlist_urls(channel_url)
        if not playlists:
            print("❌ Nenhuma playlist encontrada!")
            return []
        
        print(f"\n📋 Processando {len(playlists)} playlists...")
        
        all_videos = []
        total_processed = 0
        successful = 0
        failed = 0
        total_time = 0
        
        # 2. Processa cada playlist
        for i, playlist in enumerate(playlists):
            if total_processed >= max_videos:
                print(f"\n📦 Limite de {max_videos} vídeos alcançado!")
                break
            
            print(f"\n📋 [{i+1}/{len(playlists)}] {playlist['title']}")
            
            # Obtém vídeos da playlist
            videos = self.get_videos_from_playlist(playlist['url'], playlist['title'])
            
            if not videos:
                print("   ⚠️ Nenhum vídeo encontrado")
                continue
            
            # 3. Processa transcrições
            for j, video in enumerate(videos):
                if total_processed >= max_videos:
                    break
                
                video_start = time.time()
                print(f"\n[{total_processed+1}/{max_videos}] {video['title'][:50]}...")
                transcription = self.get_transcription_optimized(video['url'])
                video['transcription'] = transcription
                all_videos.append(video)
                total_processed += 1
                
                video_time = time.time() - video_start
                total_time += video_time
                
                if "[Transcrição" not in transcription and "[Erro" not in transcription:
                    successful += 1
                    print(f"      ✅ Sucesso! ({video_time:.1f}s)")
                else:
                    failed += 1
                    print(f"      ❌ Falha ({video_time:.1f}s)")
                
                # Pausa mínima entre vídeos (só para não sobrecarregar)
                time.sleep(1)
        
        # 4. Salva resultados
        self._save_results(all_videos, successful, failed, total_time)
        return all_videos
    
    def _save_results(self, videos, successful, failed, total_time):
        """Salva os resultados finais"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_otimizadas_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_otimizadas_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES OTIMIZADAS - EXATAMENTE 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            current_playlist = ""
            for i, video in enumerate(videos):
                if video.get('playlist') != current_playlist:
                    current_playlist = video.get('playlist', 'Sem playlist')
                    f.write(f"\n📋 PLAYLIST: {current_playlist}\n")
                    f.write("="*60 + "\n")
                
                status = "✅" if "[Transcrição" not in video['transcription'] and "[Erro" not in video['transcription'] else "❌"
                f.write(f"\n{status} {i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*40 + "\n")
        
        avg_time = total_time / len(videos) if videos else 0
        
        print(f"\n🎉 PROCESSO CONCLUÍDO!")
        print(f"📊 RESUMO FINAL:")
        print(f"   🎥 Total processados: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {failed}")
        print(f"   📈 Taxa de sucesso: {(successful/len(videos)*100):.1f}%" if videos else "   📈 Taxa de sucesso: 0%")
        print(f"   ⏱️ Tempo total: {total_time:.1f}s")
        print(f"   ⚡ Média por vídeo: {avg_time:.1f}s")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Optimized Transcriber")
    print("="*60)
    print("Versão otimizada: exatamente 5 segundos por vídeo")
    print("="*60)
    
    channel_url = input("\nURL do canal: ").strip()
    if not channel_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 50): ") or "50")
    except:
        max_videos = 50
    
    try:
        transcriber = YouTubeOptimizedTranscriber()
        videos = transcriber.process_complete(channel_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
