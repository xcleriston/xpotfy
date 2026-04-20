#!/usr/bin/env python3
"""
Gerador de PDF da Proposta Comercial Estúdio 33
Baseado no código FPDF fornecido pelo cliente
"""

from fpdf import FPDF
import os
from datetime import datetime

# Mapeamento de emojis para texto alternativo
EMOJI_MAP = {
    '🤖': '[ROBO]',
    '📁': '[PASTA]',
    '🛒': '[CARRINHO]',
    '📚': '[LIVRO]',
    '🎨': '[ARTE]',
    '📊': '[GRAFICO]',
    '💰': '[DINHEIRO]',
    '📅': '[CALENDARIO]',
    '📆': '[CALENDARIO2]',
    '💎': '[DIAMANTE]',
    '📧': '[EMAIL]',
    '📱': '[CELULAR]',
    '🌐': '[GLOBO]',
    '📍': '[PIN]',
    '✓': '[CHECK]'
}

def sanitize_text(text):
    """Remove caracteres não suportados pelo FPDF"""
    # Substituir caracteres problemáticos
    replacements = {
        '🤖': '[ROBO]',
        '📁': '[PASTA]',
        '🛒': '[CARRINHO]',
        '📚': '[LIVRO]',
        '🎨': '[ARTE]',
        '📊': '[GRAFICO]',
        '💰': '[DINHEIRO]',
        '📅': '[CALENDARIO]',
        '📆': '[CALENDARIO2]',
        '💎': '[DIAMANTE]',
        '📧': '[EMAIL]',
        '📱': '[CELULAR]',
        '🌐': '[GLOBO]',
        '📍': '[PIN]',
        '✓': '[CHECK]',
        '•': '-',  # Bullet point
        '–': '-',  # En dash
        '—': '-',  # Em dash
        '…': '...',  # Ellipsis
        '"': "'",  # Aspas duplas
        '"': "'",  # Aspas duplas direitas
        ''': "'",  # Aspas simples esquerda
        ''': "'",  # Aspas simples direita
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Remover caracteres especiais restantes
    import re
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    return text

class Estudio33_Proposta(FPDF):
    def header(self):
        # Logo e branding
        self.set_font('helvetica', 'B', 20)
        self.set_text_color(102, 126, 234)  # Azul Estúdio 33
        self.cell(0, 10, 'ESTUDIO 33 - PROPOSTA COMERCIAL', 0, 1, 'C')
        self.ln(5)
        
        # Título do projeto
        self.set_font('helvetica', 'B', 16)
        self.set_text_color(0, 0, 0)
        self.cell(0, 8, 'Sistema Fotográfico Completo com Reconhecimento Facial', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Pagina {self.page_no()}/{{nb}}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 14)
        self.set_text_color(118, 75, 162)  # Roxo
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)

    def section_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(102, 126, 234)  # Azul
        self.cell(0, 8, title, 0, 1, 'L')
        self.ln(3)

    def normal_text(self, text):
        self.set_font('helvetica', '', 11)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def highlight_text(self, text):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(255, 215, 0)  # Amarelo escuro
        self.cell(0, 6, text, 0, 1, 'L')
        self.ln(2)

    def feature_box(self, icon, title, description):
        # Sanitizar textos
        icon = sanitize_text(icon)
        title = sanitize_text(title)
        description = sanitize_text(description)
        
        # Box para funcionalidades
        self.set_fill_color(245, 247, 250)  # Fundo cinza claro
        self.set_draw_color(102, 126, 234)  # Borda azul
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(102, 126, 234)
        
        # Título com ícone
        self.cell(0, 8, f'{icon} {title}', 0, 1, 'L', True)
        self.ln(2)
        
        # Descrição
        self.set_font('helvetica', '', 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 5, description, 0, 1, 'L', True)
        self.ln(3)

def create_proposta_pdf():
    pdf = Estudio33_Proposta()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # 1. Visão do Projeto
    pdf.chapter_title('1. VISÃO DO PROJETO')
    pdf.normal_text('Desenvolvimento de uma plataforma completa de gerenciamento fotográfico com inteligência artificial, permitindo reconhecimento facial automático, organização inteligente e comercialização de conteúdo visual.')

    # 2. Funcionalidades Principais
    pdf.chapter_title('2. FUNCIONALIDADES PRINCIPAIS')
    
    features = [
        ('🤖', 'Reconhecimento Facial', 'Detecção e identificação automática de pessoas com 99% de precisão'),
        ('📁', 'Gestão de Fotos', 'Organização inteligente por eventos, pessoas e tags automáticas'),
        ('🛒', 'E-commerce Integrado', 'Venda de fotos individuais, pacotes e álbuns digitais'),
        ('📚', 'Designer de Álbuns', 'Criação profissional com templates prontos e customização'),
        ('🎨', 'Tratamento de Imagens', 'Processamento automático com filtros e correções AI'),
        ('📊', 'Analytics Avançado', 'Dashboard completo com métricas e relatórios detalhados')
    ]
    
    for icon, title, desc in features:
        pdf.feature_box(icon, title, desc)

    # 3. Investimento
    pdf.chapter_title('3. INVESTIMENTO')
    pdf.normal_text('Valor total do desenvolvimento do sistema completo:')
    
    # Valor principal
    pdf.set_font('helvetica', 'B', 24)
    pdf.set_text_color(102, 126, 234)
    pdf.cell(0, 15, 'R$ 130.000,00', 0, 1, 'C')
    pdf.ln(5)
    
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 6, 'Desconto especial de 10% para pagamento à vista: R$ 117.000,00', 0, 1, 'L')
    pdf.ln(3)
    
    pdf.highlight_text('Opção recomendada: 30% entrada + 6x sem juros')

    # 4. Formas de Pagamento
    pdf.chapter_title('4. FORMAS DE PAGAMENTO FLEXÍVEIS')
    
    payment_plans = [
        ('💰', 'Plano Start', '30% entrada: R$ 39.000,00\n70% na entrega: R$ 91.000,00'),
        ('📅', 'Plano Plus', '20% entrada: R$ 26.000,00\n40% midpoint: R$ 52.000,00\n40% entrega: R$ 52.000,00'),
        ('📆', 'Plano Mensal', '30% entrada + 6x sem juros\nParcelas de R$ 15.166,67'),
        ('💎', 'Desconto Especial', 'À vista: 10% OFF\nValor final: R$ 117.000,00')
    ]
    
    for icon, title, desc in payment_plans:
        pdf.feature_box(icon, title, desc)

    # 5. Distribuição por Módulo
    pdf.chapter_title('5. DISTRIBUIÇÃO POR MÓDULO')
    
    # Tabela de módulos
    modules_data = [
        ('Core MVP', 'Base + Reconhecimento Facial', 'R$ 45.000,00', '8 semanas'),
        ('E-commerce', 'Sistema de Vendas Completo', 'R$ 25.000,00', '4 semanas'),
        ('Designer de Álbuns', 'Templates e Diagramação', 'R$ 20.000,00', '4 semanas'),
        ('Tratamento de Imagens', 'Processamento AI e Filtros', 'R$ 15.000,00', '3 semanas'),
        ('Analytics', 'Métricas e Relatórios', 'R$ 10.000,00', '2 semanas'),
        ('Integração', 'Deploy e Testes Finais', 'R$ 15.000,00', '3 semanas')
    ]
    
    # Cabeçalho da tabela
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(255, 255, 255)
    pdf.set_fill_color(102, 126, 234)  # Azul
    pdf.cell(60, 8, 'Módulo', 1, 0, 'C', True)
    pdf.cell(80, 8, 'Descrição', 1, 0, 'C', True)
    pdf.cell(40, 8, 'Valor', 1, 0, 'C', True)
    pdf.cell(30, 8, 'Prazo', 1, 1, 'C', True)
    pdf.ln(8)
    
    # Dados da tabela
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(0, 0, 0)
    pdf.set_fill_color(245, 247, 250)
    
    for module, desc, value, deadline in modules_data:
        pdf.cell(60, 7, module, 1, 0, 'L', True)
        pdf.cell(80, 7, desc, 1, 0, 'L', True)
        pdf.cell(40, 7, value, 1, 0, 'C', True)
        pdf.cell(30, 7, deadline, 1, 1, 'C', True)
        pdf.ln(7)

    # 6. Cronograma
    pdf.chapter_title('6. CRONOGRAMA DE DESENVOLVIMENTO')
    
    timeline = [
        ('Fase 1', 'MVP Base', '8 semanas', 'Arquitetura, Backend, ML Service, Frontend Base'),
        ('Fase 2', 'E-commerce', '4 semanas', 'Sistema de Vendas e Pagamentos'),
        ('Fase 3', 'Álbuns', '4 semanas', 'Designer e Templates'),
        ('Fase 4', 'Imagens', '3 semanas', 'Tratamento e Filtros'),
        ('Fase 5', 'Analytics + Deploy', '5 semanas', 'Relatórios, Integração e Lançamento')
    ]
    
    for phase, title, duration, desc in timeline:
        pdf.section_title(f'{phase}: {title}')
        pdf.normal_text(f'Duração: {duration}')
        pdf.normal_text(f'Detalhes: {desc}')
        pdf.ln(2)

    # 7. ROI e Benefícios
    pdf.chapter_title('7. ROI E BENEFÍCIOS')
    
    benefits = [
        'Retorno estimado: 10-18 meses',
        'Receita anual projetada: R$ 200.000+',
        'Economia mensal: R$ 20.000 em mão de obra',
        'ROI em 2 anos: 300%',
        'Redução de 90% no tempo de organização',
        'Aumento de 500% nas vendas de fotos'
    ]
    
    for benefit in benefits:
        pdf.normal_text(f'• {benefit}')

    # 8. Serviços Incluídos
    pdf.chapter_title('8. SERVIÇOS INCLUÍDOS')
    
    services = [
        'Sistema completo funcional',
        'Código-fonte proprietário',
        'SEO otimizado avançado',
        'Domínio .com.br por 1 ano',
        'Manual detalhado de uso',
        'Documentação técnica completa',
        'Deploy em produção',
        'Certificado SSL gratuito',
        'CDN configurado global',
        'Backup automático diário',
        'Monitoramento 24/7 por 30 dias'
    ]
    
    for service in services:
        pdf.normal_text(f'✓ {service}')

    # 9. Contato
    pdf.chapter_title('9. CONTATO E PRÓXIMOS PASSOS')
    pdf.normal_text('Transforme seu negócio fotográfico com tecnologia de ponta!')
    pdf.ln(5)
    
    contact_info = [
        ('📧 Email', 'contato@estudio33.com.br'),
        ('📱 WhatsApp', '(61) 99355-2466'),
        ('🌐 Website', 'www.estudio33.com.br'),
        ('📍 Localização', 'Brasília, DF')
    ]
    
    for label, info in contact_info:
        pdf.section_title(label)
        pdf.normal_text(info)
        pdf.ln(2)

    # Footer final
    pdf.ln(10)
    pdf.set_font('helvetica', 'I', 10)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 6, f'Data da Proposta: {datetime.now().strftime("%d de %B de %Y")}', 0, 1, 'C')
    pdf.cell(0, 6, 'Validade: 30 dias', 0, 1, 'C')
    pdf.cell(0, 6, 'Estúdio 33 - Soluções que Transformam Negócios', 0, 1, 'C')

    # Gerar PDF
    output_path = os.path.join(os.getcwd(), f'PROPOSTA_ESTUDIO33_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf')
    pdf.output(output_path)
    print(f"✅ PDF gerado com sucesso em: {output_path}")
    
    # Tentar abrir automaticamente
    try:
        os.startfile(output_path)
        print("📄 PDF aberto automaticamente!")
    except:
        print("📄 PDF gerado. Abra manualmente para visualizar.")

if __name__ == "__main__":
    create_proposta_pdf()
