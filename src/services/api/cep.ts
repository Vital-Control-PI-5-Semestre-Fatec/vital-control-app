export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export function formatCep(value: string) {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export function cleanCep(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export async function lookupCep(value: string): Promise<CepAddress> {
  const cep = cleanCep(value);

  if (cep.length !== 8) {
    throw new Error('Informe um CEP com 8 dígitos.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = (await response.json().catch(() => null)) as ViaCepResponse | null;

  if (!response.ok || !data || data.erro) {
    throw new Error('CEP não encontrado.');
  }

  return {
    street: data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
    zipCode: formatCep(data.cep ?? cep),
  };
}
