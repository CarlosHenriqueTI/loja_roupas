const API_BASE_URL = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
      
      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Clientes
  async loginCliente(email: string, senha: string) {
    return this.request('/clientes/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    })
  }

  async registrarCliente(nome: string, email: string, senha: string) {
    return this.request('/clientes/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha })
    })
  }

  async getClientes() {
    return this.request('/clientes')
  }

  async deleteCliente(id: number) {
    return this.request(`/clientes/${id}`, {
      method: 'DELETE'
    })
  }

  // Produtos
  async getProdutos(filters?: { categoria?: string; busca?: string }) {
    const params = new URLSearchParams()
    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.busca) params.append('busca', filters.busca)
    
    const query = params.toString()
    return this.request(`/produtos${query ? `?${query}` : ''}`)
  }

  async getProduto(id: number) {
    return this.request(`/produtos/${id}`)
  }

  // Interações
  async getInteracoes(produtoId?: number) {
    const params = new URLSearchParams()
    if (produtoId) params.append('produtoId', produtoId.toString())
    
    const query = params.toString()
    return this.request(`/interacoes${query ? `?${query}` : ''}`)
  }

  async criarInteracao(data: {
    tipo: string
    conteudo: string
    avaliacao?: number
    clienteId: number
    produtoId: number
  }) {
    return this.request('/interacoes/criar', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Health Check
  async healthCheck() {
    return this.request('/')
  }
}

export const api = new ApiClient()
export default api