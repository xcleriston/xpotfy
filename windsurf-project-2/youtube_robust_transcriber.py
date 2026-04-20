#!/usr/bin/env python3
"""
Versão final robusta que resolve problemas de reprodução e timeouts
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeRobustTranscriber:
    def __init__(self):
        """Conecta ao Chrome existente"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 45)  # Timeout maior
        
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
        
        for i in range(15):
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
                
                if current_count >= 100:
                    print(f"   📦 Limite de 100 vídeos alcançado")
                    break
                    
            except Exception as e:
                print(f"   Erro na rolagem {i+1}: {e}")
                continue
        
        # Encontra todos os elementos de vídeo
        try:
            # Tenta diferentes seletores para vídeos de playlist
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
    
    def get_transcription_ultra_robust(self, video_url):
        """Obtém transcrição com máxima robustez contra erros"""
        try:
            print(f"   🎥 Processando...")
            
            # Abre em nova aba
            self.driver.execute_script(f"window.open('{video_url}', '_blank');")
            time.sleep(3)
            
            # Muda para nova aba
            handles = self.driver.window_handles
            self.driver.switch_to.window(handles[-1])
            time.sleep(10)  # Tempo generoso para carregar
            
            # Espera o vídeo carregar completamente
            try:
                WebDriverWait(self.driver, 20).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                time.sleep(3)  # Tempo extra
            except:
                print("      ⏱️ Timeout esperando carregamento, continuando...")
            
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
                        print("      📝 Legendas ativadas")
                        break
                    except:
                        continue
            except:
                print("      ⚠️ Não foi possível ativar legendas")
            
            # Tenta reproduzir com múltiplas estratégias
            reproduction_success = False
            
            # Estratégia 1: Botão play padrão
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)  # Usa JavaScript
                print("      ▶️ Reproduzindo (método 1)...")
                time.sleep(7)
                reproduction_success = True
            except Exception as e:
                print(f"      ⚠️ Método 1 falhou: {e}")
            
            # Estratégia 2: Área do vídeo
            if not reproduction_success:
                try:
                    video_area = self.driver.find_element(By.CSS_SELECTOR, ".html5-main-video, video")
                    video_area.click()
                    print("      ▶️ Reproduzindo (método 2)...")
                    time.sleep(7)
                    reproduction_success = True
                except Exception as e:
                    print(f"      ⚠️ Método 2 falhou: {e}")
            
            # Estratégia 3: JavaScript
            if not reproduction_success:
                try:
                    self.driver.execute_script("document.querySelector('video').play();")
                    print("      ▶️ Reproduzindo (método 3)...")
                    time.sleep(7)
                    reproduction_success = True
                except Exception as e:
                    print(f"      ⚠️ Método 3 falhou: {e}")
            
            # Se não conseguiu reproduzir, espera mesmo assim
            if not reproduction_success:
                print("      ⏱️ Não foi possível reproduzir, aguardando 7 segundos...")
                time.sleep(7)
            
            # Tenta pausar
            try:
                pause_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                if pause_button.get_attribute("title") and "Pausar" in pause_button.get_attribute("title"):
                    pause_button.click()
            except:
                pass
            
            # Extrai legendas
            transcription = ""
            try:
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    transcription = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos encontrados")
                else:
                    print("      📝 Nenhuma legenda visível")
            except:
                print("      📝 Erro ao extrair legendas")
            
            # Fecha aba
            try:
                self.driver.close()
                time.sleep(2)
            except:
                pass
            
            # Volta para aba anterior
            handles = self.driver.window_handles
            if handles:
                self.driver.switch_to.window(handles[-1])
            
            return transcription if transcription else "[Sem transcrição]"
            
        except Exception as e:
            print(f"      ❌ Erro crítico: {e}")
            # Tenta fechar aba em caso de erro
            try:
                self.driver.close()
                time.sleep(2)
                handles = self.driver.window_handles
                if handles:
                    self.driver.switch_to.window(handles[-1])
            except:
                pass
            return "[Erro crítico]"
    
    def process_complete(self, channel_url, max_videos=206):
        """Processa completo com máxima robustez"""
        print("🎬 YouTube Robust Transcriber")
        print("="*60)
        print("Versão ultra robusta: extrai playlists + transcrições")
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
                
                print(f"\n[{total_processed+1}/{max_videos}] {video['title'][:50]}...")
                transcription = self.get_transcription_ultra_robust(video['url'])
                video['transcription'] = transcription
                all_videos.append(video)
                total_processed += 1
                
                if "[Transcrição" not in transcription and "[Erro" not in transcription:
                    successful += 1
                
                time.sleep(5)  # Pausa maior entre vídeos
        
        # 4. Salva resultados
        self._save_results(all_videos, successful)
        return all_videos
    
    def _save_results(self, videos, successful):
        """Salva os resultados finais"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_robustas_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_robustas_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES ROBUSTAS - PRIMEIROS 5 SEGUNDOS\n")
            f.write("="*60 + "\n\n")
            
            current_playlist = ""
            for i, video in enumerate(videos):
                if video.get('playlist') != current_playlist:
                    current_playlist = video.get('playlist', 'Sem playlist')
                    f.write(f"\n📋 PLAYLIST: {current_playlist}\n")
                    f.write("="*60 + "\n")
                
                f.write(f"\n{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*40 + "\n")
        
        failed = len(videos) - successful
        
        print(f"\n🎉 PROCESSO CONCLUÍDO!")
        print(f"📊 RESUMO FINAL:")
        print(f"   🎥 Total processados: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {failed}")
        print(f"   📈 Taxa de sucesso: {(successful/len(videos)*100):.1f}%" if videos else "   📈 Taxa de sucesso: 0%")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Robust Transcriber")
    print("="*60)
    print("Versão ultra robusta contra erros")
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
        transcriber = YouTubeRobustTranscriber()
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
