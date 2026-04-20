#!/usr/bin/env python3
"""
Versão com depuração visual para analisar o que está acontecendo na página
"""

import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class YouTubeTranscriberDebug:
    def __init__(self):
        """Conecta ao Chrome com modo debug"""
        chrome_options = Options()
        chrome_options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 15)
        
    def debug_page_structure(self, url):
        """Analisa a estrutura da página para debug"""
        print(f"\n🔍 ANALISANDO PÁGINA: {url}")
        print("="*60)
        
        self.driver.get(url)
        time.sleep(5)
        
        # Informações básicas da página
        print(f"📄 Título: {self.driver.title}")
        print(f"🌐 URL atual: {self.driver.current_url}")
        print(f"📏 Tamanho da página: {self.driver.execute_script('return document.body.scrollHeight')}px")
        
        # Verifica se há mensagens de erro
        try:
            error_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'error') or contains(text(), 'Error') or contains(text(), 'não encontrado') or contains(text(), 'not found')]")
            if error_elements:
                print("⚠️ Mensagens de erro encontradas:")
                for elem in error_elements[:3]:
                    print(f"   - {elem.text}")
        except:
            pass
        
        # Verifica se é um canal privado
        page_text = self.driver.page_source.lower()
        if "private" in page_text or "privado" in page_text:
            print("🔒 Página parece ser privada")
        
        # Analisa estrutura de elementos
        print("\n🏗️ ESTRUTURA DE ELEMENTOS:")
        
        # Procura por qualquer tipo de link
        all_links = self.driver.find_elements(By.TAG_NAME, "a")
        video_links = [link for link in all_links if "/watch?v=" in (link.get_attribute("href") or "")]
        print(f"   🔗 Total de links: {len(all_links)}")
        print(f"   🎥 Links de vídeo: {len(video_links)}")
        
        if video_links:
            print("   📋 Primeiros 5 links de vídeo:")
            for i, link in enumerate(video_links[:5]):
                href = link.get_attribute("href")
                text = link.text.strip() or link.get_attribute("title") or "Sem texto"
                print(f"      {i+1}. {text[:50]} -> {href}")
        
        # Procura por elementos de vídeo específicos
        selectors_to_test = [
            ("Vídeos com ID #video-title", "a#video-title"),
            ("Links yt-simple-endpoint", "a.yt-simple-endpoint"),
            ("Elementos ytd-video-renderer", "ytd-video-renderer"),
            ("Grid de vídeos", "ytd-grid-renderer"),
            ("Listas de reprodução", "ytd-playlist-renderer"),
            ("Seções de conteúdo", "ytd-rich-section-renderer"),
            ("Qualquer elemento com 'video'", "[id*='video'], [class*='video']"),
        ]
        
        print("\n🔍 TESTANDO SELETORES ESPECÍFICOS:")
        for name, selector in selectors_to_test:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                print(f"   {name}: {len(elements)} elementos")
                
                if elements and len(elements) <= 3:
                    for i, elem in enumerate(elements):
                        text = elem.text.strip()[:50] if elem.text else "Sem texto"
                        print(f"      {i+1}. {text}")
                        
            except Exception as e:
                print(f"   {name}: Erro - {e}")
        
        # Verifica abas/navegação
        print("\n📑 VERIFICANDO NAVEGAÇÃO:")
        try:
            tabs = self.driver.find_elements(By.XPATH, "//tp-yt-paper-tab | //a[contains(@href, '/videos')] | //button[contains(., 'Vídeos')]")
            print(f"   Abas encontradas: {len(tabs)}")
            for i, tab in enumerate(tabs):
                text = tab.text.strip()
                print(f"      {i+1}. '{text}'")
        except:
            pass
        
        # Tira screenshot para análise visual
        try:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            screenshot_file = f"debug_screenshot_{timestamp}.png"
            self.driver.save_screenshot(screenshot_file)
            print(f"\n📸 Screenshot salvo: {screenshot_file}")
        except:
            pass
        
        # Mostra HTML da área principal para análise
        try:
            main_content = self.driver.find_element(By.TAG_NAME, "body").get_attribute("innerHTML")[:1000]
            print(f"\n📄 HTML (primeiros 1000 caracteres):")
            print(main_content)
        except:
            pass
        
        return video_links
    
    def try_click_videos_tab(self):
        """Tenta clicar em diferentes abas de vídeos"""
        print("\n🖱️ TENTANDO CLICAR EM ABAS...")
        
        tab_strategies = [
            ("Aba /videos", "//a[contains(@href, '/videos')]"),
            ("Tab Vídeos", "//tp-yt-paper-tab[contains(., 'Vídeos')]"),
            ("Botão Videos", "//button[contains(., 'Videos')]"),
            ("Botão VÍDEOS", "//button[contains(., 'VIDEOS')]"),
            ("Link Videos", "//a[contains(., 'Videos')]"),
        ]
        
        for name, selector in tab_strategies:
            try:
                elements = self.driver.find_elements(By.XPATH, selector)
                print(f"   {name}: {len(elements)} encontrados")
                
                for i, elem in enumerate(elements):
                    try:
                        print(f"      Clicando no elemento {i+1}...")
                        elem.click()
                        time.sleep(3)
                        
                        # Verifica se mudou a página
                        new_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/watch?v=')]")
                        print(f"      Links de vídeo após clique: {len(new_links)}")
                        
                        if len(new_links) > 0:
                            print(f"      ✅ Sucesso! Encontrados {len(new_links)} vídeos")
                            return True
                        
                    except Exception as e:
                        print(f"      Erro ao clicar: {e}")
                        continue
                        
            except Exception as e:
                print(f"   Erro: {e}")
                continue
        
        return False
    
    def manual_inspection_mode(self, channel_url):
        """Modo de inspeção manual interativo"""
        print(f"\n🔬 MODO DE INSPEÇÃO MANUAL")
        print("="*60)
        
        self.driver.get(channel_url)
        time.sleep(3)
        
        print("\n📋 INSTRUÇÕES:")
        print("1. Use o Chrome para navegar manualmente no canal")
        print("2. Encontre a página com os vídeos")
        print("3. Quando encontrar os vídeos, pressione Enter aqui")
        print("4. Vou extrair os vídeos da página atual")
        
        input("\nPressione Enter quando encontrar a página com os vídeos...")
        
        # Extrai vídeos da página atual
        video_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/watch?v=')]")
        print(f"\n🎥 Encontrados {len(video_links)} vídeos na página atual:")
        
        videos = []
        for i, link in enumerate(video_links[:206]):
            try:
                href = link.get_attribute("href")
                title = link.text.strip() or link.get_attribute("title") or f"Vídeo {i+1}"
                
                if href and "/watch?v=" in href:
                    videos.append({
                        "title": title,
                        "url": href,
                        "transcription": ""
                    })
                    print(f"   {i+1}. {title[:50]}")
            except:
                continue
        
        return videos
    
    def process_channel_debug(self, channel_url, max_videos=206):
        """Processa canal com modo debug"""
        print("🔍 MODO DEBUG ATIVADO")
        
        # Opções de análise
        print("\n📋 ESCOLHA O MODO DE ANÁLISE:")
        print("1. Análise automática completa")
        print("2. Inspeção manual interativa")
        print("3. Testar estratégias específicas")
        
        choice = input("\nEscolha (1-3): ").strip()
        
        if choice == "1":
            # Análise automática
            video_links = self.debug_page_structure(channel_url)
            
            if len(video_links) == 0:
                print("\n🔄 Tentando clicar em abas...")
                if self.try_click_videos_tab():
                    video_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/watch?v=')]")
            
        elif choice == "2":
            # Inspeção manual
            videos = self.manual_inspection_mode(channel_url)
            if videos:
                self._save_results(videos)
                return videos
            else:
                return []
        
        else:
            # Testar estratégias
            video_links = self.debug_page_structure(channel_url)
        
        # Converte links para formato de vídeos
        videos = []
        for i, link in enumerate(video_links[:max_videos]):
            try:
                href = link.get_attribute("href")
                title = link.text.strip() or link.get_attribute("title") or f"Vídeo {i+1}"
                
                videos.append({
                    "title": title,
                    "url": href,
                    "transcription": ""
                })
            except:
                continue
        
        if videos:
            print(f"\n✅ Processados {len(videos)} vídeos")
            self._save_results(videos)
        else:
            print("\n❌ Nenhum vídeo encontrado")
        
        return videos
    
    def _save_results(self, videos):
        """Salva os resultados"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # JSON
        json_file = f"debug_videos_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(videos, f, ensure_ascii=False, indent=2)
        
        # TXT
        txt_file = f"debug_videos_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write("VIDEOS ENCONTRADOS (MODO DEBUG)\n")
            f.write("="*60 + "\n\n")
            
            for i, video in enumerate(videos):
                f.write(f"{i+1}. {video['title']}\n")
                f.write(f"URL: {video['url']}\n")
                f.write("-"*60 + "\n\n")
        
        print(f"\n✅ Arquivos salvos:")
        print(f"   📄 {json_file}")
        print(f"   📄 {txt_file}")
    
    def close(self):
        """Não fecha o navegador"""
        print("🔗 Mantendo Chrome aberto para análise")

def main():
    print("🔬 YouTube Transcriber - MODO DEBUG")
    print("="*60)
    print("Análise detalhada da estrutura da página")
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
        transcriber = YouTubeTranscriberDebug()
        videos = transcriber.process_channel_debug(channel_url, max_videos)
        
    except KeyboardInterrupt:
        print("\n⏹️ Operação cancelada.")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    finally:
        if 'transcriber' in locals():
            transcriber.close()

if __name__ == "__main__":
    main()
