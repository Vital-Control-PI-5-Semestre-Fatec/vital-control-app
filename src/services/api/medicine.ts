/**
 * URL base da API do backend.
 * Como o app roda no celular/emulador e o backend roda no computador,
 * nem sempre é possível usar "localhost".
 * Use de acordo com o ambiente:
 * 1. Celular físico com Expo Go:
 *    - O celular e o computador precisam estar na mesma rede Wi-Fi.
 *    - Use o IPv4 do computador.
 *    - Exemplo: http://192.168.15.8:8000
 *
 * 2. Emulador Android:
 *    - Use: http://10.0.2.2:8000
 *
 * 3. Navegador/Web:
 *    - Use: http://localhost:8000
 *
 * Para descobrir o IPv4 no Windows:
 *    - Abra o terminal
 *    - Rode: ipconfig
 *    - Procure por "Endereço IPv4"
 */
const API_URL = 'http://192.168.15.8:8000';

export async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Erro na requisição');
  }

  return data;
}