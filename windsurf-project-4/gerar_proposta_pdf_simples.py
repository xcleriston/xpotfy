#!/usr/bin/env python3
"""
Gerador de PDF simples da Proposta Comercial Estúdio 33
Versão simplificada sem caracteres especiais
"""

from fpdf import FPDF
import os
from datetime import datetime

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
        self.cell(0, 8, 'Sistema Fotografico Completo com Reconhecimento Facial', 0, 1, 'C')
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
        self.set_text_color(255, 140, 0)  # Laranja
        self.cell(0, 6, text, 0, 1, 'L')
        self.ln(2)

def create_proposta_pdf():
    pdf = Estudio33_Proposta()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # 1. Visão do Projeto
    pdf.chapter_title('1. VISAO DO PROJETO')
    pdf.normal_text('Desenvolvimento de uma plataforma completa de gerenciamento fotografico com inteligencia artificial, permitindo reconhecimento facial automatico, organizacao inteligente e comercializacao de conteudo visual.')

    # 2. Funcionalidades Principais
    pdf.chapter_title('2. FUNCIONALIDADES PRINCIPAIS')
    
    features = [
        ('[ROBO]', 'Reconhecimento Facial', 'Detecao e identificacao automatica de pessoas com 99% de precisao'),
        ('[PASTA]', 'Gestao de Fotos', 'Organizacao inteligente por eventos, pessoas e tags automaticas'),
        ('[CARRINHO]', 'E-commerce Integrado', 'Venda de fotos individuais, pacotes e albuns digitais'),
        ('[LIVRO]', 'Designer de Albuns', 'Criacao profissional com templates prontos e customizacao'),
        ('[ARTE]', 'Tratamento de Imagens', 'Processamento automatico com filtros e correcoes AI'),
        ('[GRAFICO]', 'Analytics Avancado', 'Dashboard completo com metricas e relatorios detalhados')
    ]
    
    for icon, title, desc in features:
        pdf.section_title(f'{icon} {title}')
        pdf.normal_text(desc)
        pdf.ln(2)

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
    pdf.cell(0, 6, 'Desconto especial de 10% para pagamento a vista: R$ 117.000,00', 0, 1, 'L')
    pdf.ln(3)
    
    pdf.highlight_text('Opcao recomendada: 30% entrada + 6x sem juros')

    # 4. Formas de Pagamento
    pdf.chapter_title('4. FORMAS DE PAGAMENTO FLEXIVEIS')
    
    payment_plans = [
        ('[DINHEIRO]', 'Plano Start', '30% entrada: R$ 39.000,00 | 70% na entrega: R$ 91.000,00'),
        ('[CALENDARIO]', 'Plano Plus', '20% entrada: R$ 26.000,00 | 40% midpoint: R$ 52.000,00 | 40% entrega: R$ 52.000,00'),
        ('[CALENDARIO2]', 'Plano Mensal', '30% entrada + 6x sem juros | Parcelas de R$ 15.166,67'),
        ('[DIAMANTE]', 'Desconto Especial', 'A vista: 10% OFF | Valor final: R$ 117.000,00')
    ]
    
    for icon, title, desc in payment_plans:
        pdf.section_title(f'{icon} {title}')
        pdf.normal_text(desc)
        pdf.ln(2)

    # 5. Distribuicao por Modulo
    pdf.chapter_title('5. DISTRIBUICAO POR MODULO')
    
    # Tabela de modulos
    modules_data = [
        ('Core MVP', 'Base + Reconhecimento Facial', 'R$ 45.000,00', '8 semanas'),
        ('E-commerce', 'Sistema de Vendas Completo', 'R$ 25.000,00', '4 semanas'),
        ('Designer de Albuns', 'Templates e Diagramacao', 'R$ 20.000,00', '4 semanas'),
        ('Tratamento de Imagens', 'Processamento AI e Filtros', 'R$ 15.000,00', '3 semanas'),
        ('Analytics', 'Metricas e Relatorios', 'R$ 10.000,00', '2 semanas'),
        ('Integracao', 'Deploy e Testes Finais', 'R$ 15.000,00', '3 semanas')
    ]
    
    # Cabecalho da tabela
    pdf.set_font('helvetica', 'B', 11)
    pdf.set_text_color(255, 255, 255)
    pdf.set_fill_color(102, 126, 234)  # Azul
    pdf.cell(60, 8, 'Modulo', 1, 0, 'C', True)
    pdf.cell(80, 8, 'Descricao', 1, 0, 'C', True)
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
        ('Fase 3', 'Albuns', '4 semanas', 'Designer e Templates'),
        ('Fase 4', 'Imagens', '3 semanas', 'Tratamento e Filtros'),
        ('Fase 5', 'Analytics + Deploy', '5 semanas', 'Relatorios, Integracao e Lancamento')
    ]
    
    for phase, title, duration, desc in timeline:
        pdf.section_title(f'{phase}: {title}')
        pdf.normal_text(f'Duracao: {duration}')
        pdf.normal_text(f'Detalhes: {desc}')
        pdf.ln(2)

    # 7. ROI e Beneficios
    pdf.chapter_title('7. ROI E BENEFICIOS')
    
    benefits = [
        'Retorno estimado: 10-18 meses',
        'Receita anual projetada: R$ 200.000+',
        'Economia mensal: R$ 20.000 em mao de obra',
        'ROI em 2 anos: 300%',
        'Reducao de 90% no tempo de organizacao',
        'Aumento de 500% nas vendas de fotos'
    ]
    
    for benefit in benefits:
        pdf.normal_text(f'- {benefit}')

    # 8. Servicos Incluidos
    pdf.chapter_title('8. SERVICOS INCLUIDOS')
    
    services = [
        'Sistema completo funcional',
        'Codigo-fonte proprietario',
        'SEO otimizado avancado',
        'Dominio .com.br por 1 ano',
        'Manual detalhado de uso',
        'Documentacao tecnica completa',
        'Deploy em producao',
        'Certificado SSL gratuito',
        'CDN configurado global',
        'Backup automatico diario',
        'Monitoramento 24/7 por 30 dias'
    ]
    
    for service in services:
        pdf.normal_text(f'[CHECK] {service}')

    # 9. Contato
    pdf.chapter_title('9. CONTATO E PROXIMOS PASSOS')
    pdf.normal_text('Transforme seu negocio fotografico com tecnologia de ponta!')
    pdf.ln(5)
    
    contact_info = [
        ('[EMAIL]', 'contato@estudio33.com.br'),
        ('[CELULAR]', '(61) 99355-2466'),
        ('[GLOBO]', 'www.estudio33.com.br'),
        ('[PIN]', 'Brasilia, DF')
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
    pdf.cell(0, 6, 'Estudio 33 - Solucoes que Transformam Negocios', 0, 1, 'C')

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
