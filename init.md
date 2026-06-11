# LeadForge - PRD Completo

## Visão Geral
LeadForge é uma plataforma SaaS de prospecção inteligente que encontra empresas sem presença digital, analisa oportunidades, gera diagnósticos profissionais, cria wireframes, produz briefs estruturados para IA e auxilia no fechamento de novos clientes.

## Objetivos
- Encontrar empresas sem site.
- Identificar oportunidades comerciais.
- Gerar score de maturidade digital.
- Produzir relatórios profissionais.
- Gerar wireframes para apresentação.
- Gerar arquivos TXT estruturados para uso em IA.
- Gerar propostas comerciais.
- Gerenciar leads através de CRM.

---

# Fluxo Principal

Empresa Encontrada
→ Coleta de Dados
→ Análise Digital
→ Score
→ Diagnóstico
→ Wireframe
→ TXT Estruturado
→ Proposta Comercial
→ PDF
→ Envio

---

# Módulos

## Dashboard
## Busca de Empresas
## CRM
## Relatórios
## Diagnóstico Digital
## Wireframe Generator
## TXT Generator
## Proposal Generator
## Analytics
## Configurações

---

# Busca de Empresas

## Filtros

- País
- Estado
- Cidade
- Raio
- Segmento
- Possui Site
- Não Possui Site
- Avaliação Mínima
- Possui WhatsApp
- Possui Instagram

## Dados Coletados

- Nome
- Categoria
- Endereço
- Cidade
- Estado
- Telefone
- WhatsApp
- Email
- Website
- Instagram
- Facebook
- Avaliação
- Reviews

---

# Diagnóstico Digital

## Website

- Possui Website
- SSL
- Responsividade
- Performance
- SEO
- Domínio Próprio

## Redes Sociais

- Instagram
- Facebook
- LinkedIn
- TikTok

## Google Business

- Perfil Verificado
- Nota
- Avaliações

---

# Score Digital

- 0–40: Crítico
- 41–60: Baixo
- 61–80: Médio
- 81–100: Excelente

---

# Problemas Identificados

- Não possui website
- Site lento
- Site antigo
- Não responsivo
- Sem SSL
- SEO inexistente
- Redes sociais abandonadas

---

# Oportunidades

- Site institucional
- Landing Page
- SEO Local
- Blog
- Integração WhatsApp
- Automação Comercial

---

# Wireframe Generator

Saídas:

- Wireframe textual
- Wireframe visual
- Estrutura de páginas
- Componentes sugeridos

---

# TXT Generator

## company.txt

- Nome
- Categoria
- Cidade
- Telefone
- WhatsApp
- Email
- Website
- Redes Sociais
- Serviços

## analysis.txt

- Score
- Problemas
- Oportunidades
- Recomendações

## website-brief.txt

- Objetivo
- Público-Alvo
- Estrutura
- Páginas
- Seções
- Estilo Visual
- CTA

---

# Exemplo de Estrutura TXT

Nome: Auto Center Silva
Categoria: Auto Center
Cidade: Pelotas
Website: Não possui
Avaliação: 4.8

Problemas:
- Não possui website

Oportunidades:
- Site institucional
- SEO Local

---

# CRM

Status:

- Novo
- Em Contato
- Interessado
- Proposta Enviada
- Negociação
- Fechado
- Perdido

---

# Proposal Generator

Campos:

- Cliente
- Escopo
- Valor
- Prazo
- Mensalidade
- Observações

Arquivos:

- proposta.pdf
- diagnostico.pdf
- wireframe.pdf
- prompt.md

---

# Segmentos

## Automotivo
Oficina Mecânica, Auto Center, Borracharia, Lava Rápido, Guincho, Auto Elétrica.

## Alimentação
Restaurante, Pizzaria, Hamburgueria, Cafeteria, Padaria.

## Saúde
Clínica Médica, Dentista, Psicólogo, Nutricionista.

## Beleza
Salão de Beleza, Barbearia, Clínica Estética.

## Construção
Construtora, Marcenaria, Vidraçaria, Serralheria, Eletricista.

## Serviços
Contabilidade, Consultoria, Marketing Digital, Gráfica.

## Jurídico
Advogado, Escritório de Advocacia.

## Fitness
Academia, Crossfit, Pilates.

## Pet
Pet Shop, Clínica Veterinária.

## Imobiliário
Imobiliária, Corretor.

## Educação
Escolas, Cursos, Idiomas.

## Turismo
Hotel, Pousada.

## Comércio
Roupas, Calçados, Papelaria, Ótica.

## Tecnologia
Software House, Empresa de TI.

## Logística
Transportadora, Fretes.

## Eventos
Fotógrafo, DJ, Casa de Festas.

## Indústria
Metalúrgica, Alimentícia, Têxtil.

## Agronegócio
Agropecuária, Cooperativas.

## Financeiro
Seguros, Consórcios, Investimentos.

---

# Banco de Dados

## User
- id
- name
- email
- avatar
- role

## Lead
- id
- name
- category
- phone
- email
- website
- city
- state
- rating
- reviews
- score
- status

## Prompt
- id
- leadId
- title
- content

## Proposal
- id
- leadId
- value
- status
- pdfUrl

## Contact
- id
- leadId
- date
- notes
- status
- nextContact

---

# Diferenciais

1. Busca automática de empresas.
2. Identificação de empresas sem site.
3. Score digital.
4. Diagnóstico profissional.
5. Wireframe automático.
6. Geração de TXT para IA.
7. Proposta comercial.
8. Exportação PDF.
9. CRM integrado.
