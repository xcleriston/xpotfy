#!/usr/bin/env python3
"""
Sistema que extrai closed caption dos vídeos para identificar conteúdo
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

class YouTubeClosedCaptionExtractor:
    def __init__(self):
        """Conecta ao Chrome existente"""
        try:
            chrome_options = Options()
            chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 30)
            print("✅ Conectado ao Chrome!")
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            raise
    
    def load_video_list(self):
        """Carrega lista de vídeos do arquivo debug"""
        try:
            with open('debug_videos_20260309_230952.json', 'r', encoding='utf-8') as f:
                videos = json.load(f)
            
            # Remove duplicatas
            unique_videos = {}
            for video in videos:
                url = video.get('url', '')
                if '/watch?v=' in url:
                    video_id = url.split('v=')[1].split('&')[0]
                    if video_id not in unique_videos:
                        unique_videos[video_id] = video
            
            videos_list = list(unique_videos.values())
            print(f"📁 {len(videos_list)} vídeos únicos carregados")
            return videos_list
            
        except Exception as e:
            print(f"❌ Erro ao carregar vídeos: {e}")
            return []
    
    def extract_closed_caption(self, video_url, video_title):
        """Extrai closed caption dos primeiros 5 segundos"""
        try:
            print(f"   🎥 Extraindo caption...")
            
            # Abre vídeo
            self.driver.get(video_url)
            time.sleep(8)  # Tempo para carregar
            
            # Espera página carregar completamente
            try:
                self.wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
            except:
                pass
            
            # Ativa legendas/closed caption
            caption_activated = False
            try:
                # Procura botão de legendas
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
                        time.sleep(2)
                        caption_activated = True
                        print("      📝 Legendas ativadas")
                        break
                    except:
                        continue
                
                if not caption_activated:
                    print("      ⚠️ Não foi possível ativar legendas")
                    
            except Exception as e:
                print(f"      ⚠️ Erro ao ativar legendas: {e}")
            
            # Reproduz vídeo por 5 segundos
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo 5 segundos...")
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
            
            # Extrai caption/legendas
            caption_text = ""
            try:
                # Método 1: Segmentos de legenda
                captions = self.driver.find_elements(By.CSS_SELECTOR, ".ytp-caption-segment")
                if captions:
                    caption_text = " ".join([c.text for c in captions if c.text.strip()])
                    print(f"      📝 {len(captions)} segmentos encontrados")
                
                # Método 2: Painel de transcrição
                if not caption_text:
                    try:
                        # Procura por painel de transcrição
                        transcript_button = self.driver.find_element(By.XPATH, "//button[contains(., 'Transcrição') or contains(., 'Transcript')]")
                        transcript_button.click()
                        time.sleep(2)
                        
                        transcript_elements = self.driver.find_elements(By.CSS_SELECTOR, ".ytd-transcript-segment-renderer")
                        if transcript_elements:
                            # Pega os primeiros elementos (primeiros segundos)
                            for elem in transcript_elements[:3]:  # Primeiros 3 segmentos
                                text = elem.text.strip()
                                if text:
                                    caption_text += text + " "
                            print(f"      📝 Transcrição do painel: {len(transcript_elements)} segmentos")
                    except:
                        pass
                
                # Método 3: Texto alternativo
                if not caption_text:
                    try:
                        # Procura por qualquer elemento de texto que possa ser legenda
                        text_elements = self.driver.find_elements(By.CSS_SELECTOR, "[style*='caption'], [style*='subtitle']")
                        for elem in text_elements:
                            text = elem.text.strip()
                            if text and len(text) > 5:
                                caption_text += text + " "
                        
                        if caption_text:
                            print("      📝 Texto alternativo encontrado")
                    except:
                        pass
                
            except Exception as e:
                print(f"      ❌ Erro ao extrair caption: {e}")
            
            # Limpa e formata o texto
            if caption_text:
                # Remove espaços extras
                caption_text = " ".join(caption_text.split())
                # Limita a um tamanho razoável
                if len(caption_text) > 200:
                    caption_text = caption_text[:200] + "..."
                print(f"      ✅ Caption extraído: {len(caption_text)} caracteres")
            else:
                caption_text = "[Sem caption disponível]"
                print("      ❌ Nenhum caption encontrado")
            
            return caption_text
            
        except Exception as e:
            print(f"      ❌ Erro crítico: {e}")
            return "[Erro na extração]"
    
    def process_videos(self, max_videos=20):
        """Processa vídeos e extrai captions"""
        print("🎬 YouTube Closed Caption Extractor")
        print("="*60)
        print("Extraindo closed caption dos primeiros 5 segundos")
        print("="*60)
        
        # Carrega vídeos
        videos = self.load_video_list()
        if not videos:
            return []
        
        # Limita número de vídeos
        videos = videos[:max_videos]
        print(f"\n📋 Processando {len(videos)} vídeos...")
        
        successful = 0
        failed = 0
        
        # Processa cada vídeo
        for i, video in enumerate(videos):
            print(f"\n[{i+1}/{len(videos)}] {video['title'][:50]}...")
            
            caption = self.extract_closed_caption(video['url'], video['title'])
            video['closed_caption_5s'] = caption
            
            if "[Sem caption" not in caption and "[Erro" not in caption:
                successful += 1
                print(f"      ✅ Sucesso!")
            else:
                failed += 1
                print(f"      ❌ Falha")
            
            time.sleep(3)  # Pausa entre vídeos
        
        # Salva resultados
        self.save_results(videos, successful, failed)
        return videos
    
    def save_results(self, videos, successful, failed):
        """Salva resultados com captions"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"closed_captions_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT - Relatório de identificação
        txt_file = f"relatorio_identificacao_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("RELATÓRIO DE IDENTIFICAÇÃO - CLOSED CAPTIONS\n")
            f.write("="*60 + "\n")
            f.write("Primeiros 5 segundos de cada vídeo para identificação\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                status = "✅" if "[Sem caption" not in video['closed_caption_5s'] and "[Erro]" not in video['closed_caption_5s'] else "❌"
                f.write(f"\n{status} VÍDEO {i+1}\n")
                f.write(f"Título: {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Caption (5s): {video['closed_caption_5s']}\n")
                f.write("-"*60 + "\n")
        
        # CSV - Para análise fácil
        csv_file = f"videos_identificados_{timestamp}.csv"
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write("Título,URL,Caption_5s,Status\n")
            for video in videos:
                caption = video['closed_caption_5s'].replace('"', '""').replace('\n', ' ')
                title = video['title'].replace('"', '""')
                status = "OK" if "[Sem caption" not in video['closed_caption_5s'] and "[Erro]" not in video['closed_caption_5s'] else "FALHA"
                f.write(f'"{title}","{video['url']}","{caption}","{status}"\n')
        
        print(f"\n🎉 PROCESSO CONCLUÍDO!")
        print(f"📊 RESUMO:")
        print(f"   🎥 Total: {len(videos)}")
        print(f"   ✅ Com caption: {successful}")
        print(f"   ❌ Sem caption: {failed}")
        if videos:
            print(f"   📈 Taxa de sucesso: {(successful/len(videos)*100):.1f}%")
        
        print(f"\n✅ Arquivos gerados:")
        print(f"   📄 {json_file} - Dados completos")
        print(f"   📄 {txt_file} - Relatório de identificação")
        print(f"   📄 {csv_file} - Planilha para análise")
    
    def close(self):
        """Mantém Chrome aberto"""
        print("🔗 Chrome mantido aberto")

def main():
    print("🎬 YouTube Closed Caption Extractor")
    print("="*60)
    print("Sistema para identificar conteúdo dos vídeos via caption")
    print("="*60)
    
    max_videos = 999999  # Processa todos os vídeos
    
    try:
        extractor = YouTubeClosedCaptionExtractor()
        videos = extractor.process_videos(max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'extractor' in locals():
            extractor.close()

if __name__ == "__main__":
    main()
