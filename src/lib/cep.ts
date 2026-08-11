export interface ViaCepResponse {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '')
  if (cleanCep.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
    }
  } catch {
    return null
  }
}
