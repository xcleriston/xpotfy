#!/usr/bin/env python3
"""
Versão que acessa diretamente os vídeos do YouTube Studio
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeStudioTranscriber:
    def __init__(self):
        """Conecta ao Chrome existente com retry"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"🔄 Tentativa {attempt + 1}/{max_retries} de conectar ao Chrome...")
                self.driver = webdriver.Chrome(options=chrome_options)
                self.wait = WebDriverWait(self.driver, 120)
                print("✅ Conectado ao Chrome!")
                return
            except Exception as e:
                print(f"❌ Erro na tentativa {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    print("⏱️ Aguardando 5 segundos antes de tentar novamente...")
                    time.sleep(5)
                else:
                    raise e
    
    def get_videos_from_studio(self, studio_url):
        """Obtém vídeos diretamente do YouTube Studio"""
        print(f"🔍 Acessando YouTube Studio: {studio_url}")
        
        try:
            self.driver.get(studio_url)
            time.sleep(10)  # Tempo generoso para carregar
            print("✅ YouTube Studio acessado")
        except Exception as e:
            print(f"❌ Erro ao acessar Studio: {e}")
            print("🔄 Ignorando erro e tentando continuar...")
            # Não retorna [], continua mesmo com erro
        
        # Rola a página para carregar todos os vídeos
        print("🔄 Carregando vídeos...")
        last_count = 0
        
        for i in range(20):  # Mais rolagens para garantir todos os 206
            try:
                self.driver.execute_script("window.scrollTo(0, document.documentElement.scrollHeight);")
                time.sleep(3)
                
                # Conta vídeos atuais
                current_videos = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='/watch?v=']")
                current_count = len(current_videos)
                
                print(f"   Rolagem {i+1}: {current_count} vídeos")
                
                if i > 3 and current_count == last_count:
                    print(f"   📦 Estabilizado em {current_count} vídeos")
                    break
                
                last_count = current_count
                
                if current_count >= 206:
                    print(f"   📦 Limite de 206 vídeos alcançado!")
                    break
                    
            except Exception as e:
                print(f"   Erro na rolagem {i+1}: {e}")
                continue
        
        # Encontra todos os elementos de vídeo
        try:
            video_elements = []
            selectors = [
                "a[href*='/watch?v=']",
                "ytd-video-renderer a[href*='/watch?v=']",
                ".ytd-video-renderer a[href*='/watch?v=']",
                "#video-title[href*='/watch?v=']",
                "a.yt-simple-endpoint[href*='/watch?v=']"
            ]
            
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    video_elements.extend(elements)
                    print(f"   Seletor '{selector}': +{len(elements)} elementos")
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
                            "#byline",
                            "yt-formatted-string",
                            "#video-title yt-formatted-string",
                            ".ytd-video-renderer #video-title"
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
                        if (len(title) < 3 or 
                            title.replace(":", "").replace(" ", "").isdigit() or
                            (title.count(":") == 1 and len(title) < 10)):
                            title = f"Vídeo {len(unique_videos)+1}"
                        
                        unique_videos.append({
                            "title": title,
                            "url": url,
                            "transcription": ""
                        })
                        
                        print(f"   {len(unique_videos)}. {title[:50]}")
                        
                except Exception as e:
                    continue
            
            print(f"📺 Processados {len(unique_videos)} vídeos únicos")
            return unique_videos
            
        except Exception as e:
            print(f"❌ Erro ao processar vídeos: {e}")
            return []
    
    def get_transcription_studio(self, video_url):
        """Obtém transcrição com máxima acurácia"""
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
                WebDriverWait(self.driver, 30).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                time.sleep(5)  # Tempo extra
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
            
            # Tenta ativar legendas
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
                        time.sleep(2)
                        print("      📝 Legendas ativadas")
                        break
                    except:
                        continue
            except:
                print("      ⚠️ Não foi possível ativar legendas")
            
            # Tenta reproduzir com múltiplas estratégias
            reproduction_success = False
            
            # Estratégia 1: Botão play com JavaScript
            try:
                play_button = self.driver.find_element(By.CSS_SELECTOR, "button.ytp-play-button")
                self.driver.execute_script("arguments[0].click();", play_button)
                print("      ▶️ Reproduzindo (método 1)...")
                time.sleep(7)
                reproduction_success = True
            except Exception as e:
                print(f"      ⚠️ Método 1 falhou: {e}")
            
            # Estratégia 2: Área do vídeo
            if not reproduction_success:
                try:
                    video_area = self.driver.find_element(By.CSS_SELECTOR, ".html5-main-video, video, .ytp-player")
                    video_area.click()
                    print("      ▶️ Reproduzindo (método 2)...")
                    time.sleep(7)
                    reproduction_success = True
                except Exception as e:
                    print(f"      ⚠️ Método 2 falhou: {e}")
            
            # Estratégia 3: JavaScript direto
            if not reproduction_success:
                try:
                    self.driver.execute_script("if(document.querySelector('video')) document.querySelector('video').play();")
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
    
    def process_complete(self, studio_url, max_videos=206):
        """Processa completo do YouTube Studio"""
        print("🎬 YouTube Studio Transcriber")
        print("="*60)
        print("Versão que acessa diretamente os vídeos do Studio")
        print("="*60)
        
        # 1. Obtém vídeos do Studio
        videos = self.get_videos_from_studio(studio_url)
        if not videos:
            print("❌ Nenhum vídeo encontrado!")
            return []
        
        print(f"\n📋 Processando {len(videos)} vídeos...")
        
        successful = 0
        failed = 0
        
        # 2. Processa transcrições
        for i, video in enumerate(videos):
            if i >= max_videos:
                print(f"\n📦 Limite de {max_videos} vídeos alcançado!")
                break
            
            print(f"\n[{i+1}/{max_videos}] {video['title'][:50]}...")
            transcription = self.get_transcription_studio(video['url'])
            video['transcription'] = transcription
            
            if "[Transcrição" not in transcription and "[Erro" not in transcription:
                successful += 1
                print(f"      ✅ Sucesso!")
            else:
                failed += 1
                print(f"      ❌ Falha: {transcription}")
            
            time.sleep(5)  # Pausa generosa entre vídeos
        
        # 3. Salva resultados
        self._save_results(videos, successful, failed)
        return videos
    
    def _save_results(self, videos, successful, failed):
        """Salva os resultados finais"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"transcricoes_studio_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"transcricoes_studio_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("TRANSCRIÇÕES DO YOUTUBE STUDIO - TODOS OS VÍDEOS\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                status = "✅" if "[Transcrição" not in video['transcription'] and "[Erro" not in video['transcription'] else "❌"
                f.write(f"\n{status} {i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write(f"Transcrição: {video['transcription']}\n")
                f.write("-"*40 + "\n")
        
        print(f"\n🎉 PROCESSO CONCLUÍDO!")
        print(f"📊 RESUMO FINAL:")
        print(f"   🎥 Total processados: {len(videos)}")
        print(f"   ✅ Com transcrição: {successful}")
        print(f"   ❌ Sem transcrição: {failed}")
        if videos:
            print(f"   📈 Taxa de sucesso: {(successful/len(videos)*100):.1f}%")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto")

def main():
    print("🎬 YouTube Studio Transcriber")
    print("="*60)
    print("Versão que acessa diretamente os vídeos do Studio")
    print("="*60)
    
    studio_url = input("\nURL do YouTube Studio: ").strip()
    if not studio_url:
        print("URL inválida!")
        return
    
    try:
        max_videos = int(input("Número máximo de vídeos (padrão 206): ") or "206")
    except:
        max_videos = 206
    
    try:
        transcriber = YouTubeStudioTranscriber()
        videos = transcriber.process_complete(studio_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
