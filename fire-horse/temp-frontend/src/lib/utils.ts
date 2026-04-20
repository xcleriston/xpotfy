import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma segura, resolvendo conflitos e mesclando estilos
 * @param inputs - Classes CSS a serem combinadas
 * @returns String com as classes CSS mescladas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @param options - Opções adicionais de formatação
 * @returns String formatada como moeda brasileira
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...options,
  }).format(value);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date - Data a ser formatada (string, número ou objeto Date)
 * @returns String com a data formatada
 */
export function formatDate(date: string | number | Date): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora para o formato brasileiro (DD/MM/YYYY HH:MM)
 * @param date - Data a ser formatada (string, número ou objeto Date)
 * @returns String com a data e hora formatadas
 */
export function formatDateTime(date: string | number | Date): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata um CPF (###.###.###-##)
 * @param cpf - CPF a ser formatado (apenas números)
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ (##.###.###/####-##)
 * @param cnpj - CNPJ a ser formatado (apenas números)
 * @returns CNPJ formatado
 */
export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata um telefone no formato (##) #####-####
 * @param phone - Número de telefone (apenas números)
 * @returns Telefone formatado
 */
export function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/**
 * Formata um CEP (#####-###)
 * @param cep - CEP a ser formatado (apenas números)
 * @returns CEP formatado
 */
export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param value - String contendo números e outros caracteres
 * @returns String contendo apenas números
 */
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida um endereço de e-mail
 * @param email - E-mail a ser validado
 * @returns true se o e-mail for válido, false caso contrário
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida um CPF
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF for válido, false caso contrário
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = onlyNumbers(cpf);
  
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    return false;
  }

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    return false;
  }

  return true;
}

/**
 * Valida um CNPJ
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se o CNPJ for válido, false caso contrário
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = onlyNumbers(cnpj);
  
  if (cleaned.length !== 14 || /^(\d)\1{13}$/.test(cleaned)) {
    return false;
  }

  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }
  
  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }
  
  return true;
}

/**
 * Gera um ID único
 * @returns String com um ID único
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Função de debounce para atrasar a execução de funções
 * @param func - Função a ser executada após o delay
 * @param wait - Tempo de espera em milissegundos
 * @returns Função de debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Função de throttle para limitar a taxa de execução de funções
 * @param func - Função a ser executada
 * @param limit - Intervalo mínimo em milissegundos entre execuções
 * @returns Função de throttle
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Copia um texto para a área de transferência
 * @param text - Texto a ser copiado
 * @returns Promise que resolve quando o texto é copiado
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      console.error('Falha ao copiar texto: ', err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Falha ao copiar texto: ', err);
    return false;
  }
}

/**
 * Converte uma string para o formato slug (URL amigável)
 * @param text - Texto a ser convertido
 * @returns String no formato slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
}

/**
 * Trunca um texto adicionando reticências se exceder o comprimento máximo
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo do texto
 * @returns Texto truncado, se necessário
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Verifica se o código está sendo executado no navegador
 * @returns true se estiver no navegador, false caso contrário
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Verifica se o dispositivo é móvel com base no user agent
 * @returns true se for um dispositivo móvel, false caso contrário
 */
export const isMobile = (): boolean => {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Formata bytes para o formato mais legível (KB, MB, GB, TB)
 * @param bytes - Quantidade de bytes
 * @param decimals - Número de casas decimais
 * @returns String formatada
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Converte uma string para o formato Title Case
 * @param str - String a ser convertida
 * @returns String em Title Case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

/**
 * Remove acentos de uma string
 * @param str - String com acentos
 * @returns String sem acentos
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se um valor é vazio (null, undefined, string vazia, array vazio, objeto vazio)
 * @param value - Valor a ser verificado
 * @returns true se o valor for vazio, false caso contrário
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Mescla dois objetos profundamente
 * @param target - Objeto alvo
 * @param source - Objeto fonte
 * @returns Novo objeto com as propriedades mescladas
 */
export function deepMerge<T extends object, S extends object>(target: T, source: S): T & S {
  const output = { ...target } as T & S;
  
  if (isPlainObject(target) && isPlainObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isPlainObject(source[key as keyof S])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof S] });
        } else {
          output[key as keyof T & S] = deepMerge(
            target[key as keyof T] as any,
            source[key as keyof S] as any
          );
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof S] });
      }
    });
  }
  
  return output;
}

/**
 * Verifica se um valor é um objeto simples
 * @param value - Valor a ser verificado
 * @returns true se for um objeto simples, false caso contrário
 */
function isPlainObject(value: any): value is object {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.prototype.toString.call(value) === '[object Object]' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Retorna uma função que só pode ser chamada uma vez
 * @param fn - Função a ser executada apenas uma vez
 * @returns Nova função que só pode ser chamada uma vez
 */
export function once<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let called = false;
  let result: ReturnType<T>;
  
  return function (...args: Parameters<T>): ReturnType<T> | undefined {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return undefined;
  };
}

/**
 * Retorna um valor padrão se o valor for nulo ou indefinido
 * @param value - Valor a ser verificado
 * @param defaultValue - Valor padrão
 * @returns O valor original ou o valor padrão
 */
export function defaultValue<T>(value: T | null | undefined, defaultValue: T): T {
  return value !== null && value !== undefined ? value : defaultValue;
}

/**
 * Remove valores falsy (false, null, 0, "", undefined, NaN) de um array
 * @param arr - Array a ser filtrado
 * @returns Novo array sem valores falsy
 */
export function compact<T>(arr: Array<T | null | undefined | false | "" | 0>): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * Retorna um número aleatório entre min e max (inclusive)
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @returns Número aleatório
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna um elemento aleatório de um array
 * @param arr - Array de elementos
 * @returns Elemento aleatório ou undefined se o array estiver vazio
 */
export function sample<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Retorna um array com elementos únicos (remove duplicatas)
 * @param arr - Array de elementos
 * @returns Novo array sem elementos duplicados
 */
export function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Retorna a diferença entre dois arrays
 * @param arr1 - Primeiro array
 * @param arr2 - Segundo array
 * @returns Array com elementos que estão no primeiro array mas não no segundo
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((x) => !arr2.includes(x));
}

/**
 * Retorna a interseção entre dois arrays
 * @param arr1 - Primeiro array
 * @param arr2 - Segundo array
 * @returns Array com elementos que estão em ambos os arrays
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  return arr1.filter((x) => arr2.includes(x));
}

/**
 * Retorna a união de dois arrays (sem duplicatas)
 * @param arr1 - Primeiro array
 * @param arr2 - Segundo array
 * @returns Novo array com todos os elementos únicos de ambos os arrays
 */
export function union<T>(arr1: T[], arr2: T[]): T[] {
  return [...new Set([...arr1, ...arr2])];
}

export default {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  onlyNumbers,
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  generateId,
  debounce,
  throttle,
  copyToClipboard,
  slugify,
  truncate,
  isBrowser,
  isMobile,
  formatFileSize,
  toTitleCase,
  removeAccents,
  isEmpty,
  deepMerge,
  once,
  defaultValue,
  compact,
  randomInt,
  sample,
  uniq,
  difference,
  intersection,
  union,
};
